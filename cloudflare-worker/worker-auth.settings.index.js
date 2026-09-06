import baseWorker, { GameRoomDO } from './worker-auth.quick.index.js';
import { isAccountSettingsRoute, handleAccountSettingsRequest } from './account-settings-backend.js';

export { GameRoomDO };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = buildCors(request, env);

    if (request.method === 'OPTIONS' && isAccountSettingsPath(url.pathname)) {
      return new Response(null, { status: 204, headers: cors });
    }

    if (isAccountSettingsRoute(url.pathname, request.method)) {
      try {
        return await handleAccountSettingsRequest(request, env, cors);
      } catch (error) {
        const status = Number(error?.status || 500);
        const code = error?.code || (status < 500 ? String(error?.message || 'request_failed') : 'Internal Server Error');
        if (status >= 500) console.error('Account settings route failed', error);
        return json({ error: code }, status, cors);
      }
    }

    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    if (typeof baseWorker.scheduled === 'function') {
      return baseWorker.scheduled(controller, env, ctx);
    }
  }
};

function isAccountSettingsPath(pathname) {
  return pathname === '/auth/account/settings'
    || pathname === '/auth/account/username'
    || pathname === '/auth/account/password'
    || pathname === '/auth/login';
}

function buildCors(request, env) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
  const origin = request.headers.get('Origin');
  const allowed = new Set();
  if (env.FRONT_ORIGIN) allowed.add(env.FRONT_ORIGIN.replace(/\/$/, ''));
  if (env.ALLOWED_ORIGINS) {
    for (const item of env.ALLOWED_ORIGINS.split(',')) {
      const value = item.trim().replace(/\/$/, '');
      if (value) allowed.add(value);
    }
  }
  if (origin && allowed.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

function json(payload, status, cors = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors }
  });
}
