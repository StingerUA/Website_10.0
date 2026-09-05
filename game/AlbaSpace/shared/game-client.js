(() => {
  const API = "https://api.albaspace.com.tr";
  const REQUEST_PREFIX = "alba-game-request-";
  const AUTH_TOKEN_KEY = "albaspace_access_token";
  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const GAME_LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru:{server:"Ошибка сервера",loginMessage:"Для игры войдите в AlbaSpace account.",auth:"Авторизация",title:"Войдите в AlbaSpace",button:"Войти в AlbaSpace"},
    tr:{server:"Sunucu hatası",loginMessage:"Oyun için AlbaSpace hesabınıza giriş yapın.",auth:"Kimlik doğrulama",title:"AlbaSpace'e giriş yapın",button:"AlbaSpace'e giriş yap"},
    en:{server:"Server error",loginMessage:"Sign in to your AlbaSpace account to play.",auth:"Authentication",title:"Sign in to AlbaSpace",button:"Sign in to AlbaSpace"}
  }[GAME_LOCALE];
  const makeId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const esc = value => String(value ?? "").replace(/[&<>\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  const readAuthToken = () => { try { return localStorage.getItem(AUTH_TOKEN_KEY) || ""; } catch { return ""; } };
  const authHeaders = () => { const token = readAuthToken(); return token ? { Authorization:`Bearer ${token}` } : {}; };
  const localizedPath = path => `${path}${path.includes("?") ? "&" : "?"}locale=${encodeURIComponent(GAME_LOCALE)}`;
  const consumeAuthToken = () => {
    const hash = window.location.hash.replace(/^#/, "");
    const parts = hash ? hash.split("&") : [];
    const tokenPart = parts.find(part => part.startsWith(`${AUTH_TOKEN_KEY}=`));
    if (!tokenPart) return;
    const token = decodeURIComponent(tokenPart.slice(AUTH_TOKEN_KEY.length + 1));
    if (token) { try { localStorage.setItem(AUTH_TOKEN_KEY, token); } catch {} }
    const rest = parts.filter(part => !part.startsWith(`${AUTH_TOKEN_KEY}=`));
    const clean = `${window.location.pathname}${window.location.search}${rest.length ? `#${rest.join("&")}` : ""}`;
    window.history.replaceState({}, document.title, clean);
  };
  async function request(path, options = {}) {
    const response = await fetch(API + localizedPath(path), { credentials:"include", mode:"cors", headers:{ "Content-Type":"application/json", ...authHeaders(), ...(options.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `${COPY.server} (${response.status})`);
    return data;
  }
  async function currentUser() {
    consumeAuthToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${API}/me`, { credentials:"include", mode:"cors", headers:authHeaders(), signal:controller.signal });
      if (!response.ok) return null;
      return response.json();
    } catch { return null; }
    finally { clearTimeout(timeout); }
  }
  function login() {
    sessionStorage.setItem("albaspace_auth_return_to", window.location.href);
    window.location.href = `${API}/auth/google?from=${encodeURIComponent(window.location.href)}`;
  }
  function requireLogin(app, message = COPY.loginMessage) {
    app.innerHTML = `<section class="card center"><div class="phase">${COPY.auth}</div><h1>${COPY.title}</h1><p class="muted">${esc(message)}</p><button id="login" class="btn primary">${COPY.button}</button></section>`;
    document.getElementById("login").onclick = login;
  }
  function requestId() { return `${REQUEST_PREFIX}${makeId()}`; }
  async function createRoom(presentationMode, timingMode = "STANDARD") { return request("/api/game/rooms", { method:"POST", body:JSON.stringify({ presentationMode, mode:timingMode, locale:GAME_LOCALE }) }); }
  async function joinRoom(code) { return request("/api/game/rooms/join", { method:"POST", body:JSON.stringify({ code }) }); }
  async function snapshot(roomId) { return request(`/api/game/rooms/${encodeURIComponent(roomId)}/snapshot`); }
  async function command(roomId, type, payload = {}) { return request(`/api/game/rooms/${encodeURIComponent(roomId)}/command`, { method:"POST", body:JSON.stringify({ type, payload, requestId:requestId() }) }); }
  function subscribe(roomId, onState, onStatus) {
    let source;
    let retry = 0;
    let stopped = false;
    let lastVersion = 0;
    let pollTimer;
    let polling = false;
    const accept = next => {
      const version = Number(next?.version || 0);
      if (version <= lastVersion) return;
      lastVersion = version;
      onState(next);
    };
    const refresh = async () => {
      if (stopped || polling) return;
      polling = true;
      try { const data = await snapshot(roomId); if (data.state) accept(data.state); onStatus?.("polled"); }
      catch { if (!stopped) onStatus?.("offline"); }
      finally { polling = false; }
    };
    const connect = () => {
      if (stopped) return;
      onStatus?.("connecting");
      const token = readAuthToken();
      const tokenQuery = token ? `&access_token=${encodeURIComponent(token)}` : "";
      source = new EventSource(`${API}/api/game/rooms/${encodeURIComponent(roomId)}/events?ts=${Date.now()}&locale=${encodeURIComponent(GAME_LOCALE)}${tokenQuery}`, { withCredentials:true });
      source.onopen = () => { retry = 0; onStatus?.("connected"); refresh(); };
      source.onmessage = event => { try { const data = JSON.parse(event.data); if (data.state) accept(data.state); } catch (error) { console.warn("Invalid game event", error); } };
      source.onerror = () => { source.close(); onStatus?.("offline"); if (!stopped) setTimeout(connect, Math.min(1000 * 2 ** retry++, 10000)); };
    };
    pollTimer = setInterval(refresh, 3000);
    refresh();
    connect();
    return () => { stopped = true; clearInterval(pollTimer); source?.close(); };
  }
  window.AlbaGame = { API, GAME_LOCALE, esc, currentUser, login, requireLogin, createRoom, joinRoom, snapshot, command, subscribe, makeId };
})();
