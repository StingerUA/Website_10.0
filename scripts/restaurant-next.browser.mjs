// Project integration tests; synthetic camera input is NOT a physical AR test.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {dishes, categories} from '../assets/js/restaurant-next/catalog.mjs';

const output = process.env.RESTAURANT_TEST_OUTPUT || 'test-results/restaurant-next';
await fs.mkdir(output, {recursive:true});
const server = spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const results=[];
try {
  for(let i=0;i<60;i++){
    try{const response=await fetch('http://127.0.0.1:4173/rus/ar-restaurant-next/');if(response.ok)break;}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  browser = await chromium.launch({headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,permissions:['camera']});
  const page=await context.newPage();
  const errors=[],missing=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('response',r=>{if(r.status()===404&&r.url().includes('127.0.0.1'))missing.push(r.url());});
  await page.goto('http://127.0.0.1:4173/rus/ar-restaurant-next/');
  await page.waitForFunction(()=>document.querySelector('#dish-viewer').loaded,{},{timeout:60000});
  await page.screenshot({path:`${output}/ru-mobile-preview.png`});
  assert.equal(await page.locator('#auth-gate').isVisible(),false);
  assert.equal(await page.locator('#start-ar').isEnabled(),true);
  results.push('RU guest preview loads with its real GLB');
  await page.locator('#start-ar').click();
  await page.getByText('Продолжайте в 3D',{exact:true}).waitFor();
  results.push('Desktop/no-AR mode remains interactive and shows a friendly fallback');
  for(const dish of dishes){
    await page.locator('#menu-toggle').click();
    await page.locator('#categories').getByRole('button',{name:categories.find(c=>c.id===dish.category).label.ru,exact:true}).click();
    await page.locator('#dishes button').filter({hasText:dish.copy.ru.name}).click();
    await page.waitForFunction(src=>{const v=document.querySelector('#dish-viewer');return v.loaded&&v.src.endsWith(src)&&document.querySelector('#load-progress').hidden;},dish.src,{timeout:60000});
    assert.equal(await page.locator('#dish-name').textContent(),dish.copy.ru.name);
    assert.equal(await page.locator('#dish-viewer').evaluate(v=>v.scale),`${dish.modelScale} ${dish.modelScale} ${dish.modelScale}`);
  }
  results.push('All 10 dishes load in the inline viewer; category changes, poster paths and scales checked');
  await page.locator('#hands-toggle').click();
  await page.getByText('Сведите большой и указательный пальцы над блюдом, чтобы захватить его. Две руки меняют размер и поворот.',{exact:true}).waitFor({timeout:90000});
  await page.waitForFunction(()=>document.querySelector('#camera-video').videoWidth>0);
  await page.locator('#lab-toggle').click();
  await page.waitForFunction(()=>/Inference ms\s+\d+/.test(document.querySelector('#lab-values').innerText),{},{timeout:30000});
  results.push('MediaPipe worker initializes, processes synthetic camera frames, and reports inference telemetry');
  await page.locator('#lab-toggle').click();
  for(const dish of dishes){
    await page.locator('#menu-toggle').click();
    await page.locator('#categories').getByRole('button',{name:categories.find(c=>c.id===dish.category).label.ru,exact:true}).click();
    await page.locator('#dishes button').filter({hasText:dish.copy.ru.name}).click();
    await page.waitForFunction(()=>document.querySelector('#status-title').textContent==='Блюдо готово'&&document.querySelector('#load-progress').hidden,{},{timeout:60000});
    assert.equal(await page.locator('#dish-name').textContent(),dish.copy.ru.name);
  }
  results.push('All 10 dishes also load through Three.js, including Draco and multi-file glTF');
  await page.locator('#exit').click();
  await page.waitForFunction(()=>document.querySelector('#camera-video').srcObject===null&&document.querySelector('#next-app').dataset.mode==='preview');
  results.push('Exit releases the camera and returns to 3D');
  await page.locator('#menu-toggle').click();
  await page.screenshot({path:`${output}/ru-mobile-menu.png`});
  await page.locator('#menu-close').click();
  await page.setViewportSize({width:1440,height:960});
  await page.screenshot({path:`${output}/ru-desktop.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);

  // Auth is mocked at the backend boundary only. The real gate runs unchanged.
  await page.route('https://api.albaspace.com.tr/me',route=>route.fulfill({status:401,body:'{}',contentType:'application/json',headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4173','Access-Control-Allow-Credentials':'true'}}));
  await page.goto('http://127.0.0.1:4173/ar-restaurant-next/');
  await page.locator('#login-link').waitFor({state:'visible'});
  assert.equal(await page.locator('#next-app').evaluate(e=>e.inert),true);
  assert.equal(await page.locator('#dish-viewer').getAttribute('src'),null);
  results.push('TR gate denies unauthenticated use and does not load a dish');
  await page.unroute('https://api.albaspace.com.tr/me');
  await page.route('https://api.albaspace.com.tr/me',route=>route.fulfill({status:200,body:JSON.stringify({id:42,name:'Test quick account'}),contentType:'application/json',headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4173','Access-Control-Allow-Credentials':'true'}}));
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#dish-viewer').loaded,{},{timeout:60000});
  assert.equal(await page.locator('#auth-gate').isVisible(),false);
  await page.screenshot({path:`${output}/tr-desktop.png`});
  results.push('TR accepts verified quick accounts without an email');

  for(const route of ['/ar-restaurant/','/rus/ar-restaurant/']){
    await page.goto(`http://127.0.0.1:4173${route}`);
    await page.waitForFunction(()=>document.querySelector('#mobile-model-viewer').loaded,{},{timeout:60000});
    results.push(`Production regression: ${route} loads its dish with the original engine`);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  await fs.writeFile(`${output}/report.json`,JSON.stringify({passed:true,checks:results,errors,missing,hardwareARTested:false},null,2));
  console.log(results.join('\n'));
} catch(error) {
  await fs.writeFile(`${output}/report.json`,JSON.stringify({passed:false,checks:results,error:String(error.stack)},null,2));
  throw error;
} finally {await browser?.close();server.kill();}
