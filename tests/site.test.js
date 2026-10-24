import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const origin = 'http://127.0.0.1:4174';
const routes = ['/', '/about', '/services', '/events', '/messages', '/ministries', '/media', '/contact'];
const viewports = [320, 360, 375, 390, 414, 768, 834, 1024, 1280, 1440, 1920];
let browser;
let server;

before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Preview did not start within 15 seconds: ${output}`)), 15000);
    const finish = (error) => { clearTimeout(timeout); error ? reject(error) : resolve(); };
    server.stdout.on('data', data => { output += data; if (data.toString().includes('4174')) finish(); });
    server.stderr.on('data', data => { output += data; });
    server.once('error', finish);
    server.once('exit', code => finish(new Error(`Preview exited (${code}): ${output}`)));
  });
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
}, { timeout: 30000 });

after(async () => {
  await browser?.close();
  server?.kill();
});

async function openPage(path = '/', options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ...options });
  page.setDefaultTimeout(10000);
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200, `${path} must return HTTP 200`);
  return page;
}

async function loadImages(page) {
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(element => Promise.race([
      element.decode(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Image failed to decode: ${element.getAttribute('src')}`)), 5000)),
    ]));
    assert.ok(await image.evaluate(element => element.complete && element.naturalWidth > 0), `Image should load: ${await image.getAttribute('src')}`);
  }
}

async function playVideo(page, video) {
  await video.evaluate(element => Promise.race([
    new Promise((resolve, reject) => {
      if (element.readyState >= 1) return resolve();
      element.addEventListener('loadedmetadata', resolve, { once: true });
      element.addEventListener('error', () => reject(new Error('Video failed to load')), { once: true });
      element.load();
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Video metadata timed out')), 7000)),
  ]));
  assert.ok(await video.evaluate(element => element.duration > 0), 'Video must have a finite playable duration');
  await video.evaluate(element => { element.muted = true; return element.play(); });
  await page.waitForFunction(() => [...document.querySelectorAll('video')].some(element => element.currentTime > 0), null, { timeout: 7000 });
  assert.ok(await video.evaluate(element => element.currentTime > 0), 'Video playback must actually advance');
  await video.evaluate(element => element.pause());
}

test('all public pages render the SW8 identity, working images, and correct anchor targets', { timeout: 30000 }, async () => {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, `${route} must load`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1, `${route} needs a single primary heading`);
      const body = await page.locator('body').innerText();
      assert.match(body, /SW8/, `${route} must identify SW8`);
      assert.match(body, /Ijebu\s*\/\s*Remo/i, `${route} must identify the region`);
      if (route === '/') assert.match(await page.getByRole('heading', { level: 1 }).innerText(), /Welcome\s+to\s+Mountain\s+of\s+Fire\s+and\s+Miracles\s+Ministries/i);
      if (route === '/about') await page.getByRole('heading', { name: 'Pastor Japheth Otujinrin' }).waitFor();
      await loadImages(page);
      for (const anchor of await page.locator('a[href^="#"]').all()) {
        const href = await anchor.getAttribute('href');
        assert.equal(await page.locator(href).count(), 1, `${route}: ${href} must resolve to one target`);
      }
      assert.deepEqual(errors, [], `${route} must not raise runtime errors`);
      if (route === '/') {
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
        await page.screenshot({ path: '/tmp/mfm-desktop.png', fullPage: true });
      }
    } finally { await page.close(); }
  }
});

test('mobile menu opens, follows a real page link, and closes with Escape', { timeout: 30000 }, async () => {
  const page = await openPage('/', { viewport: { width: 390, height: 844 } });
  try {
    const menu = page.locator('.menu-toggle');
    await menu.click();
    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Our region', exact: true }).click();
    await page.waitForURL(`${origin}/about`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    await menu.click();
    await page.keyboard.press('Escape');
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert.equal(await menu.evaluate(element => document.activeElement === element), true, 'Escape returns focus to the menu button');
    await page.goto(origin, { waitUntil: 'networkidle' });
    await loadImages(page);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await page.screenshot({ path: '/tmp/mfm-mobile.png', fullPage: true });
  } finally { await page.close(); }
});

test('the photographic welcome hero changes only through its accessible carousel controls', { timeout: 30000 }, async () => {
  const page = await openPage('/', { reducedMotion: 'no-preference' });
  try {
    await page.clock.install();
    const hero = page.getByRole('region', { name: 'Welcome to MFM SW8 Ijebu/Remo', exact: true });
    await hero.waitFor();
    const photo = hero.locator('.hero-backdrop img');
    const first = hero.getByRole('button', { name: 'Show photograph 1', exact: true });
    const second = hero.getByRole('button', { name: 'Show photograph 2', exact: true });
    const third = hero.getByRole('button', { name: 'Show photograph 3', exact: true });
    assert.equal(await first.getAttribute('aria-pressed'), 'true');
    assert.equal(await second.getAttribute('aria-pressed'), 'false');
    const firstSource = await photo.getAttribute('src');
    assert.ok(firstSource, 'The hero must display a real regional photograph');

    await hero.getByRole('button', { name: 'Next photograph', exact: true }).click();
    assert.equal(await second.getAttribute('aria-pressed'), 'true');
    assert.equal(await first.getAttribute('aria-pressed'), 'false');
    const secondSource = await photo.getAttribute('src');
    assert.notEqual(secondSource, firstSource, 'Next must show another photograph');
    await photo.evaluate(image => image.decode());

    await hero.getByRole('button', { name: 'Previous photograph', exact: true }).click();
    assert.equal(await first.getAttribute('aria-pressed'), 'true');
    assert.equal(await photo.getAttribute('src'), firstSource);
    await third.click();
    assert.equal(await third.getAttribute('aria-pressed'), 'true');
    const thirdSource = await photo.getAttribute('src');
    assert.notEqual(thirdSource, secondSource);
    assert.notEqual(thirdSource, firstSource);
    await photo.evaluate(image => image.decode());

    await hero.getByRole('button', { name: 'Next photograph', exact: true }).click();
    assert.equal(await first.getAttribute('aria-pressed'), 'true', 'Next wraps from the last photograph to the first');
    await hero.getByRole('button', { name: 'Previous photograph', exact: true }).click();
    assert.equal(await third.getAttribute('aria-pressed'), 'true', 'Previous wraps from the first photograph to the last');
    await page.clock.fastForward(60000);
    assert.equal(await third.getAttribute('aria-pressed'), 'true', 'The carousel must never advance automatically');
    assert.equal(await photo.getAttribute('src'), thirdSource);

    const header = page.locator('.site-header');
    assert.ok((await header.getAttribute('class')).includes('header-over-hero'), 'Home navigation must overlay the hero');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 600); });
    await page.waitForFunction(() => document.querySelector('.site-header').classList.contains('scrolled'));
    const bounds = await header.boundingBox();
    assert.ok(bounds && bounds.y >= 0 && bounds.y < 100, 'Navigation remains visible after scrolling');
    assert.equal(await header.getByRole('link', { name: 'Our region', exact: true }).isVisible(), true);
  } finally { await page.close(); }
});

