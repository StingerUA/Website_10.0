// =========================
// 🔧 РУЧНОЙ ДОСТУП (временно)
// =========================
const MANUAL_ACCESS = {
  "nncdecdgc@gmail.com": [
    "iss", "atlas-iss",
    "atlas-curiosity", "atlas-earth", "atlas-exomars",
    "atlas-gokturk-2", "atlas-hubble", "atlas-imece", "atlas-ingenuity",
    "atlas-jameswebb", "atlas-jupiter", "atlas-kepler", "atlas-lagari",
    "atlas-mars", "mars", "atlas-marsodyssey", "atlas-marsreconnaissance",
    "atlas-mercury", "atlas-perseverance", "atlas-saturn", "atlas-spirit",
    "atlas-turksat-1A", "atlas-turksat-1B", "atlas-turksat-1C",
    "atlas-turksat-2A", "atlas-turksat-3A", "atlas-turksat-3B",
    "atlas-turksat-4A", "atlas-turksat-5A", "atlas-turksat-5B", "atlas-turksat-6A",
    "atlas-uranus", "atlas-venus", "venus",
    "atlas-voyager1", "atlas-voyager2", "atlas-zhurong",
  ],
  "idrisalbayrak10@gmail.com": [
    "iss", "atlas-iss",
    "atlas-curiosity", "atlas-earth", "atlas-exomars",
    "atlas-gokturk-2", "atlas-hubble", "atlas-imece", "atlas-ingenuity",
    "atlas-jameswebb", "atlas-jupiter", "atlas-kepler", "atlas-lagari",
    "atlas-mars", "mars", "atlas-marsodyssey", "atlas-marsreconnaissance",
    "atlas-mercury", "atlas-neptune", "atlas-perseverance", "atlas-saturn", "atlas-spirit",
    "atlas-turksat-1A", "atlas-turksat-1B", "atlas-turksat-1C",
    "atlas-turksat-2A", "atlas-turksat-3A", "atlas-turksat-3B",
    "atlas-turksat-4A", "atlas-turksat-5A", "atlas-turksat-5B", "atlas-turksat-6A",
    "atlas-uranus", "atlas-venus", "venus",
    "atlas-voyager1", "atlas-voyager2", "atlas-zhurong",
  ],
};

import { handleGameRequest, GameRoomDO } from "./game-backend.js";
export { GameRoomDO };

const SESSION_COOKIE     = "albaspace_session";
const OAUTH_STATE_COOKIE = "albaspace_oauth_state";
const AUTH_TOKEN_QUERY = "access_token";
const ORBITAL_LAUNCHES_URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=3&mode=detailed";
const ORBITAL_ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const ORBITAL_CREW_URL = "https://whoisinspace.com/";
let orbitalLaunchesCache = null;
let orbitalIssCache = null;
let orbitalCrewCache = null;
let orbitalMissionCache = null;

// =========================
// 🚀 ENTRY POINT
// =========================
export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Worker error:", error);
      return json({ error: "Internal Server Error" }, 500, buildCors(request, env));
    }
  }
};

