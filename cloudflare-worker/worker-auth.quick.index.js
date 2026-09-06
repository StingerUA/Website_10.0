import baseWorker, { GameRoomDO } from './worker-auth.reset.index.js';
import {
  isQuickAuthRoute,
  handleQuickAuthRequest,
  getGoogleLinkIntent,
  deleteGoogleLinkIntent,
  completeGoogleLink
} from './quick-account-backend.js';

export { GameRoomDO };

const OAUTH_STATE_COOKIE = 'albaspace_oauth_state';
const SESSION_COOKIE = 'albaspace_session';
const AUTH_TOKEN_QUERY = 'access_token';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = buildCors(request, env);

    if (request.method === 'OPTIONS' && isQuickPath(url.pathname)) {
      return new Response(null, { status: 204, headers: cors });
    }

    if (isQuickAuthRoute(url.pathname, request.method)) {
      try {
        return await handleQuickAuthRequest(request, env, cors);
      } catch (error) {
        const status = Number(error?.status || 500);
        const code = error?.code || (status < 500 ? String(error?.message || 'request_failed') : 'Internal Server Error');
        if (status >= 500) console.error('Quick account route failed', error);
        return json({ error: code }, status, cors);
      }
    }

    if (url.pathname === '/auth/google/callback') {
      const state = url.searchParams.get('state') || '';
      let intent = null;
      try { intent = await getGoogleLinkIntent(env, state); }
      catch (error) { console.error('Google link intent lookup failed', error); }
      if (intent) return handleGoogleLinkCallback(request, env, cors, intent);
    }

    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    if (typeof baseWorker.scheduled === 'function') {
      return baseWorker.scheduled(controller, env, ctx);
    }
  }
};

function isQuickPath(pathname) {
  return pathname === '/auth/quick-account'
    || pathname === '/auth/quick-account/status'
    || pathname === '/auth/google/link/start'
    || pathname === '/auth/login';
}

async function handleGoogleLinkCallback(request, env, cors, intent) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  const state = url.searchParams.get('state') || '';
  const cookies = parseCookies(request.headers.get('Cookie'));
  const cookieState = cookies[OAUTH_STATE_COOKIE];
  const returnUrl = safeReturnUrl(intent.return_url, env);
  const clearStateCookie = serializeCookie(OAUTH_STATE_COOKIE, '', {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 0
  });

  if (oauthError) {
    await deleteGoogleLinkIntent(env, state).catch(() => {});
    return redirect(withQuery(returnUrl, 'google_link_error', oauthError), { 'Set-Cookie': clearStateCookie });
  }

  // Linking changes account identity, so unlike the legacy normal-login callback
  // this path requires an exact OAuth state-cookie match.
  if (!cookieState || state !== cookieState || state !== intent.state) {
    await deleteGoogleLinkIntent(env, state).catch(() => {});
    return redirect(withQuery(returnUrl, 'google_link_error', 'state_mismatch'), { 'Set-Cookie': clearStateCookie });
  }
  if (!code) {
    await deleteGoogleLinkIntent(env, state).catch(() => {});
    return redirect(withQuery(returnUrl, 'google_link_error', 'missing_google_code'), { 'Set-Cookie': clearStateCookie });
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.PUBLIC_BASE_URL}/auth/google/callback`,
      grant_type: 'authorization_code'
    })
  });
  if (!tokenRes.ok) {
    console.error('Google link token exchange error:', await tokenRes.text());
    await deleteGoogleLinkIntent(env, state).catch(() => {});
    return redirect(withQuery(returnUrl, 'google_link_error', 'token_exchange_failed'), { 'Set-Cookie': clearStateCookie });
  }

  const tokenData = await tokenRes.json();
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  if (!userRes.ok) {
    await deleteGoogleLinkIntent(env, state).catch(() => {});
    return redirect(withQuery(returnUrl, 'google_link_error', 'google_profile_failed'), { 'Set-Cookie': clearStateCookie });
  }

  const googleUser = await userRes.json();
  let linked;
  try {
    linked = await completeGoogleLink(env, intent, googleUser);
  } catch (error) {
    await deleteGoogleLinkIntent(env, state).catch(() => {});
    const codeValue = error?.code || 'google_link_failed';
    return redirect(withQuery(returnUrl, 'google_link_error', codeValue), { 'Set-Cookie': clearStateCookie });
  }

  const sessionId = randomToken();
  const sessionTtl = Number(env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO sessions (id, user_google_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, linked.google_id, now + sessionTtl).run();

  const successUrl = withAuthToken(withQuery(returnUrl, 'google_linked', '1'), sessionId);
  return redirect(successUrl, {
    'Set-Cookie': [
      serializeCookie(SESSION_COOKIE, sessionId, {
        httpOnly: true, secure: true, sameSite: 'None', path: '/', maxAge: sessionTtl
      }),
      clearStateCookie
    ]
  });
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

function safeReturnUrl(value, env) {
  const fallback = env.FRONT_ORIGIN || 'https://albaspace.com.tr';
  try {
    const target = new URL(value || fallback);
    const allowed = new Set([
      new URL(fallback).origin,
      ...(env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean).map(v => new URL(v).origin)
    ]);
    return allowed.has(target.origin) ? target.toString() : fallback;
  } catch {
    return fallback;
  }
}

function withQuery(value, key, val) {
  const target = new URL(value);
  target.searchParams.set(key, val);
  return target.toString();
}

function withAuthToken(value, token) {
  const target = new URL(value);
  const fragment = target.hash.replace(/^#/, '');
  const rest = fragment ? `&${fragment}` : '';
  target.hash = `${AUTH_TOKEN_QUERY}=${encodeURIComponent(token)}${rest}`;
  return target.toString();
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  }
  return out;
}

function serializeCookie(name, value, options = {}) {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (options.maxAge !== undefined) str += `; Max-Age=${options.maxAge}`;
  if (options.path) str += `; Path=${options.path}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  return str;
}

function redirect(location, extraHeaders = {}) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (Array.isArray(value)) value.forEach(v => headers.append(key, v));
    else headers.set(key, value);
  }
  return new Response(null, { status: 302, headers });
}

function json(payload, status, cors = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors }
  });
}
