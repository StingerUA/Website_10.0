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
import * as satellite from "satellite.js";
export { GameRoomDO };

const SESSION_COOKIE     = "albaspace_session";
const OAUTH_STATE_COOKIE = "albaspace_oauth_state";
const AUTH_TOKEN_QUERY = "access_token";
const ORBITAL_LAUNCHES_URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=3&mode=detailed&ordering=net";
const ORBITAL_LAUNCHES_FALLBACK_URL = "https://fdo.rocketlaunch.live/json/launches/next/5";
const ORBITAL_ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const ORBITAL_CREW_URL = "https://whoisinspace.com/";
const ORBITAL_ISS_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";
const ORBITAL_SNAPSHOT_KEY = "overview";
const VENUS_USGS_SEARCH_URL = "https://planetarynames.wr.usgs.gov/SearchResults?Target=15_Venus";
const VENUS_USGS_TARGET_URL = "https://planetarynames.wr.usgs.gov/Page/VENUS/target";
const VENUS_SNAPSHOT_KEY = "venus_nomenclature";
const VENUS_MIN_FEATURES = 1500;
const VENUS_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MARS_USGS_SEARCH_URL = "https://planetarynames.wr.usgs.gov/SearchResults?Target=20_Mars";
const MARS_USGS_TARGET_URL = "https://planetarynames.wr.usgs.gov/Page/MARS/target";
const MOON_USGS_SEARCH_URL = "https://planetarynames.wr.usgs.gov/SearchResults?Target=16_Moon";
const MOON_USGS_TARGET_URL = "https://planetarynames.wr.usgs.gov/Page/MOON/target";
const PLANETARY_NOMENCLATURE = {
  mars: { target: "Mars", cacheKey: "mars_nomenclature", minFeatures: 1500, maxBytes: 8 * 1024 * 1024, searchUrl: MARS_USGS_SEARCH_URL, targetUrl: MARS_USGS_TARGET_URL },
  moon: { target: "Moon", cacheKey: "moon_nomenclature", minFeatures: 7500, maxBytes: 30 * 1024 * 1024, searchUrl: MOON_USGS_SEARCH_URL, targetUrl: MOON_USGS_TARGET_URL }
};
let orbitalLaunchesCache = null;
let orbitalIssCache = null;
let orbitalCrewCache = null;
let orbitalMissionCache = null;
let orbitalIssTleCache = null;
let venusNomenclatureCache = null;
const planetaryNomenclatureCache = new Map();
const orbitalCityCache = new Map();

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
  },
  async scheduled(controller, env, ctx) {
    if (controller.cron !== "0 */5 * * *") return;
    ctx.waitUntil(orbitalRefreshSnapshot(env));
    ctx.waitUntil(venusRefreshSnapshot(env));
    ctx.waitUntil(planetaryRefreshSnapshot("mars", env));
    ctx.waitUntil(planetaryRefreshSnapshot("moon", env));
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
    return orbitalOverview(cors, env);
  }
  if (url.pathname === "/api/orbital/iss-tle" && request.method === "GET") {
    return orbitalIssTle(url, cors);
  }
  if (url.pathname === "/api/orbital/iss-track" && request.method === "GET") {
    return orbitalIssTrack(url, cors);
  }
  if (url.pathname === "/api/orbital/venus" && request.method === "GET") {
    return venusNomenclature(cors, env);
  }
  if (url.pathname === "/api/orbital/mars" && request.method === "GET") {
    return planetaryNomenclature("mars", cors, env);
  }
  if (url.pathname === "/api/orbital/moon" && request.method === "GET") {
    return planetaryNomenclature("moon", cors, env);
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
  const video = Array.isArray(raw?.vidURLs) ? raw.vidURLs.find(item => isOrbitalYouTubeUrl(item?.url)) : null;
  const image = orbitalSafeLaunchImage(raw?.image);
  return {
    name: orbitalText(raw?.name, "Миссия уточняется"),
    net: typeof raw?.net === "string" ? raw.net : typeof raw?.window_start === "string" ? raw.window_start : null,
    provider,
    location: orbitalText(raw?.pad?.location?.name, orbitalText(raw?.pad?.name, "Площадка уточняется")),
    status: orbitalText(raw?.status?.name, "Статус уточняется"),
    streamUrl: video?.url || (/spacex/i.test(provider) ? "https://www.youtube.com/@SpaceX/live" : null),
    image,
    source: "Data: Launch Library 2"
  };
}