async function handleRequest(request, env) {
  const url  = new URL(request.url);
  const cors = buildCors(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  // 🛰️ ORBITAL ATLAS — public, cached data route for the live space section.
  if (url.pathname === "/api/orbital/overview" && request.method === "GET") {
    return orbitalOverview(cors);
  }

  // 🎮 GAME BACKEND — uses the same AlbaSpace session as the rest of the site.
  if (url.pathname.startsWith("/api/game/")) {
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Войдите в AlbaSpace, чтобы играть" }, 401, cors);
    return handleGameRequest(request, env, user, cors);
  }

  // =========================
  // 🔐 GOOGLE LOGIN
  // =========================
  if (url.pathname === "/auth/google") {
    const returnUrl    = safeReturnUrl(url.searchParams.get("from") || env.FRONT_ORIGIN, env);
    const state        = randomToken();
    const statePayload = `${state}|${returnUrl}`;
    const redirect_uri = `${env.PUBLIC_BASE_URL}/auth/google/callback`;
    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
      "&response_type=code&scope=openid%20email%20profile" +
      "&prompt=select_account" +
      `&state=${encodeURIComponent(statePayload)}`;
    return redirect(authUrl, {
      "Set-Cookie": serializeCookie(OAUTH_STATE_COOKIE, state, {
        httpOnly: true, secure: true, sameSite: "Lax", path: "/", maxAge: 600
      })
    });
  }

  // =========================
  // 🔐 GOOGLE CALLBACK
  // =========================
  if (url.pathname === "/auth/google/callback") {
    const code        = url.searchParams.get("code");
    const stateParam  = url.searchParams.get("state") || "";
    const oauthError  = url.searchParams.get("error");
    const cookies     = parseCookies(request.headers.get("Cookie"));
    const cookieState = cookies[OAUTH_STATE_COOKIE];
    const clearStateCookie = serializeCookie(OAUTH_STATE_COOKIE, "", {
      httpOnly: true, secure: true, sameSite: "Lax", path: "/", maxAge: 0
    });

    if (oauthError) {
      return redirect(`${env.FRONT_ORIGIN}/?login_error=${encodeURIComponent(oauthError)}`, {
        "Set-Cookie": clearStateCookie
      });
    }

    const [receivedState, ...urlParts] = stateParam.split("|");
    const returnUrl = safeReturnUrl(urlParts.join("|") || env.FRONT_ORIGIN, env);

    if (!cookieState || receivedState !== cookieState) {
      console.warn("CSRF state mismatch — cookieState:", cookieState, "received:", receivedState);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${env.PUBLIC_BASE_URL}/auth/google/callback`,
        grant_type:    "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      console.error("Token exchange error:", await tokenRes.text());
      return new Response("Failed to exchange Google code", { status: 502 });
    }

    const tokenData = await tokenRes.json();
    const userRes   = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userRes.ok) return new Response("Failed to fetch Google profile", { status: 502 });

    const user = await userRes.json();

    await env.DB.prepare(
      "INSERT OR REPLACE INTO users (google_id, email, name, avatar) VALUES (?, ?, ?, ?)"
    ).bind(user.sub, user.email, user.name, user.picture).run();

    const sessionId  = randomToken();
    const sessionTtl = Number(env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
    const now        = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      "INSERT INTO sessions (id, user_google_id, expires_at) VALUES (?, ?, ?)"
    ).bind(sessionId, user.sub, now + sessionTtl).run();

    return redirect(withAuthToken(returnUrl, sessionId), {
      "Set-Cookie": [
        serializeCookie(SESSION_COOKIE, sessionId, {
          httpOnly: true, secure: true, sameSite: "None", path: "/", maxAge: sessionTtl
        }),
        clearStateCookie
      ]
    });
  }

  // =========================
  // 📧 EMAIL REGISTER
  // =========================
  if (url.pathname === "/auth/register" && request.method === "POST") {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid JSON" }, 400, cors); }

    const email    = String(body.email    || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const name     = String(body.name     || "").trim() || email.split("@")[0];

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json({ error: "Geçersiz e-posta adresi." }, 400, cors);
    if (password.length < 8)
      return json({ error: "Şifre en az 8 karakter olmalıdır." }, 400, cors);

    const existing = await env.DB.prepare(
      "SELECT google_id FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first();
    if (existing)
      return json({ error: "Bu e-posta zaten kayıtlı." }, 409, cors);

    const pwHash = await hashPassword(password);
    const fakeGoogleId = "email:" + email;

    await env.DB.prepare(
      "INSERT INTO users (google_id, email, name, avatar, password_hash) VALUES (?, ?, ?, '', ?)"
    ).bind(fakeGoogleId, email, name, pwHash).run();

    const sessionId  = randomToken();
    const sessionTtl = Number(env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
    const now        = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      "INSERT INTO sessions (id, user_google_id, expires_at) VALUES (?, ?, ?)"
    ).bind(sessionId, fakeGoogleId, now + sessionTtl).run();

    return new Response(JSON.stringify({
      ok: true,
      message: "Kayıt başarılı.",
      token: sessionId,
      user: { email, name, avatar: "" }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...cors,
        "Set-Cookie": serializeCookie(SESSION_COOKIE, sessionId, {
          httpOnly: true, secure: true, sameSite: "None", path: "/",
          maxAge: sessionTtl
        })
      }
    });
  }

  // =========================
  // 📧 EMAIL LOGIN
  // =========================
  if (url.pathname === "/auth/login" && request.method === "POST") {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid JSON" }, 400, cors); }

    const email    = String(body.email    || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    const user = await env.DB.prepare(
      "SELECT google_id, email, name, avatar, password_hash FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first();

    if (!user || !user.password_hash)
      return json({ error: "E-posta veya şifre hatalı." }, 401, cors);

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok)
      return json({ error: "E-posta veya şifre hatalı." }, 401, cors);

    const sessionId  = randomToken();
    const sessionTtl = Number(env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
    const now        = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      "INSERT INTO sessions (id, user_google_id, expires_at) VALUES (?, ?, ?)"
    ).bind(sessionId, user.google_id, now + sessionTtl).run();

    return new Response(JSON.stringify({
      ok: true,
      token: sessionId,
      user: { email: user.email, name: user.name, avatar: user.avatar || "" }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...cors,
        "Set-Cookie": serializeCookie(SESSION_COOKIE, sessionId, {
          httpOnly: true, secure: true, sameSite: "None", path: "/",
          maxAge: sessionTtl
        })
      }
    });
  }

  // =========================
  // 👤 CURRENT USER
  // =========================
  if (url.pathname === "/me") {
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Not logged in" }, 401, cors);
    return json(user, 200, cors);
  }

  // =========================
  // 💾 SAVE PROFILE
  // =========================
  if (url.pathname === "/profile" && request.method === "POST") {
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Not logged in" }, 401, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid JSON" }, 400, cors); }

    const name   = String(body.name   || "").trim().slice(0, 100);
    const avatar = String(body.avatar || "").trim().slice(0, 500);

    if (name) {
      await env.DB.prepare(
        "UPDATE users SET name = ?, avatar = ? WHERE google_id = ?"
      ).bind(name, avatar || user.avatar, user.google_id).run();
    }

    return json({ ok: true }, 200, cors);
  }

  // =========================
  // 🚪 LOGOUT
  // =========================
  if (url.pathname === "/logout") {
    const cookies   = parseCookies(request.headers.get("Cookie"));
    const sessionId = getSessionToken(request);
    if (sessionId) {
      await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    }
    return json({ ok: true }, 200, {
      ...cors,
      "Set-Cookie": serializeCookie(SESSION_COOKIE, "", {
        httpOnly: true, secure: true, sameSite: "None", path: "/", maxAge: 0
      })
    });
  }

  // =========================
  // 🔓 ACCESS CHECK
  // =========================
  if (url.pathname === "/product-access") {
    const slug = url.searchParams.get("slug");
    const user = await getSessionUser(request, env);
    if (!user) return json({ access: "none" }, 200, cors);
    const hasAccess = await checkAccess(env, user, slug);
    return json({ access: hasAccess ? "premium" : "preview" }, 200, cors);
  }

  // =========================
  // 📦 MODEL DELIVERY
  // =========================
  if (url.pathname === "/model") {
    const slug      = url.searchParams.get("slug");
    const user      = await getSessionUser(request, env);
    const hasAccess = user ? await checkAccess(env, user, slug) : false;
    console.log("MODEL ACCESS:", hasAccess, "slug:", slug, "user:", user?.email || "anon");

    if (!hasAccess) {
      const placeholder = await env.MODELS.get("zaglushka.glb");
      if (!placeholder) return new Response("Placeholder not found", { status: 404, headers: cors });
      return new Response(placeholder.body, {
        headers: { ...cors, "Content-Type": "model/gltf-binary", "Cache-Control": "no-store" }
      });
    }

    const path   = `${slug.replace(/^atlas-/, "")}.glb`;
    const object = await env.MODELS.get(path);
    if (!object) return new Response("Model not found", { status: 404, headers: cors });
    return new Response(object.body, {
      headers: { ...cors, "Content-Type": "model/gltf-binary", "Cache-Control": "private, max-age=0" }
    });
  }

  return json({ ok: true, service: "albaspace-api" }, 200, cors);
}

// =========================
// 🛠️ HELPERS
// =========================
function getSessionToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  const bearer = authorization.match(/^Bearer\s+([^\s]+)$/i)?.[1] || "";
  if (bearer) return bearer;
  const cookies = parseCookies(request.headers.get("Cookie"));
  return cookies[SESSION_COOKIE] || new URL(request.url).searchParams.get(AUTH_TOKEN_QUERY) || "";
}

function safeReturnUrl(value, env) {
  const fallback = env.FRONT_ORIGIN || "https://albaspace.com.tr";
  try {
    const target = new URL(value || fallback);
    const allowed = new Set([new URL(fallback).origin, ...(env.ALLOWED_ORIGINS || "").split(",").map(item => item.trim()).filter(Boolean).map(item => new URL(item).origin)]);
    return allowed.has(target.origin) ? target.toString() : fallback;
  } catch { return fallback; }
}

function withAuthToken(value, token) {
  const target = new URL(value);
  const fragment = target.hash.replace(/^#/, "");
  const rest = fragment ? `&${fragment}` : "";
  target.hash = `${AUTH_TOKEN_QUERY}=${encodeURIComponent(token)}${rest}`;
  return target.toString();
}


async function getSessionUser(request, env) {
  const cookies   = parseCookies(request.headers.get("Cookie"));
  const sessionId = getSessionToken(request);
  if (!sessionId) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `SELECT u.id, u.google_id, u.email, u.name, u.avatar
     FROM sessions s
     JOIN users u ON u.google_id = s.user_google_id
     WHERE s.id = ? AND s.expires_at > ?
     LIMIT 1`
  ).bind(sessionId, now).first();
  return row || null;
}

async function checkAccess(env, user, slug) {
  const product = await env.DB.prepare("SELECT id FROM products WHERE slug = ?").bind(slug).first();
  if (product) {
    const purchase = await env.DB.prepare(
      "SELECT id FROM purchases WHERE user_id = ? AND product_id = ?"
    ).bind(user.id, product.id).first();
    if (purchase) return true;
  }
  const manualList = MANUAL_ACCESS[user.email] || [];
  return manualList.includes(slug);
}

// PBKDF2-SHA256 — пароли никогда не хранятся в открытом виде
async function hashPassword(password) {
  const enc    = new TextEncoder();
  const salt   = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits   = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 }, keyMat, 256
  );
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const [, saltHex, hashHex] = stored.split(":");
  const salt   = Uint8Array.from(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const enc    = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits   = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 }, keyMat, 256
  );
  const newHash = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
  return newHash === hashHex;
}

function buildCors(request, env) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin"
  };
  const origin  = request.headers.get("Origin");
  const allowed = new Set();
  if (env.FRONT_ORIGIN)    allowed.add(env.FRONT_ORIGIN.replace(/\/$/, ""));
  if (env.ALLOWED_ORIGINS) {
    for (const o of env.ALLOWED_ORIGINS.split(",")) {
      const t = o.trim().replace(/\/$/, "");
      if (t) allowed.add(t);
    }
  }
  if (origin && allowed.has(origin)) {
    headers["Access-Control-Allow-Origin"]      = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

function json(payload, status, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

function orbitalText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function orbitalDecodeHtml(value) {
  return String(value).replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+/g, " ").trim();
}

function orbitalMissionLabel(value) {
  return orbitalDecodeHtml(value).replace(/^ISS\s*-\s*/i, "").replace(/\s+/g, " ").trim();
}

function orbitalMissionName(value) {
  return orbitalMissionLabel(value).replace(/^spacex\s+crew-/i, "SpaceX Crew-").replace(/^soyuz\s+ms-/i, "Soyuz MS-");
}

function orbitalMissionInfobox(html, label) {
  const match = String(html).match(new RegExp(`>${label}<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i"));
  return match ? orbitalDecodeHtml(match[1].replace(/<[^>]+>/g, " ")) : "";
}

function orbitalMissionDuration(value) {
  const days = Number(String(value).match(/(\d+)\s*days?/i)?.[1] || 0);
  const hours = Number(String(value).match(/(\d+)\s*hours?/i)?.[1] || 0);
  const minutes = Number(String(value).match(/(\d+)\s*minutes?/i)?.[1] || 0);
  const total = days * 86400000 + hours * 3600000 + minutes * 60000;
  return Number.isFinite(total) && total > 0 ? total : null;
}

function normalizeOrbitalMission(mission, crew, html, now) {
  const landing = orbitalMissionInfobox(html, "Landing date");
  if (!landing) return null;
  const name = orbitalMissionName(mission);
  const dockedFor = orbitalMissionDuration(orbitalMissionInfobox(html, "Time docked"));
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    vehicle: /^spacex/i.test(name) ? "Dragon" : /^soyuz/i.test(name) ? "Soyuz" : name,
    crew,
    arrival: dockedFor ? new Date(now - dockedFor).toISOString() : null,
    returnWindow: landing.replace(/\s*\((?:planned|in progress)\)\s*/i, "").trim(),
    returnStatus: /planned/i.test(landing) ? "planned" : "target",
    source: "Open mission record"
  };
}

function normalizeOrbitalCrew(html) {
  const headings = [];
  const headerPattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let headerMatch;
  while ((headerMatch = headerPattern.exec(html)) !== null) {
    const strongMatch = headerMatch[1].match(/<strong>\s*([^<]+?)(?:<br\s*\/?>)?\s*<\/strong>/i);
    if (strongMatch) headings.push({ mission: orbitalDecodeHtml(strongMatch[1]), index: headerMatch.index, end: headerPattern.lastIndex });
  }
  const members = [];
  for (let index = 0; index < headings.length; index += 1) {
    const header = headings[index];
    if (!/^ISS\s*-/i.test(header.mission)) continue;
    const nextHeader = headings[index + 1];
    const segment = html.slice(header.end, nextHeader ? nextHeader.index : html.length);
    const namePattern = /<h2[^>]*>\s*([^<][^<]*?)\s*<\/h2>/gi;
    let nameMatch;
    while ((nameMatch = namePattern.exec(segment)) !== null) {
      const name = orbitalDecodeHtml(nameMatch[1]);
      if (/^[A-Za-z][A-Za-z' .-]{1,80}$/.test(name) && !members.some(member => member.name.toLowerCase() === name.toLowerCase())) members.push({ name, mission: header.mission });
    }
  }
  return members;
}

function normalizeOrbitalLaunch(raw) {
  const provider = orbitalText(raw?.launch_service_provider?.name, "Оператор уточняется");
  const video = Array.isArray(raw?.vidURLs) ? raw.vidURLs.find(item => typeof item?.url === "string") : null;
  return {
    name: orbitalText(raw?.name, "Миссия уточняется"),
    net: typeof raw?.net === "string" ? raw.net : typeof raw?.window_start === "string" ? raw.window_start : null,
    provider,
    location: orbitalText(raw?.pad?.location?.name, orbitalText(raw?.pad?.name, "Площадка уточняется")),
    status: orbitalText(raw?.status?.name, "Статус уточняется"),
    streamUrl: video?.url || (/spacex/i.test(provider) ? "https://www.youtube.com/@SpaceX/live" : "https://www.youtube.com/@NASA/live")
  };
}

async function orbitalFetch(url) {
  const response = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": "AlbaSpace-OrbitalAtlas/1.0" } });
  if (!response.ok) throw new Error(`Orbital source returned ${response.status}`);
  return response.json();
}

async function orbitalLaunches(now) {
  if (orbitalLaunchesCache?.expiresAt > now) return orbitalLaunchesCache.value;
  try {
    const payload = await orbitalFetch(ORBITAL_LAUNCHES_URL);
    const value = Array.isArray(payload?.results) ? payload.results.slice(0, 3).map(normalizeOrbitalLaunch) : [];
    orbitalLaunchesCache = { value, expiresAt: now + 20 * 60 * 1000 };
    return value;
  } catch (error) {
    console.warn("Orbital Atlas launch source unavailable", error);
    return orbitalLaunchesCache?.value || [];
  }
}

async function orbitalIss(now) {
  if (orbitalIssCache?.expiresAt > now) return orbitalIssCache.value;
  try {
    const payload = await orbitalFetch(ORBITAL_ISS_URL);
    const coordinates = [payload?.latitude, payload?.longitude, payload?.altitude, payload?.velocity];
    if (!coordinates.every(value => typeof value === "number" && Number.isFinite(value))) throw new Error("Malformed ISS telemetry");
    const value = { latitude: payload.latitude, longitude: payload.longitude, altitude: payload.altitude, velocity: payload.velocity, visibility: orbitalText(payload.visibility, "связь") };
    orbitalIssCache = { value, expiresAt: now + 15 * 1000 };
    return value;
  } catch (error) {
    console.warn("Orbital Atlas ISS source unavailable", error);
    return orbitalIssCache?.value || null;
  }
}

async function orbitalCrew(now) {
  if (orbitalCrewCache?.expiresAt > now) return orbitalCrewCache.value;
  try {
    const response = await fetch(ORBITAL_CREW_URL, { headers: { "Accept": "text/html", "User-Agent": "AlbaSpace-OrbitalAtlas/1.0" } });
    if (!response.ok) throw new Error(`Orbital crew source returned ${response.status}`);
    const value = normalizeOrbitalCrew(await response.text());
    if (value.length) orbitalCrewCache = { value, expiresAt: now + 30 * 60 * 1000 };
    return value.length ? value : orbitalCrewCache?.value || [];
  } catch (error) {
    console.warn("Orbital Atlas crew source unavailable", error);
    return orbitalCrewCache?.value || [];
  }
}

async function orbitalMissions(crew, now) {
  if (orbitalMissionCache?.expiresAt > now) return orbitalMissionCache.value;
  const groups = {};
  for (const member of crew) {
    const label = orbitalMissionLabel(member.mission);
    if (label) groups[label] = [...(groups[label] || []), member.name];
  }
  try {
    const results = await Promise.all(Object.entries(groups).map(async ([label, members]) => {
      const page = orbitalMissionName(label).replace(/\s+/g, "_");
      const payload = await orbitalFetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&origin=*`);
      const html = payload?.parse?.text?.["*"] || "";
      return html ? normalizeOrbitalMission(label, members, html, now) : null;
    }));
    const value = results.filter(Boolean);
    if (value.length) orbitalMissionCache = { value, expiresAt: now + 30 * 60 * 1000 };
    return value.length ? value : orbitalMissionCache?.value || [];
  } catch (error) {
    console.warn("Orbital Atlas mission source unavailable", error);
    return orbitalMissionCache?.value || [];
  }
}

async function orbitalOverview(cors) {
  const now = Date.now();
  const [launches, iss, crew] = await Promise.all([orbitalLaunches(now), orbitalIss(now), orbitalCrew(now)]);
  const missions = await orbitalMissions(crew, now);
  return json({ launches, iss, crew, missions, updatedAt: new Date(now).toISOString() }, 200, { ...cors, "Cache-Control": "public, max-age=15" });
}

function redirect(location, headers = {}) {
  const h = new Headers();
  h.set("Location", location);
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) { for (const v of value) h.append(key, v); }
    else h.set(key, value);
  }
  return new Response(null, { status: 302, headers: h });
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) out[name] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

function serializeCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge  !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.domain)  parts.push(`Domain=${opts.domain}`);
  if (opts.path)    parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure)  parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join("; ");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}
