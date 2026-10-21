// Server-only cryptography: memory-hard passwords, random tokens and authenticated encryption.
import "server-only";
import { randomBytes, scrypt, timingSafeEqual, createHmac, createCipheriv, createDecipheriv } from "node:crypto";
import { authEnv } from "@/lib/auth-env";
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
});
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  if (!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash)) return false;
  const [, salt, expected] = hash.split(":");
  return timingSafeEqual(await derive(password, salt), Buffer.from(expected, "hex"));
}
export const randomToken = () => randomBytes(32).toString("hex");
export const tokenHash = (token: string) => createHmac("sha256", Buffer.from(authEnv().AUTH_SECRET, "hex")).update(token).digest("hex");
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(authEnv().AUTH_SECRET, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64url")).join(".");
}
export function decrypt(value: string) {
  const [iv, tag, encrypted] = value.split(".").map(part => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(authEnv().AUTH_SECRET, "hex"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