function normalizeRocketLaunch(raw) {
  const provider = orbitalText(raw?.provider?.name, "Оператор уточняется");
  const location = [raw?.pad?.name, raw?.pad?.location?.name].filter(value => typeof value === "string" && value.trim()).join(" · ");
  const media = Array.isArray(raw?.media) ? raw.media.find(item => isOrbitalYouTubeUrl(item?.media_url) || typeof item?.youtube_vidid === "string") : null;
  const streamUrl = isOrbitalYouTubeUrl(media?.media_url)
    ? media.media_url
    : typeof media?.youtube_vidid === "string" && media.youtube_vidid ? `https://www.youtube.com/watch?v=${encodeURIComponent(media.youtube_vidid)}`
      : /spacex/i.test(provider) ? "https://www.youtube.com/@SpaceX/live" : null;
  return {
    name: orbitalText(raw?.name, "Миссия уточняется"),
    net: typeof raw?.t0 === "string" ? raw.t0 : typeof raw?.win_open === "string" ? raw.win_open : null,
    provider,
    location: location || "Площадка уточняется",
    status: raw?.est_date?.year ? "Запланирован" : "Окно уточняется",
    streamUrl,
    image: null,
    source: "Data by RocketLaunch.Live"
  };
}

function isOrbitalYouTubeUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname.toLowerCase()) && url.pathname !== "/";
  } catch { return false; }
}

function orbitalSafeLaunchImage(value) {
  const licenseName = orbitalText(value?.license?.name, "");
  const url = typeof value?.image_url === "string" ? value.image_url : typeof value?.thumbnail_url === "string" ? value.thumbnail_url : "";
  const canDisplay = /^CC BY(?:\s|[-–])/i.test(licenseName) && !/\bNC\b/i.test(licenseName);
  if (!url || !canDisplay) return null;
  return {
    url,
    credit: orbitalText(value?.credit, "The Space Devs"),
    license: licenseName,
    licenseUrl: typeof value?.license?.link === "string" ? value.license.link : null
  };
}

async function orbitalFetch(url) {
  const response = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": "AlbaSpace-OrbitalAtlas/1.0" } });
  if (!response.ok) throw new Error(`Orbital source returned ${response.status}`);
  return response.json();
}

