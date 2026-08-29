import baseWorker, { GameRoomDO } from "./worker-auth.index.js";

export { GameRoomDO };

const GOOGLE_CSE_API = "https://customsearch.googleapis.com/customsearch/v1";
const GOOGLE_REUSE_RIGHTS = "(cc_publicdomain|cc_attribute|cc_sharealike).-(cc_noncommercial|cc_nonderived)";
const META_TTL = 7 * 24 * 60 * 60;
const IMAGE_TTL = 7 * 24 * 60 * 60;

const rejectedWords = /\b(?:logo|patch|insignia|diagram|drawing|blueprint|schema|schematic|render|concept|poster|map|infographic|illustration|simulation|mockup|replica|toy|model kit)\b/i;
const trustedSourceHosts = [
  "spacex.com",
  "flickr.com",
  "staticflickr.com",
  "nasa.gov",
  "rocketlabusa.com",
  "ulalaunch.com",
  "arianespace.com",
  "esa.int",
  "blueorigin.com",
  "isro.gov.in",
  "spaceforce.mil",
  "af.mil",
  "jaxa.jp"
];
const knownRocketNames = [
  "falcon heavy", "falcon 9", "electron", "neutron", "starship", "new glenn",
  "vulcan", "ariane 6", "soyuz", "long march", "h3", "pslv", "gslv",
  "atlas v", "delta iv", "space launch system", "sls"
];

class GoogleConfigError extends Error {}