test('the homepage fits all eleven brief-specified viewport widths', { timeout: 30000 }, async () => {
  for (const width of viewports) {
    const page = await openPage('/', { viewport: { width, height: 1000 } });
    try {
      await page.getByRole('heading', { level: 1 }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Homepage overflows at ${width}px`);
      assert.ok(await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize) >= 16), `Body text is too small at ${width}px`);
    } finally { await page.close(); }
  }
});

test('all public pages fit a narrow phone viewport', { timeout: 30000 }, async () => {
  for (const route of routes) {
    const page = await openPage(route, { viewport: { width: 320, height: 800 } });
    try {
      await page.getByRole('heading', { level: 1 }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflows at 320px`);
    } finally { await page.close(); }
  }
});

test('gallery photos open in an accessible dialog and return focus when dismissed', { timeout: 30000 }, async () => {
  const page = await openPage('/media');
  try {
    const photo = page.getByRole('button', { name: /^View photo:/ }).first();
    await photo.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('img').evaluate(element => element.decode());
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await photo.evaluate(element => document.activeElement === element), true);
    await photo.click();
    await page.getByRole('button', { name: 'Close media', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  } finally { await page.close(); }
});

test('the hero uses the NEW motion identity and actual video playback works', { timeout: 30000 }, async () => {
  const page = await openPage('/');
  try {
    await page.getByRole('button', { name: /Watch our motion identity/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    const video = dialog.locator('video');
    assert.equal(await video.locator('source').getAttribute('src'), '/media/new-motion-logo.mp4');
    await playVideo(page, video);
    await page.getByRole('button', { name: 'Close media', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  } finally { await page.close(); }
});

test('regional introduction plays and the denominational resource is explicitly external', { timeout: 30000 }, async () => {
  const page = await openPage('/media');
  try {
    await playVideo(page, page.getByLabel('Ijebu/Remo regional introduction', { exact: true }));
    await page.goto(`${origin}/messages`, { waitUntil: 'networkidle' });
    const resource = page.getByRole('link', { name: 'Visit the official MFM website' });
    assert.equal(await resource.getAttribute('href'), 'https://www.mountainoffire.org');
    assert.equal(await resource.getAttribute('target'), '_blank');
    assert.match(await resource.getAttribute('rel'), /noopener/);
    assert.match(await page.locator('body').innerText(), /international/i);
  } finally { await page.close(); }
});

test('reduced-motion mode keeps hero content visible without decorative continuous motion', { timeout: 30000 }, async () => {
  const page = await openPage('/', { reducedMotion: 'reduce' });
  try {
    assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
    for (const element of await page.locator('.hero-enter').all()) {
      assert.equal(await element.isVisible(), true);
      assert.equal(await element.evaluate(node => parseFloat(getComputedStyle(node).opacity)), 1);
    }
    const infinite = await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.getTiming().iterations === Infinity && animation.playState === 'running').length);
    assert.equal(infinite, 0, 'Decorative infinite animations must stop with reduced motion');
  } finally { await page.close(); }
});

test('unconfigured admin requires setup and never exposes content editing controls', { timeout: 30000 }, async () => {
  const page = await openPage('/admin.html');
  try {
    await page.getByRole('heading', { name: 'One-time connection needed', exact: true }).waitFor();
    assert.match(await page.locator('body').innerText(), /setup|connect|configuration/i);
    assert.equal(await page.getByRole('button', { name: /publish|add event|save changes|delete/i }).count(), 0);
    assert.equal(await page.locator('input[type="password"]').count(), 0, 'Do not collect a password before a backend is configured');
  } finally { await page.close(); }
});
