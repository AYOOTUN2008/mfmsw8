/**
 * Office invitation/recovery integration with a mocked Supabase HTTP service.
 * The fake unsigned tokens and reserved example.test accounts below are fixtures.
 * These checks prove browser flow behavior, not real email delivery or live RLS.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const directory = '/tmp/mfm-cms-auth-build';
const origin = 'http://127.0.0.1:4186';
const project = 'https://auth-flow-check.supabase.co';
const timeout = 90000;
const user = {
  id: '9bf2f633-39c7-4b32-a05f-ebaf2d765129',
  aud: 'authenticated', role: 'authenticated', email: 'staff@example.test',
  app_metadata: { provider: 'email' }, user_metadata: {},
  created_at: '2026-10-24T00:00:00Z',
};
let browser;
let server;
function token() {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, sub: user.id, role: 'authenticated' })}.test-fixture`;
}
function command(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Auth fixture build timed out: ${output}`)); }, 60000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`Auth fixture build failed (${code}): ${output}`)); });
  });
}
before(async () => {
  await command(['node_modules/vite/bin/vite.js', 'build', '--outDir', directory, '--emptyOutDir'], {
    ...process.env, VITE_SUPABASE_URL: project, VITE_SUPABASE_ANON_KEY: 'sb_publishable_testing_only',
  });
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', directory, '--host', '127.0.0.1', '--port', '4186', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Auth fixture preview timed out: ${output}`)), 15000);
    const finish = error => { clearTimeout(timer); error ? reject(error) : resolve(); };
    server.stdout.on('data', data => { output += data; if (data.toString().includes('4186')) finish(); });
    server.stderr.on('data', data => { output += data; });
    server.once('error', finish);
    server.once('exit', code => finish(new Error(`Auth fixture preview exited (${code}): ${output}`)));
  });
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
}, { timeout });
after(async () => {
  await browser?.close();
  server?.kill();
  await rm(directory, { recursive: true, force: true });
});
async function mockedPage() {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const state = { updates: 0, logouts: 0, memberships: 0, recoveries: 0, unexpected: [] };
  await page.route(`${project}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
    const respond = (body, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(body) });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname === '/auth/v1/user') {
      if (method === 'PUT') {
        assert.equal(request.postDataJSON().password, 'Long secure fixture phrase');
        state.updates++;
      }
      return respond(user);
    }
    if (url.pathname === '/auth/v1/logout') { state.logouts++; return respond({}); }
    if (url.pathname === '/auth/v1/recover') {
      assert.equal(url.searchParams.get('redirect_to'), `${origin}/admin.html`);
      assert.equal(request.postDataJSON().email, user.email);
      state.recoveries++;
      return respond({});
    }
    if (url.pathname === '/auth/v1/token') return respond({ access_token: token(), refresh_token: 'fixture-refresh', expires_in: 3600, token_type: 'bearer', user });
    if (url.pathname === '/rest/v1/cms_admins') { state.memberships++; return respond([]); }
    state.unexpected.push(`${method} ${url.pathname}`);
    return respond({ message: 'Unexpected auth fixture endpoint' }, 500);
  });
  return { context, page, state };
}
for (const intent of ['invite', 'recovery']) {
  test(`mocked ${intent} link clears tokens, validates password confirmation, and signs out`, { timeout }, async () => {
    const { context, page, state } = await mockedPage();
    try {
      await page.goto(`${origin}/admin.html#access_token=${token()}&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=${intent}`);
      await page.getByRole('heading', { name: intent === 'invite' ? 'Set up your staff password.' : 'Choose a new password.', exact: true }).waitFor();
      assert.equal(new URL(page.url()).hash, '', 'SDK callback tokens are removed from the browser URL');
      assert.equal(state.memberships, 0, 'Password setup must not open CMS editing controls');
      await page.getByLabel('New password', { exact: true }).fill('Long secure fixture phrase');
      await page.getByLabel('Confirm new password', { exact: true }).fill('Different secure fixture phrase');
      await page.getByRole('button', { name: 'Save password & sign out', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'passwords do not match' }).waitFor();
      assert.equal(state.updates, 0);
      await page.getByLabel('Confirm new password', { exact: true }).fill('Long secure fixture phrase');
      await page.getByRole('button', { name: 'Save password & sign out', exact: true }).click();
      await page.getByRole('heading', { name: 'Welcome back.', exact: true }).waitFor();
      assert.equal(state.updates, 1);
      assert.equal(state.logouts, 1);
      await page.getByLabel('Email address', { exact: true }).fill(user.email);
      await page.getByLabel('Password', { exact: true }).fill('Long secure fixture phrase');
      await page.getByRole('button', { name: 'Sign in securely', exact: true }).click();
      await page.getByRole('heading', { name: 'Staff access needed.', exact: true }).waitFor();
      assert.equal(await page.getByRole('navigation', { name: 'Church office navigation' }).count(), 0, 'A password reset cannot grant staff membership');
      assert.deepEqual(state.unexpected, []);
    } finally { await context.close(); }
  });
}
test('mocked reset request uses the exact office redirect and a non-enumerating message', { timeout }, async () => {
  const { context, page, state } = await mockedPage();
  try {
    await page.goto(`${origin}/admin.html`);
    await page.getByRole('button', { name: 'Forgot your password?', exact: true }).click();
    await page.getByRole('heading', { name: 'Reset your password.', exact: true }).waitFor();
    await page.getByLabel('Email address', { exact: true }).fill(user.email);
    await page.getByRole('button', { name: 'Send password reset link', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'a reset link has been sent' }).waitFor();
    assert.match(await page.getByRole('status').innerText(), /does not confirm whether an account exists/);
    assert.equal(state.recoveries, 1);
    assert.deepEqual(state.unexpected, []);
  } finally { await context.close(); }
});
test('expired account links show a recoverable error without opening the CMS', { timeout }, async () => {
  const { context, page, state } = await mockedPage();
  try {
    await page.goto(`${origin}/admin.html#error=access_denied&error_code=otp_expired&error_description=Link+expired`);
    await page.getByRole('heading', { name: 'Welcome back.', exact: true }).waitFor();
    await page.getByRole('alert').filter({ hasText: 'expired or could not be verified' }).waitFor();
    assert.equal(new URL(page.url()).hash, '');
    assert.equal(await page.getByRole('navigation', { name: 'Church office navigation' }).count(), 0);
    assert.equal(state.memberships, 0);
    assert.deepEqual(state.unexpected, []);
  } finally { await context.close(); }
});
