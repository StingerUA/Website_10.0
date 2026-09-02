import appWorker, { GameRoomDO } from './worker-with-ll2-refresh.js';
import { handlePassRequest } from './pass-backend.js';

export { GameRoomDO };

const SESSION_COOKIE = 'albaspace_session';
const AUTH_TOKEN_QUERY = 'access_token';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (isPassRoute(url.pathname)) {
      const cors = buildPassCors(request, env);
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
      }
      const user = await getSessionUser(request, env);
      return handlePassRequest(request, env, user, cors);
    }
    return appWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    if (typeof appWorker.scheduled === 'function') {
      return appWorker.scheduled(controller, env, ctx);
    }
  }
};

function isPassRoute(pathname) {
  return pathname.startsWith('/api/pass/')
    || pathname.startsWith('/api/staff/')
    || pathname.startsWith('/api/admin/pass/');
}

async function getSessionUser(request, env) {
  const sessionId = getSessionToken(request);
  if (!sessionId || !env.DB) return null;
  const now = Math.floor(Date.now() / 1000);
  try {
    return await env.DB.prepare(`
      SELECT u.id, u.google_id, u.email, u.name, u.avatar
      FROM sessions s
      JOIN users u ON u.google_id = s.user_google_id
      WHERE s.id = ? AND s.expires_at > ?
      LIMIT 1
    `).bind(sessionId, now).first();
  } catch (error) {
    console.warn('Pass session lookup failed', error);
    return null;
  }
}

function getSessionToken(request) {
  const authorization = request.headers.get('Authorization') || '';
  const bearer = authorization.match(/^Bearer\s+([^\s]+)$/i)?.[1] || '';
  if (bearer) return bearer;
  const cookies = parseCookies(request.headers.get('Cookie'));
  if (cookies[SESSION_COOKIE]) return cookies[SESSION_COOKIE];
  try {
    return new URL(request.url).searchParams.get(AUTH_TOKEN_QUERY) || '';
  } catch {
    return '';
  }
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try { out[key] = decodeURIComponent(value); }
    catch { out[key] = value; }
  }
  return out;
}

function buildPassCors(request, env) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  const origin = request.headers.get('Origin');
  const allowed = new Set();
  if (env.FRONT_ORIGIN) allowed.add(String(env.FRONT_ORIGIN).replace(/\/$/, ''));
  if (env.ALLOWED_ORIGINS) {
    for (const raw of String(env.ALLOWED_ORIGINS).split(',')) {
      const value = raw.trim().replace(/\/$/, '');
      if (value) allowed.add(value);
    }
  }
  if (origin && allowed.has(origin.replace(/\/$/, ''))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}
