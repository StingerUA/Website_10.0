const SESSION_COOKIE = 'albaspace_session';
const OAUTH_STATE_COOKIE = 'albaspace_oauth_state';
const AUTH_TOKEN_QUERY = 'access_token';
const LINK_TTL_SECONDS = 10 * 60;
const QUICK_PREFIX = 'Uzaydash-';

export function isQuickAuthRoute(pathname, method) {
  if (pathname === '/auth/quick-account' && method === 'POST') return true;
  if (pathname === '/auth/quick-account/status' && method === 'GET') return true;
  if (pathname === '/auth/google/link/start' && method === 'POST') return true;
  if (pathname === '/auth/login' && method === 'POST') return true;
  return false;
}

export async function handleQuickAuthRequest(request, env, cors) {
  const url = new URL(request.url);
  if (url.pathname === '/auth/quick-account' && request.method === 'POST') {
    return createQuickAccount(request, env, cors);
  }
  if (url.pathname === '/auth/quick-account/status' && request.method === 'GET') {
    return quickAccountStatus(request, env, cors);
  }
  if (url.pathname === '/auth/google/link/start' && request.method === 'POST') {
    return startGoogleLink(request, env, cors);
  }
  if (url.pathname === '/auth/login' && request.method === 'POST') {
    return universalLogin(request, env, cors);
  }
  return json({ error: 'Not found' }, 404, cors);
}

export async function getGoogleLinkIntent(env, state) {
  const token = String(state || '').trim();
  if (!token || !env.DB) return null;
  try {
    const now = Math.floor(Date.now() / 1000);
    return await env.DB.prepare(`
      SELECT state, user_id, return_url, expires_at
      FROM google_link_intents
      WHERE state = ? AND expires_at > ?
      LIMIT 1
    `).bind(token, now).first();
  } catch (error) {
    if (isMissingQuickSchema(error)) return null;
    throw error;
  }
}

export async function deleteGoogleLinkIntent(env, state) {
  if (!state || !env.DB) return;
  try {
    await env.DB.prepare('DELETE FROM google_link_intents WHERE state = ?').bind(state).run();
  } catch (error) {
    if (!isMissingQuickSchema(error)) throw error;
  }
}

export async function completeGoogleLink(env, intent, googleUser) {
  const now = Math.floor(Date.now() / 1000);
  const userId = intent?.user_id;
  const googleId = String(googleUser?.sub || '').trim();
  const email = String(googleUser?.email || '').trim().toLowerCase();
  const name = String(googleUser?.name || '').trim();
  const googleAvatar = String(googleUser?.picture || '').trim();
  if (!userId || !googleId || !email) {
    throw authError('invalid_google_profile', 400);
  }

  const row = await env.DB.prepare(`
    SELECT u.id, u.google_id, u.email, u.name, u.avatar, qa.username, qa.linked_at
    FROM quick_accounts qa
    JOIN users u ON u.id = qa.user_id
    WHERE qa.user_id = ?
    LIMIT 1
  `).bind(userId).first();
  if (!row) throw authError('quick_account_not_found', 404);
  if (row.linked_at || !String(row.google_id || '').startsWith('guest:') || String(row.email || '').trim()) {
    throw authError('quick_account_already_linked', 409);
  }

  const existingGoogle = await env.DB.prepare(
    'SELECT id FROM users WHERE google_id = ? AND id <> ? LIMIT 1'
  ).bind(googleId, userId).first();
  if (existingGoogle) throw authError('google_account_already_used', 409);

  const existingEmail = await env.DB.prepare(
    'SELECT id FROM users WHERE lower(email) = ? AND id <> ? LIMIT 1'
  ).bind(email, userId).first();
  if (existingEmail) throw authError('google_email_already_used', 409);

  const oldGoogleId = String(row.google_id);
  const avatar = isManagedAvatar(row.avatar) ? row.avatar : googleAvatar;

  try {
    await env.DB.batch([
      env.DB.prepare(
        'UPDATE users SET google_id = ?, email = ?, name = ?, avatar = ? WHERE id = ? AND google_id = ?'
      ).bind(googleId, email, name || row.username || row.name || email, avatar, userId, oldGoogleId),
      env.DB.prepare(
        'UPDATE sessions SET user_google_id = ? WHERE user_google_id = ?'
      ).bind(googleId, oldGoogleId),
      env.DB.prepare(
        'UPDATE quick_accounts SET linked_at = ? WHERE user_id = ?'
      ).bind(now, userId),
      env.DB.prepare(
        'DELETE FROM google_link_intents WHERE state = ?'
      ).bind(intent.state)
    ]);
  } catch (error) {
    if (/unique|constraint/i.test(String(error?.message || error))) {
      throw authError('google_identity_conflict', 409);
    }
    throw error;
  }

  await audit(env, 'account_google_linked', userId, {
    quick_username: row.username,
    email,
    google_id_suffix: googleId.slice(-6)
  });

  return { user_id: userId, google_id: googleId, email, name: name || row.username || email, avatar };
}

