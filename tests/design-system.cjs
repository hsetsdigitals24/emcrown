// Node-only frontend contract checks using installed TypeScript and React.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader verifies TSX without adding a test dependency. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.resolve('src', name.slice(2)) : name, ...args);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    module._compile(outputText, filename);
  };
}
// CSS is exercised in browser checks; Node contract rendering only needs module resolution.
require.extensions['.css'] = () => {};
const { MOCK_NAVIGATION, MOCK_FOOTER } = require('../src/config/mock-content.ts');
const Navigation = require('../src/components/layout/Navigation.tsx').default;
const Footer = require('../src/components/layout/Footer.tsx').default;
const Reveal = require('../src/components/motion/Reveal.tsx').default;
const navigation = renderToStaticMarkup(React.createElement(Navigation, { content: MOCK_NAVIGATION }));
assert.match(navigation, /href="#main-content"/);
assert.match(navigation, /<summary/);
assert.equal((navigation.match(/bg-accentOrange /g) || []).length, 2);
assert.match(navigation, /hidden xl:block/);
assert.match(navigation, /xl:hidden/);
const footer = renderToStaticMarkup(React.createElement(Footer, { content: MOCK_FOOTER }));
assert.match(footer, /Fax<\/p><p>\[FAX NUMBER\]/);
assert.doesNotMatch(footer, /href="tel:/);
const reveal = renderToStaticMarkup(React.createElement(Reveal, null, 'Visible without JavaScript'));
assert.match(reveal, /Visible without JavaScript/);
assert.doesNotMatch(reveal, /opacity:0|visibility:hidden|hidden=/);
const css = fs.readFileSync('src/app/globals.css', 'utf8');
for (const token of ['primary','primaryHover','highlight','surfaceTint','surfaceSoft','background','sectionAlt','navy','accentOrange','accentOrangeHover','text','textSecondary','border','success','error']) {
  assert.ok(css.includes(`--color-${token}:`), `Missing ${token}`);
}
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /:focus-visible/);
console.log('Passed: tokens, server-visible reveals, navigation disclosures and responsive CTA classes, plain-text fax.');

const Home = require('../src/features/cms/HomeContent.tsx').default;
const { HOME_SEED } = require('../src/config/cms/content.ts');
const SiteLayout = require('../src/components/layout/SiteLayout.tsx').default;
const { SITE_NAVIGATION, SITE_FOOTER } = require('../src/config/site-shell.ts');
const home = renderToStaticMarkup(React.createElement(SiteLayout, { navigation: SITE_NAVIGATION, footer: SITE_FOOTER }, React.createElement(Home, {content:HOME_SEED})));
const sections = [...home.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(sections, ['home','about','services','booking','contact','faq','next-step']);
assert.equal((home.match(/<h1 /g) || []).length, 1);
assert.equal((home.match(/class="faq-item"/g) || []).length, 5);
assert.equal((home.match(/class="service-card"/g) || []).length, 6);
assert.equal((home.match(/class="physician-card"/g) || []).length, 0);
assert.equal((home.match(/class="testimonial-card"/g) || []).length, 0);
assert.match(home, /id="legal-notice"/);
assert.doesNotMatch(home, /<form/);
assert.match(home, /<iframe[^>]+src="https:\/\/www\.google\.com\/maps\?/);
assert.match(home, /loading="lazy" referrerPolicy="no-referrer"/);
assert.doesNotMatch(home, /TESTIMONIAL PLACEHOLDER/);
assert.doesNotMatch(home, /\[PHYSICIAN NAME\]/);
assert.match(home, /reference details pending final verification/);
assert.match(home, /href="\/book"/);
console.log('Passed: homepage section order, single h1, six visit guides, omitted empty physician/testimonial slots, native FAQs, provisional facts and no backend form.');

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const colors = Object.fromEntries([...css.matchAll(/--color-(\w+):\s*(#[A-Fa-f\d]{6});/g)].map((match) => [match[1], match[2]]));
for (const [foreground, background] of [['text','background'],['textSecondary','background'],['textSecondary','surfaceTint'],['primary','surfaceSoft'],['background','accentOrange'],['background','navy']]) {
  assert.ok(contrast(colors[foreground], colors[background]) >= 4.5, `${foreground}/${background} contrast`);
}
assert.ok(contrast(colors.highlight, colors.background) >= 3, 'Large headline highlight contrast');
console.log('Passed: theme text combinations meet WCAG AA contrast thresholds.');
