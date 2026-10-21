// Node-only template contracts and input lookup tests using the existing TSX loader.
/* eslint-disable @typescript-eslint/no-require-imports -- Existing CommonJS test loader avoids a new package. */
require('./design-system.cjs');
// Keep template checks independent of deployment credentials and real database contents.
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name.endsWith(".css")) return {};
  if (name === "@/features/physicians/repository") return { publicPhysicians: async () => [] };
  if (name === 'server-only') return {};
  if (name === '@/features/cms/public') return { publishedContent: async (_path, seed) => seed, publicValues: async () => undefined };
  return originalLoad.call(this, name, ...args);
};
const PublishedPage = require('../src/features/cms/PublishedPage.tsx').default;
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { findPublicEntry } = require('../src/lib/public-entry.ts');
const { searchPublicPages } = require('../src/lib/page-search.ts');
const { PUBLIC_PAGES } = require('../src/config/pages/recovery.ts');
const { SERVICE_ENTRIES, PHYSICIAN_ENTRIES, ARTICLE_ENTRIES } = require('../src/config/pages/catalogs.ts');
const { PRACTICE } = require('../src/config/practice.ts');
const { SITE_NAVIGATION, SITE_FOOTER } = require('../src/config/site-shell.ts');
const SiteLayout = require('../src/components/layout/SiteLayout.tsx').default;
const InsurancePlans = require('../src/components/pages/InsurancePlans.tsx').default;
const PracticeLocations = require('../src/components/pages/PracticeLocations.tsx').default;
const { serializeStructuredData } = require('../src/lib/structured-data.ts');
const serialized = serializeStructuredData({ text: '</script><img src=x onerror=alert(1)>&\u2028' });
assert.doesNotMatch(serialized, /<|>|&/);
assert.equal(JSON.parse(serialized).text, '</script><img src=x onerror=alert(1)>&\u2028');
const { proxy } = require('../src/proxy.ts');
const { NextRequest } = require('next/server');
assert.equal(proxy(new NextRequest('https://example.test/services/service-1')).headers.get('x-middleware-next'), '1');
const missingResponse = proxy(new NextRequest('https://example.test/services/missing?private=value'));
assert.equal(missingResponse.status, 404);
assert.equal(missingResponse.headers.get('x-middleware-rewrite'), 'https://example.test/404');
const { INSURANCE_SETTINGS } = require('../src/config/pages/information.ts');
assert.equal(findPublicEntry(SERVICE_ENTRIES, 'service-1').slug, 'service-1');
for (const slug of ['../service-1','service-1?name=test','SERVICE-1','unknown']) assert.equal(findPublicEntry(SERVICE_ENTRIES, slug), undefined);
assert.deepEqual(searchPublicPages(PUBLIC_PAGES, ' BLOG ').map((page) => page.href), ['/resources']);
assert.deepEqual(searchPublicPages(PUBLIC_PAGES, 'zzzz'), []);
assert.equal(searchPublicPages(PUBLIC_PAGES, '').length, PUBLIC_PAGES.length);
const comingSoon = renderToStaticMarkup(React.createElement(InsurancePlans, { settings: { ...INSURANCE_SETTINGS, plans: [{ id:'hidden', name:'MUST NOT RENDER', description:'hidden' }] } }));
assert.doesNotMatch(comingSoon, /MUST NOT RENDER/);
const available = renderToStaticMarkup(React.createElement(InsurancePlans, { settings: { ...INSURANCE_SETTINGS, state:'available', plans:[{id:'mock',name:'[APPROVED PLAN]',description:'[APPROVED DESCRIPTION]'}] } }));
assert.match(available, /\[APPROVED PLAN\]/);
const locations = renderToStaticMarkup(React.createElement(PracticeLocations, { practice:PRACTICE }));
assert.match(locations, /Jensen Beach/);
const single = renderToStaticMarkup(React.createElement(PracticeLocations, { practice:{...PRACTICE,locationSelectorEnabled:false} }));
assert.doesNotMatch(single, /Jensen Beach|name="practice-location"/);
async function checkRoutes() {
  const paths = ['about','services','physicians','resources','insurance','contact','faq','legal','privacy','terms','accessibility','notice-of-privacy-practices'];
  for (const path of paths) {
    const route = require(`../src/app/(public)/${path}/page.tsx`);
    const html = renderToStaticMarkup(React.createElement(SiteLayout, {navigation:SITE_NAVIGATION,footer:SITE_FOOTER}, await PublishedPage((await route.default()).props)));
    assert.equal((html.match(/<h1 /g)||[]).length,1,path);
    assert.equal((html.match(/<main /g)||[]).length,1,path);
    assert.match(html,/Preview/);
    const metadata = await route.generateMetadata();
    assert.equal(metadata.robots.index,false,path);
    assert.match(metadata.alternates.canonical, new RegExp(`/${path}$`));
    assert.doesNotMatch(html,/dangerouslySetInnerHTML|<iframe/);
    if (path==='contact') { assert.match(html,/<fieldset disabled=""/); assert.doesNotMatch(html,/href="mailto:/); }
  }
  for (const [family, entries] of [['services',SERVICE_ENTRIES],['physicians',PHYSICIAN_ENTRIES],['resources',ARTICLE_ENTRIES]]) {
    const route = require(`../src/app/(public)/${family}/[slug]/page.tsx`);
    assert.equal(route.generateStaticParams().length, entries.length);
    for (const entry of entries) {
      const page = await route.default({params:Promise.resolve({slug:entry.slug})});
      const html = renderToStaticMarkup(await PublishedPage(page.props));
      assert.equal((html.match(/<h1 /g)||[]).length,1);
      assert.match(html,/\[/);
      if (family==='physicians') { assert.match(html,/APPROVED CREDENTIALS/); assert.doesNotMatch(html,/licence|license/i); }
      if (family==='resources') assert.match(html,/MEDICAL REVIEW DATE/);
      const metadata = await route.generateMetadata({params:Promise.resolve({slug:entry.slug})});
      assert.equal(metadata.robots.index,false);
      assert.ok(metadata.alternates.canonical.endsWith(entry.path));
    }
    await assert.rejects(route.default({params:Promise.resolve({slug:'missing'})}), error=>error.digest==='NEXT_HTTP_ERROR_FALLBACK;404');
  }
  const ErrorFallback = require('../src/components/recovery/ErrorFallback.tsx').default;
  let retries=0;
  const fallback = ErrorFallback({retry:()=>retries++});
  const retryButton = React.Children.toArray(fallback.props.children).find(child => React.isValidElement(child) && child.type === "button");
  retryButton.props.onClick();
  assert.equal(retries,1);
  const errorHtml=renderToStaticMarkup(fallback);
  assert.match(errorHtml,/Try again/);
  assert.match(errorHtml,/page-search-input/);
  assert.doesNotMatch(errorHtml,/stack|digest/i);
  console.log('Passed: 24 page templates, metadata, invalid slugs, insurance states, location configuration, private local search and retry callback.');
}
checkRoutes().catch(error=>{console.error(error);process.exitCode=1;});
