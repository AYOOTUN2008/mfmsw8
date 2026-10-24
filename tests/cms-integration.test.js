/**
 * Browser integration tests with an in-memory Supabase HTTP fixture.
 * These exercise the compiled UI/data/auth integration; they DO NOT establish
 * that a real Supabase project's authentication or PostgreSQL RLS is secure.
 * Only the reserved fake project hostname is intercepted. No real backend is used.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';

const directory = '/tmp/mfm-cms-test-build';
const origin = 'http://127.0.0.1:4185';
const project = 'https://test-project.supabase.co';
const staffId = '00000000-0000-4000-8000-000000000001';
const visitorId = '00000000-0000-4000-8000-000000000002';
const timeout = 60000;
let browser;
let server;

function command(args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Command timed out: ${output}`)); }, 45000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); code === 0 ? resolve(output) : reject(new Error(`Command failed (${code}): ${output}`)); });
  });
}

before(async () => {
  await command(['node_modules/vite/bin/vite.js', 'build', '--outDir', directory, '--emptyOutDir'], {
    ...process.env,
    VITE_SUPABASE_URL: project,
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_testkey',
  });
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', directory, '--host', '127.0.0.1', '--port', '4185', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Configured preview startup timed out: ${output}`)), 15000);
    const finish = error => { clearTimeout(timer); error ? reject(error) : resolve(); };
    server.stdout.on('data', data => { output += data; if (data.toString().includes('4185')) finish(); });
    server.stderr.on('data', data => { output += data; });
    server.once('error', finish);
    server.once('exit', code => finish(new Error(`Configured preview exited (${code}): ${output}`)));
  });
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
}, { timeout });

after(async () => {
  await browser?.close();
  server?.kill();
  await rm(directory, { recursive: true, force: true });
});

function user(id) {
  return { id, aud: 'authenticated', role: 'authenticated', email: id === staffId ? 'staff@example.test' : 'observer@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-01-01T00:00:00Z' };
}
function token(id) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  // A deliberately unsigned local test token. The fixture is not an auth server.
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.test-fixture`;
}
function fixture({ outage = false } = {}) {
  const state = { outage, items: [], settings: null, unexpected: [], requests: [], nextId: 1 };
  async function attach(page) {
    page.setDefaultTimeout(12000);
    await page.route(`${project}/**`, async route => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();
      const headers = request.headers();
      const auth = headers.authorization || '';
      const id = auth === `Bearer ${token(staffId)}` ? staffId : auth === `Bearer ${token(visitorId)}` ? visitorId : null;
      // Decode the stable subject as auth tokens are timestamped on sign-in.
      let subject = id;
      try { subject = JSON.parse(Buffer.from(auth.replace(/^Bearer /, '').split('.')[1], 'base64url').toString()).sub || subject; } catch {}
      const approved = subject === staffId;
      const responseHeaders = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info,prefer,range', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'content-type': 'application/json' };
      const respond = (body, status = 200) => route.fulfill({ status, headers: responseHeaders, body: JSON.stringify(body) });
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: responseHeaders });
      state.requests.push({ path, method });
      if (state.outage && path.startsWith('/rest/v1/')) return respond({ code: 'TEST_OUTAGE', message: 'The test content service is unavailable.' }, 503);
      if (path === '/auth/v1/token' && method === 'POST') {
        const body = request.postDataJSON();
        const loginId = body.email === 'staff@example.test' ? staffId : visitorId;
        return respond({ access_token: token(loginId), refresh_token: `fixture-refresh-${loginId}`, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: user(loginId) });
      }
      if (path === '/auth/v1/user' && method === 'GET') return subject ? respond(user(subject)) : respond({ message: 'No session' }, 401);
      if (path === '/auth/v1/logout' && method === 'POST') return respond({});
      if (path === '/rest/v1/cms_admins' && method === 'GET') return respond(approved ? [{ user_id: staffId }] : []);
      if (path === '/rest/v1/site_settings') {
        if (method === 'GET') return respond(state.settings ? [{ data: state.settings }] : []);
        if (!approved) return respond({ message: 'Staff access required' }, 403);
        if (method === 'POST' || method === 'PATCH') { state.settings = request.postDataJSON().data; return respond(null, 200); }
      }
      if (path === '/rest/v1/content_items') {
        if (method === 'GET') {
          const publishedOnly = url.searchParams.get('published') === 'eq.true';
          let rows = state.items.filter(item => approved || item.published);
          if (publishedOnly) rows = rows.filter(item => item.published);
          return respond(rows);
        }
        if (!approved) return respond({ message: 'Staff access required' }, 403);
        if (method === 'POST') {
          const input = request.postDataJSON();
          const record = { ...input, id: `10000000-0000-4000-8000-${String(state.nextId++).padStart(12, '0')}`, created_at: '2026-10-24T12:00:00Z', updated_at: '2026-10-24T12:00:00Z' };
          state.items.push(record);
          return respond(headers.accept?.includes('vnd.pgrst.object') ? record : [record], 201);
        }
        const target = url.searchParams.get('id')?.replace(/^eq\./, '');
        if (method === 'PATCH') {
          const index = state.items.findIndex(item => item.id === target);
          if (index < 0) return respond({ message: 'Missing fixture item' }, 404);
          state.items[index] = { ...state.items[index], ...request.postDataJSON() };
          return respond(headers.accept?.includes('vnd.pgrst.object') ? state.items[index] : [state.items[index]]);
        }
        if (method === 'DELETE') { state.items = state.items.filter(item => item.id !== target); return respond(null); }
      }
      state.unexpected.push(`${method} ${path}`);
      return respond({ message: 'Unexpected test fixture endpoint' }, 500);
    });
  }
  return { state, attach };
}

async function newPage(mock, path = '/') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await mock.attach(page);
  await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  return page;
}
async function signIn(page, email) {
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('fixture-only-password');
  await page.getByRole('button', { name: 'Sign in securely', exact: true }).click();
}

test('configured content outage retains the public shell without resurrecting local archive items', { timeout }, async () => {
  const mock = fixture({ outage: true });
  const page = await newPage(mock);
  try {
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.match(await page.getByRole('heading', { level: 1 }).innerText(), /Welcome to Mountain of Fire and Miracles Ministries/i);
    await page.getByRole('status').filter({ hasText: /temporarily unavailable/i }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^View photo:/ }).count(), 0);
    await page.goto(`${origin}/about`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Pastor Japheth Otujinrin', exact: true }).count(), 0);
    assert.deepEqual(mock.state.unexpected, []);
  } finally { await page.close(); }
});

test('a configured empty CMS keeps intentionally empty public collections empty', { timeout }, async () => {
  const mock = fixture();
  const page = await newPage(mock, '/media');
  try {
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^View photo:/ }).count(), 0);
    assert.match(await page.locator('body').innerText(), /album.*prepared|photographs.*published/i);
    await page.goto(`${origin}/about`, { waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('heading', { name: 'Pastor Japheth Otujinrin', exact: true }).count(), 0);
    assert.deepEqual(mock.state.unexpected, []);
  } finally { await page.close(); }
});

test('a signed-in account without approved staff membership cannot open editing controls', { timeout }, async () => {
  const mock = fixture();
  const page = await newPage(mock, '/admin.html');
  try {
    await signIn(page, 'observer@example.test');
    await page.getByRole('heading', { name: 'Staff access needed.', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Add programme|Publish page changes|Save draft/ }).count(), 0);
    assert.equal(await page.getByRole('navigation', { name: 'Church office navigation' }).count(), 0);
    assert.deepEqual(mock.state.unexpected, []);
  } finally { await page.close(); }
});

test('approved staff can draft, publish, unpublish a programme and update the public homepage', { timeout }, async () => {
  const mock = fixture();
  const admin = await newPage(mock, '/admin.html');
  let visitor;
  try {
    await signIn(admin, 'staff@example.test');
    await admin.getByRole('heading', { name: 'Good work starts here.', exact: true }).waitFor();
    await admin.getByRole('button', { name: /Add programme/ }).first().click();
    await admin.getByLabel('Title', { exact: true }).fill('Fixture-only regional programme');
    await admin.getByLabel('Description', { exact: true }).fill('Test content, never published to a real church backend.');
    await admin.getByLabel('Confirmed programme date', { exact: true }).fill('2099-12-01');
    await admin.getByRole('button', { name: 'Save draft', exact: true }).click();
    const row = admin.getByRole('row').filter({ hasText: 'Fixture-only regional programme' });
    await row.waitFor();
    assert.match(await row.innerText(), /Draft/);
    visitor = await newPage(mock, '/events');
    assert.equal(await visitor.getByRole('heading', { name: 'Fixture-only regional programme', exact: true }).count(), 0, 'Drafts stay off the public website');
    await row.getByRole('button', { name: 'Publish', exact: true }).click();
    await row.getByRole('button', { name: 'Unpublish', exact: true }).waitFor();
    await visitor.reload({ waitUntil: 'networkidle' });
    await visitor.getByRole('heading', { name: 'Fixture-only regional programme', exact: true }).waitFor();
    await row.getByRole('button', { name: 'Unpublish', exact: true }).click();
    await row.getByRole('button', { name: 'Publish', exact: true }).waitFor();
    await visitor.reload({ waitUntil: 'networkidle' });
    assert.equal(await visitor.getByRole('heading', { name: 'Fixture-only regional programme', exact: true }).count(), 0, 'Unpublished content is removed from the public website');
    await admin.getByRole('navigation', { name: 'Church office navigation' }).getByRole('button', { name: 'Page text & contact', exact: true }).click();
    await admin.getByLabel('Welcome heading', { exact: true }).fill('A fixture welcome for our regional family.');
    await admin.getByRole('button', { name: 'Publish page changes', exact: true }).click();
    await admin.getByRole('status').filter({ hasText: /update has been saved/i }).waitFor();
    await visitor.goto(origin, { waitUntil: 'networkidle' });
    await visitor.getByRole('heading', { level: 1, name: 'A fixture welcome for our regional family.', exact: true }).waitFor();
    assert.equal(mock.state.items.length, 1);
    assert.equal(mock.state.items[0].published, false);
    assert.deepEqual(mock.state.unexpected, []);
  } finally { await visitor?.close(); await admin.close(); }
});
