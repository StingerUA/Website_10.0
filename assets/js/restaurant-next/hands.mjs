import {CONFIG} from './config.mjs?v=0.1.0';
import {PinchFilter, videoPoint, distance} from './math.mjs?v=0.1.0';

export class HandPoints {
  constructor() { this.tracks = []; this.nextId = 0; this.lastTime = 0; }
  reset() { this.tracks = []; this.lastTime = 0; }
  update(landmarks, time, {videoWidth, videoHeight, width, height, mirrored}) {
    const gap = time - this.lastTime;
    if (gap > 250) this.tracks = [];
    const available = new Set(this.tracks);
    const tracks = [];
    for (const points of landmarks) {
      if (!points[17] || !points[8] || !points[4]) continue;
      const tip = points[8];
      let match = [...available].sort((a, b) => distance(a.tip, tip) - distance(b.tip, tip))[0];
      if (match && distance(match.tip, tip) > 0.25) match = null;
      if (!match) match = {id: ++this.nextId, filter: new PinchFilter(), point: null};
      available.delete(match);
      const aspect = videoWidth / videoHeight;
      const d = (a, b) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);
      const ratio = d(points[4], tip) / Math.max(0.001, d(points[5], points[17]));
      const point = videoPoint(tip, videoWidth, videoHeight, width, height, mirrored);
      const alpha = 1 - Math.exp(-Math.max(1, gap) / 65);
      if (match.point) { point.x = match.point.x + alpha * (point.x - match.point.x); point.y = match.point.y + alpha * (point.y - match.point.y); }
      Object.assign(match, {tip, point, pressed: match.filter.update(ratio)});
      tracks.push(match);
    }
    this.tracks = tracks; this.lastTime = time;
    return tracks.map(t => ({id: t.id, ...t.point, pressed: t.pressed}));
  }
}

export class CameraHands {
  constructor({video, bounds, onHands, onStats, onError}) {
    Object.assign(this, {video, bounds, onHands, onStats, onError});
    this.points = new HandPoints(); this.generation = 0; this.running = false;
    this.busy = false; this.lastFrame = 0; this.lastVideoTime = -1;
  }
  async start(facingMode = 'environment') {
    this.stop(); const generation = this.generation;
    this.running = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: {
        facingMode: {ideal: facingMode}, width: {ideal: 640, max: 640}, height: {ideal: 480, max: 480}, frameRate: {ideal: 24, max: 30},
      }});
      if (!this.running || generation !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false; }
      this.stream = stream;
      this.mirrored = (stream.getVideoTracks()[0].getSettings().facingMode || facingMode) === 'user';
      this.video.classList.toggle('mirrored', this.mirrored);
      this.video.srcObject = stream; await this.video.play();
      if (!this.running || generation !== this.generation) return false;
      const worker = new Worker(new URL('./hand-worker.js?v=0.1.0', import.meta.url));
      this.worker = worker;
      await new Promise((resolve, reject) => {
        this.rejectInit = reject;
        this.initTimer = setTimeout(() => reject(new Error('Hand model initialization timed out')), 30000);
        worker.onerror = event => reject(new Error(event.message || 'Worker unavailable'));
        worker.onmessage = ({data}) => {
          if (data.type === 'ready') resolve();
          else if (data.type === 'error') reject(new Error(data.message));
        };
        worker.postMessage({type: 'init', vision: CONFIG.vision, model: CONFIG.handModel});
      });
      clearTimeout(this.initTimer); this.rejectInit = null;
      if (!this.running || generation !== this.generation) return false;
      worker.onerror = event => this.fail(new Error(event.message || 'Hand recognition stopped'));
      worker.onmessage = ({data}) => {
        if (generation !== this.generation || !this.running) return;
        this.busy = false;
        if (data.type === 'error') { this.fail(new Error(data.message)); return; }
        if (data.type !== 'hands') return;
        const rect = this.bounds.getBoundingClientRect();
        const hands = this.points.update(data.landmarks, data.time, {
          videoWidth: this.video.videoWidth, videoHeight: this.video.videoHeight,
          width: rect.width, height: rect.height, mirrored: this.mirrored,
        }).map(p => ({...p, x: p.x + rect.left, y: p.y + rect.top}));
        this.onHands(hands);
        this.onStats({inferenceMs: Math.round(data.inferenceMs), hands: hands.length});
      };
      this.schedule(generation);
      return true;
    } catch (error) {
      if (generation !== this.generation) return false;
      this.stop(); throw error;
    }
  }
  schedule(generation) {
    const loop = async time => {
      if (!this.running || generation !== this.generation) return;
      this.raf = requestAnimationFrame(loop);
      if (this.busy || document.hidden || time - this.lastFrame < 1000 / CONFIG.handFps ||
          this.video.readyState < 2 || this.video.currentTime === this.lastVideoTime) return;
      this.busy = true; this.lastFrame = time; this.lastVideoTime = this.video.currentTime;
      try {
        const image = await createImageBitmap(this.video);
        if (!this.running || generation !== this.generation) { image.close(); return; }
        this.worker.postMessage({type: 'frame', image, time}, [image]);
      } catch (error) { if (generation === this.generation) this.fail(error); }
    };
    this.raf = requestAnimationFrame(loop);
  }
  fail(error) { this.stop(); this.onError(error); }
  stop() {
    ++this.generation; this.running = false; this.busy = false;
    cancelAnimationFrame(this.raf); clearTimeout(this.initTimer);
    this.rejectInit?.(new Error('Cancelled')); this.rejectInit = null;
    this.worker?.terminate(); this.worker = null;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = null;
    this.video.pause(); this.video.srcObject = null; this.points.reset();
    this.lastVideoTime = -1; this.lastFrame = 0; this.onHands([]);
  }
}
