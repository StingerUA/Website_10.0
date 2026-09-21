// Classic worker intentionally: MediaPipe's WASM loader uses importScripts.
// The JS API itself is an ES module, loaded with dynamic import.
let landmarker;
self.onmessage = async ({data}) => {
  if (data.type === 'init') {
    try {
      const {FilesetResolver, HandLandmarker} = await import(`${data.vision}/vision_bundle.mjs`);
      const files = await FilesetResolver.forVisionTasks(`${data.vision}/wasm`);
      landmarker = await HandLandmarker.createFromOptions(files, {
        baseOptions: {modelAssetPath: data.model, delegate: 'CPU'},
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.65, minHandPresenceConfidence: 0.65, minTrackingConfidence: 0.65,
      });
      self.postMessage({type: 'ready'});
    } catch (error) { self.postMessage({type: 'error', message: String(error.message || error)}); }
  } else if (data.type === 'frame') {
    try {
      const start = performance.now();
      const result = landmarker.detectForVideo(data.image, data.time);
      self.postMessage({type: 'hands', landmarks: result.landmarks, time: data.time, inferenceMs: performance.now() - start});
    } catch (error) { self.postMessage({type: 'error', message: String(error.message || error)}); }
    finally { data.image.close(); }
  }
};
