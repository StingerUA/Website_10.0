import appWorker, { GameRoomDO } from "./worker-with-ll2-auth.js";

export { GameRoomDO };

const PROD_PREFIX = "https://ll.thespacedevs.com/2.3.0/";
const REFRESH_CRON = "17 * * * *";
const MAX_REFRESHES_PER_RUN = 3;
const DEFAULT_BUDGET = 14;
const WORKERS_DEV_ORIGIN = "https://albaspace-api.nncdecdgc.workers.dev";

function policyForUrl(value) {
  let path = "";
  try {
    const url = new URL(value);
    path = url.pathname.replace(/^\/2\.3\.0\//, "");
  } catch {}

  if (path === "launches/upcoming/") return { fresh: 5 * 60, stale: 2 * 60 * 60 };
  if (/^launches\/[0-9a-f-]{32,40}\/$/i.test(path)) return { fresh: 30 * 60, stale: 24 * 60 * 60 };
  if (path === "launches/previous/") return { fresh: 6 * 60 * 60, stale: 7 * 24 * 60 * 60 };
  if (path === "launches/") return { fresh: 2 * 60 * 60, stale: 3 * 24 * 60 * 60 };
  if (path === "agencies/") return { fresh: 24 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  if (path === "pads/") return { fresh: 6 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  if (/^launcher_configurations\/\d+\/$/.test(path)) return { fresh: 24 * 60 * 60, stale: 30 * 24 * 60 * 60 };
  return { fresh: 6 * 60 * 60, stale: 14 * 24 * 60 * 60 };
}

async function ensureBudgetSchema(env) {
  if (!env.DB) return false;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS orbital_ll2_budget (
      bucket INTEGER PRIMARY KEY,
      count INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`).run();
    return true;
  } catch (error) {
    console.warn("LL2 refresh budget schema unavailable", error);
    return false;
  }
}

async function reserveUpstreamAttempt(env, now) {
  if (!env.DB) return false;
  const ready = await ensureBudgetSchema(env);
  if (!ready) return false;

  const budget = Math.min(
    60,
    Math.max(1, Number.parseInt(env.LL2_UPSTREAM_BUDGET_PER_HOUR || DEFAULT_BUDGET, 10) || DEFAULT_BUDGET)
  );
  const bucket = Math.floor(now / 3600);

  try {
    const result = await env.DB.prepare(`INSERT INTO orbital_ll2_budget (bucket, count, updated_at)
      VALUES (?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
      WHERE orbital_ll2_budget.count < ?`
    ).bind(bucket, now, budget).run();
    return Number(result?.meta?.changes || 0) > 0;
  } catch (error) {
    console.warn("LL2 scheduled budget reservation failed", error);
    return false;
  }
}

async function oldestCachedRows(env) {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare(`SELECT cache_key, updated_at, refresh_at
      FROM orbital_ll2_cache
      WHERE cache_key LIKE ?
      ORDER BY
        CASE
          WHEN cache_key LIKE '%/launches/upcoming/%' THEN 0
          WHEN cache_key LIKE '%/launches/?%' OR cache_key LIKE '%/launches/' THEN 1
          WHEN cache_key LIKE '%/agencies/%' THEN 2
          WHEN cache_key LIKE '%/pads/%' THEN 3
          ELSE 4
        END,
        updated_at ASC
      LIMIT 12`
    ).bind(`${PROD_PREFIX}%`).all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch (error) {
    console.warn("LL2 scheduled cache scan failed", error);
    return [];
  }
}

async function replaceCachedRow(env, cacheKey, status, body, contentType, now) {
  if (!env.DB) return false;
  const policy = policyForUrl(cacheKey);
  try {
    await env.DB.prepare(`UPDATE orbital_ll2_cache SET
      status = ?,
      body = ?,
      content_type = ?,
      refresh_at = ?,
      stale_until = ?,
      updated_at = ?,
      lock_until = 0
      WHERE cache_key = ?`
    ).bind(
      status,
      body,
      contentType,
      now + policy.fresh,
      now + policy.stale,
      now,
      cacheKey
    ).run();
    return true;
  } catch (error) {
    console.warn("LL2 scheduled D1 replacement failed", cacheKey, error);
    return false;
  }
}

async function purgeEdgeCopies(env, cacheKey) {
  const cache = caches.default;
  const origins = new Set([
    WORKERS_DEV_ORIGIN,
    String(env.PUBLIC_BASE_URL || "").replace(/\/+$/, "")
  ]);

  for (const origin of origins) {
    if (!origin) continue;
    try {
      const edge = new URL(`${origin}/__alba_ll2_cache__`);
      edge.searchParams.set("u", cacheKey);
      await cache.delete(new Request(edge.toString(), { method: "GET" }));
    } catch (error) {
      console.warn("LL2 scheduled edge purge failed", origin, error);
    }
  }
}

async function refreshProductionCache(env) {
  const rows = await oldestCachedRows(env);
  if (!rows.length) return { attempted: 0, updated: 0, rateLimited: false };

  let attempted = 0;
  let updated = 0;
  let rateLimited = false;
  const token = String(env.LL2_API_KEY || "").trim();

  for (const row of rows) {
    if (attempted >= MAX_REFRESHES_PER_RUN) break;
    const cacheKey = String(row?.cache_key || "");
    if (!cacheKey.startsWith(PROD_PREFIX)) continue;

    const now = Math.floor(Date.now() / 1000);
    const reserved = await reserveUpstreamAttempt(env, now);
    if (!reserved) break;
    attempted += 1;

    const headers = {
      Accept: "application/json",
      "User-Agent": "AlbaSpace-OrbitalAtlas-ScheduledRefresh/1.0 (https://albaspace.com.tr)"
    };
    if (token) headers.Authorization = `Token ${token}`;

    let response;
    try {
      response = await fetch(cacheKey, { headers });
    } catch (error) {
      console.warn("LL2 scheduled production request failed", cacheKey, error);
      continue;
    }

    if (response.status === 429) {
      rateLimited = true;
      console.log("LL2 scheduled refresh rate-limited; keeping cached fallback data");
      break;
    }

    if (!response.ok) {
      console.warn("LL2 scheduled production response", response.status, cacheKey);
      continue;
    }

    const body = await response.text();
    const contentType = response.headers.get("Content-Type") || "application/json; charset=utf-8";
    const replaced = await replaceCachedRow(env, cacheKey, response.status, body, contentType, now);
    if (!replaced) continue;

    await purgeEdgeCopies(env, cacheKey);
    updated += 1;
  }

  console.log("LL2 scheduled refresh complete", { attempted, updated, rateLimited });
  return { attempted, updated, rateLimited };
}

export default {
  async fetch(request, env, ctx) {
    return appWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    if (controller?.cron === REFRESH_CRON) {
      ctx.waitUntil(refreshProductionCache(env));
      return;
    }
    return appWorker.scheduled(controller, env, ctx);
  }
};
