import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {SurfaceTracker, PinchFilter, gestureDelta, videoPoint} from '../assets/js/restaurant-next/math.mjs';
import {RestaurantXR} from '../assets/js/restaurant-next/xr-session.mjs';
import {HandPoints, CameraHands} from '../assets/js/restaurant-next/hands.mjs';
import {detectCapabilities} from '../assets/js/restaurant-next/config.mjs';
import {hasIdentity, consumeToken} from '../assets/js/restaurant-next/auth.mjs';
import {dishes} from '../assets/js/restaurant-next/catalog.mjs';

const matrix = (x = 0, up = 1) => [1,0,0,0,0,up,0,0,0,0,1,0,x,0.75,-1,1];
test('placement requires stable upward horizontal hits and invalidates on loss', () => {
  const tracker = new SurfaceTracker();
  assert.equal(tracker.update(matrix(), 0), false);
  assert.equal(tracker.update(matrix(.01), 230), true);
  const placed = {...tracker.position};
  assert.equal(tracker.update(matrix(.7), 240), false);
  assert.equal(placed.x < .02, true, 'placed transform must not alias the hit-test position');
  assert.equal(tracker.update(null, 250), false);
  assert.equal(tracker.position, null);
  assert.equal(tracker.update(matrix(0, -1), 300), false, 'ceiling rejected');
  assert.equal(tracker.update(matrix(0, 0), 600), false, 'wall rejected');
});
test('pinch hysteresis avoids chatter and releases invalid observations', () => {
  const pinch = new PinchFilter();
  assert.equal(pinch.update(.2), false); assert.equal(pinch.update(.2), true);
  assert.equal(pinch.update(.4), true); assert.equal(pinch.update(.51), true);
  assert.equal(pinch.update(.6), false); pinch.update(.1); pinch.update(.1);
  assert.equal(pinch.update(NaN), false);
});
test('finger count changes and hand identities cannot jump the object', () => {
  assert.equal(gestureDelta([{id:1,x:0,y:0}], [{id:1,x:1,y:1},{id:2,x:3,y:3}]), null);
  assert.equal(gestureDelta([{id:1,x:0,y:0}], [{id:2,x:20,y:20}]), null);
  const delta = gestureDelta([{id:1,x:0,y:0},{id:2,x:100,y:0}], [{id:1,x:10,y:5},{id:2,x:120,y:5}]);
  assert.equal(delta.dx, 15); assert.equal(delta.dy, 5); assert.equal(delta.scale, 1.1); assert.equal(delta.angle, 0);
});
test('cover mapping accounts for video cropping and selfie mirroring', () => {
  assert.deepEqual(videoPoint({x:.5,y:.5},640,480,400,800), {x:200,y:400});
  const a = videoPoint({x:.25,y:.5},640,480,640,480,false);
  const b = videoPoint({x:.25,y:.5},640,480,640,480,true);
  assert.equal(a.x,160); assert.equal(b.x,480);
});
test('hand loss discards a grab instead of attaching it to a new detection', () => {
  const points = new HandPoints(), options = {videoWidth:640,videoHeight:480,width:640,height:480,mirrored:false};
  const hand = Array.from({length:21},()=>({x:.5,y:.5,z:0}));
  hand[5]={x:.4,y:.5};hand[17]={x:.6,y:.5};hand[4]={x:.49,y:.5};
  points.update([hand],0,options);
  const pressed = points.update([hand],50,options)[0]; assert.equal(pressed.pressed,true);
  assert.deepEqual(points.update([],100,options),[]);
  const newHand = points.update([hand],400,options)[0];
  assert.notEqual(newHand.id,pressed.id); assert.equal(newHand.pressed,false);
});
test('capability detection handles blocked and insecure browsers without throwing', async () => {
  assert.equal((await detectCapabilities({xr:{isSessionSupported:async()=>{throw Error();}}},true)).immersive,false);
  assert.equal((await detectCapabilities({xr:{isSessionSupported:async()=>true}},false)).immersive,false);
});
test('quick accounts remain valid and fragments are scrubbed from URLs', () => {
  assert.equal(hasIdentity({id:42,name:'cadet'}),true); assert.equal(hasIdentity({}),false);
  let stored, url;
  consumeToken({hash:'#access_token=example&tab=menu',pathname:'/ar-restaurant-next/',search:''},{replaceState:(_a,_b,u)=>url=u},{setItem:(k,v)=>stored=[k,v]});
  assert.deepEqual(stored,['albaspace_access_token','example']); assert.equal(url,'/ar-restaurant-next/#tab=menu');
});

