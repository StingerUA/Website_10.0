const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
(async()=>{
 const base=process.env.ISS_QA_BASE_URL||'https://albaspace.com.tr/';
 const output=process.env.ISS_QA_OUTPUT||'/tmp/iss-live-qa';fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});
 const issues=[];page.on('pageerror',e=>{issues.push(e.message);console.log('PAGE ERROR',e.message);});
 page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url(),r.failure()?.errorText));
 if(process.env.ISS_MODEL_VIEWER_SCRIPT)await page.route('**/model-viewer.min.js',route=>route.fulfill({path:process.env.ISS_MODEL_VIEWER_SCRIPT,contentType:'application/javascript'}));
 await page.goto(base+'rus/iss/?module=destiny',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('.iss-module-card').length===18,{},{timeout:60000});
 const ids=await page.locator('.iss-module-card').evaluateAll(es=>es.map(e=>e.dataset.issGo));
 const results=[];
 for(const id of ids){
  await page.locator('[data-iss-go="'+id+'"]').click();
  await page.waitForFunction(id=>{const v=document.getElementById('mainViewer');return v.loaded&&v.getAttribute('src').includes('/'+id+'_optimized.glb')&&document.getElementById('iss-interior-status').dataset.kind==='success';},id,{timeout:60000});
  await page.waitForTimeout(800);
  const state=await page.locator('#mainViewer').evaluate(v=>({src:v.getAttribute('src'),target:v.getAttribute('camera-target'),orbit:v.getAttribute('camera-orbit'),orbitActual:v.getCameraOrbit(),targetActual:v.getCameraTarget(),loaded:v.loaded}));
  await page.locator('#mainViewer').screenshot({path:path.join(output,id+'.png')});
  results.push({id,...state});console.log('Loaded',id,JSON.stringify(state.orbitActual));
 }
 await page.locator('#iss-back-corridor').click();await page.waitForFunction(()=>document.getElementById('mainViewer').loaded&&document.getElementById('mainViewer').getAttribute('src').includes('tranquility_optimized'),{},{timeout:60000});
 await page.locator('#iss-look-cupola').click();await page.waitForFunction(()=>document.getElementById('mainViewer').loaded&&document.getElementById('mainViewer').getAttribute('src').includes('cupola_optimized'),{},{timeout:60000});
 await page.locator('#iss-interior-outside').click();await page.waitForFunction(()=>document.getElementById('mainViewer').loaded&&document.getElementById('mainViewer').getAttribute('src')==='/assets/models/iss.glb',{},{timeout:120000});
 for(const locale of ['iss/','eng/iss/']){await page.goto(base+locale+'?module=destiny',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('.iss-module-card').length===18&&document.getElementById('mainViewer').loaded,{},{timeout:60000});}
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({base,modules:results,route:true,exterior:true,locales:3,pageErrors:issues},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
