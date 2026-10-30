/* Automated local WebGL check; uses the real explorer controller and GLBs. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),deps=path.join(root,'qa/node_modules');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/models/interior/catalog-stage2.json')));
const sections={};
for(const [lang,page] of [['tr','iss/index.html'],['en','eng/iss/index.html'],['ru','rus/iss/index.html']]){
  const s=fs.readFileSync(path.join(root,page),'utf8');
  sections[lang]=s.match(/<section id="iss-interior-explorer"[\s\S]*?<\/section>/)[0];
}
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');let file;
  if(u.pathname==='/'){
    const lang=u.searchParams.get('lang')||'tr';res.setHeader('content-type','text/html; charset=utf-8');
    return res.end(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/iss-interiors.css"><style>body{background:#081420;color:white;font-family:Arial;margin:0}model-viewer{display:block;width:640px;height:420px}#iss-interior-explorer{width:640px}*{scroll-behavior:auto!important;animation:none!important}</style></head><body><model-viewer id="mainViewer" camera-controls environment-image="neutral"></model-viewer>${sections[lang]}<script type="module">import '/model-viewer.js';customElements.get('model-viewer').dracoDecoderLocation='/draco/';const s=document.createElement('script');s.src='/assets/js/iss-interiors.js';document.body.append(s);</script></body></html>`);
  }
  if(u.pathname==='/model-viewer.js')file=path.join(deps,'@google/model-viewer/dist/model-viewer.min.js');
  else if(u.pathname.startsWith('/draco/'))file=path.join(deps,'three/examples/jsm/libs/draco/gltf',path.basename(u.pathname));
  else file=path.join(root,u.pathname.replace(/^\//,''));
  if(!fs.existsSync(file)){res.statusCode=404;return res.end('Not found');}
  const ext=path.extname(file);res.setHeader('content-type',({'.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.jpg':'image/jpeg','.glb':'model/gltf-binary'})[ext]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const context=await browser.newContext({viewport:{width:660,height:480},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],report=[];
  page.on('pageerror',e=>errors.push(e.message));
  async function ready(id){await page.waitForFunction(id=>{const v=document.querySelector('#mainViewer');return v.loaded&&v.getAttribute('src')===`/assets/models/interior/stage2/${id}.glb`&&document.querySelector('#iss-interior-status').dataset.kind==='success'},id,{timeout:120000});}
  for(const lang of ['tr','en','ru']){
    await page.goto(`http://127.0.0.1:${port}/?lang=${lang}&module=destiny`);await ready('destiny');
    if(await page.locator('#iss-interior-quality').inputValue()!=='detailed')throw Error('Detailed quality not default');
    if(await page.locator('.iss-module-card').count()!==18)throw Error('Incomplete catalogue');
    console.log('LANGUAGE_OK',lang);
  }
  for(const m of catalog){
    await page.locator(`button[data-iss-go="${m.id}"]`).click({force:true});await ready(m.id);
    await page.evaluate(()=>{scrollTo(0,0);document.querySelector('#mainViewer').jumpCameraToGoal();});
    await page.waitForTimeout(200);
    const state=await page.locator('#mainViewer').evaluate(v=>({fov:v.getFieldOfView(),orbit:v.getCameraOrbit(),materials:v.model.materials.length}));
    if(state.materials<3)throw Error(`Missing materials: ${m.id}`);
    if(Math.abs(state.fov-65)>1)throw Error(`Unexpected field of view: ${m.id} ${state.fov}`);
    report.push({id:m.id,...state});console.log('MODEL_OK',m.id,JSON.stringify(state));
    if(['destiny','cupola','zvezda'].includes(m.id))await page.screenshot({path:path.join(root,'qa',`${m.id}-web.png`),clip:{x:0,y:0,width:640,height:420},timeout:120000});
  }
  await page.locator('button[data-iss-go="destiny"]').click({force:true});await ready('destiny');
  await page.locator('#iss-interior-quality').selectOption('optimized');
  await page.waitForFunction(()=>{const v=document.querySelector('#mainViewer');return v.loaded&&v.getAttribute('src').includes('destiny_optimized.glb')},{},{timeout:120000});
  console.log('BASE_SWITCH_OK');
  await page.locator('#iss-interior-quality').selectOption('detailed');await ready('destiny');console.log('DETAIL_SWITCH_OK');
  if(errors.length)throw Error(JSON.stringify(errors));
  fs.writeFileSync(path.join(root,'qa/browser-stage2.json'),JSON.stringify({modules:report,languageChecks:3,baseDetailSwitch:true,pageErrors:errors},null,2));
  await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
