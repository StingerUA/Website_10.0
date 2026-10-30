/**
 * Holo-bag demo slots: render a real player only when its .mp4 exists.
 * Missing files retain their polished 9:16 placeholders, without broken players.
 * Adding the four MP4s under /assets/videos/holobag/ is enough to activate them.
 */
(() => {
  'use strict';
  const slots = document.querySelectorAll('[data-holobag-video]');
  if (!slots.length) return;
  const otherVideos = () => document.querySelectorAll('.holo-video-frame video');
  slots.forEach(async (frame, i) => {
    const path = frame.getAttribute('data-holobag-video');
    if (!/^\/assets\/videos\/holobag\/holobag-0[1-4]\.mp4$/.test(path || '')) return;
    try {
      const response = await fetch(path, { method: 'HEAD', cache: 'no-store', credentials: 'omit' });
      if (!response.ok || !frame.isConnected) return;
      const mime = response.headers.get('content-type') || '';
      if (mime && !/video\//i.test(mime) && !/octet-stream/i.test(mime)) return;
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('aria-label', frame.dataset.videoLabel || 'Holo-bag ' + (i + 1));
      video.src = path;
      video.addEventListener('play', () => {
        otherVideos().forEach(other => { if (other !== video) other.pause(); });
      });
      video.addEventListener('error', () => {
        video.remove(); // Keep a usable placeholder if the file is invalid.
        frame.querySelector('.holo-video-placeholder')?.removeAttribute('hidden');
      });
      frame.querySelector('.holo-video-placeholder')?.setAttribute('hidden', '');
      frame.appendChild(video);
    } catch (_) {
      // Network/CORS/CDN error: leave the placeholder, never show a broken video.
    }
  });
})();
