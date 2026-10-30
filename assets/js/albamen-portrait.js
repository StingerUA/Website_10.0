/* Albamen | AlbaSpace interactive camera.
 * Video/photo is captured inside the page rather than native Quick Look or
 * Scene Viewer (those viewers do not expose their camera compositing to JS).
 * A MediaPipe person mask puts the real person's silhouette in front of
 * the character; this is 2D segmentation, not true per-pixel ARCore depth.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const root = document.querySelector('[data-albamen-experience]');
if (root) {
  const lang = document.documentElement.lang.slice(0, 2);
  const L = ({
    tr: {
      pending: '3D model henüz yüklenmedi. /assets/models/albamen.glb dosyasını ekleyin.',
      ready: '3D model hazır. Kamerayı açıp Albamen ile fotoğraf çekebilirsiniz.',
      camera: 'Kamera erişimi gerekiyor. Telefonunuzdan izin verin.',
      error: 'Kamera veya 3D modeli başlatılamadı. Tarayıcı izinlerini kontrol edin.',
      processing: 'Kişi algılama yükleniyor…',
      fallback: 'Kişi ayrımı kullanılamıyor. Fotoğraf ve video devam eder; gerçekçi örtüşme sınırlıdır.',
      running: 'Kamera hazır. Modeli sürükleyerek döndürün, +/− ile boyutunu ayarlayın.',
      filming: 'Kısa video kaydediliyor…',
      saved: 'Dosya kaydedildi.',
      videoUnavailable: 'Bu tarayıcı video kaydını desteklemiyor. Fotoğraf çekebilirsiniz.'
    },
    en: {
      pending: '3D model not uploaded yet. Add /assets/models/albamen.glb.',
      ready: '3D model ready. Open the camera to take a photo with Albaman.',
      camera: 'Camera access is required. Please allow access on your phone.',
      error: 'Could not start the camera or 3D model. Check browser permissions.',
      processing: 'Preparing person segmentation…',
      fallback: 'Person segmentation is unavailable. Photos and videos still work, but occlusion is limited.',
      running: 'Camera ready. Drag to rotate the model; use +/− to resize.',
      filming: 'Recording a short video…',
      saved: 'File saved.',
      videoUnavailable: 'Video recording is not supported by this browser. Photos are available.'
    },
    ru: {
      pending: '3D-модель ещё не загружена. Добавь /assets/models/albamen.glb.',
      ready: '3D-модель готова. Откройте камеру для фото с Альбамэном.',
      camera: 'Нужен доступ к камере. Разрешите его на телефоне.',
      error: 'Не удалось запустить камеру или 3D. Проверьте разрешения браузера.',
      processing: 'Запускаем распознавание человека…',
      fallback: 'Сегментация человека недоступна. Фото и видео работают, но перекрытие ограничено.',
      running: 'Камера готова. Потяните для вращения модели, +/− — для масштаба.',
      filming: 'Записываем короткое видео…',
      saved: 'Файл сохранён.',
      videoUnavailable: 'В этом браузере недоступна запись видео. Можно сделать фото.'
    }
  })[lang] || {};
  const modelUrl = '/assets/models/albamen.glb';
  const viewer = root.querySelector('model-viewer');
  const open = root.querySelector('[data-open-portrait]');
  const modal = document.getElementById('albamenPortraitModal');
  const close = modal.querySelector('[data-portrait-close]');
  const canvas = modal.querySelector('#neilPortraitCanvas');
  const ctx = canvas.getContext('2d', {alpha:false});
  const video = modal.querySelector('#neilCameraVideo');
  const status = modal.querySelector('[data-portrait-status]');
  const photo = modal.querySelector('[data-take-photo]');
  const record = modal.querySelector('[data-take-video]');
  const plus = modal.querySelector('[data-resize-up]');
  const minus = modal.querySelector('[data-resize-down]');
  const rotate = modal.querySelector('[data-rotate-avatar]');
  const foreground = document.createElement('canvas');
  const fctx = foreground.getContext('2d');
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, preserveDrawingBuffer:false, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .05, 100);
  camera.position.set(0, 1.2, 5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xeefaff, 0x283c67, 2.0));
  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.set(-2, 5, 6);
  scene.add(light);
  const holder = new THREE.Group();
  scene.add(holder);
  let stream = null, modelReady = false, isOpen = false, raf = 0;
  let segmentation = null, segmentBusy = false, lastSegment = 0, lastMask = null;
  let recorder = null, recorded = [], recordingTimeout = 0;
  let rotation = .12, figureScale = 1, lastPointerX = null;
  let modelLoaded = false;

  const say = (v) => { status.textContent = v; };
  const download = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  function setSize() {
    const w = Math.max(320, Math.min(960, video.videoWidth || 720));
    const h = Math.max(400, Math.round(w * (video.videoHeight || 1280) / (video.videoWidth || 720)));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w; canvas.height = h;
    foreground.width = w; foreground.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  async function loadModel() {
    if (modelLoaded) return;
    const gltf = await new GLTFLoader().loadAsync(modelUrl);
    const obj = gltf.scene;
    const bbox = new THREE.Box3().setFromObject(obj);
    const dims = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    if (!(dims.y > 0)) throw new Error('Model has no height');
    obj.position.sub(center);
    obj.scale.setScalar(2.8 / dims.y);
    holder.add(obj);
    holder.position.set(.55, 0, 0);
    modelLoaded = true;
  }

  // We only request the real model when the user has actually uploaded it.
  fetch(modelUrl, {method:'HEAD', cache:'no-store'}).then(r => {
    if (!r.ok) throw new Error('No model');
    modelReady = true;
    // The GLB placeholder remains visible until the real Albamen model is uploaded.
    viewer.src = modelUrl;
    open.disabled = false;
  }).catch(() => {
    // Keep /assets/models/zaglushka.glb displayed; only the portrait camera needs the real character.
    open.disabled = true;
  });

  function compose() {
    if (!isOpen) return;
    raf = requestAnimationFrame(compose);
    if (video.readyState < 2) return;
    setSize();
    holder.rotation.y = rotation;
    holder.scale.setScalar(figureScale);
    renderer.render(scene, camera);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
    // Camera-person in the foreground, 3D virtual model behind.
    if (lastMask) {
      fctx.globalCompositeOperation = 'source-over';
      fctx.clearRect(0, 0, foreground.width, foreground.height);
      fctx.drawImage(lastMask, 0, 0, foreground.width, foreground.height);
      fctx.globalCompositeOperation = 'source-in';
      fctx.drawImage(video, 0, 0, foreground.width, foreground.height);
      fctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(foreground, 0, 0);
    }
    const now = performance.now();
    if (segmentation && !segmentBusy && now-lastSegment>100) {
      segmentBusy = true; lastSegment = now;
      segmentation.send({image:video}).catch(() => {
        segmentation = null;
        say(L.fallback);
      }).finally(() => { segmentBusy = false; });
    }
  }

  function loadScript(url) {
    return new Promise((resolve,reject) => {
      if (window.SelfieSegmentation) return resolve();
      const s = document.createElement('script');
      s.src = url; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initSegmentation() {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js');
      if (!isOpen) return;
      const seg = new window.SelfieSegmentation({
        locateFile: (f) => 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/' + f
      });
      seg.setOptions({modelSelection:1});
      seg.onResults(result => {
        if (isOpen && result.segmentationMask) lastMask = result.segmentationMask;
      });
      segmentation = seg;
    } catch (e) { say(L.fallback); }
  }

  async function openCamera() {
    if (!modelReady || isOpen) return;
    modal.hidden = false;
    document.body.classList.add('neil-portrait-open');
    say(L.camera);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('No camera API');
      stream = await navigator.mediaDevices.getUserMedia({
        audio:false, video:{facingMode:'user',width:{ideal:720},height:{ideal:1280}}
      });
      video.srcObject = stream;
      await video.play();
      await loadModel();
      isOpen = true;
      say(L.processing);
      compose();
      initSegmentation().then(() => { if (isOpen && segmentation) say(L.running); });
    } catch (e) {
      console.warn('[Albamen portrait]',e);
      say(L.error);
      stream?.getTracks().forEach(t=>t.stop()); stream=null;
    }
  }
  function stopRecording() {
    clearTimeout(recordingTimeout);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }
  function closeCamera() {
    isOpen = false; cancelAnimationFrame(raf); stopRecording();
    segmentation?.close?.(); segmentation = null; lastMask = null;
    stream?.getTracks().forEach(t=>t.stop()); stream = null;
    video.pause(); video.srcObject = null;
    modal.hidden = true;
    document.body.classList.remove('neil-portrait-open');
  }

  open.addEventListener('click', openCamera);
  close.addEventListener('click', closeCamera);
  modal.addEventListener('click', (e) => {if (e.target === modal) closeCamera();});
  window.addEventListener('pagehide', closeCamera);
  document.addEventListener('keydown', (e) => {if (e.key==='Escape' && isOpen) closeCamera();});
  plus.addEventListener('click', () => figureScale = Math.min(2.6,figureScale*1.15));
  minus.addEventListener('click', () => figureScale = Math.max(.35,figureScale/1.15));
  rotate.addEventListener('click', () => rotation += .30);
  canvas.addEventListener('pointerdown', e => {lastPointerX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove', e => {if(lastPointerX != null){rotation+=(e.clientX-lastPointerX)*.012;lastPointerX=e.clientX;}});
  const release=()=>{lastPointerX=null;};
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);

  photo.addEventListener('click', () => {
    if (!isOpen) return;
    canvas.toBlob(blob => {
      if(blob) {download(blob, 'albaspace-albamen-' + Date.now() + '.png');say(L.saved);}
    },'image/png');
  });
  record.addEventListener('click', () => {
    if (!isOpen || recorder?.state==='recording') {stopRecording();return;}
    if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {say(L.videoUnavailable);return;}
    const options = ['video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']
      .find(type => MediaRecorder.isTypeSupported(type));
    try {
      const output = canvas.captureStream(24);
      recorded = [];
      recorder = new MediaRecorder(output, options?{mimeType:options}:undefined);
      recorder.ondataavailable = e => {if (e.data.size) recorded.push(e.data);};
      recorder.onstop = () => {
        record.classList.remove('recording');
        record.textContent = record.dataset.idleLabel;
        const type = recorder.mimeType || options || 'video/webm';
        if (recorded.length) {
          download(new Blob(recorded, {type}), 'albaspace-albamen-' + Date.now() + (type.includes('mp4')?'.mp4':'.webm'));
          say(L.saved);
        }
        output.getTracks().forEach(t=>t.stop());
      };
      recorder.start(250);
      record.classList.add('recording');
      record.textContent = '■';
      say(L.filming);
      recordingTimeout = setTimeout(stopRecording, 8000);
    } catch (e) {console.warn('[Neil portrait recorder]',e); say(L.videoUnavailable);}
  });
}
