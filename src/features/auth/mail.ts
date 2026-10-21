// Server-only mail worker: claim encrypted reset jobs with SKIP LOCKED; never log links.
import "server-only";
import nodemailer from "nodemailer";
import { and, eq, gt, lt, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { mailOutbox, users, memberships, invitations } from "@/lib/db/schema";
import { authEnv } from "@/lib/auth-env";
import { decrypt } from "@/features/auth/crypto";
import { audit } from "@/features/auth/audit";
import { HANDOVER_COPY } from "@/config/handover";
import { AUTH_COPY } from "@/config/auth";
import { cleanExpiredAuthData } from "@/features/auth/cleanup";
export async function deliverResetEmails() {
  await cleanExpiredAuthData();
  const env = authEnv();
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465,
    requireTLS: true, auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false,
  });
  let processed = 0;
  for (let i = 0; i < 20; i++) {
    const found = await db().transaction(async tx => {
      const now = new Date();
      const [job] = await tx.select().from(mailOutbox).where(and(gt(mailOutbox.expiresAt, now),
        lte(mailOutbox.availableAt, now), lt(mailOutbox.attempts, 5)))
        .orderBy(mailOutbox.availableAt).for("update", { skipLocked: true }).limit(1);
      if (!job) return false;
      const [user] = await tx.select().from(users).where(eq(users.id, job.userId));
      const members = await tx.select().from(memberships).where(eq(memberships.userId, job.userId));
      const [invitation] = job.kind === "invitation" ? await tx.select().from(invitations)
        .where(and(eq(invitations.userId, job.userId), gt(invitations.expiresAt, new Date()))) : [];
      let success = false;
      try {
        if (!user || (job.kind === "invitation" ? !invitation || user.active : !user.active)) throw new Error("Ineligible account");
        const isInvitation = job.kind === "invitation";
        const subject = isInvitation ? HANDOVER_COPY.invitationSubject : AUTH_COPY.emailSubject;
        const body = isInvitation ? HANDOVER_COPY.invitationBody : AUTH_COPY.emailBody;
        const route = isInvitation ? "accept-invitation" : "reset-password";
        const delivery = await transport.sendMail({ from: env.SMTP_FROM, to: user.email, subject,
          text: `${body}\n\n${env.AUTH_ORIGIN}/emcrown-admin/${route}#token=${decrypt(job.payload)}` });
        // SMTP may resolve with rejected recipients. Never discard a job without acceptance.
        success = delivery.accepted.some(recipient =>
          recipient.toLowerCase() === user.email.toLowerCase())
          && delivery.rejected.length === 0;
      } catch { /* Retry without logging provider responses, recipient or token. */ }
      if (success) await tx.delete(mailOutbox).where(eq(mailOutbox.id, job.id));
      else await tx.update(mailOutbox).set({ attempts: job.attempts + 1,
        availableAt: new Date(Date.now() + 60000 * 2 ** job.attempts) }).where(eq(mailOutbox.id, job.id));
      if (invitation) await audit(tx, "auth.invitation_email", success ? "success" : "failure",
        { userId: invitation.userId, organisationId: invitation.organisationId, role: "staff" });
      for (const member of members) await audit(tx, "auth.reset_email", success ? "success" : "failure", { ...member });
      return true;
    });
    if (!found) break;
    processed++;
  }
  return processed;
}
