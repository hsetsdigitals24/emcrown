// Node-only MFA regression: QR/manual secrets match; optional independent decode uses test data only.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the existing TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { generateSecret, generate, verify } = require("otplib");
const QRCode = require("qrcode");
const { enrollmentUri } = require("../src/features/auth/enrollment-uri.ts");
const { enrollmentQr } = require("../src/features/auth/enrollment-qr.ts");
async function main() {
  const secret = generateSecret();
  const uri = enrollmentUri(secret, "owner+test@example.test");
  const parsed = new URL(uri);
  assert.equal(parsed.protocol, "otpauth:");
  assert.equal(parsed.hostname, "totp");
  assert.equal(parsed.searchParams.get("secret"), secret);
  // otplib omits standard defaults from the URI; authenticators apply those defaults.
  assert.equal(parsed.searchParams.get("digits") ?? "6", "6");
  assert.equal(parsed.searchParams.get("period") ?? "30", "30");
  const dataUrl = await enrollmentQr(secret, "owner+test@example.test");
  assert.match(dataUrl, /^data:image\/png;base64,/);
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  assert.equal(png.readUInt32BE(16), 320);
  assert.equal(png.readUInt32BE(20), 320);
  if (process.env.QR_DECODE_TEST === "1" || process.argv.includes("--decode")) {
    const decoded = spawnSync("/usr/bin/python3", ["tests/decode-qr.py"], { input: png, timeout: 10000 });
    assert.equal(decoded.status, 0, "Independent decoder failed");
    assert.equal(decoded.stdout.toString(), uri);
    const decodedSecret = new URL(decoded.stdout.toString()).searchParams.get("secret");
    assert.equal((await verify({ secret, token: await generate({ secret: decodedSecret }) })).valid, true);
  }
  const original = QRCode.toDataURL;
  const log = console.error;
  const messages = [];
  try {
    QRCode.toDataURL = async () => { throw new Error(secret); };
    console.error = message => messages.push(message);
    assert.equal(await enrollmentQr(secret, "owner+test@example.test"), undefined);
    assert.ok(messages.every(message => !message.includes(secret)));
  } finally { QRCode.toDataURL = original; console.error = log; }
  console.log("Passed: local PNG QR, matching manual/enrollment secret and safe fallback" + (process.env.QR_DECODE_TEST === "1" || process.argv.includes("--decode") ? ", with independent scan and OTP verification." : "."));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
