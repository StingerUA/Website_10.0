const SESSION_COOKIE = 'albaspace_session';
const AUTH_TOKEN_QUERY = 'access_token';

export function isAccountSettingsRoute(pathname, method) {
  if (pathname === '/auth/account/settings' && method === 'GET') return true;
  if (pathname === '/auth/account/username' && method === 'POST') return true;
  if (pathname === '/auth/account/password' && method === 'POST') return true;
  if (pathname === '/auth/login' && method === 'POST') return true;
  return false;
}

export async function handleAccountSettingsRequest(request, env, cors) {
  const url = new URL(request.url);
  if (url.pathname === '/auth/account/settings' && request.method === 'GET') {
    return settingsStatus(request, env, cors);
  }
  if (url.pathname === '/auth/account/username' && request.method === 'POST') {
    return changeUsername(request, env, cors);
  }
  if (url.pathname === '/auth/account/password' && request.method === 'POST') {
    return changePassword(request, env, cors);
  }
  if (url.pathname === '/auth/login' && request.method === 'POST') {
    return universalLogin(request, env, cors);
  }
  return json({ error: 'Not found' }, 404, cors);
}

async function settingsStatus(request, env, cors) {
  const user = await getSessionUserWithPassword(request, env);
  if (!user) return json({ error: 'Not logged in' }, 401, cors);
  await assertSettingsSchema(env);

  const local = await env.DB.prepare(
    'SELECT username, created_at, updated_at FROM local_usernames WHERE user_id = ? LIMIT 1'
  ).bind(user.id).first();
  const quick = await env.DB.prepare(
    'SELECT username, linked_at FROM quick_accounts WHERE user_id = ? LIMIT 1'
  ).bind(user.id).first();

  const hasPassword = !!String(user.password_hash || '');
  const emailIdentity = String(user.google_id || '').startsWith('email:');
  const isQuick = !!quick;
  const canChangeLogin = hasPassword && (emailIdentity || isQuick);
  const googleLinked = !!user.email && !emailIdentity && !String(user.google_id || '').startsWith('guest:');
  const username = local?.username || quick?.username || '';

  return json({
    ok: true,
    user: {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      username,
      current_login: username || user.email || '',
      account_kind: isQuick ? 'quick' : (emailIdentity ? 'email' : 'google'),
      google_linked: googleLinked,
      has_local_password: hasPassword,
      can_change_login: canChangeLogin,
      can_change_password: hasPassword
    }
  }, 200, cors);
}

async function changeUsername(request, env, cors) {
  await assertSettingsSchema(env);
  const user = await getSessionUserWithPassword(request, env);
  if (!user) return json({ error: 'Not logged in' }, 401, cors);

  const quick = await env.DB.prepare(
    'SELECT username FROM quick_accounts WHERE user_id = ? LIMIT 1'
  ).bind(user.id).first();
  const emailIdentity = String(user.google_id || '').startsWith('email:');
  if (!user.password_hash || (!quick && !emailIdentity)) {
    return json({ error: 'login_change_not_available' }, 403, cors);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const currentPassword = String(body.current_password || '');
  const nextUsername = normalizeUsername(body.username);
  if (!currentPassword) return json({ error: 'current_password_required' }, 400, cors);
  if (!validUsername(nextUsername)) return json({ error: 'invalid_username' }, 400, cors);

  const currentLocal = await env.DB.prepare(
    'SELECT username FROM local_usernames WHERE user_id = ? LIMIT 1'
  ).bind(user.id).first();
  const oldUsername = currentLocal?.username || quick?.username || '';
  if (oldUsername && oldUsername.toLowerCase() === nextUsername.toLowerCase()) {
    return json({ ok: true, username: oldUsername, unchanged: true }, 200, cors);
  }

  if (/^uzaydash-\d+$/i.test(nextUsername)) {
    return json({ error: 'reserved_username' }, 400, cors);
  }

  const passwordOk = await verifyPassword(currentPassword, user.password_hash);
  if (!passwordOk) return json({ error: 'current_password_invalid' }, 401, cors);

  const conflictLocal = await env.DB.prepare(
    'SELECT user_id FROM local_usernames WHERE lower(username) = lower(?) AND user_id <> ? LIMIT 1'
  ).bind(nextUsername, user.id).first();
  if (conflictLocal) return json({ error: 'username_taken' }, 409, cors);

  const conflictQuick = await env.DB.prepare(
    'SELECT user_id FROM quick_accounts WHERE lower(username) = lower(?) AND user_id <> ? LIMIT 1'
  ).bind(nextUsername, user.id).first();
  if (conflictQuick) return json({ error: 'username_taken' }, 409, cors);

  const now = Math.floor(Date.now() / 1000);
  try {
    if (quick) {
      await env.DB.prepare(
        'UPDATE quick_accounts SET username = ? WHERE user_id = ?'
      ).bind(nextUsername, user.id).run();
      if (oldUsername && String(user.name || '') === oldUsername) {
        await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(nextUsername, user.id).run();
      }
    } else {
      await env.DB.prepare(`
        INSERT INTO local_usernames (user_id, username, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET username = excluded.username, updated_at = excluded.updated_at
      `).bind(user.id, nextUsername, now, now).run();
    }
  } catch (error) {
    if (/unique|constraint/i.test(String(error?.message || error))) {
      return json({ error: 'username_taken' }, 409, cors);
    }
    throw error;
  }

  await audit(env, 'account_username_changed', user.id, {
    old_username: oldUsername || null,
    new_username: nextUsername
  });

  return json({ ok: true, username: nextUsername }, 200, cors);
}

async function changePassword(request, env, cors) {
  const user = await getSessionUserWithPassword(request, env);
  if (!user) return json({ error: 'Not logged in' }, 401, cors);
  if (!user.password_hash) return json({ error: 'password_change_not_available' }, 403, cors);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const currentPassword = String(body.current_password || '');
  const nextPassword = String(body.new_password || '');
  if (!currentPassword) return json({ error: 'current_password_required' }, 400, cors);
  if (nextPassword.length < 8 || nextPassword.length > 128) {
    return json({ error: 'invalid_new_password' }, 400, cors);
  }
  if (currentPassword === nextPassword) return json({ error: 'password_must_change' }, 400, cors);

  const passwordOk = await verifyPassword(currentPassword, user.password_hash);
  if (!passwordOk) return json({ error: 'current_password_invalid' }, 401, cors);

  const passwordHash = await hashPassword(nextPassword);
  const sessionId = getSessionToken(request);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_google_id = ? AND id <> ?').bind(user.google_id, sessionId || '')
  ]);

  await audit(env, 'account_password_changed', user.id, {});
  return json({ ok: true }, 200, cors);
}

