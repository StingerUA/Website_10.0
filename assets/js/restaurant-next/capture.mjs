export class ARCapture {
  constructor({video, sceneCanvas, onState = () => {}}) {
    Object.assign(this, {video, sceneCanvas, onState});
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', {alpha: false});
    this.recorder = null;
    this.chunks = [];
    this.recording = false;
    this.startedAt = 0;
    this.maxDuration = 60_000;
    this.frame = 0;
  }

  resizeCanvas() {
    const width = this.video.videoWidth || window.innerWidth;
    const height = this.video.videoHeight || window.innerHeight;
    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / width);
    this.canvas.width = Math.max(1, Math.round(width * scale));
    this.canvas.height = Math.max(1, Math.round(height * scale));
  }

  drawComposite() {
    if (!this.video.videoWidth || !this.video.videoHeight) return;
    if (!this.canvas.width || !this.canvas.height) this.resizeCanvas();

    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    const cover = Math.max(W / vw, H / vh);
    const dw = vw * cover;
    const dh = vh * cover;
    const ox = (W - dw) / 2;
    const oy = (H - dh) / 2;

    ctx.save();
    if (this.video.classList.contains('mirrored')) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.video, ox, oy, dw, dh);
    ctx.restore();

    if (this.sceneCanvas?.width && this.sceneCanvas?.height) {
      ctx.drawImage(this.sceneCanvas, 0, 0, W, H);
    }
  }

  photo() {
    this.resizeCanvas();
    this.drawComposite();
    return new Promise(resolve => {
      this.canvas.toBlob(blob => {
        if (!blob) { this.onState('error'); resolve(false); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AlbaSpace-AR-${Date.now()}.jpg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        this.onState('photo');
        resolve(true);
      }, 'image/jpeg', 0.94);
    });
  }

  pickMime() {
    const types = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
  }

  startRecording() {
    if (this.recording) return false;
    if (!window.MediaRecorder || !this.canvas.captureStream) {
      this.onState('unsupported');
      return false;
    }
    this.resizeCanvas();
    const stream = this.canvas.captureStream(30);
    const mimeType = this.pickMime();
    try {
      this.recorder = new MediaRecorder(stream, mimeType ? {
        mimeType,
        videoBitsPerSecond: 8_000_000
      } : undefined);
    } catch {
      stream.getTracks().forEach(track => track.stop());
      this.onState('error');
      return false;
    }

    this.chunks = [];
    this.recording = true;
    this.startedAt = performance.now();
    this.onState('recording');

    this.recorder.ondataavailable = event => {
      if (event.data?.size) this.chunks.push(event.data);
    };
    this.recorder.onerror = () => this.stopRecording();
    this.recorder.onstop = () => {
      const type = this.recorder?.mimeType || mimeType || 'video/webm';
      const blob = new Blob(this.chunks, {type});
      stream.getTracks().forEach(track => track.stop());
      this.recorder = null;
      this.recording = false;
      this.chunks = [];
      if (!blob.size) { this.onState('error'); return; }
      const url = URL.createObjectURL(blob);
      const extension = type.includes('mp4') ? 'mp4' : 'webm';
      const a = document.createElement('a');
      a.href = url;
      a.download = `AlbaSpace-AR-${Date.now()}.${extension}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.onState('video');
    };

    const render = () => {
      if (!this.recording) return;
      this.drawComposite();
      this.frame = requestAnimationFrame(render);
      if (performance.now() - this.startedAt >= this.maxDuration) this.stopRecording();
    };
    this.frame = requestAnimationFrame(render);
    this.recorder.start(1000);
    return true;
  }

  stopRecording() {
    cancelAnimationFrame(this.frame);
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
  }

  stop() {
    this.stopRecording();
  }
}
