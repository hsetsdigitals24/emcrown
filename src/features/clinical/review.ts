// Server-only engineering review controls: real reservations with explicitly allowed test mailboxes.
import "server-only";
import { z } from "zod";

export function bookingReviewMode() {
  return process.env.CLINICAL_REVIEW_MODE === "true";
}

export function reviewEmails() {
  return z.string().transform(value => value.split(",").map(email => email.trim().toLowerCase()))
    .pipe(z.array(z.email()).min(1).max(50)).parse(process.env.CLINICAL_REVIEW_EMAILS);
}

export function reviewRecipientAllowed(email: string) {
  return !bookingReviewMode() || reviewEmails().includes(email.trim().toLowerCase());
}
