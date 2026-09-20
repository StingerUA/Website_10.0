// Project integration tests; synthetic camera input is NOT a physical AR test.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {dishes, categories} from '../assets/js/restaurant-next/catalog.mjs';

const output = process.env.RESTAURANT_TEST_OUTPUT || 'test-results/restaurant-next';
await fs.mkdir(output, {recursive:true});
const server = spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
let browser, page;
const results=[], errors=[], missing=[], diagnostics=[];
const record=message=>{results.push(message);console.log(message);};
function observePage(page){
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',message=>{if(['warning','error'].includes(message.type()))diagnostics.push(message.text());});
  page.on('requestfailed',request=>diagnostics.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response',r=>{if(r.status()===404&&r.url().includes('127.0.0.1'))missing.push(r.url());});
}
try {
  for(let i=0;i<60;i++){
    try{const response=await fetch('http://127.0.0.1:4173/rus/ar-restaurant-next/');if(response.ok)break;}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  browser = await chromium.launch({headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,permissions:['camera']});
  page=await context.newPage();
  observePage(page);
  await page.goto('http://127.0.0.1:4173/rus/ar-restaurant-next/');
  await page.waitForFunction(()=>document.querySelector('#dish-viewer').loaded,{},{timeout:60000});
  await page.screenshot({path:`${output}/ru-mobile-preview.png`});
  assert.equal(await page.locator('#auth-gate').isVisible(),false);
  assert.equal(await page.locator('#start-ar').isEnabled(),true);
  record('RU guest preview loads with its real GLB');
  await page.locator('#start-ar').click();
  await page.getByText('Продолжайте в 3D',{exact:true}).waitFor();
  record('Desktop/no-AR mode remains interactive and shows a friendly fallback');
  for(const dish of dishes){
    await page.locator('#menu-toggle').click();
    await page.locator('#categories').getByRole('button',{name:categories.find(c=>c.id===dish.category).label.ru,exact:true}).click();
    await page.locator('#dishes button').filter({hasText:dish.copy.ru.name}).click();
    await page.waitForFunction(src=>{const v=document.querySelector('#dish-viewer');return v.loaded&&v.src.endsWith(src)&&document.querySelector('#load-progress').hidden;},dish.src,{timeout:60000});
    assert.equal(await page.locator('#dish-name').textContent(),dish.copy.ru.name);
    assert.equal(await page.locator('#dish-viewer').evaluate(v=>v.scale),`${dish.modelScale} ${dish.modelScale} ${dish.modelScale}`);
    console.log(`Inline model loaded: ${dish.id}`);
  }
  record('All 10 dishes load in the inline viewer; category changes, poster paths and scales checked');
  await page.locator('#hands-toggle').click();
  await page.getByText('Сведите большой и указательный пальцы над блюдом, чтобы захватить его. Две руки меняют размер и поворот.',{exact:true}).waitFor({timeout:90000});
  await page.waitForFunction(()=>document.querySelector('#camera-video').videoWidth>0);
  await page.locator('#lab-toggle').click();
  await page.waitForFunction(()=>/Inference ms\s+\d+/.test(document.querySelector('#lab-values').innerText),{},{timeout:30000});
  record('MediaPipe worker initializes, processes synthetic camera frames, and reports inference telemetry');
  await page.locator('#lab-toggle').click();
  for(const dish of dishes){
    await page.locator('#menu-toggle').click();
    await page.locator('#categories').getByRole('button',{name:categories.find(c=>c.id===dish.category).label.ru,exact:true}).click();
    await page.locator('#dishes button').filter({hasText:dish.copy.ru.name}).click();
    await page.waitForFunction(()=>document.querySelector('#status-title').textContent==='Блюдо готово'&&document.querySelector('#load-progress').hidden,{},{timeout:60000});
    assert.equal(await page.locator('#dish-name').textContent(),dish.copy.ru.name);
    console.log(`Three.js model loaded: ${dish.id}`);
  }
  record('All 10 dishes also load through Three.js, including Draco and multi-file glTF');
  await page.locator('#exit').click();
  await page.waitForFunction(()=>document.querySelector('#camera-video').srcObject===null&&document.querySelector('#next-app').dataset.mode==='preview');
  record('Exit releases the camera and returns to 3D');
  const replay=await page.evaluate(async()=>{
    const {RestaurantScene}=await import('/assets/js/restaurant-next/scene.mjs?v=0.1.0');
    const THREE=await import('three');
    const host=document.createElement('div');host.style.cssText='position:fixed;width:300px;height:300px;left:0;top:0;';document.body.append(host);
    const overlay=document.createElement('div'),interaction=document.createElement('div');host.append(overlay,interaction);
    interaction.style.cssText='position:absolute;inset:0;';
    const scene=new RestaurantScene({host,overlay,interaction,onState:()=>{},onStats:()=>{}});
    try{
      scene.model=new THREE.Mesh(new THREE.BoxGeometry(.2,.1,.2),new THREE.MeshBasicMaterial());
      scene.root.add(scene.model);scene.ready=true;scene.mode='xr';scene.scanStart=0;
      let tracked=true,hit=true,x=.3;
      const frame={session:{visibilityState:'visible',inputSources:[]},getViewerPose:()=>tracked?{emulatedPosition:false}:null,
        getHitTestResults:()=>hit?[{getPose:()=>({transform:{matrix:new THREE.Matrix4().makeTranslation(x,.7,-1).elements}})}]:[]};
      scene.frame(0,frame,{},{});const earlyPlacement=scene.place();
      scene.frame(300,frame,{},{});const autoPlaced=scene.placed;const tapPlacement=scene.place();
      const placed=scene.root.position.toArray();
      x=4;scene.camera.position.x=1;scene.frame(600,frame,{},{});
      const afterCameraMotion=scene.root.position.toArray();
      tracked=false;scene.frame(900,frame,{},{});const hiddenOnLoss=!scene.root.visible;
      tracked=true;scene.frame(1200,frame,{},{});const afterRecovery=scene.root.position.toArray();
      scene.rescan();hit=false;scene.frame(1500,frame,{},{});const lostHitPlacement=scene.place();
      scene.startCamera();
      scene.manipulate([{id:1,x:120,y:150},{id:2,x:180,y:150}],[{id:1,x:110,y:140},{id:2,x:190,y:160}]);
      const changed=scene.scale>1&&Math.abs(scene.yaw)>0;
      const beforeIdentityChange=[...scene.root.position.toArray(),scene.scale,scene.yaw];
      scene.manipulate([{id:1,x:110,y:140},{id:2,x:190,y:160}],[{id:3,x:200,y:200}]);
      const afterIdentityChange=[...scene.root.position.toArray(),scene.scale,scene.yaw];
      return{earlyPlacement,autoPlaced,tapPlacement,placed,afterCameraMotion,hiddenOnLoss,afterRecovery,lostHitPlacement,changed,beforeIdentityChange,afterIdentityChange};
    }finally{await scene.stop();scene.dispose();host.remove();}
  });
  assert.equal(replay.earlyPlacement,false);assert.equal(replay.autoPlaced,false);assert.equal(replay.tapPlacement,true);
  assert.deepEqual(replay.afterCameraMotion,replay.placed);assert.equal(replay.hiddenOnLoss,true);assert.deepEqual(replay.afterRecovery,replay.placed);
  assert.equal(replay.lostHitPlacement,false);assert.equal(replay.changed,true);assert.deepEqual(replay.afterIdentityChange,replay.beforeIdentityChange);
  record('Synthetic scene replay: explicit placement only, fixed world transform, tracking loss/recovery and gesture identity changes');
  await page.locator('#menu-toggle').click();
  await page.screenshot({path:`${output}/ru-mobile-menu.png`});
  await page.locator('#menu-close').click();
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  // A separate desktop page bounds retained GLB/SwiftShader memory after the
  // mobile catalogue stress pass and sets the viewport before WebGL starts.
  await page.close();
  page=await context.newPage();observePage(page);
  await page.setViewportSize({width:1440,height:960});
  await page.goto('http://127.0.0.1:4173/rus/ar-restaurant-next/');
  await page.waitForFunction(()=>document.querySelector('#dish-viewer').loaded,{},{timeout:60000});
  await page.screenshot({path:`${output}/ru-desktop.png`,timeout:60000});
  record('Desktop RU preview loads at 1440×960');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);

  // Auth is mocked at the backend boundary only. The real gate runs unchanged.
  await page.route('https://api.albaspace.com.tr/me',route=>route.fulfill({status:401,body:'{}',contentType:'application/json',headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4173','Access-Control-Allow-Credentials':'true'}}));
  await page.goto('http://127.0.0.1:4173/ar-restaurant-next/');
  await page.locator('#login-link').waitFor({state:'visible'});
  assert.equal(await page.locator('#next-app').evaluate(e=>e.inert),true);
  assert.equal(await page.locator('#dish-viewer').getAttribute('src'),null);
  record('TR gate denies unauthenticated use and does not load a dish');
  await page.unroute('https://api.albaspace.com.tr/me');
  await page.route('https://api.albaspace.com.tr/me',route=>route.fulfill({status:200,body:JSON.stringify({id:42,name:'Test quick account'}),contentType:'application/json',headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4173','Access-Control-Allow-Credentials':'true'}}));
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#dish-viewer').loaded,{},{timeout:60000});
  assert.equal(await page.locator('#auth-gate').isVisible(),false);
  await page.screenshot({path:`${output}/tr-desktop.png`,timeout:60000});
  record('TR accepts verified quick accounts without an email');

  for(const route of ['/ar-restaurant/','/rus/ar-restaurant/']){
    await page.goto(`http://127.0.0.1:4173${route}`);
    await page.waitForFunction(()=>document.querySelector('#mobile-model-viewer').loaded,{},{timeout:60000});
    record(`Production regression: ${route} loads its dish with the original engine`);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  await fs.writeFile(`${output}/report.json`,JSON.stringify({passed:true,checks:results,errors,missing,hardwareARTested:false},null,2));
  console.log(results.join('\n'));
} catch(error) {
  await page?.screenshot({path:`${output}/failure.png`}).catch(()=>{});
  const state=await page?.evaluate(()=>({url:location.pathname,status:document.querySelector('#status')?.innerText,mode:document.querySelector('#next-app')?.dataset.mode})).catch(()=>null);
  const report={passed:false,checks:results,error:String(error.stack),state,errors,missing,diagnostics,hardwareARTested:false};
  await fs.writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  console.error(JSON.stringify(report,null,2));
  throw error;
} finally {await browser?.close();server.kill();}