function xrHarness({failSource = false, deferred = false} = {}) {
  const states = [], calls = []; let accept;
  const source = {cancel:()=>calls.push('cancel')};
  const reference = new EventTarget();
  const session = new EventTarget(); session.visibilityState = 'visible';
  session.end = async () => { calls.push('end'); session.dispatchEvent(new Event('end')); };
  session.requestReferenceSpace = async type => { if(type==='local-floor') throw Error('floor unavailable'); return reference; };
  session.requestHitTestSource = async () => { if(failSource) throw Error('hit test failed'); return source; };
  const renderer = {xr:{setReferenceSpaceType:()=>{},setSession:async()=>{},setReferenceSpace:()=>{}},setAnimationLoop:loop=>calls.push(loop?'loop':'stop')};
  const xr = {requestSession:(_mode,options)=>{calls.push(options);return deferred?new Promise(resolve=>{accept=resolve;}):Promise.resolve(session);}};
  const controller = new RestaurantXR({xr,renderer,overlay:{},onFrame:()=>{},onState:s=>states.push(s)});
  return {controller,calls,states,session,accept:()=>accept(session)};
}
test('XR requests permission synchronously and falls back to local reference space', async () => {
  const h=xrHarness();const started=h.controller.start();
  assert.equal(h.calls.length,1);assert.deepEqual(h.calls[0].requiredFeatures,['hit-test','dom-overlay']);
  await started;assert.ok(h.controller.reference);assert.deepEqual(h.states,['started']);
  await h.controller.stop();assert.ok(h.calls.includes('cancel'));assert.equal(h.controller.session,null);
});
test('closing during permission prompt ends a late-arriving session', async () => {
  const h=xrHarness({deferred:true});const starting=h.controller.start();await h.controller.stop();h.accept();await starting;
  assert.equal(h.controller.session,null);assert.ok(h.calls.includes('end'));assert.ok(!h.states.includes('started'));
});
test('hit-test initialization failures release the session and renderer loop', async () => {
  const h=xrHarness({failSource:true});await assert.rejects(h.controller.start());
  assert.equal(h.controller.session,null);assert.ok(h.calls.includes('end'));assert.ok(h.calls.includes('stop'));
});
test('reference-space reset requests rescan, never reuses the old position', async () => {
  const h=xrHarness();await h.controller.start();h.controller.reference.dispatchEvent(new Event('reset'));
  assert.ok(h.states.includes('reset'));await h.controller.stop();
});
test('catalog preserves production sources, scale, exposure and orientation in both languages', () => {
  const src=fs.readFileSync('assets/js/restaurant-model-viewer-core.js','utf8');
  const menu=vm.runInNewContext(src.slice(src.indexOf('const MODEL_VERSION'),src.indexOf('const COPY'))+';({tr:MENU_TR,ru:MENU_RU})');
  assert.equal(dishes.length,10);
  for(const dish of dishes){
    const i=Number(dish.id.split('-')[1])-1;
    for(const lang of ['tr','ru']){
      const old=menu[lang][dish.category].items[i];
      assert.equal(dish.src,old.src);assert.equal(dish.poster,old.poster);
      assert.equal(dish.modelScale,old.modelScale??1);assert.equal(dish.orientation,old.orientation??'0deg 0deg 0deg');
      assert.equal(dish.exposure,old.exposure??(dish.category==='meat'?1.27:1.15));assert.equal(dish.copy[lang].name,old.name);
    }
  }
});
test('all menu assets including glTF sidecars exist', () => {
  for(const dish of dishes) for(const url of [dish.src,dish.poster]){
    const file=url.split('?')[0].slice(1);assert.ok(fs.existsSync(file),file);
    if(file.endsWith('.gltf')){
      const gltf=JSON.parse(fs.readFileSync(file,'utf8'));
      for(const item of [...gltf.buffers,...gltf.images]) if(item.uri&&!item.uri.startsWith('data:')) assert.ok(fs.existsSync(path.join(path.dirname(file),item.uri)),item.uri);
    }
  }
});
test('Next pages isolate assets and preserve TR/RU access modes', () => {
  for(const [file,mode] of [['ar-restaurant-next/index.html','required'],['rus/ar-restaurant-next/index.html','guest']]){
    const html=fs.readFileSync(file,'utf8');assert.ok(html.includes(`data-auth-mode="${mode}"`));
    assert.ok(!html.includes('restaurant-model-viewer'));assert.ok(!html.includes('restaurant-ar.css'));
    for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)/g))assert.ok(fs.existsSync(match[1].slice(1)),match[1]);
  }
});
