export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
export const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// Works in a stable reference space. Losing a hit immediately invalidates placement.
// The transform of an already placed dish is deliberately not part of this class.
export class SurfaceTracker {
  constructor({settleMs = 220, tolerance = 0.04} = {}) {
    this.settleMs = settleMs;
    this.tolerance = tolerance;
    this.reset();
  }
  reset() { this.position = null; this.origin = null; this.since = 0; this.ready = false; }
  update(matrix, now) {
    if (!matrix || !Array.from(matrix).every(Number.isFinite) || matrix[5] < Math.cos(Math.PI / 9)) {
      this.reset(); return false;
    }
    const p = {x: matrix[12], y: matrix[13], z: matrix[14]};
    if (!this.origin || distance(p, this.origin) > this.tolerance) {
      this.origin = {...p}; this.position = {...p}; this.since = now;
    } else {
      for (const k of ['x', 'y', 'z']) this.position[k] += 0.3 * (p[k] - this.position[k]);
    }
    this.ready = now - this.since >= this.settleMs;
    return this.ready;
  }
}

export class PinchFilter {
  constructor({close = 0.32, open = 0.5, frames = 2} = {}) {
    this.close = close; this.open = open; this.frames = frames;
    this.pressed = false; this.count = 0;
  }
  update(ratio) {
    if (!Number.isFinite(ratio)) { this.pressed = false; this.count = 0; return false; }
    const wants = this.pressed ? ratio < this.open : ratio < this.close;
    if (wants === this.pressed) this.count = 0;
    else if (++this.count >= this.frames) { this.pressed = wants; this.count = 0; }
    return this.pressed;
  }
}

// Map unmirrored inference coordinates to a CSS object-fit: cover video.
export function videoPoint(p, videoWidth, videoHeight, width, height, mirrored = false) {
  const factor = Math.max(width / videoWidth, height / videoHeight);
  return {
    x: ((mirrored ? 1 - p.x : p.x) * videoWidth * factor - (videoWidth * factor - width) / 2),
    y: p.y * videoHeight * factor - (videoHeight * factor - height) / 2,
  };
}

// Delta-based manipulation avoids jumps when a finger/hand is added or removed.
export function gestureDelta(previous, current) {
  if (!previous || !current || previous.length !== current.length || !current.length ||
      previous.some((p, i) => p.id !== current[i].id)) return null;
  if (current.length === 1) return {dx: current[0].x - previous[0].x, dy: current[0].y - previous[0].y, scale: 1, angle: 0};
  const a = previous.slice(0, 2), b = current.slice(0, 2);
  const before = distance(a[0], a[1]), after = distance(b[0], b[1]);
  return {
    dx: (b[0].x + b[1].x - a[0].x - a[1].x) / 2,
    dy: (b[0].y + b[1].y - a[0].y - a[1].y) / 2,
    scale: before > 10 ? clamp(after / before, 0.8, 1.25) : 1,
    angle: angleDelta(Math.atan2(b[1].y - b[0].y, b[1].x - b[0].x), Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x)),
  };
}
