// Local email rendering/security checks: fictional content only; no provider calls or database.
/* eslint-disable @typescript-eslint/no-require-imports */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { renderEmail } = require("../src/lib/email-template.ts");
const { messagePayloadSchema } = require("../src/features/appointments/delivery.ts");
const origin = "https://example.test";
const link = `${origin}/book/manage#fictional-token`;
const options = { title: "Appointment <update>", text: `Appointment requested\nTest practice\n${link}`, origin, actionLabel: "Manage appointment", physician: { name: '<script>private</script>', photo: 'javascript:alert(1)' } };
const html = renderEmail(options);
assert.ok(html.includes("&lt;script&gt;private&lt;/script&gt;"));
assert.ok(!html.includes("<script>"));
assert.ok(!html.includes("javascript:"));
assert.ok(html.includes(`href="${link}"`), "Fragment must survive HTML email rendering");
assert.ok(html.includes('role="presentation"'));
assert.ok(!renderEmail({...options,text:"https://attacker.test/reset#secret"}).includes('href="https://attacker.test'));
assert.ok(!renderEmail({...options,physician:{name:"Fictional physician",photo:"https://user:pass@example.test/photo.png"}}).includes('<img'));
assert.ok(renderEmail({...options,physician:{name:"Fictional physician",photo:"/media/test.png"}}).includes('src="https://example.test/media/test.png"'));
assert.ok(messagePayloadSchema.safeParse({to:"test@example.test",text:"Old queued email"}).success, "Old queued messages remain valid");
assert.ok(messagePayloadSchema.safeParse({to:"test@example.test",text:"Update",physician:{name:"Fictional physician",photo:"/media/test.png"}}).success);
assert.ok(renderEmail({...options,text:`Reset password\n${origin}/emcrown-admin/reset-password#token=fictional`}).includes("#token=fictional"));
console.log("Email checks passed: escaping, unsafe URLs, same-origin actions, token fragments, portraits and old/new payloads.");