async function createQuickAccount(request, env, cors) {
  await assertQuickSchema(env);
  const existingUser = await getSessionUser(request, env);
  if (existingUser) return json({ error: 'already_logged_in', user: existingUser }, 409, cors);

  const now = Math.floor(Date.now() / 1000);
  const guestGoogleId = `guest:${crypto.randomUUID()}`;
  const password = randomPassword(18);
  const passwordHash = await hashPassword(password);

  const userInsert = await env.DB.prepare(
    "INSERT INTO users (google_id, email, name, avatar, password_hash) VALUES (?, '', 'Uzaydash', '', ?)"
  ).bind(guestGoogleId, passwordHash).run();
  let userId = userInsert?.meta?.last_row_id;
  if (userId === undefined || userId === null) {
    userId = (await env.DB.prepare('SELECT id FROM users WHERE google_id = ? LIMIT 1').bind(guestGoogleId).first())?.id;
  }
  if (userId === undefined || userId === null) throw new Error('Unable to create quick account user');

  let accountNo;
  try {
    const quickInsert = await env.DB.prepare(
      'INSERT INTO quick_accounts (user_id, username, created_at, linked_at) VALUES (?, NULL, ?, NULL)'
    ).bind(userId, now).run();
    accountNo = quickInsert?.meta?.last_row_id;
    if (accountNo === undefined || accountNo === null) {
      accountNo = (await env.DB.prepare('SELECT account_no FROM quick_accounts WHERE user_id = ? LIMIT 1').bind(userId).first())?.account_no;
    }
    if (!accountNo) throw new Error('Unable to allocate Uzaydash number');
  } catch (error) {
    await env.DB.prepare('DELETE FROM users WHERE id = ? AND google_id = ?').bind(userId, guestGoogleId).run().catch(() => {});
    throw error;
  }

  const username = `${QUICK_PREFIX}${accountNo}`;
  await env.DB.batch([
    env.DB.prepare('UPDATE quick_accounts SET username = ? WHERE user_id = ?').bind(username, userId),
    env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(username, userId)
  ]);

  const session = await createSession(env, guestGoogleId);
  await audit(env, 'quick_account_created', userId, { username, account_no: Number(accountNo) });

  return json({
    ok: true,
    token: session.id,
    credentials: { username, password },
    user: {
      id: userId,
      google_id: guestGoogleId,
      email: '',
      name: username,
      avatar: '',
      account_kind: 'quick',
      quick_username: username,
      google_linked: false,
      can_link_google: true
    }
  }, 200, cors, sessionCookie(session.id, session.ttl));
}

async function quickAccountStatus(request, env, cors) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Not logged in' }, 401, cors);
  try {
    const row = await env.DB.prepare(`
      SELECT qa.username, qa.created_at, qa.linked_at, u.email, u.google_id
      FROM quick_accounts qa
      JOIN users u ON u.id = qa.user_id
      WHERE qa.user_id = ?
      LIMIT 1
    `).bind(user.id).first();
    if (!row) return json({ is_quick: false, can_link_google: false }, 200, cors);
    const linked = !!row.linked_at || !String(row.google_id || '').startsWith('guest:');
    return json({
      is_quick: true,
      username: row.username,
      google_linked: linked,
      can_link_google: !linked && !String(row.email || '').trim(),
      has_email: !!String(row.email || '').trim(),
      created_at: row.created_at
    }, 200, cors);
  } catch (error) {
    if (isMissingQuickSchema(error)) return json({ is_quick: false, can_link_google: false }, 200, cors);
    throw error;
  }
}

