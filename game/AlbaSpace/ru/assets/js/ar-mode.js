(() => {
  let stream = null;
  let scanTimer = null;
  const stop = () => { if (scanTimer) clearInterval(scanTimer); scanTimer = null; stream?.getTracks().forEach(track => track.stop()); stream = null; };
  const esc = value => window.AlbaGame?.esc(value) || String(value ?? "");
  async function start(root, player) {
    const video = root.querySelector("video");
    const status = root.querySelector("[data-ar-status]");
    const canvas = document.createElement("canvas");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Камера недоступна в этом браузере");
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      video.srcObject = stream; await video.play(); status.textContent = `Камера активна · ищем ${player.anchor?.id || "TABLE-01"}`;
      if ("BarcodeDetector" in window) {
        const detector = new BarcodeDetector({ formats: ["qr_code", "code_128", "code_39"] });
        scanTimer = setInterval(async () => { if (!video.videoWidth) return; canvas.width = video.videoWidth; canvas.height = video.videoHeight; const context = canvas.getContext("2d"); context.drawImage(video, 0, 0); try { const codes = await detector.detect(canvas); const match = codes.find(code => /^TABLE-\d{2}$/i.test(code.rawValue || "")); if (match) { const id = match.rawValue.toUpperCase(); status.textContent = `Якорь ${id} найден · станция закреплена`; root.querySelector("[data-ar-anchor]").textContent = id; } } catch {} }, 800);
      } else status.textContent = "Камера активна · сканер QR не поддерживается, используйте выбор якоря";
    } catch (error) { status.textContent = error.message || "Не удалось открыть камеру"; }
  }
  function mount(root, player) {
    if (!root || root.dataset.arMounted === "1") return;
    root.dataset.arMounted = "1";
    root.innerHTML = `<div class="ar-view" style="position:relative;overflow:hidden;border-radius:16px;background:#0b1020;margin:10px 0"><video muted playsinline style="display:block;width:100%;max-height:260px;object-fit:cover;opacity:.78"></video><div style="position:absolute;inset:0;display:grid;place-items:center;pointer-events:none"><div style="border:2px solid #7dd3fc;border-radius:14px;width:42%;height:34%;box-shadow:0 0 0 999px #07101c55"></div></div><div style="position:absolute;left:12px;right:12px;bottom:10px;display:flex;justify-content:space-between;gap:8px;align-items:center;background:#07101ccc;padding:8px 10px;border-radius:10px;color:#e0f2fe;font-size:.82rem"><span data-ar-status>Камера выключена</span><strong data-ar-anchor>${esc(player.anchor?.id || "TABLE-01")}</strong></div></div><div class="notice" style="margin-top:8px"><strong>AR station</strong> · наведите камеру на якорь стола. Если автоматическое распознавание недоступно, интерфейс использует назначенный сервером якорь.</div><button class="btn primary" data-ar-start style="margin-top:8px">Включить камеру</button>`;
    root.querySelector("[data-ar-start]").onclick = event => { event.currentTarget.disabled = true; start(root, player); };
  }
  window.AlbaAR = { mount, stop };
})();
