import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
let browser,server;
const origin='http://127.0.0.1:4174';
before(async()=>{
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4174','--strictPort'],{stdio:'pipe'});
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('4174'))resolve()});server.on('error',reject);server.on('exit',code=>reject(new Error(`Preview exited: ${code}`)))});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 browser.on('page',page=>page.setDefaultTimeout(10000));
});
after(async()=>{await browser?.close();server?.kill()});
test('regional identity, verified leadership and locally served assets render',async()=>{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(origin);assert.equal(response.status(),200);
 await page.getByRole('heading',{name:'Pastor Japheth Otujinrin'}).waitFor();
 assert.match(await page.locator('body').innerText(),/SW8 Mega-Regional Headquarters, Ijebu\/Remo/);
 for(const img of await page.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert.equal(await img.evaluate(el=>el.complete&&el.naturalWidth>0),true)}
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)});
 for(const a of await page.locator('a[href^="#"]').all()){const href=await a.getAttribute('href');assert.equal(await page.locator(href).count(),1)}
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/mfm-desktop.png',fullPage:true});await page.close();
});
test('mobile navigation opens, follows links, and closes with Escape',async()=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(origin);
 const menu=page.locator('.menu-toggle');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');
 await page.getByRole('navigation').getByRole('link',{name:'Worship with us'}).click();assert.equal(await menu.getAttribute('aria-expanded'),'false');
 await menu.click();await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/mfm-mobile.png',fullPage:true});await page.close();
});
test('small phone, mobile, tablet and desktop layouts do not overflow',async()=>{
 for(const width of [320,390,768,1024,1440]){const page=await browser.newPage({viewport:{width,height:900}});await page.goto(origin);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}px`);await page.close()}
});
test('regional video is accessible, playable and official link is labeled',async()=>{
 const page=await browser.newPage();await page.goto(origin);const video=page.locator('video');
 await video.evaluate(el=>new Promise((resolve,reject)=>{if(el.readyState>=1)return resolve();el.onloadedmetadata=resolve;el.onerror=()=>reject(new Error('Video could not load'))}));
 assert.ok(await video.evaluate(el=>el.duration>0));await video.evaluate(el=>{el.muted=true;return el.play()});await page.waitForTimeout(300);assert.ok(await video.evaluate(el=>el.currentTime>0));
 const a=page.getByRole('link',{name:'Visit the official MFM website'});assert.equal(await a.getAttribute('href'),'https://www.mountainoffire.org');assert.match(await a.getAttribute('rel'),/noopener/);await page.close();
});
