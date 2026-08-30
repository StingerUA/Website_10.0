import baseWorker, { GameRoomDO } from "./worker-with-rocket-images.js";

export { GameRoomDO };

const LL2_ORIGIN = "https://ll.thespacedevs.com/2.3.0";
const LL2_PREFIX = "/api/orbital/ll2";
const DEFAULT_BUDGET = 14;

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

function json(data, status, request, env, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...buildCors(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra
    }
  });
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
    if (key === "ordering") {
      if (/^-?[a-z_]{1,60}$/i.test(value)) output.set(key, value);
    }
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

function upstreamUrl(path, params) {
  const url = new URL(`${LL2_ORIGIN}/${path}`);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return url;
}

function cacheKeyFor(url) {
  return url.toString();
}

function edgeKeyFor(requestUrl, upstream) {
  const edge = new URL(`${requestUrl.origin}/__alba_ll2_cache__`);
  edge.searchParams.set("u", upstream.toString());
  return new Request(edge.toString(), { method: "GET" });
}

async function ensureSchema(env) {
  if (!env.DB) return false;
  try {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS orbital_ll2_cache (
        cache_key TEXT PRIMARY KEY,
        status INTEGER NOT NULL,
        body TEXT NOT NULL,
        content_type TEXT NOT NULL,
        refresh_at INTEGER NOT NULL,
        stale_until INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        lock_until INTEGER NOT NULL DEFAULT 0
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS orbital_ll2_budget (
        bucket INTEGER PRIMARY KEY,
        count INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`)
    ]);
    return true;
  } catch (error) {
    console.warn("LL2 cache schema unavailable", error);
    return false;
  }
}

async function readD1(env, key) {
  if (!env.DB) return null;
  try {
    return await env.DB.prepare(
      "SELECT cache_key, status, body, content_type, refresh_at, stale_until, updated_at, lock_until FROM orbital_ll2_cache WHERE cache_key = ?"
    ).bind(key).first();
  } catch {
    return null;
  }
}

async function writeD1(env, key, status, body, contentType, policy, now) {
  if (!env.DB) return;
  const refreshAt = now + policy.fresh;
  const staleUntil = now + policy.stale;
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
    ).bind(key, status, body, contentType, refreshAt, staleUntil, now).run();
  } catch (error) {
    console.warn("LL2 D1 cache write failed", error);
  }
}

async function releaseLock(env, key) {
  if (!env.DB) return;
  try {
    await env.DB.prepare("UPDATE orbital_ll2_cache SET lock_until = 0 WHERE cache_key = ?").bind(key).run();
  } catch {}
}

async function claimRefreshLock(env, key, now) {
  if (!env.DB) return true;
  try {
    const result = await env.DB.prepare(
      "UPDATE orbital_ll2_cache SET lock_until = ? WHERE cache_key = ? AND lock_until < ?"
    ).bind(now + 90, key, now).run();
    return Number(result?.meta?.changes || 0) > 0;
  } catch {
    return false;
  }
}

async function consumeBudget(env, now) {
  if (!env.DB) return true;
  const budget = Math.min(60, Math.max(1, Number.parseInt(env.LL2_UPSTREAM_BUDGET_PER_HOUR || DEFAULT_BUDGET, 10) || DEFAULT_BUDGET));
  const bucket = Math.floor(now / 3600);
  try {
    const result = await env.DB.prepare(`INSERT INTO orbital_ll2_budget (bucket, count, updated_at)
      VALUES (?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
      WHERE orbital_ll2_budget.count < ?`
    ).bind(bucket, now, budget).run();
    return Number(result?.meta?.changes || 0) > 0;
  } catch (error) {
    console.warn("LL2 upstream budget check failed", error);
    return true;
  }
}

function proxyPagination(value, requestOrigin) {
  if (!value || typeof value !== "string") return value;
  try {
    const source = new URL(value);
    if (source.origin !== new URL(LL2_ORIGIN).origin) return value;
    const basePath = new URL(LL2_ORIGIN).pathname.replace(/\/$/, "");
    if (!source.pathname.startsWith(`${basePath}/`)) return value;
    const relative = source.pathname.slice(basePath.length).replace(/^\/+/, "");
    const target = new URL(`${LL2_PREFIX}/${relative}`, requestOrigin);
    source.searchParams.forEach((v, k) => {
      if (ALLOWED_QUERY.has(k)) target.searchParams.set(k, v);
    });
    return target.toString();
  } catch {
    return value;
  }
}

function rewriteBody(body, contentType, requestOrigin) {
  if (!/application\/json/i.test(contentType || "")) return body;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === "object") {
      if ("next" in parsed) parsed.next = proxyPagination(parsed.next, requestOrigin);
      if ("previous" in parsed) parsed.previous = proxyPagination(parsed.previous, requestOrigin);
    }
    return JSON.stringify(parsed);
  } catch {
    return body;
  }
}

function responseFromBody(request, env, requestUrl, body, status, contentType, policy, cacheState, age = 0, warning = "") {
  const rewritten = rewriteBody(body, contentType, requestUrl.origin);
  const headers = new Headers({
    ...buildCors(request, env),
    "Content-Type": contentType || "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    "X-Content-Type-Options": "nosniff",
    "X-Alba-LL2-Cache": cacheState,
    "X-Alba-LL2-Age": String(Math.max(0, age))
  });
  if (warning) headers.set("Warning", warning);
  return new Response(rewritten, { status, headers });
}

async function putEdge(cache, edgeKey, response, policy, ctx) {
  try {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", `public, max-age=${policy.fresh}`);
    headers.delete("X-Alba-LL2-Cache");
    headers.delete("X-Alba-LL2-Age");
    const stored = new Response(response.body, { status: response.status, headers });
    ctx.waitUntil(cache.put(edgeKey, stored));
  } catch (error) {
    console.warn("LL2 edge cache write failed", error);
  }
}

async function fetchUpstream(request, env, ctx, requestUrl, upstream, key, policy, existing = null, background = false) {
  const now = Math.floor(Date.now() / 1000);
  const allowed = await consumeBudget(env, now);
  if (!allowed) {
    if (existing && now < Number(existing.stale_until || 0)) {
      await releaseLock(env, key);
      return responseFromBody(request, env, requestUrl, existing.body, existing.status, existing.content_type, policy, "STALE-BUDGET", now - Number(existing.updated_at || now), '110 - "LL2 upstream budget exhausted; serving cached data"');
    }
    if (background) {
      await releaseLock(env, key);
      return null;
    }
    const retry = 3600 - (now % 3600);
    return json({ error: "LL2 proxy upstream budget exhausted", retry_after: retry }, 429, request, env, { "Retry-After": String(retry) });
  }

  let response;
  try {
    response = await fetch(upstream.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "AlbaSpace-OrbitalAtlas-Cache/1.0 (https://albaspace.com.tr)"
      }
    });
  } catch (error) {
    console.warn("LL2 upstream network error", error);
    if (existing && now < Number(existing.stale_until || 0)) {
      await releaseLock(env, key);
      return responseFromBody(request, env, requestUrl, existing.body, existing.status, existing.content_type, policy, "STALE-ERROR", now - Number(existing.updated_at || now), '111 - "LL2 upstream unavailable; serving cached data"');
    }
    await releaseLock(env, key);
    if (background) return null;
    return json({ error: "LL2 upstream unavailable" }, 502, request, env);
  }

  const body = await response.text();
  const contentType = response.headers.get("Content-Type") || "application/json; charset=utf-8";

  if (!response.ok) {
    if (existing && now < Number(existing.stale_until || 0)) {
      await releaseLock(env, key);
      return responseFromBody(request, env, requestUrl, existing.body, existing.status, existing.content_type, policy, response.status === 429 ? "STALE-429" : "STALE-UPSTREAM", now - Number(existing.updated_at || now), `111 - "LL2 returned HTTP ${response.status}; serving cached data"`);
    }
    await releaseLock(env, key);
    if (background) return null;
    return new Response(body || JSON.stringify({ error: `LL2 HTTP ${response.status}` }), {
      status: response.status,
      headers: {
        ...buildCors(request, env),
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Alba-LL2-Cache": "UPSTREAM-ERROR"
      }
    });
  }

  await writeD1(env, key, response.status, body, contentType, policy, now);
  const final = responseFromBody(request, env, requestUrl, body, response.status, contentType, policy, "MISS", 0);
  const cache = caches.default;
  const edgeKey = edgeKeyFor(requestUrl, upstream);
  await putEdge(cache, edgeKey, final.clone(), policy, ctx);
  return background ? null : final;
}

async function handleLL2(request, env, ctx, requestUrl) {
  const path = normalizePath(requestUrl.pathname);
  if (!path || !isAllowedPath(path)) {
    return json({ error: "Unsupported LL2 endpoint" }, 404, request, env);
  }

  const params = cleanQuery(requestUrl.searchParams);
  const upstream = upstreamUrl(path, params);
  const key = cacheKeyFor(upstream);
  const policy = policyFor(path);
  const edgeKey = edgeKeyFor(requestUrl, upstream);
  const cache = caches.default;

  const edge = await cache.match(edgeKey);
  if (edge) {
    const headers = new Headers(edge.headers);
    Object.entries(buildCors(request, env)).forEach(([k, v]) => headers.set(k, v));
    headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    headers.set("X-Alba-LL2-Cache", "EDGE");
    return new Response(edge.body, { status: edge.status, headers });
  }

  const schemaReady = await ensureSchema(env);
  const now = Math.floor(Date.now() / 1000);
  const existing = schemaReady ? await readD1(env, key) : null;

  if (existing && now < Number(existing.refresh_at || 0)) {
    const final = responseFromBody(request, env, requestUrl, existing.body, existing.status, existing.content_type, policy, "D1-HIT", now - Number(existing.updated_at || now));
    await putEdge(cache, edgeKey, final.clone(), policy, ctx);
    return final;
  }

  if (existing && now < Number(existing.stale_until || 0)) {
    const locked = await claimRefreshLock(env, key, now);
    if (locked) {
      ctx.waitUntil(fetchUpstream(request, env, ctx, requestUrl, upstream, key, policy, existing, true));
    }
    return responseFromBody(request, env, requestUrl, existing.body, existing.status, existing.content_type, policy, locked ? "D1-STALE-REFRESH" : "D1-STALE", now - Number(existing.updated_at || now));
  }

  return fetchUpstream(request, env, ctx, requestUrl, upstream, key, policy, existing, false);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isLL2Route = url.pathname === LL2_PREFIX || url.pathname.startsWith(`${LL2_PREFIX}/`);

    if (isLL2Route && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: buildCors(request, env) });
    }

    if (isLL2Route) {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405, request, env, { Allow: "GET, OPTIONS" });
      }
      try {
        return await handleLL2(request, env, ctx, url);
      } catch (error) {
        console.error("LL2 proxy error", error);
        return json({ error: "LL2 proxy failed" }, 500, request, env);
      }
    }

    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    return baseWorker.scheduled(controller, env, ctx);
  }
};
