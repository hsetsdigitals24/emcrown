// Server-only HTML email renderer: escaped content, table layout and plaintext fallback, without tracking.
import "server-only";
import { EMAIL_COPY as c, EMAIL_THEME as t } from "@/config/email";
type EmailOptions = { title: string; text: string; origin: string; actionLabel: string; physician?: { name: string; photo: string } };
export function escapeEmail(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
function safeUrl(value: string, origin: string, action = false) {
  try {
    const url = new URL(value, origin);
    if (url.username || url.password || (action && url.origin !== new URL(origin).origin)) return "";
    return url.protocol === "https:" || (url.protocol === "http:" && url.origin === new URL(origin).origin) ? url.href : "";
  } catch { return ""; }
}
export function renderEmail({ title, text, origin, actionLabel, physician }: EmailOptions) {
  const lines = text.split("\n").filter(Boolean);
  const actionUrl = lines.find(line => /^https?:\/\//.test(line) && safeUrl(line, origin, true));
  const action = actionUrl ? safeUrl(actionUrl, origin, true) : "";
  const paragraphs = lines.filter(line => line !== actionUrl).map(line => `<p style="margin:0 0 16px;line-height:1.7">${escapeEmail(line)}</p>`).join("");
  const photo = physician?.photo ? safeUrl(physician.photo, origin) : "";
  const portrait = physician ? `<table role="presentation" width="100%" style="margin:20px 0;border-top:1px solid ${t.border}"><tr><td style="padding:20px 0">${photo ? `<img src="${escapeEmail(photo)}" width="72" height="72" alt="${escapeEmail(c.portrait)}" style="display:block;border-radius:12px;object-fit:cover;margin-bottom:12px">` : ""}<span style="color:${t.muted};font-size:13px">${escapeEmail(c.physician)}</span><p style="margin:6px 0;font-size:20px;font-weight:bold">${escapeEmail(physician.name)}</p></td></tr></table>` : "";
  const button = action ? `<p style="margin:28px 0"><a href="${escapeEmail(action)}" style="display:inline-block;background:${t.primary};color:${t.surface};padding:16px 24px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeEmail(actionLabel)}</a></p><p style="font-size:12px;color:${t.muted}">${escapeEmail(c.fallback)}</p><p style="font-size:12px;word-break:break-all"><a href="${escapeEmail(action)}" style="color:${t.primary}">${escapeEmail(action)}</a></p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmail(title)}</title></head><body style="margin:0;background:${t.background};font-family:Arial,Helvetica,sans-serif;color:${t.text}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${t.surface};border:1px solid ${t.border};border-radius:16px"><tr><td style="padding:24px 32px;border-bottom:3px solid ${t.primary};font-size:20px;font-weight:bold;color:${t.primary}">${escapeEmail(c.brand)}</td></tr><tr><td style="padding:32px"><p style="margin:0 0 12px;font-size:12px;letter-spacing:2px;color:${t.muted};text-transform:uppercase">${escapeEmail(c.eyebrow)}</p><h1 style="font-size:28px;line-height:1.25;margin:0 0 24px;color:${t.primary}">${escapeEmail(title)}</h1>${paragraphs}${portrait}${button}</td></tr><tr><td style="padding:24px 32px;border-top:1px solid ${t.border};color:${t.muted};font-size:12px;line-height:1.6">${escapeEmail(c.footer)}</td></tr></table></td></tr></table></body></html>`;
}
