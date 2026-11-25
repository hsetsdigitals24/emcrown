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
assert.doesNotMatch(locations, /Jensen Beach/);
assert.match(locations, /www.google.com\/maps/);
assert.equal(PRACTICE.locations.length, 1);
assert.equal(PRACTICE.locationSelectorEnabled, false);
const single = renderToStaticMarkup(React.createElement(PracticeLocations, { practice:{...PRACTICE,locationSelectorEnabled:false} }));
assert.doesNotMatch(single, /Jensen Beach|name="practice-location"/);
async function checkRoutes() {
  const { CMS_DEFINITIONS } = require('../src/config/cms/registry.ts');
  const { validateValues, storedValues } = require('../src/features/cms/validation.ts');
  const { applyContent } = require('../src/features/cms/fields.ts');
  const { PAGE_SEEDS } = require('../src/config/cms/content.ts');
  for (const definition of CMS_DEFINITIONS) {
    assert.ok(validateValues(definition.path, definition.initial), `Invalid CMS seed: ${definition.path}`);
    assert.deepEqual(storedValues(definition.path, definition.initial), definition.initial);
  }
  const { RETIRED_STARTER_COPY } = require('../src/features/cms/legacy-copy.ts');
  for (const change of RETIRED_STARTER_COPY) {
    const definition = CMS_DEFINITIONS.find(entry => entry.path === change.path);
    if (!definition.fields.some(field => field.key === change.key)) {
      assert.equal(storedValues(change.path, { ...definition.initial, [change.key]: change.before })[change.key], undefined);
      continue;
    }
    const previous = { ...definition.initial, [change.key]: change.before };
    assert.equal(storedValues(change.path, previous)[change.key], definition.initial[change.key]);
    const editedValue = definition.fields.find(field => field.key === change.key).link ? '/contact?topic=visit' : 'Staff-authored copy';
    previous[change.key] = editedValue;
    assert.equal(storedValues(change.path, previous)[change.key], editedValue);
  }
  const { BOOKING_SEED, HOME_SEED } = require('../src/config/cms/content.ts');
  const BookingUnavailable = require('../src/features/booking/BookingUnavailable.tsx').default;
  const unavailable = renderToStaticMarkup(React.createElement(BookingUnavailable, { content: BOOKING_SEED, site: require('../src/config/cms/content.ts').SITE_SEED }));
  assert.doesNotMatch(unavailable, /<form|demo|sample times/i);
  assert.match(unavailable, /href="tel:/);
  const HomeContent = require('../src/features/cms/HomeContent.tsx').default;
  const record = { id: 'fixture', fullName: 'Published fixture', title: '', credentials: '', specialties: 'Published specialty', slug: 'published-fixture', photo: '', bookingAvailable: false };
  const rendered = renderToStaticMarkup(React.createElement(HomeContent, { content: HOME_SEED, records: [record] }));
  assert.match(rendered, /Published fixture/);
  assert.match(rendered, /href="\/physicians\/published-fixture"/);
  const cmsHome = CMS_DEFINITIONS.find(entry => entry.path === '/');
  const cmsHomeValues = { ...cmsHome.initial, 'about.buttonLabel': 'CMS about action', 'insurance.buttonLabel': 'CMS insurance action', 'physicians.labels.profile': 'CMS profile action' };
  const cmsHomeHtml = renderToStaticMarkup(React.createElement(HomeContent, { content: applyContent(HOME_SEED, cmsHomeValues), records: [record] }));
  for (const label of ['CMS about action', 'CMS insurance action', 'CMS profile action']) assert.ok(cmsHomeHtml.includes(label));
  assert.doesNotMatch(cmsHomeHtml, /stock imagery|not emcrown staff|demonstration|website demo/i);
  const { Window } = await import('happy-dom');
  const cmsWindow = new Window();
  cmsWindow.document.body.innerHTML = cmsHomeHtml;
  const { fieldAtElement } = require('../src/features/cms/preview-selection.ts');
  for (const [selector, key] of [
    ['#about h2', 'about.headline'],
    ['#insurance a span', 'insurance.buttonLabel'],
    ['.reference-service:nth-child(3) a span', 'services.items.2.link.label'],
    ['#about .reference-values li:first-child span[data-cms-field]', 'about.items.0.title'],
    ['.editorial-physician-actions a span', 'physicians.labels.profile'],
  ]) assert.equal(fieldAtElement(cmsWindow.document.querySelector(selector), cmsHome, cmsHomeValues), key);
  await cmsWindow.happyDOM.close();
  const stale = { ...HOME_SEED, physicians: { ...HOME_SEED.physicians, physicians: [{ id: 'stale', name: 'STALE IDENTITY' }] } };
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(HomeContent, { content: stale, records: [] })), /STALE IDENTITY/);
  const about = CMS_DEFINITIONS.find(entry => entry.path === '/about');
  const edited = { ...about.initial, 'content.hero.body': 'Staff-edited introduction', 'content.sections.0.body': 'Staff-edited paragraph' };
  assert.ok(validateValues('/about', edited));
  const updated = applyContent(PAGE_SEEDS['/about'], edited);
  assert.equal(updated.content.hero.body, 'Staff-edited introduction');
  assert.equal(updated.content.sections[0].body, 'Staff-edited paragraph');

  const paths = ['about','services','physicians','resources','insurance','contact','faq','legal','privacy','terms','accessibility','notice-of-privacy-practices'];
  for (const path of paths) {
    const route = require(`../src/app/(public)/${path}/page.tsx`);
    const html = renderToStaticMarkup(React.createElement(SiteLayout, {navigation:SITE_NAVIGATION,footer:SITE_FOOTER}, await PublishedPage((await route.default()).props)));
    assert.equal((html.match(/<h1 /g)||[]).length,1,path);
    assert.equal((html.match(/<main /g)||[]).length,1,path);
    assert.doesNotMatch(html,/\[(?:SERVICE NAME|ARTICLE TITLE|APPROVED PRIVACY|PRACTICE INTRODUCTION)/);
    const metadata = await route.generateMetadata();
    assert.equal(metadata.robots.index,false,path);
    assert.match(metadata.alternates.canonical, new RegExp(`/${path}$`));
    assert.doesNotMatch(html,/dangerouslySetInnerHTML/);
    if (path === "contact") {
      assert.equal((html.match(/<iframe/g) ?? []).length, 1);
      assert.match(html, /src="https:\/\/www.google.com\/maps\?/);
    } else assert.doesNotMatch(html, /<iframe/);
    if (path==='contact') { assert.doesNotMatch(html,/<form/); assert.match(html,/href="tel:/); assert.doesNotMatch(html,/href="mailto:/); }
  }
  for (const [family, entries] of [['services',SERVICE_ENTRIES],['physicians',PHYSICIAN_ENTRIES],['resources',ARTICLE_ENTRIES]]) {
    const route = require(`../src/app/(public)/${family}/[slug]/page.tsx`);
    assert.equal(route.generateStaticParams().length, entries.length);
    for (const entry of entries) {
      const page = await route.default({params:Promise.resolve({slug:entry.slug})});
      const html = renderToStaticMarkup(await PublishedPage(page.props));
      assert.equal((html.match(/<h1 /g)||[]).length,1);
      assert.doesNotMatch(html,/\[(?:SERVICE NAME|ARTICLE TITLE|ARTICLE BODY|MEDICAL REVIEW DATE)/);
      if (family==='physicians') { assert.match(html,/APPROVED CREDENTIALS/); assert.doesNotMatch(html,/licence|license/i); }
      if (family==='resources') { assert.doesNotMatch(html,/Medically reviewed<\/dt>/); assert.match(html,/Further reading/); }
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
  console.log('Passed: public editorial pages, metadata, invalid slugs, insurance states, location configuration, private local search and retry callback.');
}
checkRoutes().catch(error=>{console.error(error);process.exitCode=1;});
