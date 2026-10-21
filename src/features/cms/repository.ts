// Server-only persistence: page locks, optimistic versions and immutable editorial revisions.
import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, type AuthTransaction } from "@/lib/db";
import { cmsDocuments, cmsRevisions } from "@/lib/db/schema";
import { cmsActor } from "@/features/cms/access";
import { CMS_DEFINITIONS, findDefinition } from "@/config/cms/registry";
import { CMS_POLICY } from "@/config/cms/copy";
import { operationSchema, validateValues, storedValues } from "@/features/cms/validation";
import type { CmsResult, CmsSnapshot } from "@/types/cms";
import type { AuditActor } from "@/features/auth/audit";
function pageWhere(organisationId: string, path: string) {
  return and(eq(cmsDocuments.organisationId, organisationId), eq(cmsDocuments.path, path));
}
async function revisions(tx: AuthTransaction, organisationId: string, path: string) {
  const rows = await tx.select({ id: cmsRevisions.id, action: cmsRevisions.action, createdAt: cmsRevisions.createdAt })
    .from(cmsRevisions).where(and(eq(cmsRevisions.organisationId, organisationId), eq(cmsRevisions.path, path)))
    .orderBy(desc(cmsRevisions.createdAt), desc(cmsRevisions.id)).limit(CMS_POLICY.revisionLimit);
  return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
}
export async function loadCms(path: string): Promise<CmsResult> {
  const definition = findDefinition(path);
  if (!definition) return { ok: false, code: "invalid" };
  return db().transaction(async tx => {
    const actor = await cmsActor(tx);
    if (!actor) return { ok: false, code: "denied" };
    const [row] = await tx.select().from(cmsDocuments).where(pageWhere(actor.organisationId, path));
    const values = row ? storedValues(path, row.draft) : definition.initial;
    if (!values) return { ok: false, code: "invalid" };
    const snapshot: CmsSnapshot = { path, values, version: row?.version ?? 0, published: Boolean(row?.published) };
    const paths = ["/_site", ...(path === "/_site" ? ["/"] : CMS_DEFINITIONS.filter(entry => entry.path.startsWith(`${path}/`)).map(entry => entry.path))];
    const related = await tx.select({ path: cmsDocuments.path, draft: cmsDocuments.draft }).from(cmsDocuments)
      .where(and(eq(cmsDocuments.organisationId, actor.organisationId), inArray(cmsDocuments.path, paths)));
    const context = Object.fromEntries(related.flatMap(row => {
      const values = storedValues(row.path, row.draft);
      return values ? [[row.path, values]] : [];
    }));
    return { ok: true, snapshot, context, revisions: await revisions(tx, actor.organisationId, path) };
  });
}
async function writeDocument(tx: AuthTransaction, actor: AuditActor, input: ReturnType<typeof operationSchema.parse>): Promise<CmsResult> {
  const { path, operation } = input;
  const definition = findDefinition(path)!;
  // Serialize even the first save, when there is no document row to lock yet.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${actor.organisationId}), hashtext(${path}))`);
  const [row] = await tx.select().from(cmsDocuments).where(pageWhere(actor.organisationId, path)).for("update");
  if ((row?.version ?? 0) !== input.version) return { ok: false, code: "conflict" };
  let values = input.values ? validateValues(path, input.values) : row ? storedValues(path, row.draft) : definition.initial;
  if (operation === "restore") {
    if (!input.revisionId) return { ok: false, code: "invalid" };
    const [revision] = await tx.select().from(cmsRevisions).where(and(eq(cmsRevisions.id, input.revisionId),
      eq(cmsRevisions.organisationId, actor.organisationId), eq(cmsRevisions.path, path)));
    values = revision ? storedValues(path, revision.values) : null;
  }
  if (!values) return { ok: false, code: "invalid" };
  const version = (row?.version ?? 0) + 1;
  if (operation === "unpublish" && path === "/_site") return { ok: false, code: "invalid" };
  const published = operation === "publish" ? values : operation === "unpublish" ? null : row?.published ?? null;
  const withdrawn = operation === "unpublish" || (operation !== "publish" && (row?.withdrawn ?? false));
  if (!row) await tx.insert(cmsRevisions).values({ organisationId: actor.organisationId, path, values: definition.initial, action: "initial", actorId: actor.userId });
  await tx.insert(cmsDocuments).values({ organisationId: actor.organisationId, path, draft: values, published, withdrawn, version })
    .onConflictDoUpdate({ target: [cmsDocuments.organisationId, cmsDocuments.path], set: { draft: values, published, withdrawn, version, updatedAt: new Date() } });
  await tx.insert(cmsRevisions).values({ organisationId: actor.organisationId, path, values, action: operation, actorId: actor.userId });
  return { ok: true, snapshot: { path, values, version, published: Boolean(published) }, revisions: await revisions(tx, actor.organisationId, path) };
}
export async function mutateCms(input: unknown): Promise<CmsResult> {
  const parsed = operationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  return db().transaction(async tx => {
    const publishing = ["publish", "unpublish"].includes(parsed.data.operation);
    const actor = await cmsActor(tx, publishing ? "content:publish" : "content:edit");
    if (!actor) return { ok: false, code: "denied" };
    return writeDocument(tx, actor, parsed.data);
  });
}
