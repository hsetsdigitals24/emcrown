// Node regression: production Dashboard pages must render inside exactly one shared workspace.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the existing TypeScript loader. */
require('../scripts/auth.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
require.extensions['.tsx'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  module._compile(result.outputText, filename);
};
require.extensions['.css'] = () => {};
let pathname = '/emcrown-admin';
let signedIn = true;
const permissions = [];
const actor = { userId: '11111111-1111-4111-8111-111111111111', role: 'super_admin', organisationName: 'Fictional test practice' };
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === 'next/server') return { connection: async () => {} };
  if (name === 'next/navigation') return { usePathname: () => pathname, redirect: path => { throw Error('redirect:' + path); } };
  if (name === '@/lib/auth-env') return { authConfigured: () => true };
  if (name === '@/features/auth/session') return { readSession: async () => signedIn ? { ...actor, stage: 'full', privateCanary: 'MUST_NOT_RENDER' } : null, sessionDestination: () => '/emcrown-admin/mfa' };
  if (name === '@/features/auth/authorize') return { authorisedRead: async permission => {
    permissions.push(permission);
    return { actor, events: [] };
  } };
  if (name === '@/features/notifications/repository') return { listNotificationFeed: async () => ({ok:true,data:{events:[],attention:[],page:0,hasMore:false}}) };
  if (name === '@/features/auth/actions') return { logoutAction: async () => {} };
  // Security forms have their own integration suite; the regression here is their page wrapper.
  if (name === '@/features/auth/WorkspaceSecurity') return { __esModule: true, default: () => React.createElement('section', null, 'Fictional security content') };
  return originalLoad.call(this, name, ...args);
};
const Dashboard = require('../src/features/auth/Dashboard.tsx').default;
const WorkspaceLayout = require('../src/app/emcrown-admin/(workspace)/layout.tsx').default;
async function main() {
  for (const [path, props, title, permission] of [
    ['/emcrown-admin', {}, 'Overview', 'portal:read'],
    ['/emcrown-admin/activity', { activity: true }, 'Activity log', 'audit:read'],
    ['/emcrown-admin/security', { security: true }, 'Security &amp; access', 'portal:read'],
  ]) {
    pathname = path;
    const content = await Dashboard(props);
    const tree = await WorkspaceLayout({ children: content });
    const html = renderToStaticMarkup(tree);
    assert.equal((html.match(/class="admin-workspace"/g) || []).length, 1, path + ': one frame');
    assert.equal((html.match(/class="workspace-sidebar"/g) || []).length, 1, path + ': one sidebar');
    assert.equal((html.match(/class="workspace-header"/g) || []).length, 1, path + ': one header');
    assert.equal((html.match(/<h1>/g) || []).length, 1, path + ': one page heading');
    assert.ok(html.includes('<h1>' + title + '</h1>'), path + ': correct page title');
    assert.equal(permissions.at(-1), permission, path + ': page permission retained');
    assert.doesNotMatch(html, /MUST_NOT_RENDER/);
    console.log('Single-shell rendering verified: ' + path);
  }
  signedIn = false;
  await assert.rejects(WorkspaceLayout({ children: null }), /redirect:\/emcrown-admin\/login/);
  console.log('Shared-layout sign-in guard remains enforced.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
