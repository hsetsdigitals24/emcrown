// Shared validation: browser and server use identical input contracts.
import { z } from "zod";
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const password = z.string().min(12).max(128).refine(value => value.toLowerCase() !== "password123");
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const forgotSchema = z.object({ email });
export const passwordSchema = z.object({ password, confirmPassword: z.string() })
  .refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"] });
export const resetSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password, confirmPassword: z.string() })
  .refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"] });
export const mfaSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export const inviteSchema = z.object({ email, code: mfaSchema.shape.code });
export const transferSchema = z.object({ targetId: z.uuid(), code: mfaSchema.shape.code, confirm: z.literal("on") });
export const acceptSchema = resetSchema;
export const recoverySchema = z.object({ code: z.string().trim().toLowerCase().max(35).transform(value => value.replaceAll("-", "")).pipe(z.string().regex(/^[a-f0-9]{32}$/)) });
