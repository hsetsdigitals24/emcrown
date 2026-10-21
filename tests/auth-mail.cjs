// Node-only worker tests: capture SMTP in memory; no emails leave the test process.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing test harness. */
const assert = require("node:assert/strict");
const Module = require("node:module");
module.exports = async function testMail(db, tables, requestReset, email) {
  const { eq } = require("drizzle-orm");
  let fail = true;
  const messages = [];
  const original = Module._load;
  Module._load = function(name, ...args) {
    if (name === "nodemailer") return { createTransport: config => {
      assert.equal(config.requireTLS, true);
      assert.equal(config.tls.rejectUnauthorized, true);
      return { sendMail: async message => { if (fail) throw new Error("Simulated SMTP failure"); messages.push(message); return { accepted: [message.to], rejected: [] }; } };
    } };
    return original.call(this, name, ...args);
  };
  try {
    const { deliverResetEmails } = require("../src/features/auth/mail.ts");
    await requestReset(email);
    await deliverResetEmails();
    const [retry] = await db().select().from(tables.mailOutbox);
    assert.equal(retry.attempts, 1);
    assert.equal(messages.length, 0);
    await db().update(tables.mailOutbox).set({ availableAt: new Date(Date.now() - 1000) }).where(eq(tables.mailOutbox.id, retry.id));
    fail = false; await deliverResetEmails();
    assert.equal(messages.length, 1);
    assert.equal(messages[0].to, email);
    assert.match(messages[0].text, /reset-password#token=[a-f0-9]{64}/);
    assert.equal((await db().select().from(tables.mailOutbox)).length, 0);
  } finally { Module._load = original; }
};