async function universalLogin(request, env, cors) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const identifier = String(body.email || body.login || body.username || '').trim();
  const password = String(body.password || '');
  if (!identifier || !password) return json({ error: 'login_and_password_required' }, 400, cors);

  let user = null;
  try {
    user = await env.DB.prepare(`
      SELECT u.id, u.google_id, u.email, u.name, u.avatar, u.password_hash, lu.username
      FROM local_usernames lu
      JOIN users u ON u.id = lu.user_id
      WHERE lower(lu.username) = lower(?)
      LIMIT 1
    `).bind(identifier).first();
  } catch (error) {
    if (!isMissingSettingsSchema(error)) throw error;
  }

  if (!user) {
    try {
      user = await env.DB.prepare(`
        SELECT u.id, u.google_id, u.email, u.name, u.avatar, u.password_hash, qa.username
        FROM quick_accounts qa
        JOIN users u ON u.id = qa.user_id
        WHERE lower(qa.username) = lower(?)
        LIMIT 1
      `).bind(identifier).first();
    } catch {}
  }

  if (!user) {
    user = await env.DB.prepare(
      'SELECT id, google_id, email, name, avatar, password_hash FROM users WHERE lower(email) = lower(?) LIMIT 1'
    ).bind(identifier).first();
  }

  if (!user || !user.password_hash) return json({ error: 'invalid_login_or_password' }, 401, cors);
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return json({ error: 'invalid_login_or_password' }, 401, cors);

  const session = await createSession(env, user.google_id);
  return json({
    ok: true,
    token: session.id,
    user: {
      email: user.email || '',
      name: user.name || user.username || identifier,
      avatar: user.avatar || ''
    }
  }, 200, cors, sessionCookie(session.id, session.ttl));
}

function normalizeUsername(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function validUsername(value) {
  if (value.length < 3 || value.length > 32 || value.includes('@') || value.includes(' ')) return false;
  return /^[\p{L}\p{N}](?:[\p{L}\p{N}._-]{1,30})[\p{L}\p{N}]$/u.test(value);
}

async function getSessionUserWithPassword(request, env) {
  const sessionId = getSessionToken(request);
  if (!sessionId || !env.DB) return null;
  const now = Math.floor(Date.now() / 1000);
  return await env.DB.prepare(`
    SELECT u.id, u.google_id, u.email, u.name, u.avatar, u.password_hash
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

async function assertSettingsSchema(env) {
  try {
    await env.DB.prepare('SELECT user_id FROM local_usernames LIMIT 1').first();
  } catch (error) {
    if (isMissingSettingsSchema(error)) throw authError('account_settings_schema_missing', 503);
    throw error;
  }
}

function isMissingSettingsSchema(error) {
  return /no such table:\s*local_usernames/i.test(String(error?.message || error));
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
  const chunks = saltHex.match(/.{2}/g);
  if (!chunks) return false;
  const salt = Uint8Array.from(chunks.map(h => parseInt(h, 16)));
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

async function audit(env, eventType, userId, payload) {
  if (!env.DB) return;
  try {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(`
      INSERT INTO audit_log (event_type, actor_user_id, target_type, target_id, payload_json, created_at)
      VALUES (?, ?, 'user', ?, ?, ?)
    `).bind(eventType, userId, String(userId), JSON.stringify(payload || {}), now).run();
  } catch (error) {
    console.warn('Account settings audit failed', error);
  }
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

function authError(code, status) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  return error;
}

function json(payload, status, cors = {}, setCookie = null) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  for (const [key, value] of Object.entries(cors || {})) headers.set(key, value);
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(JSON.stringify(payload), { status, headers });
}
