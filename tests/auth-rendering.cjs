// Node-only security regression: production nonce policy and compatible rendering configuration.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing auth test loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { CACHE_COMPONENTS_ENABLED } = require("../src/config/rendering.ts");
const config = require("../next.config.ts").default;
const { authEnv } = require("../src/lib/auth-env.ts");
const { adminResponse } = require("../src/features/auth/headers.ts");
const { NextRequest } = require("next/server");
assert.equal(CACHE_COMPONENTS_ENABLED, false);
assert.equal(config.cacheComponents, false);
assert.equal(config.partialPrefetching, false);
Object.assign(process.env, {
  NODE_ENV: "production", DATABASE_URL: "postgres://test:test@localhost/test", DATABASE_CA_CERT: "",
  AUTH_ORIGIN: "https://example.test", AUTH_SECRET: "a".repeat(64), SUPER_ADMIN_EMAIL: "owner@example.test",
  ORGANISATION_NAME: "Test", SMTP_HOST: "localhost", SMTP_PORT: "587", SMTP_USER: "test",
  SMTP_PASSWORD: "test", SMTP_FROM: "staff@example.test",
});
assert.equal(authEnv().AUTH_ORIGIN, "https://example.test");
const first = adminResponse(new NextRequest("https://example.test/emcrown-admin/login"));
const second = adminResponse(new NextRequest("https://example.test/emcrown-admin/login"));
const policy = first.headers.get("Content-Security-Policy");
assert.match(policy, /'nonce-[^']+'/);
assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
assert.match(policy, /frame-ancestors 'none'/);
assert.notEqual(policy, second.headers.get("Content-Security-Policy"));
assert.match(first.headers.get("Cache-Control"), /private, no-store/);
assert.equal(first.headers.get("Referrer-Policy"), "no-referrer");
const cms = adminResponse(new NextRequest("https://example.test/emcrown-admin/cms"));
const preview = adminResponse(new NextRequest("https://example.test/emcrown-admin/cms/preview"));
assert.equal(cms.headers.get("X-Frame-Options"), "DENY");
assert.equal(preview.headers.get("X-Frame-Options"), "SAMEORIGIN");
assert.match(preview.headers.get("Content-Security-Policy"), /frame-ancestors 'self'/);
assert.match(cms.headers.get("Content-Security-Policy"), /style-src-attr 'unsafe-inline'/);
assert.doesNotMatch(cms.headers.get("Content-Security-Policy").split(";").find(part => part.trim().startsWith("script-src")), /unsafe-inline|unsafe-eval/);
assert.match(preview.headers.get("Cache-Control"), /no-store/);
console.log("Passed: compatible rendering configuration, production HTTPS auth, unique nonces, strict production CSP and private response headers.");
