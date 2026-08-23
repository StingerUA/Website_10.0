(() => {
  const API = "https://albaspace-api.nncdecdgc.workers.dev";
  const REQUEST_PREFIX = "alba-game-request-";
  const makeId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const esc = value => String(value ?? "").replace(/[&<>\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));

  async function request(path, options = {}) {
    const response = await fetch(API + path, { credentials: "include", mode: "cors", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Ошибка сервера (${response.status})`);
    return data;
  }
  async function currentUser() {
    const response = await fetch(`${API}/me`, { credentials: "include", mode: "cors" });
    if (!response.ok) return null;
    return response.json();
  }
  function login() {
    sessionStorage.setItem("albaspace_auth_return_to", window.location.href);
    window.location.href = `${API}/auth/google?from=${encodeURIComponent(window.location.href)}`;
  }
  function requireLogin(app, message = "Для игры войдите в AlbaSpace account.") {
    app.innerHTML = `<section class="card center"><div class="phase">Авторизация</div><h1>Войдите в AlbaSpace</h1><p class="muted">${esc(message)}</p><button id="login" class="btn primary">Войти в AlbaSpace</button></section>`;
    document.getElementById("login").onclick = login;
  }
  function requestId() { return `${REQUEST_PREFIX}${makeId()}`; }
  async function createRoom(mode) { return request("/api/game/rooms", { method: "POST", body: JSON.stringify({ mode }) }); }
  async function joinRoom(code) { return request("/api/game/rooms/join", { method: "POST", body: JSON.stringify({ code }) }); }
  async function snapshot(roomId) { return request(`/api/game/rooms/${encodeURIComponent(roomId)}/snapshot`); }
  async function command(roomId, type, payload = {}) { return request(`/api/game/rooms/${encodeURIComponent(roomId)}/command`, { method: "POST", body: JSON.stringify({ type, payload, requestId: requestId() }) }); }
  function subscribe(roomId, onState, onStatus) {
    let source;
    let retry = 0;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      onStatus?.("connecting");
      source = new EventSource(`${API}/api/game/rooms/${encodeURIComponent(roomId)}/events`, { withCredentials: true });
      source.onopen = () => { retry = 0; onStatus?.("connected"); };
      source.onmessage = event => { try { const data = JSON.parse(event.data); if (data.state) onState(data.state); } catch (error) { console.warn("Invalid game event", error); } };
      source.onerror = () => { source.close(); onStatus?.("offline"); if (!stopped) { const wait = Math.min(1000 * 2 ** retry++, 10000); setTimeout(connect, wait); } };
    };
    connect();
    return () => { stopped = true; source?.close(); };
  }
  window.AlbaGame = { API, esc, currentUser, login, requireLogin, createRoom, joinRoom, snapshot, command, subscribe, makeId };
})();
