// Shared pure presentation: historical event codes receive outcome-specific descriptions.
import { AUDIT_DISPLAY, AUDIT_MESSAGES } from "@/config/audit-messages";
import type { AuditAction } from "@/types/auth";
export function auditMessage(action: string, outcome: string): string {
  if (!Object.hasOwn(AUDIT_MESSAGES, action) || !Object.hasOwn(AUDIT_DISPLAY.outcomes, outcome)) return AUDIT_DISPLAY.fallback;
  return AUDIT_MESSAGES[action as AuditAction][outcome as keyof typeof AUDIT_DISPLAY.outcomes];
}
export function auditOutcome(outcome: string): string {
  return Object.hasOwn(AUDIT_DISPLAY.outcomes, outcome) ? AUDIT_DISPLAY.outcomes[outcome as keyof typeof AUDIT_DISPLAY.outcomes] : outcome;
}