async function orbitalLaunches(now) {
  if (orbitalLaunchesCache?.expiresAt > now) return orbitalLaunchesCache.value;
  let value = [];
  try {
    const payload = await orbitalFetch(`${ORBITAL_LAUNCHES_URL}&net__gte=${encodeURIComponent(new Date(now).toISOString())}`);
    value = Array.isArray(payload?.results) ? payload.results.map(normalizeOrbitalLaunch).filter(item => item.net && Date.parse(item.net) >= now - 60000).slice(0, 3) : [];
  } catch (error) {
    console.warn("Orbital Atlas launch source unavailable", error);
  }
  if (!value.length) {
    try {
      const payload = await orbitalFetch(ORBITAL_LAUNCHES_FALLBACK_URL);
      value = Array.isArray(payload?.result) ? payload.result.map(normalizeRocketLaunch).filter(item => item.net && Date.parse(item.net) >= now - 60000).slice(0, 3) : [];
    } catch (error) {
      console.warn("Orbital Atlas launch fallback unavailable", error);
    }
  }
  if (value.length) orbitalLaunchesCache = { value, expiresAt: now + 20 * 60 * 1000 };
  return value.length ? value : orbitalLaunchesCache?.value || [];
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

function orbitalOverviewUsable(value) {
  return value.launches.length > 0 || value.iss !== null || value.crew.length > 0 || value.missions.length > 0;
}

async function orbitalReadSnapshot(env) {
  if (!env.DB) return null;
  try {
    const row = await env.DB.prepare("SELECT payload_json FROM orbital_content_cache WHERE cache_key = ? LIMIT 1").bind(ORBITAL_SNAPSHOT_KEY).first();
    const value = row?.payload_json ? JSON.parse(row.payload_json) : null;
    return value && Array.isArray(value.launches) && Array.isArray(value.crew) && Array.isArray(value.missions) ? value : null;
  } catch (error) {
    console.warn("Orbital Atlas stored snapshot unavailable", error);
    return null;
  }
}

async function orbitalWriteSnapshot(env, value) {
  if (!env.DB) return;
  await env.DB.prepare("INSERT INTO orbital_content_cache (cache_key, payload_json, refreshed_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, refreshed_at = excluded.refreshed_at")
    .bind(ORBITAL_SNAPSHOT_KEY, JSON.stringify(value), Date.now()).run();
}

async function orbitalFreshOverview() {
  const now = Date.now();
  const [launches, iss, crew] = await Promise.all([orbitalLaunches(now), orbitalIss(now), orbitalCrew(now)]);
  const missions = await orbitalMissions(crew, now);
  return { launches, iss, crew, missions, updatedAt: new Date(now).toISOString() };
}

async function orbitalRefreshSnapshot(env) {
  const fresh = await orbitalFreshOverview();
  if (!orbitalOverviewUsable(fresh)) throw new Error("No usable orbital data received; prior snapshot preserved");
  await orbitalWriteSnapshot(env, fresh);
  console.log("Orbital Atlas snapshot refreshed", fresh.updatedAt);
  return fresh;
}

async function orbitalOverview(cors, env) {
  let value = await orbitalFreshOverview();
  try {
    if (!orbitalOverviewUsable(value)) value = await orbitalReadSnapshot(env) || value;
  } catch (error) {
    console.warn("Orbital Atlas stored fallback unavailable", error);
  }
  return json(value, 200, { ...cors, "Cache-Control": "public, max-age=15" });
}

// =========================
// ♀️ VENUS NOMENCLATURE — official USGS / IAU snapshot
// =========================
function venusText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function venusDecodeHtml(value) {
  return venusText(value)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function venusStripHtml(value) {
  return venusDecodeHtml(String(value || "").replace(/<[^>]*>/g, " "));
}

function venusNumber(value) {
  const number = Number(venusText(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function venusEastLongitude(value) {
  const longitude = venusNumber(value);
  if (longitude === null || longitude < -360 || longitude > 360) return null;
  return longitude < 0 ? longitude + 360 : longitude;
}

function venusFeatureUrl(id) {
  return `https://planetarynames.wr.usgs.gov/Feature/${encodeURIComponent(id)}`;
}

function venusNormalizeRow(cells) {
  const id = venusText(cells[0]);
  const nameMatch = String(cells[1] || "").match(/href\s*=\s*["']\/Feature\/(\d+)["']/i);
  const name = venusStripHtml(cells[1]);
  const latitude = venusNumber(venusStripHtml(cells[5]));
  const longitudeEast = venusEastLongitude(venusStripHtml(cells[6]));
  if (!/^\d+$/.test(id) || !name || latitude === null || longitudeEast === null || latitude < -90 || latitude > 90 || longitudeEast < 0 || longitudeEast > 360) return null;
  return {
    id,
    name,
    cleanName: venusStripHtml(cells[2]) || name,
    type: venusStripHtml(cells[14]),
    code: venusStripHtml(cells[15]),
    diameterKm: venusNumber(venusStripHtml(cells[4])),
    latitude,
    longitudeEast,
    minLatitude: venusNumber(venusStripHtml(cells[8])),
    maxLatitude: venusNumber(venusStripHtml(cells[7])),
    minLongitudeEast: venusEastLongitude(venusStripHtml(cells[10])),
    maxLongitudeEast: venusEastLongitude(venusStripHtml(cells[9])),
    continent: venusStripHtml(cells[12]),
    ethnicity: venusStripHtml(cells[13]),
    quad: venusStripHtml(cells[16]),
    approval: venusStripHtml(cells[17]),
    approvalDate: venusStripHtml(cells[18]),
    origin: venusStripHtml(cells[20]),
    sourceUrl: venusFeatureUrl(nameMatch?.[1] || id)
  };
}

export function parseVenusUsGsHtml(html, snapshotAt = new Date().toISOString()) {
  const section = String(html || "").match(/<tbody\b[^>]*id\s*=\s*["']results_body["'][^>]*>([\s\S]*?)<\/tbody>/i)?.[1] || "";
  const features = [];
  const seen = new Set();
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let row;
  while ((row = rowPattern.exec(section)) !== null) {
    const cells = [];
    const cellPattern = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
    let cell;
    while ((cell = cellPattern.exec(row[1])) !== null) cells.push(cell[1]);
    const feature = venusNormalizeRow(cells);
    if (feature && !seen.has(feature.id)) {
      seen.add(feature.id);
      features.push(feature);
    }
  }
  features.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return {
    schemaVersion: 1,
    target: "Venus",
    coordinateSystem: "Planetocentric latitude; east longitude 0–360°",
    source: {
      provider: "USGS Astrogeology / IAU Gazetteer of Planetary Nomenclature",
      targetUrl: VENUS_USGS_TARGET_URL,
      datasetUrl: VENUS_USGS_SEARCH_URL
    },
    snapshotAt,
    featureCount: features.length,
    features
  };
}

function venusSnapshotUsable(value) {
  return Boolean(value && value.target === "Venus" && Array.isArray(value.features) && value.features.length >= VENUS_MIN_FEATURES && typeof value.snapshotAt === "string");
}

async function venusReadSnapshot(env) {
  if (!env.DB) return null;
  try {
    const row = await env.DB.prepare("SELECT payload_json, refreshed_at FROM orbital_content_cache WHERE cache_key = ? LIMIT 1").bind(VENUS_SNAPSHOT_KEY).first();
    const value = row?.payload_json ? JSON.parse(row.payload_json) : null;
    if (!venusSnapshotUsable(value)) return null;
    const refreshedAt = Number(row?.refreshed_at) || Date.parse(value.snapshotAt) || 0;
    return { value, refreshedAt };
  } catch (error) {
    console.warn("Venus Atlas stored snapshot unavailable", error);
    return null;
  }
}

async function venusWriteSnapshot(env, value, refreshedAt) {
  if (!env.DB) return;
  await env.DB.prepare("INSERT INTO orbital_content_cache (cache_key, payload_json, refreshed_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, refreshed_at = excluded.refreshed_at")
    .bind(VENUS_SNAPSHOT_KEY, JSON.stringify(value), refreshedAt).run();
}

async function venusFetchFreshSnapshot(now) {
  const response = await fetch(VENUS_USGS_SEARCH_URL, {
    headers: { "Accept": "text/html", "User-Agent": "AlbaSpace-VenusAtlas/1.0 (+https://albaspace.com.tr)" }
  });
  if (!response.ok) throw new Error(`USGS Venus source returned ${response.status}`);
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 8 * 1024 * 1024) throw new Error("USGS Venus response exceeded safe size limit");
  const html = await response.text();
  if (html.length > 8 * 1024 * 1024) throw new Error("USGS Venus response exceeded safe size limit");
  const value = parseVenusUsGsHtml(html, new Date(now).toISOString());
  if (!venusSnapshotUsable(value)) throw new Error(`USGS Venus response did not contain enough valid features (${value.featureCount})`);
  return value;
}

async function venusRefreshSnapshot(env, force = false) {
  const now = Date.now();
  const stored = await venusReadSnapshot(env);
  if (!force && stored?.refreshedAt && now - stored.refreshedAt < VENUS_REFRESH_INTERVAL_MS) return stored.value;
  try {
    const value = await venusFetchFreshSnapshot(now);
    await venusWriteSnapshot(env, value, now);
    venusNomenclatureCache = { value, expiresAt: now + 15 * 60 * 1000 };
    console.log("Venus Atlas snapshot refreshed", value.snapshotAt, value.featureCount);
    return value;
  } catch (error) {
    console.warn("Venus Atlas refresh failed; preserving prior snapshot", error);
    if (stored?.value) return stored.value;
    throw error;
  }
}

async function venusNomenclature(cors, env) {
  const now = Date.now();
  let value = venusNomenclatureCache?.expiresAt > now ? venusNomenclatureCache.value : null;
  if (!value) {
    const stored = await venusReadSnapshot(env);
    try {
      value = !stored || now - stored.refreshedAt >= VENUS_REFRESH_INTERVAL_MS
        ? await venusRefreshSnapshot(env)
        : stored.value;
    } catch (error) {
      console.warn("Venus Atlas API could not obtain initial snapshot", error);
      return json({ error: "Venus nomenclature is temporarily unavailable", source: { targetUrl: VENUS_USGS_TARGET_URL } }, 503, { ...cors, "Cache-Control": "public, max-age=60" });
    }
    venusNomenclatureCache = { value, expiresAt: now + 15 * 60 * 1000 };
  }
  return json(value, 200, { ...cors, "Cache-Control": "public, max-age=900, stale-while-revalidate=3600" });
}

// =========================
// ♂ / ☾ MARS & MOON — official USGS / IAU nomenclature snapshots
// =========================
export function parsePlanetaryUsGsHtml(html, key, snapshotAt = new Date().toISOString()) {
  const target = PLANETARY_NOMENCLATURE[key];
  if (!target) throw new Error(`Unknown planetary nomenclature target: ${key}`);
  const parsed = parseVenusUsGsHtml(html, snapshotAt);
  return {
    ...parsed,
    target: target.target,
    source: {
      provider: "USGS Astrogeology / IAU Gazetteer of Planetary Nomenclature",
      targetUrl: target.targetUrl,
      datasetUrl: target.searchUrl
    }
  };
}

function planetarySnapshotUsable(key, value) {
  const target = PLANETARY_NOMENCLATURE[key];
  return Boolean(target && value && value.target === target.target && Array.isArray(value.features) && value.features.length >= target.minFeatures && typeof value.snapshotAt === "string");
}

async function planetaryReadSnapshot(key, env) {
  const target = PLANETARY_NOMENCLATURE[key];
  if (!target || !env.DB) return null;
  try {
    const row = await env.DB.prepare("SELECT payload_json, refreshed_at FROM orbital_content_cache WHERE cache_key = ? LIMIT 1").bind(target.cacheKey).first();
    const value = row?.payload_json ? JSON.parse(row.payload_json) : null;
    if (!planetarySnapshotUsable(key, value)) return null;
    return { value, refreshedAt: Number(row?.refreshed_at) || Date.parse(value.snapshotAt) || 0 };
  } catch (error) {
    console.warn(`${target.target} Atlas stored snapshot unavailable`, error);
    return null;
  }
}

async function planetaryWriteSnapshot(key, env, value, refreshedAt) {
  const target = PLANETARY_NOMENCLATURE[key];
  if (!target || !env.DB) return;
  await env.DB.prepare("INSERT INTO orbital_content_cache (cache_key, payload_json, refreshed_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, refreshed_at = excluded.refreshed_at")
    .bind(target.cacheKey, JSON.stringify(value), refreshedAt).run();
}

async function planetaryFetchFreshSnapshot(key, now) {
  const target = PLANETARY_NOMENCLATURE[key];
  const response = await fetch(target.searchUrl, { headers: { "Accept": "text/html", "User-Agent": `AlbaSpace-${target.target}Atlas/1.0 (+https://albaspace.com.tr)` } });
  if (!response.ok) throw new Error(`USGS ${target.target} source returned ${response.status}`);
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > target.maxBytes) throw new Error(`USGS ${target.target} response exceeded safe size limit`);
  const html = await response.text();
  if (html.length > target.maxBytes) throw new Error(`USGS ${target.target} response exceeded safe size limit`);
  const value = parsePlanetaryUsGsHtml(html, key, new Date(now).toISOString());
  if (!planetarySnapshotUsable(key, value)) throw new Error(`USGS ${target.target} response did not contain enough valid features (${value.featureCount})`);
  return value;
}

async function planetaryRefreshSnapshot(key, env, force = false) {
  const target = PLANETARY_NOMENCLATURE[key];
  const now = Date.now();
  const stored = await planetaryReadSnapshot(key, env);
  if (!force && stored?.refreshedAt && now - stored.refreshedAt < VENUS_REFRESH_INTERVAL_MS) return stored.value;
  try {
    const value = await planetaryFetchFreshSnapshot(key, now);
    await planetaryWriteSnapshot(key, env, value, now);
    planetaryNomenclatureCache.set(key, { value, expiresAt: now + 15 * 60 * 1000 });
    console.log(`${target.target} Atlas snapshot refreshed`, value.snapshotAt, value.featureCount);
    return value;
  } catch (error) {
    console.warn(`${target.target} Atlas refresh failed; preserving prior snapshot`, error);
    if (stored?.value) return stored.value;
    throw error;
  }
}

async function planetaryNomenclature(key, cors, env) {
  const target = PLANETARY_NOMENCLATURE[key];
  const now = Date.now();
  let value = planetaryNomenclatureCache.get(key)?.expiresAt > now ? planetaryNomenclatureCache.get(key).value : null;
  if (!value) {
    const stored = await planetaryReadSnapshot(key, env);
    try {
      value = !stored || now - stored.refreshedAt >= VENUS_REFRESH_INTERVAL_MS ? await planetaryRefreshSnapshot(key, env) : stored.value;
    } catch (error) {
      console.warn(`${target.target} Atlas API could not obtain initial snapshot`, error);
      return json({ error: `${target.target} nomenclature is temporarily unavailable`, source: { targetUrl: target.targetUrl } }, 503, { ...cors, "Cache-Control": "public, max-age=60" });
    }
    planetaryNomenclatureCache.set(key, { value, expiresAt: now + 15 * 60 * 1000 });
  }
  return json(value, 200, { ...cors, "Cache-Control": "public, max-age=900, stale-while-revalidate=3600" });
}

async function orbitalCurrentTle(now) {
  if (orbitalIssTleCache?.expiresAt > now) return orbitalIssTleCache.value;
  const response = await fetch(ORBITAL_ISS_TLE_URL, { headers: { "Accept": "text/plain", "User-Agent": "AlbaSpace-OrbitalAtlas/1.0" } });
  if (!response.ok) throw new Error(`CelesTrak TLE source returned ${response.status}`);
  const lines = (await response.text()).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const line1 = lines.find(line => line.startsWith("1 "));
  const line2 = lines.find(line => line.startsWith("2 "));
  if (!line1 || !line2) throw new Error("CelesTrak response did not include ISS TLE lines");
  const value = { line1, line2 };
  orbitalIssTleCache = { value, expiresAt: now + 30 * 60 * 1000 };
  return value;
}

async function orbitalCity(latitude, longitude, now) {
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = orbitalCityCache.get(key);
  if (cached?.expiresAt > now) return cached.value;
  try {
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`;
    const response = await fetch(endpoint, { headers: { "Accept": "application/json", "User-Agent": "AlbaSpace-OrbitalAtlas/1.0 (iss-pass-widget)" } });
    if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);
    const address = (await response.json())?.address || {};
    const value = address.city || address.town || address.village || address.municipality || address.county || null;
    orbitalCityCache.set(key, { value, expiresAt: now + 10 * 60 * 1000 });
    return value;
  } catch (error) {
    console.warn("Orbital Atlas city source unavailable", error);
    orbitalCityCache.set(key, { value: null, expiresAt: now + 5 * 60 * 1000 });
    return null;
  }
}

async function orbitalIssTle(url, cors) {
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return json({ error: "Invalid coordinates" }, 400, cors);
  const now = Date.now();
  const [tle, city] = await Promise.all([orbitalCurrentTle(now), orbitalCity(latitude, longitude, now)]);
  return json({ ...tle, city, updatedAt: new Date(now).toISOString() }, 200, { ...cors, "Cache-Control": "public, max-age=300" });
}

export function buildIssGroundTrack(tle, now = Date.now(), windowMinutes = 90, stepSeconds = 60) {
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const points = [];
  const start = now - windowMinutes * 60_000;
  const end = now + windowMinutes * 60_000;
  for (let time = start; time <= end; time += stepSeconds * 1000) {
    const date = new Date(time);
    const positionVelocity = satellite.propagate(satrec, date);
    const position = positionVelocity?.position;
    if (!position || typeof position === "boolean") continue;
    const geodetic = satellite.eciToGeodetic(position, satellite.gstime(date));
    const latitude = satellite.degreesLat(geodetic.latitude);
    const longitude = satellite.degreesLong(geodetic.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    points.push({ time: date.toISOString(), latitude: Number(latitude.toFixed(4)), longitude: Number(longitude.toFixed(4)), altitudeKm: Number(geodetic.height.toFixed(1)) });
  }
  return points;
}

async function orbitalIssTrack(url, cors) {
  const windowMinutes = Math.max(30, Math.min(180, Math.round(Number(url.searchParams.get("window")) || 90)));
  const stepSeconds = Math.max(30, Math.min(120, Math.round(Number(url.searchParams.get("step")) || 60)));
  const now = Date.now();
  try {
    const tle = await orbitalCurrentTle(now);
    const points = buildIssGroundTrack(tle, now, windowMinutes, stepSeconds);
    if (points.length < 20) throw new Error("TLE propagation did not produce enough ground-track points");
    return json({ source: "CelesTrak TLE propagated with SGP4", navigationOnly: true, windowMinutes, stepSeconds, updatedAt: new Date(now).toISOString(), tleUpdatedAt: new Date(now).toISOString(), points }, 200, { ...cors, "Cache-Control": "public, max-age=300, stale-while-revalidate=900" });
  } catch (error) {
    console.warn("Orbital Atlas ISS track unavailable", error);
    return json({ error: "ISS ground track is temporarily unavailable" }, 503, { ...cors, "Cache-Control": "public, max-age=60" });
  }
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
