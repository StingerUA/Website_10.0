import baseWorker, { GameRoomDO } from "./worker-auth.index.js";

export { GameRoomDO };

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const META_TTL = 24 * 60 * 60;
const IMAGE_TTL = 7 * 24 * 60 * 60;
const rejectedWords = /\b(?:logo|patch|insignia|diagram|drawing|blueprint|schema|render|concept|poster|map)\b/i;

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

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeVehicle(value) {
  return String(value || "")
    .replace(/[|/]/g, " ")
    .replace(/\b(?:Block\s*5|Full\s*Thrust|FT|v?\d+(?:\.\d+){1,2})\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function safeLicense(meta) {
  const name = stripHtml(meta?.LicenseShortName?.value || meta?.UsageTerms?.value || "");
  const lower = name.toLowerCase();
  if (!name || /\bnc\b|non[- ]commercial|\bnd\b|no[- ]derivatives/.test(lower)) return null;
  if (/cc0|public domain|pdm|cc by(?:-|\s|$)|cc by-sa/.test(lower)) return name;
  return null;
}

function commonsPageUrl(title) {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(title || "").replace(/ /g, "_"))}`;
}

function scoreCandidate(page, vehicle) {
  const title = String(page?.title || "").replace(/^File:/i, "");
  const info = page?.imageinfo?.[0];
  if (!info || rejectedWords.test(title)) return -Infinity;
  const meta = info.extmetadata || {};
  if (!safeLicense(meta)) return -Infinity;
  if (!/^image\/(?:jpeg|png|webp)$/i.test(info.mime || "")) return -Infinity;

  const vehicleTokens = normalizeVehicle(vehicle).toLowerCase().split(/\s+/).filter(token => token.length > 1);
  const haystack = `${title} ${stripHtml(meta.ImageDescription?.value)} ${stripHtml(meta.ObjectName?.value)}`.toLowerCase();
  let score = 0;
  vehicleTokens.forEach((token, index) => { if (haystack.includes(token)) score += index < 2 ? 6 : 2; });
  if (/launch|rocket|lift[- ]?off|pad|spaceport/.test(haystack)) score += 2;
  if (/museum|model|mockup|replica|exhibit/.test(haystack)) score -= 3;
  if (info.mime === "image/jpeg") score += 1;
  return score;
}

async function queryCommons(vehicle) {
  const searchName = normalizeVehicle(vehicle);
  if (!searchName) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "14",
    gsrsearch: `${searchName} rocket`,
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "900",
    origin: "*"
  });
  const response = await fetch(`${COMMONS_API}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AlbaSpace-OrbitalAtlas/1.0 (https://albaspace.com.tr)"
    }
  });
  if (!response.ok) throw new Error(`Commons search failed: ${response.status}`);
  const data = await response.json();
  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const ranked = pages
    .map(page => ({ page, score: scoreCandidate(page, vehicle) }))
    .filter(item => Number.isFinite(item.score) && item.score >= 4)
    .sort((a, b) => b.score - a.score);
  const page = ranked[0]?.page;
  const info = page?.imageinfo?.[0];
  if (!page || !info) return null;
  const meta = info.extmetadata || {};
  const license = safeLicense(meta);
  if (!license) return null;
  const file = String(page.title || "").replace(/^File:/i, "");
  if (!file) return null;
  return {
    file,
    credit: stripHtml(meta.Artist?.value || meta.Credit?.value || "Wikimedia Commons") || "Wikimedia Commons",
    license,
    licenseUrl: String(meta.LicenseUrl?.value || ""),
    sourceUrl: commonsPageUrl(page.title)
  };
}

