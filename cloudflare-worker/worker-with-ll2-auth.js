import fallbackWorker, { GameRoomDO } from "./worker-with-ll2-fallback.js";

export { GameRoomDO };

const LL2_PREFIX = "/api/orbital/ll2";
const PROD_ORIGIN = "https://ll.thespacedevs.com/2.3.0";

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

function isAllowedPath(path) {
  return /^(?:launches|launches\/upcoming|launches\/previous|agencies|pads|launcher_configurations)\/$/.test(path)
    || /^launches\/[0-9a-f-]{32,40}\/$/i.test(path)
    || /^launcher_configurations\/\d+\/$/.test(path);
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
      const n = Math.min(100, Math.max(1, Number.parseInt(value, 10) || 0));
      if (n) output.set(key, String(n));
      continue;
    }
    if (key === "offset") {
      output.set(key, String(Math.min(100000, Math.max(0, Number.parseInt(value, 10) || 0))));
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
    if (key === "ordering" && /^-?[a-z_]{1,60}$/i.test(value)) output.set(key, value);
  }
  return output;
}

function policyFor(path) {
  if (path === "launches/upcoming/") return { fresh: 5 * 60, stale: 2 * 60 * 60 };
  if (/^launches\/[0-9a-f-]{32,40}\/$/i.test(path)) return { fresh: 30 * 60, stale: 24 * 60 * 60 };
  if (path === "launches/previous/") return { fresh: 6 * 60 * 60, stale: 7 * 24 * 60 * 60 };
  if (path === "launches/") return { fresh: 2 * 60 * 60, stale: 3 * 24 * 60 * 60 };
  if (path === "agencies/") return { fresh: 24 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  if (path === "pads/") return { fresh: 6 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  if (/^launcher_configurations\/\d+\/$/.test(path)) return { fresh: 24 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  return { fresh: 6 * 60 * 60, stale: 14 * 24 * 60 * 60 };
}

function canonical(requestUrl) {
  const path = normalizePath(requestUrl.pathname);
  if (!path || !isAllowedPath(path)) return null;
  const params = cleanQuery(requestUrl.searchParams);
  const url = new URL(`${PROD_ORIGIN}/${path}`);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return { path, url };
}

function proxyPagination(body, requestOrigin) {
  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") return body;
    for (const key of ["next", "previous"]) {
      if (!parsed[key] || typeof parsed[key] !== "string") continue;
      try {
        const source = new URL(parsed[key]);
        const base = new URL(PROD_ORIGIN);
        if (source.origin !== base.origin || !source.pathname.startsWith(base.pathname)) continue;
        const relative = source.pathname.slice(base.pathname.length).replace(/^\/+/, "");
        const target = new URL(`${LL2_PREFIX}/${relative}`, requestOrigin);
        source.searchParams.forEach((value, name) => {
          if (ALLOWED_QUERY.has(name)) target.searchParams.set(name, value);
        });
        parsed[key] = target.toString();
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
  } catch {
    return false;
  }
}

async function readD1(env, key) {
  if (!env.DB) return null;
  try {
    return await env.DB.prepare(
      "SELECT status, body, content_type, refresh_at, stale_until, updated_at FROM orbital_ll2_cache WHERE cache_key = ?"
    ).bind(key).first();
  } catch {
    return null;
  }
}

async function writeD1(env, key, status, body, contentType, policy, now) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(`INSERT INTO orbital_ll2_cache
      (cache_key, status, body, content_type, refresh_at, stale_until, updated_at, lock_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(cache_key) DO UPDATE SET
        status = excluded.status,
        body = excluded.body,
        content_type = excluded.content_type,
        refresh_at = excluded.refresh_at,
        stale_until = excluded.stale_until,
        updated_at = excluded.updated_at,
        lock_until = 0`
    ).bind(key, status, body, contentType, now + policy.fresh, now + policy.stale, now).run();
  } catch (error) {
    console.warn("LL2 authenticated D1 write failed", error);
  }
}

function responseFromBody(request, env, requestUrl, body, status, contentType, cacheState, age = 0) {
  return new Response(proxyPagination(body, requestUrl.origin), {
    status,
    headers: {
      ...buildCors(request, env),
      "Content-Type": contentType || "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
      "X-Alba-LL2-Cache": cacheState,
      "X-Alba-LL2-Source": "ll-authenticated",
      "X-Alba-LL2-Age": String(Math.max(0, age))
    }
  });
}

async function authenticatedRoute(request, env, requestUrl) {
  const token = String(env.LL2_API_KEY || "").trim();
  if (!token) return null;

  const target = canonical(requestUrl);
  if (!target) return null;

  const now = Math.floor(Date.now() / 1000);
  const policy = policyFor(target.path);
  await ensureSchema(env);
  const cached = await readD1(env, target.url.toString());

  if (cached && now < Number(cached.refresh_at || 0)) {
    return responseFromBody(
      request, env, requestUrl, cached.body, cached.status, cached.content_type,
      "AUTH-D1", now - Number(cached.updated_at || now)
    );
  }

  let response;
  try {
    response = await fetch(target.url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Token ${token}`,
        "User-Agent": "AlbaSpace-OrbitalAtlas-Cache/2.0 (https://albaspace.com.tr)"
      }
    });
  } catch (error) {
    console.warn("Authenticated LL2 network error", error);
    if (cached && now < Number(cached.stale_until || 0)) {
      return responseFromBody(
        request, env, requestUrl, cached.body, cached.status, cached.content_type,
        "AUTH-STALE", now - Number(cached.updated_at || now)
      );
    }
    return null;
  }

  const body = await response.text();
  const contentType = response.headers.get("Content-Type") || "application/json; charset=utf-8";

  if (!response.ok) {
    if (cached && now < Number(cached.stale_until || 0)) {
      return responseFromBody(
        request, env, requestUrl, cached.body, cached.status, cached.content_type,
        `AUTH-STALE-${response.status}`, now - Number(cached.updated_at || now)
      );
    }
    return null;
  }

  await writeD1(env, target.url.toString(), response.status, body, contentType, policy, now);
  return responseFromBody(request, env, requestUrl, body, response.status, contentType, "AUTH-MISS", 0);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isLL2Route = url.pathname === LL2_PREFIX || url.pathname.startsWith(`${LL2_PREFIX}/`);

    if (isLL2Route && request.method === "GET" && env.LL2_API_KEY) {
      const response = await authenticatedRoute(request, env, url);
      if (response) return response;
    }

    return fallbackWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    return fallbackWorker.scheduled(controller, env, ctx);
  }
};
