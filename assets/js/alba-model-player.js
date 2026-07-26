/**
 * alba-model-player.js
 * ─────────────────────────────────────────────────────────────
 * Автоматически вставляет футуристичный аудио-плеер на любую
 * страницу сайта где есть тег <model-viewer>.
 *
 * Порядок воспроизведения:
 *   1. /assets/audio/models/{slug}.mp3  ← твои AI-генерированные файлы
 *   2. Google TTS через воркер          ← если MP3 нет
 *   3. Браузерный speechSynthesis       ← если воркер недоступен
 *
 * Подключение: одна строка в include.js (уже добавлена)
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const WORKER_URL   = 'https://divine-flower-a0ae.nncdecdgc.workers.dev';
  const DEFAULT_AUDIO_PATH = '/assets/audio/models/';

  function getAudioPathPrefix() {
    const pathname = (window.location && window.location.pathname) || '';
    if (pathname.startsWith('/eng/')) return '/eng/assets/audio/models/';
    if (pathname.startsWith('/rus/')) return '/rus/assets/audio/models/';
    return DEFAULT_AUDIO_PATH;
  }

  const AUDIO_PATH = getAudioPathPrefix();

  // ── CSS ──────────────────────────────────────────────────────
  const CSS = `
#albaModelPlayer {
  margin: 0 auto 18px;
  max-width: 900px;
  padding: 12px 16px 10px;
  background: linear-gradient(135deg, rgba(2,6,23,.94), rgba(15,23,42,.97));
  border: 1px solid rgba(56,189,248,.22);
  border-radius: 16px;
  box-shadow: 0 0 0 1px rgba(56,189,248,.07), 0 8px 32px rgba(0,0,0,.65), 0 0 22px rgba(56,189,248,.10);
  font-family: 'Courier New', monospace;
  box-sizing: border-box;
  /* FIX: stay above the .model-loading-overlay (z-index: 9999) and remain
     clickable even if the player ever ends up sharing a stacking context
     with the 3D-model loading overlay. */
  position: relative;
  z-index: 10000;
}
.amp-track {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  color: #38bdf8; margin-bottom: 9px; opacity: .85;
  padding-right: 100px;
}
#ampLabel {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* громкость — правый верхний угол контейнера */
.amp-volume {
  position: absolute;
  top: 12px; right: 14px;
  display: flex; align-items: center; gap: 6px;
  z-index: 2;
}
.amp-vol-btn {
  width: 22px; height: 22px; flex-shrink: 0;
  border: none; background: transparent; padding: 0;
  color: #38bdf8; opacity: .8; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity .15s, color .15s;
}
.amp-vol-btn:hover { opacity: 1; }
.amp-vol-btn svg { width: 16px; height: 16px; }
.amp-vol-slider {
  -webkit-appearance: none; appearance: none;
  width: 64px; height: 3px;
  background: rgba(255,255,255,.14);
  border-radius: 99px; outline: none; cursor: pointer;
}
.amp-vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 11px; height: 11px; border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px rgba(56,189,248,.65);
  cursor: pointer; margin-top: -1px;
}
.amp-vol-slider::-moz-range-thumb {
  width: 11px; height: 11px; border: none; border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px rgba(56,189,248,.65);
  cursor: pointer;
}
.amp-vol-slider::-moz-range-progress {
  background: #38bdf8; height: 3px; border-radius: 99px;
}
@media (max-width: 480px) {
  .amp-track { padding-right: 78px; }
  .amp-vol-slider { width: 42px; }
}
.amp-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #38bdf8; box-shadow: 0 0 8px #38bdf8;
  animation: ampPulse 2s ease-in-out infinite; flex-shrink: 0;
}
@keyframes ampPulse {
  0%,100% { opacity:1; box-shadow:0 0 8px #38bdf8; }
  50%      { opacity:.35; box-shadow:0 0 3px #38bdf8; }
}
.amp-row {
  display: flex; align-items: center; gap: 9px;
}
.amp-btn {
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid rgba(56,189,248,.38);
  background: rgba(56,189,248,.07);
  color: #38bdf8;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: background .16s, box-shadow .16s, transform .11s;
}
.amp-btn svg { width: 17px; height: 17px; }
.amp-btn:hover {
  background: rgba(56,189,248,.2);
  box-shadow: 0 0 13px rgba(56,189,248,.32);
  transform: scale(1.08);
}
.amp-btn:active { transform: scale(.93); }
.amp-btn-stop {
  border-color: rgba(168,85,247,.38);
  background: rgba(168,85,247,.07);
  color: #a855f7;
}
.amp-btn-stop:hover {
  background: rgba(168,85,247,.2);
  box-shadow: 0 0 13px rgba(168,85,247,.32);
}
.amp-mid {
  flex: 1; position: relative;
  height: 34px; display: flex; align-items: center;
}
/* прогресс */
.amp-track-bar {
  width: 100%; height: 4px;
  background: rgba(255,255,255,.07);
  border-radius: 99px; position: relative;
  cursor: pointer; display: none;
}
.amp-track-bar.vis { display: block; }
.amp-fill {
  height: 100%; width: 0%;
  background: linear-gradient(90deg,#38bdf8,#a855f7);
  border-radius: 99px;
  transition: width .1s linear;
  box-shadow: 0 0 7px rgba(56,189,248,.45);
}
.amp-thumb {
  width: 11px; height: 11px; background: #fff;
  border-radius: 50%; position: absolute;
  top: 50%; left: 0%;
  transform: translate(-50%,-50%);
  box-shadow: 0 0 7px rgba(56,189,248,.75);
  transition: left .1s linear; cursor: pointer;
}
/* загрузка */
.amp-load {
  display: none; align-items: flex-end;
  gap: 3px; height: 20px; width: 100%; justify-content: center;
}
.amp-load.vis { display: flex; }
.amp-load span {
  display: block; width: 4px;
  background: linear-gradient(to top,#38bdf8,#a855f7);
  border-radius: 2px;
  animation: ampLoad .75s ease-in-out infinite; opacity: .7;
}
.amp-load span:nth-child(1){height:7px;  animation-delay:0s}
.amp-load span:nth-child(2){height:13px; animation-delay:.07s}
.amp-load span:nth-child(3){height:19px; animation-delay:.14s}
.amp-load span:nth-child(4){height:13px; animation-delay:.21s}
.amp-load span:nth-child(5){height:7px;  animation-delay:.28s}
.amp-load span:nth-child(6){height:13px; animation-delay:.35s}
.amp-load span:nth-child(7){height:19px; animation-delay:.42s}
.amp-load span:nth-child(8){height:13px; animation-delay:.49s}
@keyframes ampLoad {
  0%,100%{transform:scaleY(.35);opacity:.35}
  50%{transform:scaleY(1);opacity:1}
}
/* эквалайзер */
.amp-eq {
  display: none; align-items: flex-end;
  gap: 3px; height: 20px; width: 100%; justify-content: center;
}
.amp-eq.vis { display: flex; }
.amp-eq span {
  display: block; width: 4px;
  background: linear-gradient(to top,#38bdf8,#a855f7);
  border-radius: 2px;
  animation: ampEq .55s ease-in-out infinite alternate;
}
.amp-eq span:nth-child(1){height:7px;  animation-duration:.42s}
.amp-eq span:nth-child(2){height:17px; animation-duration:.58s}
.amp-eq span:nth-child(3){height:20px; animation-duration:.36s}
.amp-eq span:nth-child(4){height:13px; animation-duration:.67s}
.amp-eq span:nth-child(5){height:9px;  animation-duration:.48s}
@keyframes ampEq {
  from{transform:scaleY(.28);opacity:.45}
  to{transform:scaleY(1);opacity:1}
}
/* время */
.amp-time {
  font-size: 11px; color: #94a3b8;
  letter-spacing: .04em; white-space: nowrap;
  flex-shrink: 0; display: flex; align-items: center;
  gap: 2px; min-width: 58px;
}
.amp-cur { color: #38bdf8; font-weight: 700; }
.amp-sep { color: #475569; margin: 0 1px; }
/* статус */
.amp-status {
  margin-top: 7px; font-size: 10px;
  letter-spacing: .10em; color: #475569;
  text-transform: uppercase; padding-left: 2px;
  transition: color .25s;
}
.amp-status.on  { color: #38bdf8; }
.amp-status.err { color: #f87171; }
`;

  // ── HTML шаблон ───────────────────────────────────────────────
  function buildHTML(trackName) {
    return `
<div id="albaModelPlayer">
  <div class="amp-volume" id="ampVolume">
    <button class="amp-vol-btn" id="ampVolBtn" title="Sesi kapat / aç" aria-label="Ses seviyesi">
      <svg id="ampIcoVolOn" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.74 2.5-2.26 2.5-4.02z"/><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      <svg id="ampIcoVolOff" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M19 12l2.5-2.5-1.41-1.41L17.59 10.5 15.09 8 13.68 9.41 16.18 11.9l-2.5 2.5 1.41 1.41L17.59 13.32l2.5 2.5L21.5 14.41 19 11.91z"/></svg>
    </button>
    <input type="range" id="ampVolSlider" class="amp-vol-slider" min="0" max="100" value="100" aria-label="Ses seviyesi" />
  </div>
  <div class="amp-track">
    <span class="amp-dot"></span>
    <span id="ampLabel">${trackName}</span>
  </div>
  <div class="amp-row">
    <button class="amp-btn" id="ampPlay" title="Oynat / Duraklat" aria-label="Oynat">
      <svg id="ampIcoPlay" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      <svg id="ampIcoPause" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
    </button>
    <button class="amp-btn amp-btn-stop" id="ampStop" title="Durdur" aria-label="Durdur">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
    </button>
    <div class="amp-mid" id="ampMid">
      <div class="amp-load" id="ampLoad">
        <span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="amp-track-bar" id="ampBar">
        <div class="amp-fill" id="ampFill"></div>
        <div class="amp-thumb" id="ampThumb"></div>
      </div>
      <div class="amp-eq" id="ampEq">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
    <div class="amp-time">
      <span class="amp-cur" id="ampCur">0:00</span>
      <span class="amp-sep">/</span>
      <span id="ampDur">—:——</span>
    </div>
  </div>
  <div class="amp-status" id="ampStatus">▶ Sesli anlatımı dinlemek için oynat</div>
</div>`;
  }

  // ── Язык — только по URL, текст не трогаем ───────────────────
  function detectLang() {
    const p = window.location.pathname;
    if (p.startsWith('/rus/')) return 'ru';
    if (p.startsWith('/eng/')) return 'en';
    return 'tr'; // всё остальное — турецкий
  }

  function fmt(s) {
    if (!isFinite(s) || s < 0) return '—:——';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }

  // ── Основная логика ───────────────────────────────────────────
  function initPlayer(modelViewer) {
    // Определяем slug — из data-model-name или из URL
    const slug = modelViewer.getAttribute('data-model-name')
      || location.pathname.replace(/\//g, '').replace('eng', '').replace('rus', '') || 'model';

    // Определяем текст для TTS из <h1> и <p>
    const h1 = document.querySelector('h1');
    const p  = document.querySelector('.container p, main p, p');
    const title = h1 ? h1.textContent.trim() : slug;
    const desc  = p  ? p.textContent.trim()  : '';
    const trackName = title + ' — Sesli Anlatım';

    // Инжектируем CSS
    if (!document.getElementById('alba-model-player-css')) {
      const style = document.createElement('style');
      style.id = 'alba-model-player-css';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    // Инжектируем HTML перед model-viewer
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildHTML(trackName);
    const playerEl = wrapper.firstElementChild;

    // FIX: model-preloader.js may wrap <model-viewer> in a `.viewer-wrapper`
    // (position: relative) and place a full-cover `.model-loading-overlay`
    // (position: absolute; inset: 0; z-index: 9999; pointer-events: auto)
    // inside it while the 3D model is loading. If alba-model-player.js runs
    // AFTER that wrapping (script execution order between dynamically loaded
    // scripts is not guaranteed), `modelViewer.parentNode` becomes that
    // `.viewer-wrapper`, so the audio player would be inserted INSIDE it and
    // get covered by the loading overlay — making the play button unclickable
    // until the model finishes loading. Always place the player OUTSIDE of
    // any `.viewer-wrapper`, as a sibling before it, so it is never blocked.
    const viewerWrapper = modelViewer.closest('.viewer-wrapper');
    if (viewerWrapper && viewerWrapper.parentNode) {
      viewerWrapper.parentNode.insertBefore(playerEl, viewerWrapper);
    } else {
      modelViewer.parentNode.insertBefore(playerEl, modelViewer);
    }

    // DOM ссылки
    const el = {
      play:   document.getElementById('ampPlay'),
      stop:   document.getElementById('ampStop'),
      iPlay:  document.getElementById('ampIcoPlay'),
      iPause: document.getElementById('ampIcoPause'),
      bar:    document.getElementById('ampBar'),
      fill:   document.getElementById('ampFill'),
      thumb:  document.getElementById('ampThumb'),
      load:   document.getElementById('ampLoad'),
      eq:     document.getElementById('ampEq'),
      cur:    document.getElementById('ampCur'),
      dur:    document.getElementById('ampDur'),
      status: document.getElementById('ampStatus'),
      volSlider: document.getElementById('ampVolSlider'),
      volBtn:    document.getElementById('ampVolBtn'),
      iVolOn:    document.getElementById('ampIcoVolOn'),
      iVolOff:   document.getElementById('ampIcoVolOff'),
    };

    let audio     = null;
    let loading   = false;
    let ttsActive = false;

    // ── Громкость ───────────────────────────────────────────────
    const VOL_KEY = 'albaPlayerVolume';
    let volume = 1;
    let lastVolume = 1;
    try {
      const saved = parseFloat(localStorage.getItem(VOL_KEY));
      if (!isNaN(saved) && saved >= 0 && saved <= 1) volume = saved;
    } catch (e) { /* localStorage недоступен */ }
    lastVolume = volume || 1;

    function updateVolUI() {
      if (el.volSlider) el.volSlider.value = String(Math.round(volume * 100));
      if (el.iVolOn && el.iVolOff) {
        const muted = volume <= 0;
        el.iVolOn.style.display  = muted ? 'none' : '';
        el.iVolOff.style.display = muted ? '' : 'none';
      }
    }

    function setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (audio) audio.volume = volume;
      try { localStorage.setItem(VOL_KEY, String(volume)); } catch (e) {}
      updateVolUI();
    }

    if (el.volSlider) {
      el.volSlider.addEventListener('input', () => {
        setVolume(parseFloat(el.volSlider.value) / 100);
      });
    }
    if (el.volBtn) {
      el.volBtn.addEventListener('click', () => {
        if (volume > 0) {
          lastVolume = volume;
          setVolume(0);
        } else {
          setVolume(lastVolume || 1);
        }
      });
    }
    updateVolUI();

    // Состояния
    const STATE = {
      idle:    { load: 0, eq: 0, bar: 0, iPlay: 1, iPause: 0, statusCls: '',    statusTxt: '▶ Sesli anlatımı dinlemek için oynat' },
      loading: { load: 1, eq: 0, bar: 0, iPlay: 1, iPause: 0, statusCls: 'on',  statusTxt: 'Yükleniyor...' },
      playing: { load: 0, eq: 1, bar: 1, iPlay: 0, iPause: 1, statusCls: 'on',  statusTxt: 'Oynatılıyor ▶' },
      paused:  { load: 0, eq: 0, bar: 1, iPlay: 1, iPause: 0, statusCls: '',    statusTxt: 'Duraklatıldı ⏸' },
      stopped: { load: 0, eq: 0, bar: 0, iPlay: 1, iPause: 0, statusCls: '',    statusTxt: 'Durduruldu ⏹' },
      tts:     { load: 0, eq: 1, bar: 0, iPlay: 0, iPause: 1, statusCls: 'on',  statusTxt: 'Sesli okunuyor (TTS) ▶' },
      error:   { load: 0, eq: 0, bar: 0, iPlay: 1, iPause: 0, statusCls: 'err', statusTxt: 'Sesli okunuyor...' },
    };

    function applyState(name) {
      const s = STATE[name];
      el.load.classList.toggle('vis',  !!s.load);
      el.eq.classList.toggle('vis',    !!s.eq);
      el.bar.classList.toggle('vis',   !!s.bar);
      el.iPlay.style.display  = s.iPlay  ? '' : 'none';
      el.iPause.style.display = s.iPause ? '' : 'none';
      el.status.className = 'amp-status ' + s.statusCls;
      el.status.textContent = s.statusTxt;
    }

    function resetProgress() {
      el.fill.style.width = '0%';
      el.thumb.style.left = '0%';
      el.cur.textContent = '0:00';
      el.dur.textContent = '—:——';
    }

    function destroyAudio() {
      if (audio) { audio.pause(); audio.src = ''; audio = null; }
      resetProgress();
    }

    // ── Воспроизведение MP3 ────────────────────────────────────
    function playMp3() {
      destroyAudio();
      applyState('loading');
      loading = true;

      audio = new Audio(AUDIO_PATH + slug + '.mp3');
      audio.preload = 'auto';
      audio.volume = volume;

      audio.addEventListener('loadedmetadata', () => {
        el.dur.textContent = fmt(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        el.fill.style.width = pct + '%';
        el.thumb.style.left = pct + '%';
        el.cur.textContent  = fmt(audio.currentTime);
      });
      audio.addEventListener('canplay', () => {
        loading = false;
        audio.play()
          .then(() => applyState('playing'))
          .catch(() => { applyState('error'); fallbackTTS(); });
      });
      audio.addEventListener('ended', () => {
        destroyAudio();
        applyState('stopped');
      });
      audio.addEventListener('error', () => {
        // MP3 не найден — переходим к TTS
        loading = false;
        destroyAudio();
        applyState('error');
        setTimeout(fallbackTTS, 400);
      });
    }

    // ── Фолбэк 1: Google TTS через воркер ─────────────────────
    function fallbackTTS() {
      const lang = detectLang();
      const text = (title + '. ' + desc).slice(0, 800);
      ttsActive = true;
      applyState('tts');

      fetch(WORKER_URL + '/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang })
      })
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          if (!data.audioBase64) throw new Error('no audio');
          const bin = atob(data.audioBase64);
          const buf = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
          const blob = new Blob([buf], { type: 'audio/mpeg' });
          const url  = URL.createObjectURL(blob);
          audio = new Audio(url);
          audio.volume = volume;

          audio.addEventListener('loadedmetadata', () => {
            el.dur.textContent = fmt(audio.duration);
          });
          audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;
            const pct = (audio.currentTime / audio.duration) * 100;
            el.fill.style.width = pct + '%';
            el.thumb.style.left = pct + '%';
            el.cur.textContent  = fmt(audio.currentTime);
          });
          el.bar.classList.add('vis');
          audio.play()
            .then(() => applyState('playing'))
            .catch(() => { URL.revokeObjectURL(url); fallbackBrowser(text, lang); });

          audio.addEventListener('ended', () => {
            URL.revokeObjectURL(url);
            destroyAudio();
            ttsActive = false;
            applyState('stopped');
          });
        })
        .catch(() => {
          ttsActive = false;
          fallbackBrowser((title + '. ' + desc).slice(0, 600), lang);
        });
    }

    // ── Фолбэк 2: Браузерный speechSynthesis (только /rus/) ───
    function fallbackBrowser(text, lang) {
      // Браузерный голос — только на русской версии сайта
      const isRusPage = window.location.pathname.startsWith('/rus/');
      if (!isRusPage) { applyState('error'); return; }

      if (!window.speechSynthesis) { applyState('error'); return; }
      applyState('tts');
      window.speechSynthesis.cancel();
      const utt  = new SpeechSynthesisUtterance(text);
      utt.lang   = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'tr-TR';
      utt.pitch  = 0.70;
      utt.rate   = 0.88;
      utt.volume = volume;
      utt.onend  = () => { ttsActive = false; applyState('stopped'); };
      utt.onerror= () => { ttsActive = false; applyState('error'); };
      window.speechSynthesis.speak(utt);
    }

    function stopAll() {
      destroyAudio();
      ttsActive = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      applyState('stopped');
    }

    // ── Кнопка Play / Pause ────────────────────────────────────
    // FIX: Removed `if (loading) return;` — audio must work independently of 3D model loading.
    // The `loading` flag tracked MP3 fetch, not 3D model state, but caused confusion when
    // the 3D model got stuck in permanent loading due to 404. Audio is now always clickable.
    el.play.addEventListener('click', () => {

      // TTS пауза не поддерживается — просто стоп
      if (ttsActive) { stopAll(); return; }

      if (!audio || audio.ended || !audio.src || audio.src === location.href) {
        playMp3();
        return;
      }
      if (audio.paused) {
        audio.play();
        applyState('playing');
      } else {
        audio.pause();
        applyState('paused');
      }
    });

    // ── Кнопка Stop ───────────────────────────────────────────
    el.stop.addEventListener('click', stopAll);

    // ── Перемотка по клику на бар ─────────────────────────────
    el.bar.addEventListener('click', (e) => {
      if (!audio || !audio.duration) return;
      const rect = el.bar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });

    applyState('idle');
  }

  // ── Точка входа — ждём загрузки DOM ──────────────────────────
  function tryInit() {
    const mv = document.querySelector('model-viewer');
    if (!mv) return; // не страница с моделью — выходим тихо
    initPlayer(mv);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

})();