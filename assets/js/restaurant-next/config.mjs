export const CONFIG = Object.freeze({
  version: '0.1.0',
  // Change to false to remove both the AR LAB button and diagnostics timer.
  lab: true,
  pixelRatio: 1.5,
  minScale: 0.25,
  maxScale: 3,
  handFps: 20,
  handModel: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  vision: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',
});

export async function detectCapabilities(nav = navigator, secure = isSecureContext) {
  let immersive = false;
  try { immersive = secure && Boolean(await nav.xr?.isSessionSupported('immersive-ar')); } catch { /* permission or policy */ }
  return {
    immersive, secure,
    // These features can only be confirmed inside a granted XR session.
    hitTest: 'not tested', xrHands: 'not tested',
    camera: secure && Boolean(nav.mediaDevices?.getUserMedia),
  };
}