async function rocketImageMeta(request, env, ctx, url) {
  const cors = buildCors(request, env);
  const vehicle = String(url.searchParams.get("vehicle") || "").trim();
  if (!vehicle || vehicle.length > 120) return json({ error: "Invalid vehicle" }, 400, cors);

  const normalized = normalizeVehicle(vehicle).toLowerCase();
  const cacheKey = new Request(`https://orbital-rocket-meta.albaspace.invalid/${encodeURIComponent(normalized)}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    const payload = await cached.json();
    return json(payload, 200, cors, "public, max-age=3600, s-maxage=86400");
  }

  const found = await queryCommons(vehicle);
  if (!found) return json({ error: "No open-license rocket image found", vehicle }, 404, cors, "public, max-age=1800");
  const payload = {
    vehicle,
    image: {
      url: `${url.origin}/api/orbital/rocket-image?file=${encodeURIComponent(found.file)}`,
      credit: found.credit,
      license: found.license,
      licenseUrl: found.licenseUrl,
      sourceUrl: found.sourceUrl
    }
  };
  const cachedResponse = new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": `public, max-age=${META_TTL}` }
  });
  ctx.waitUntil(cache.put(cacheKey, cachedResponse));
  return json(payload, 200, cors, "public, max-age=3600, s-maxage=86400");
}

function validCommonsFile(file) {
  return file.length > 2 && file.length <= 190 && !/[<>#?\\]/.test(file) && /\.(?:jpe?g|png|webp)$/i.test(file);
}

async function resolveCommonsThumb(file) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: `File:${file}`,
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "900",
    origin: "*"
  });
  const response = await fetch(`${COMMONS_API}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AlbaSpace-OrbitalAtlas/1.0 (https://albaspace.com.tr)"
    }
  });
  if (!response.ok) throw new Error(`Commons image lookup failed: ${response.status}`);
  const data = await response.json();
  const page = Array.isArray(data?.query?.pages) ? data.query.pages[0] : null;
  const info = page?.imageinfo?.[0];
  if (!info || !safeLicense(info.extmetadata || {})) return null;
  if (!/^image\/(?:jpeg|png|webp)$/i.test(info.mime || "")) return null;
  return info.thumburl || info.url || null;
}

async function rocketImage(request, env, ctx, url) {
  const cors = buildCors(request, env);
  const file = String(url.searchParams.get("file") || "").trim();
  if (!validCommonsFile(file)) return json({ error: "Invalid file" }, 400, cors);

  const cache = caches.default;
  const cacheKey = new Request(`https://orbital-rocket-image.albaspace.invalid/${encodeURIComponent(file)}`);
  const cached = await cache.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    return new Response(cached.body, { status: cached.status, headers });
  }

  const source = await resolveCommonsThumb(file);
  if (!source) return json({ error: "Open-license image not found" }, 404, cors, "public, max-age=1800");
  const imageResponse = await fetch(source, {
    headers: { "User-Agent": "AlbaSpace-OrbitalAtlas/1.0 (https://albaspace.com.tr)" }
  });
  if (!imageResponse.ok) return json({ error: "Image upstream unavailable" }, 502, cors);
  const contentType = imageResponse.headers.get("Content-Type") || "";
  if (!/^image\/(?:jpeg|png|webp)/i.test(contentType)) return json({ error: "Invalid image response" }, 502, cors);

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": `public, max-age=${IMAGE_TTL}, immutable`,
    "X-Content-Type-Options": "nosniff"
  });
  const length = imageResponse.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);
  const cacheable = new Response(imageResponse.body, { status: 200, headers });
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
      try { return await rocketImageMeta(request, env, ctx, url); }
      catch (error) {
        console.error("Rocket image metadata error", error);
        return json({ error: "Rocket image lookup failed" }, 502, buildCors(request, env));
      }
    }
    if (request.method === "GET" && url.pathname === "/api/orbital/rocket-image") {
      try { return await rocketImage(request, env, ctx, url); }
      catch (error) {
        console.error("Rocket image proxy error", error);
        return json({ error: "Rocket image proxy failed" }, 502, buildCors(request, env));
      }
    }
    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    return baseWorker.scheduled(controller, env, ctx);
  }
};