function buildCors(request, env) {
  const requested = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || env.FRONT_ORIGIN || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const origin = allowed.includes(requested) ? requested : (allowed[0] || "https://albaspace.com.tr");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, cors, cacheControl = "no-store") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function normalizeVehicle(value) {
  return String(value || "")
    .replace(/[|/]/g, " ")
    .replace(/\b(?:Block\s*5|Full\s*Thrust|FT|v?\d+(?:\.\d+){1,2})\b/gi, " ")
    .replace(/\b(?:original|scheme|schematic|profile|alba\s*space)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local")) return "";
    if (/^(?:127\.|10\.|169\.254\.|192\.168\.)/.test(host)) return "";
    const match172 = host.match(/^172\.(\d{1,3})\./);
    if (match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31) return "";
    if (host === "::1" || /^\[.*\]$/.test(host)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function hostFrom(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

function isBlockedHost(host) {
  return host === "wikimedia.org" || host.endsWith(".wikimedia.org") ||
    host === "wikipedia.org" || host.endsWith(".wikipedia.org");
}

function hostMatches(host, expected) {
  return host === expected || host.endsWith(`.${expected}`);
}

function scoreCandidate(item, vehicle) {
  const imageUrl = safeHttpsUrl(item?.link);
  const contextUrl = safeHttpsUrl(item?.image?.contextLink);
  const thumbnailUrl = safeHttpsUrl(item?.image?.thumbnailLink);
  if (!imageUrl || !contextUrl) return -Infinity;

  const imageHost = hostFrom(imageUrl);
  const contextHost = hostFrom(contextUrl);
  if (isBlockedHost(imageHost) || isBlockedHost(contextHost)) return -Infinity;

  const mime = String(item?.mime || "");
  if (mime && !/^image\/(?:jpeg|png|webp|avif)$/i.test(mime)) return -Infinity;

  const title = String(item?.title || "");
  const snippet = String(item?.snippet || "");
  const haystack = `${title} ${snippet} ${contextHost} ${contextUrl}`.toLowerCase();
  if (rejectedWords.test(haystack)) return -Infinity;

  const normalized = normalizeVehicle(vehicle).toLowerCase();
  const tokens = normalized.split(/\s+/).filter(token => token.length > 1);
  let score = 0;

  if (normalized && haystack.includes(normalized)) score += 34;
  let matchedTokens = 0;
  tokens.forEach(token => {
    if (haystack.includes(token)) {
      matchedTokens += 1;
      score += 5;
    }
  });
  if (tokens.length && matchedTokens === tokens.length) score += 16;

  if (/\brocket\b/.test(haystack)) score += 4;
  if (/\b(?:launch|liftoff|lift-off|launchpad|launch pad|booster)\b/.test(haystack)) score += 5;
  if (trustedSourceHosts.some(host => hostMatches(contextHost, host))) score += 12;

  for (const other of knownRocketNames) {
    if (other !== normalized && !normalized.includes(other) && haystack.includes(other)) score -= 18;
  }

  const width = Number(item?.image?.width || 0);
  const height = Number(item?.image?.height || 0);
  if (width >= 800 && height >= 500) score += 5;
  else if (width >= 500 && height >= 300) score += 2;
  if (width > 0 && height > 0) {
    const ratio = width / height;
    if (ratio >= 0.28 && ratio <= 1.6) score += 3;
    if (ratio > 3.2) score -= 4;
  }

  if (thumbnailUrl) score += 1;
  return score;
}

async function queryGoogle(vehicle, env) {
  const apiKey = String(env.GOOGLE_CSE_API_KEY || "").trim();
  const cx = String(env.GOOGLE_CSE_CX || "").trim();
  if (!apiKey || !cx) {
    throw new GoogleConfigError("GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX must be configured");
  }

  const searchName = normalizeVehicle(vehicle);
  if (!searchName) return null;

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: `${searchName} rocket launch`,
    searchType: "image",
    imgType: "photo",
    imgSize: "large",
    safe: "active",
    filter: "1",
    num: "10",
    rights: GOOGLE_REUSE_RIGHTS
  });

  const response = await fetch(`${GOOGLE_CSE_API}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AlbaSpace-OrbitalAtlas/2.0 (https://albaspace.com.tr)"
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google image search failed: ${response.status} ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  const ranked = items
    .map(item => ({ item, score: scoreCandidate(item, vehicle) }))
    .filter(entry => Number.isFinite(entry.score) && entry.score >= 20)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.item;
  if (!best) return null;

  const imageUrl = safeHttpsUrl(best.link);
  const thumbnailUrl = safeHttpsUrl(best?.image?.thumbnailLink);
  const contextUrl = safeHttpsUrl(best?.image?.contextLink);
  if (!imageUrl || !contextUrl) return null;

  return {
    vehicle: searchName,
    query: `${searchName} rocket launch`,
    imageUrl,
    thumbnailUrl,
    contextUrl,
    sourceHost: hostFrom(contextUrl) || hostFrom(imageUrl),
    title: String(best.title || searchName).slice(0, 180),
    mime: String(best.mime || "").slice(0, 60),
    width: Number(best?.image?.width || 0),
    height: Number(best?.image?.height || 0)
  };
}

async function getGoogleCandidate(vehicle, env, ctx) {
  const normalized = normalizeVehicle(vehicle).toLowerCase();
  if (!normalized) return null;

  const cache = caches.default;
  const cacheKey = new Request(`https://orbital-google-rocket-source.albaspace.invalid/${encodeURIComponent(normalized)}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached.json();

  const candidate = await queryGoogle(vehicle, env);
  if (!candidate) return null;

  const cachedResponse = new Response(JSON.stringify(candidate), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${META_TTL}`
    }
  });
  ctx.waitUntil(cache.put(cacheKey, cachedResponse));
  return candidate;
}

async function rocketImageMeta(request, env, ctx, url) {
  const cors = buildCors(request, env);
  const vehicle = String(url.searchParams.get("vehicle") || "").trim();
  if (!vehicle || vehicle.length > 120) return json({ error: "Invalid vehicle" }, 400, cors);

  const found = await getGoogleCandidate(vehicle, env, ctx);
  if (!found) {
    return json({ error: "No suitable Google image result found", vehicle }, 404, cors, "public, max-age=1800");
  }

  const payload = {
    vehicle: found.vehicle,
    image: {
      url: `${url.origin}/api/orbital/rocket-image?vehicle=${encodeURIComponent(found.vehicle)}`,
      provider: "google",
      credit: found.sourceHost || "Google Images",
      sourceUrl: found.contextUrl,
      searchQuery: found.query,
      reuseFiltered: true
    }
  };

  return json(payload, 200, cors, "public, max-age=3600, s-maxage=86400");
}

async function fetchCandidateImage(candidate) {
  const sources = [candidate?.imageUrl, candidate?.thumbnailUrl].filter(Boolean);
  for (const source of sources) {
    const safe = safeHttpsUrl(source);
    if (!safe || isBlockedHost(hostFrom(safe))) continue;
    try {
      const response = await fetch(safe, {
        redirect: "follow",
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.2",
          "User-Agent": "AlbaSpace-OrbitalAtlas/2.0 (https://albaspace.com.tr)"
        }
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("Content-Type") || "";
      if (!/^image\/(?:jpeg|png|webp|avif)/i.test(contentType)) continue;
      return { response, contentType };
    } catch (error) {
      console.warn("Rocket image upstream failed", safe, error);
    }
  }
  return null;
}

async function rocketImage(request, env, ctx, url) {
  const cors = buildCors(request, env);
  const vehicle = String(url.searchParams.get("vehicle") || "").trim();
  if (!vehicle || vehicle.length > 120) return json({ error: "Invalid vehicle" }, 400, cors);

  const normalized = normalizeVehicle(vehicle).toLowerCase();
  const cache = caches.default;
  const cacheKey = new Request(`https://orbital-google-rocket-image.albaspace.invalid/${encodeURIComponent(normalized)}`);
  const cached = await cache.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    return new Response(cached.body, { status: cached.status, headers });
  }

  const candidate = await getGoogleCandidate(vehicle, env, ctx);
  if (!candidate) return json({ error: "Google image result not found" }, 404, cors, "public, max-age=1800");

  const fetched = await fetchCandidateImage(candidate);
  if (!fetched) return json({ error: "Google image upstream unavailable" }, 502, cors, "public, max-age=900");

  const headers = new Headers({
    "Content-Type": fetched.contentType,
    "Cache-Control": `public, max-age=${IMAGE_TTL}, immutable`,
    "X-Content-Type-Options": "nosniff"
  });
  const cacheable = new Response(fetched.response.body, { status: 200, headers });
  ctx.waitUntil(cache.put(cacheKey, cacheable.clone()));
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
  return new Response(cacheable.body, { status: 200, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isRocketRoute = url.pathname === "/api/orbital/rocket-image-meta" || url.pathname === "/api/orbital/rocket-image";

    if (isRocketRoute && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: buildCors(request, env) });
    }

    if (request.method === "GET" && url.pathname === "/api/orbital/rocket-image-meta") {
      try {
        return await rocketImageMeta(request, env, ctx, url);
      } catch (error) {
        console.error("Google rocket image metadata error", error);
        const status = error instanceof GoogleConfigError ? 503 : 502;
        const message = error instanceof GoogleConfigError ? "Google image search is not configured" : "Google rocket image lookup failed";
        return json({ error: message }, status, buildCors(request, env));
      }
    }

    if (request.method === "GET" && url.pathname === "/api/orbital/rocket-image") {
      try {
        return await rocketImage(request, env, ctx, url);
      } catch (error) {
        console.error("Google rocket image proxy error", error);
        const status = error instanceof GoogleConfigError ? 503 : 502;
        const message = error instanceof GoogleConfigError ? "Google image search is not configured" : "Google rocket image proxy failed";
        return json({ error: message }, status, buildCors(request, env));
      }
    }

    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    return baseWorker.scheduled(controller, env, ctx);
  }
};
