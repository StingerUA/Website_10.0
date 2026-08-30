import cachedWorker, { GameRoomDO } from "./worker-with-ll2-cache.js";

export { GameRoomDO };

const LL2_PREFIX = "/api/orbital/ll2";
const PROD_ORIGIN = "https://ll.thespacedevs.com/2.3.0";
const DEV_ORIGIN = "https://lldev.thespacedevs.com/2.3.0";

const ALLOWED_QUERY = new Set([
  "limit",
  "offset",
  "ordering",
  "mode",
  "search",
  "lsp__id",
  "launcher_config__id",
  "active",
  "total_launch_count__gt"
]);

function buildCors(request, env) {
  const requested = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || env.FRONT_ORIGIN || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const origin = allowed.includes(requested)
    ? requested
    : (allowed[0] || "https://albaspace.com.tr");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function normalizePath(pathname) {
  let path = pathname.slice(LL2_PREFIX.length).replace(/^\/+/, "");
  if (!path) return "";
  if (!path.endsWith("/")) path += "/";
  return path;
}

function cleanQuery(source) {
  const output = new URLSearchParams();
  const entries = [...source.entries()]
    .filter(([key]) => ALLOWED_QUERY.has(key))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [key, raw] of entries) {
    let value = String(raw || "").trim();
    if (!value) continue;

    if (key === "limit") {
      const number = Math.min(100, Math.max(1, Number.parseInt(value, 10) || 0));
      if (number) output.set(key, String(number));
      continue;
    }
    if (key === "offset") {
      const number = Math.min(100000, Math.max(0, Number.parseInt(value, 10) || 0));
      output.set(key, String(number));
      continue;
    }
    if (key === "search") {
      value = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").slice(0, 120).trim();
      if (value) output.set(key, value);
      continue;
    }
    if (key === "mode") {
      if (["list", "normal", "detailed"].includes(value)) output.set(key, value);
      continue;
    }
    if (key === "active") {
      if (["true", "false"].includes(value.toLowerCase())) output.set(key, value.toLowerCase());
      continue;
    }
    if (["lsp__id", "launcher_config__id", "total_launch_count__gt"].includes(key)) {
      if (/^\d{1,12}$/.test(value)) output.set(key, value);
      continue;
    }
    if (key === "ordering" && /^-?[a-z_]{1,60}$/i.test(value)) {
      output.set(key, value);
    }
  }
  return output;
}

function policyFor(path) {
  if (path === "launches/upcoming/") return { fresh: 5 * 60, stale: 24 * 60 * 60 };
  if (/^launches\/[0-9a-f-]{32,40}\/$/i.test(path)) return { fresh: 30 * 60, stale: 7 * 24 * 60 * 60 };
  if (path === "launches/previous/") return { fresh: 6 * 60 * 60, stale: 14 * 24 * 60 * 60 };
  if (path === "launches/") return { fresh: 2 * 60 * 60, stale: 7 * 24 * 60 * 60 };
  if (path === "agencies/") return { fresh: 24 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  if (path === "pads/") return { fresh: 6 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  return { fresh: 6 * 60 * 60, stale: 14 * 24 * 60 * 60 };
}

function canonicalUrls(requestUrl) {
  const path = normalizePath(requestUrl.pathname);
  if (!path) return null;
  const params = cleanQuery(requestUrl.searchParams);
  const prod = new URL(`${PROD_ORIGIN}/${path}`);
  const dev = new URL(`${DEV_ORIGIN}/${path}`);
  params.forEach((value, key) => {
    prod.searchParams.set(key, value);
    dev.searchParams.set(key, value);
  });
  return { path, prod, dev };
}

function normalizeDevPagination(body) {
  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") return body;
    for (const key of ["next", "previous"]) {
      if (!parsed[key] || typeof parsed[key] !== "string") continue;
      try {
        const url = new URL(parsed[key]);
        if (url.origin === new URL(DEV_ORIGIN).origin) {
          url.protocol = "https:";
          url.host = new URL(PROD_ORIGIN).host;
          parsed[key] = url.toString();
        }
      } catch {}
    }
    return JSON.stringify(parsed);
  } catch {
    return body;
  }
}

async function ensureSchema(env) {
  if (!env.DB) return false;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS orbital_ll2_cache (
      cache_key TEXT PRIMARY KEY,
      status INTEGER NOT NULL,
      body TEXT NOT NULL,
      content_type TEXT NOT NULL,
      refresh_at INTEGER NOT NULL,
      stale_until INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      lock_until INTEGER NOT NULL DEFAULT 0
    )`).run();
    return true;
  } catch (error) {
    console.warn("LL2 fallback schema unavailable", error);
    return false;
  }
}

async function seedD1FromDev(env, prodUrl, body, contentType, policy) {
  if (!env.DB) return;
  const now = Math.floor(Date.now() / 1000);
  try {
    await ensureSchema(env);
    await env.DB.prepare(`INSERT INTO orbital_ll2_cache
      (cache_key, status, body, content_type, refresh_at, stale_until, updated_at, lock_until)
      VALUES (?, 200, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(cache_key) DO UPDATE SET
        status = 200,
        body = excluded.body,
        content_type = excluded.content_type,
        refresh_at = excluded.refresh_at,
        stale_until = excluded.stale_until,
        updated_at = excluded.updated_at,
        lock_until = 0`
    ).bind(
      prodUrl.toString(),
      body,
      contentType,
      now + policy.fresh,
      now + policy.stale,
      now
    ).run();
  } catch (error) {
    console.warn("LL2 development fallback cache write failed", error);
  }
}

async function developmentFallback(request, env, ctx, requestUrl) {
  const urls = canonicalUrls(requestUrl);
  if (!urls) return null;

  let response;
  try {
    response = await fetch(urls.dev.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "AlbaSpace-OrbitalAtlas-Fallback/1.0 (https://albaspace.com.tr)"
      }
    });
  } catch (error) {
    console.warn("LL2 development fallback network error", error);
    return null;
  }

  if (!response.ok) return null;

  const contentType = response.headers.get("Content-Type") || "application/json; charset=utf-8";
  const rawBody = await response.text();
  const body = normalizeDevPagination(rawBody);
  const policy = policyFor(urls.path);

  ctx.waitUntil(seedD1FromDev(env, urls.prod, body, contentType, policy));

  return new Response(body, {
    status: 200,
    headers: {
      ...buildCors(request, env),
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
      "X-Alba-LL2-Cache": "DEV-FALLBACK",
      "X-Alba-LL2-Source": "lldev",
      "Warning": '110 - "Production LL2 rate-limited; serving development fallback data"'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isLL2Route = url.pathname === LL2_PREFIX || url.pathname.startsWith(`${LL2_PREFIX}/`);

    const response = await cachedWorker.fetch(request, env, ctx);

    if (
      isLL2Route &&
      request.method === "GET" &&
      response.status === 429
    ) {
      const fallback = await developmentFallback(request, env, ctx, url);
      if (fallback) return fallback;
    }

    return response;
  },

  async scheduled(controller, env, ctx) {
    return cachedWorker.scheduled(controller, env, ctx);
  }
};