async function startGoogleLink(request, env, cors) {
  await assertQuickSchema(env);
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Not logged in' }, 401, cors);

  const row = await env.DB.prepare(`
    SELECT qa.username, qa.linked_at, u.email, u.google_id
    FROM quick_accounts qa
    JOIN users u ON u.id = qa.user_id
    WHERE qa.user_id = ?
    LIMIT 1
  `).bind(user.id).first();
  if (!row) return json({ error: 'not_quick_account' }, 409, cors);
  if (row.linked_at || !String(row.google_id || '').startsWith('guest:') || String(row.email || '').trim()) {
    return json({ error: 'quick_account_already_linked' }, 409, cors);
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const returnUrl = safeReturnUrl(body.from || env.FRONT_ORIGIN, env);
  const state = randomToken();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare('DELETE FROM google_link_intents WHERE expires_at <= ?').bind(now).run();
  await env.DB.prepare(
    'INSERT INTO google_link_intents (state, user_id, return_url, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(state, user.id, returnUrl, now + LINK_TTL_SECONDS, now).run();

  const redirectUri = `${env.PUBLIC_BASE_URL}/auth/google/callback`;
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    + `?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + '&response_type=code&scope=openid%20email%20profile'
    + '&prompt=select_account'
    + `&state=${encodeURIComponent(state)}`;

  return json({ ok: true, auth_url: authUrl }, 200, cors,
    serializeCookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: LINK_TTL_SECONDS
    })
  );
}

async function universalLogin(request, env, cors) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const identifier = String(body.email || body.login || body.username || '').trim();
  const password = String(body.password || '');
  if (!identifier || !password) return json({ error: 'E-posta / Uzaydash ve şifre gereklidir.' }, 400, cors);

  let user;
  if (/^uzaydash-\d+$/i.test(identifier)) {
    try {
      user = await env.DB.prepare(`
        SELECT u.id, u.google_id, u.email, u.name, u.avatar, u.password_hash, qa.username
        FROM quick_accounts qa
        JOIN users u ON u.id = qa.user_id
        WHERE lower(qa.username) = lower(?)
        LIMIT 1
      `).bind(identifier).first();
    } catch (error) {
      if (!isMissingQuickSchema(error)) throw error;
    }
  } else {
    user = await env.DB.prepare(
      'SELECT id, google_id, email, name, avatar, password_hash FROM users WHERE lower(email) = lower(?) LIMIT 1'
    ).bind(identifier).first();
  }

  if (!user || !user.password_hash) return json({ error: 'E-posta / Uzaydash veya şifre hatalı.' }, 401, cors);
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return json({ error: 'E-posta / Uzaydash veya şifre hatalı.' }, 401, cors);

  const session = await createSession(env, user.google_id);
  return json({
    ok: true,
    token: session.id,
    user: { email: user.email || '', name: user.name || user.username || identifier, avatar: user.avatar || '' }
  }, 200, cors, sessionCookie(session.id, session.ttl));
}

async function createSession(env, googleId) {
  const id = randomToken();
  const ttl = Number(env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO sessions (id, user_google_id, expires_at) VALUES (?, ?, ?)'
  ).bind(id, googleId, now + ttl).run();
  return { id, ttl };
}

function sessionCookie(id, ttl) {
  return serializeCookie(SESSION_COOKIE, id, {
    httpOnly: true, secure: true, sameSite: 'None', path: '/', maxAge: ttl
  });
}

async function getSessionUser(request, env) {
  const sessionId = getSessionToken(request);
  if (!sessionId || !env.DB) return null;
  const now = Math.floor(Date.now() / 1000);
  return await env.DB.prepare(`
    SELECT u.id, u.google_id, u.email, u.name, u.avatar
    FROM sessions s
    JOIN users u ON u.google_id = s.user_google_id
    WHERE s.id = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(sessionId, now).first();
}

function getSessionToken(request) {
  const authorization = request.headers.get('Authorization') || '';
  const bearer = authorization.match(/^Bearer\s+([^\s]+)$/i)?.[1] || '';
  if (bearer) return bearer;
  const cookies = parseCookies(request.headers.get('Cookie'));
  return cookies[SESSION_COOKIE] || new URL(request.url).searchParams.get(AUTH_TOKEN_QUERY) || '';
}

async function assertQuickSchema(env) {
  try {
    await env.DB.prepare('SELECT account_no FROM quick_accounts LIMIT 1').first();
    await env.DB.prepare('SELECT state FROM google_link_intents LIMIT 1').first();
  } catch (error) {
    if (isMissingQuickSchema(error)) throw authError('quick_account_schema_missing', 503);
    throw error;
  }
}

function isMissingQuickSchema(error) {
  return /no such table:\s*(quick_accounts|google_link_intents)/i.test(String(error?.message || error));
}

function isManagedAvatar(value) {
  try {
    return new URL(String(value || '')).pathname.startsWith('/avatar/');
  } catch {
    return false;
  }
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

function randomPassword(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Url(bytes);
}

function base64Url(bytes) {
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, keyMat, 256
  );
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || '').split(':');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const saltHex = parts[1];
  const hashHex = parts[2];
  const pairs = saltHex.match(/.{2}/g);
  if (!pairs) return false;
  const salt = Uint8Array.from(pairs.map(h => parseInt(h, 16)));
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, keyMat, 256
  );
  const newHash = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(newHash, hashHex);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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

function json(payload, status, cors = {}, setCookie = '') {
  const headers = new Headers(cors);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(JSON.stringify(payload), { status, headers });
}

function authError(code, status) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  return error;
}

async function audit(env, eventType, userId, payload) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_log (event_type, actor_user_id, target_type, target_id, payload_json, created_at)
      VALUES (?, ?, 'user', ?, ?, ?)
    `).bind(eventType, userId, String(userId), JSON.stringify(payload || {}), Math.floor(Date.now() / 1000)).run();
  } catch (error) {
    console.warn('Quick account audit skipped', error);
  }
}
