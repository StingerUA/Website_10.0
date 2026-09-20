// Owns browser resources only; scene and UI are injected for deterministic tests.
export class RestaurantXR {
  constructor({xr, renderer, overlay, onFrame, onState}) {
    Object.assign(this, {xr, renderer, overlay, onFrame, onState});
    this.session = null; this.source = null; this.reference = null;
    this.generation = 0; this.pending = false;
  }
  async start() {
    if (this.session || this.pending) return;
    const generation = ++this.generation;
    this.pending = true;
    let session;
    try {
      // This call precedes every await: retain the button's user activation.
      session = await this.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        optionalFeatures: ['local-floor', 'hand-tracking'],
        domOverlay: {root: this.overlay},
      });
      if (generation !== this.generation) { await session.end(); return; }
      this.session = session;
      session.addEventListener('end', () => this.cleanup(session), {once: true});
      this.renderer.xr.setReferenceSpaceType('local');
      await this.renderer.xr.setSession(session);
      if (this.session !== session) return;
      try { this.reference = await session.requestReferenceSpace('local-floor'); }
      catch { this.reference = await session.requestReferenceSpace('local'); }
      if (this.session !== session) return;
      this.renderer.xr.setReferenceSpace(this.reference);
      const viewer = await session.requestReferenceSpace('viewer');
      const source = await session.requestHitTestSource({space: viewer, entityTypes: ['plane']});
      if (this.session !== session) { source.cancel(); return; }
      this.source = source;
      this.reference.addEventListener?.('reset', () => {
        // A reference-space relocalization invalidates the old world transform.
        this.onState('reset');
      });
      session.addEventListener('visibilitychange', () => {
        if (session.visibilityState !== 'visible') this.onState('interrupted');
      });
      this.renderer.setAnimationLoop((time, frame) => {
        if (frame && this.session === session) this.onFrame(time, frame, this.reference, this.source);
      });
      this.onState('started');
    } catch (error) {
      if (session && this.session === session) {
        try { await session.end(); } catch { this.cleanup(session); }
      }
      throw error;
    } finally {
      if (generation === this.generation) this.pending = false;
    }
  }
  cleanup(session) {
    if (this.session !== session) return;
    this.source?.cancel(); this.source = null;
    this.session = null; this.reference = null; this.pending = false;
    this.renderer.setAnimationLoop(null);
    this.onState('ended');
  }
  async stop() {
    ++this.generation; this.pending = false;
    const session = this.session;
    if (session) {
      try { await session.end(); } finally { this.cleanup(session); }
    }
  }
}
