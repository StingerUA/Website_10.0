import appWorker, { GameRoomDO } from './worker-with-ll2-refresh.js';
import { handlePassRequest } from './pass-backend.js';
import { handleOfflinePassRequest } from './pass-offline-backend.js';

export { GameRoomDO };

const SESSION_COOKIE = 'albaspace_session';
const OAUTH_STATE_COOKIE = 'albaspace_oauth_state';
const AUTH_TOKEN_QUERY = 'access_token';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Preserve the existing auth/session UX, but avoid SQLite INSERT OR REPLACE
    // for returning Google users. REPLACE may delete/reinsert a row and therefore
    // change users.id, which is unsafe once financial foreign keys reference it.
    if (url.pathname === '/auth/google/callback') {
      return stableGoogleCallback(request, env);
    }

    if (isPassRoute(url.pathname)) {
      const cors = buildPassCors(request, env);
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
      }
      const user = await getSessionUser(request, env);
      if (url.pathname.startsWith('/api/staff/offline/')) {
        return handleOfflinePassRequest(request, env, user, cors, handlePassRequest);
      }
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

async function stableGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state') || '';
  const oauthError = url.searchParams.get('error');
  const cookies = parseCookies(request.headers.get('Cookie'));
  const cookieState = cookies[OAUTH_STATE_COOKIE];
  const clearStateCookie = serializeCookie(OAUTH_STATE_COOKIE, '', {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 0
  });

  if (oauthError) {
    return redirect(`${env.FRONT_ORIGIN}/?login_error=${encodeURIComponent(oauthError)}`, {
      'Set-Cookie': clearStateCookie
    });
  }

  const [receivedState, ...urlParts] = stateParam.split('|');
  const returnUrl = safeReturnUrl(urlParts.join('|') || env.FRONT_ORIGIN, env);

  // Keep the current project's auth behaviour in this phase. The pre-existing
  // callback only warns on state mismatch; tightening that is a separate change.
  if (!cookieState || receivedState !== cookieState) {
    console.warn('CSRF state mismatch — cookieState:', cookieState, 'received:', receivedState);
  }

  if (!code) {
    return redirect(withLoginError(returnUrl, 'missing_google_code'), {
      'Set-Cookie': clearStateCookie
    });
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
    console.error('Token exchange error:', await tokenRes.text());
    return new Response('Failed to exchange Google code', { status: 502 });
  }

  const tokenData = await tokenRes.json();
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  if (!userRes.ok) return new Response('Failed to fetch Google profile', { status: 502 });

  const googleUser = await userRes.json();
  const googleId = String(googleUser.sub || '').trim();
  const email = String(googleUser.email || '').trim().toLowerCase();
  const name = String(googleUser.name || '').trim();
  const avatar = String(googleUser.picture || '').trim();
  if (!googleId || !email) {
    return redirect(withLoginError(returnUrl, 'invalid_google_profile'), {
      'Set-Cookie': clearStateCookie
    });
  }

  const existingByGoogle = await env.DB.prepare(
    'SELECT id, google_id, email FROM users WHERE google_id = ? LIMIT 1'
  ).bind(googleId).first();

  if (existingByGoogle) {
    // Critical for Pass/orders/payments: UPDATE preserves the existing users.id.
    await env.DB.prepare(
      'UPDATE users SET email = ?, name = ?, avatar = ? WHERE google_id = ?'
    ).bind(email, name, avatar, googleId).run();
  } else {
    const existingByEmail = await env.DB.prepare(
      'SELECT id, google_id FROM users WHERE lower(email) = ? LIMIT 1'
    ).bind(email).first();

    // Do not silently replace/link an email-password identity with Google: doing
    // so could change the primary user row and orphan financial ownership.
    if (existingByEmail && existingByEmail.google_id !== googleId) {
      console.warn('Google identity conflicts with existing AlbaSpace email account', email);
      return redirect(withLoginError(returnUrl, 'account_identity_conflict'), {
        'Set-Cookie': clearStateCookie
      });
    }

    // Match the current production insert shape for genuinely new Google users.
    await env.DB.prepare(
      'INSERT INTO users (google_id, email, name, avatar) VALUES (?, ?, ?, ?)'
    ).bind(googleId, email, name, avatar).run();
  }

  const sessionId = randomToken();
  const sessionTtl = Number(env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    'INSERT INTO sessions (id, user_google_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, googleId, now + sessionTtl).run();

  return redirect(withAuthToken(returnUrl, sessionId), {
    'Set-Cookie': [
      serializeCookie(SESSION_COOKIE, sessionId, {
        httpOnly: true, secure: true, sameSite: 'None', path: '/', maxAge: sessionTtl
      }),
      clearStateCookie
    ]
  });
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

function serializeCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join('; ');
}

function redirect(location, extraHeaders = {}) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  const cookies = extraHeaders['Set-Cookie'];
  if (Array.isArray(cookies)) {
    for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  } else if (cookies) {
    headers.append('Set-Cookie', cookies);
  }
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (key.toLowerCase() !== 'set-cookie') headers.set(key, value);
  }
  return new Response(null, { status: 302, headers });
}

function safeReturnUrl(value, env) {
  const fallback = env.FRONT_ORIGIN || 'https://albaspace.com.tr';
  try {
    const target = new URL(value || fallback);
    const allowed = new Set([
      new URL(fallback).origin,
      ...(env.ALLOWED_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean).map(item => new URL(item).origin)
    ]);
    return allowed.has(target.origin) ? target.toString() : fallback;
  } catch {
    return fallback;
  }
}

function withAuthToken(value, token) {
  const target = new URL(value);
  const fragment = target.hash.replace(/^#/, '');
  const rest = fragment ? `&${fragment}` : '';
  target.hash = `${AUTH_TOKEN_QUERY}=${encodeURIComponent(token)}${rest}`;
  return target.toString();
}

function withLoginError(value, error) {
  const target = new URL(value);
  target.searchParams.set('login_error', error);
  return target.toString();
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
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
