const RESET_PATHS = new Set(['/auth/forgot-password', '/auth/reset-password']);
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function handlePasswordResetRequest(request, env) {
  const url = new URL(request.url);
  if (!RESET_PATHS.has(url.pathname)) return null;

  const cors = buildCors(request, env);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405, cors);
  }

  if (url.pathname === '/auth/forgot-password') {
    return requestPasswordReset(request, env, cors);
  }
  return resetPassword(request, env, cors);
}

async function requestPasswordReset(request, env, cors) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const email = String(body.email || '').trim().toLowerCase();
  const lang = normalizeLang(body.lang);
  const messages = copyFor(lang);
  const genericResponse = () => json({ ok: true, message: messages.requested }, 200, cors);

  // Always use the same success response for unknown/Google-only accounts.
  // This prevents the endpoint from becoming an account-enumeration oracle.
  if (!isEmail(email)) return genericResponse();

  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipKey = 'forgot:ip:' + await sha256Hex(ip);
  const emailKey = 'forgot:email:' + await sha256Hex(email);

  const ipAllowed = await consumeRateLimit(env, ipKey, 5, 15 * 60, now);
  const emailAllowed = await consumeRateLimit(env, emailKey, 3, 60 * 60, now);
  if (!ipAllowed || !emailAllowed) {
    return json({ ok: false, error: messages.tooMany }, 429, cors);
  }

  const user = await env.DB.prepare(
    'SELECT google_id, email, name, password_hash FROM users WHERE email = ? LIMIT 1'
  ).bind(email).first();

  if (!user || !user.password_hash) return genericResponse();

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const tokenId = randomToken();
  const ttl = Math.max(300, Math.min(Number(env.PASSWORD_RESET_TTL_SECONDS || 1800), 7200));
  const expiresAt = now + ttl;

  await env.DB.batch([
    env.DB.prepare(
      'UPDATE password_reset_tokens SET used_at = ? WHERE user_google_id = ? AND used_at IS NULL'
    ).bind(now, user.google_id),
    env.DB.prepare(
      `INSERT INTO password_reset_tokens
       (id, user_google_id, email, token_hash, expires_at, used_at, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`
    ).bind(tokenId, user.google_id, user.email, tokenHash, expiresAt, now)
  ]);

  const resetUrl = buildResetUrl(env, token, lang);

  try {
    await sendResetEmail(env, {
      email: user.email,
      name: user.name || '',
      resetUrl,
      lang,
      idempotencyKey: `password-reset/${tokenId}`
    });
  } catch (error) {
    console.error('Password reset email failed:', error);
    // Do not expose whether this email exists. Invalidate the token because no
    // usable message was delivered, then return the generic response.
    await env.DB.prepare(
      'UPDATE password_reset_tokens SET used_at = ? WHERE id = ?'
    ).bind(now, tokenId).run();
  }

  return genericResponse();
}

async function resetPassword(request, env, cors) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, cors); }

  const lang = normalizeLang(body.lang);
  const messages = copyFor(lang);
  const token = String(body.token || '').trim().toLowerCase();
  const password = String(body.password || '');
  const now = Math.floor(Date.now() / 1000);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipKey = 'reset:ip:' + await sha256Hex(ip);
  if (!(await consumeRateLimit(env, ipKey, 10, 15 * 60, now))) {
    return json({ ok: false, error: messages.tooMany }, 429, cors);
  }

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return json({ ok: false, error: messages.invalidToken }, 400, cors);
  }
  if (password.length < 8) {
    return json({ ok: false, error: messages.shortPassword }, 400, cors);
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT id, user_google_id, email, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = ?
     LIMIT 1`
  ).bind(tokenHash).first();

  if (!row || row.used_at || Number(row.expires_at) <= now) {
    return json({ ok: false, error: messages.invalidToken }, 400, cors);
  }

  const passwordHash = await hashPassword(password);

  await env.DB.batch([
    env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE google_id = ?'
    ).bind(passwordHash, row.user_google_id),
    env.DB.prepare(
      'UPDATE password_reset_tokens SET used_at = ? WHERE user_google_id = ? AND used_at IS NULL'
    ).bind(now, row.user_google_id),
    // Resetting a password invalidates existing sessions for that account.
    env.DB.prepare(
      'DELETE FROM sessions WHERE user_google_id = ?'
    ).bind(row.user_google_id)
  ]);

  return json({ ok: true, message: messages.changed }, 200, cors);
}

async function consumeRateLimit(env, key, limit, windowSeconds, now) {
  const row = await env.DB.prepare(
    'SELECT window_started_at, count FROM auth_rate_limits WHERE rate_key = ? LIMIT 1'
  ).bind(key).first();

  if (!row || now - Number(row.window_started_at) >= windowSeconds) {
    await env.DB.prepare(
      `INSERT INTO auth_rate_limits (rate_key, window_started_at, count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(rate_key) DO UPDATE SET
         window_started_at = excluded.window_started_at,
         count = 1,
         updated_at = excluded.updated_at`
    ).bind(key, now, now).run();
    return true;
  }

  if (Number(row.count) >= limit) return false;

  await env.DB.prepare(
    'UPDATE auth_rate_limits SET count = count + 1, updated_at = ? WHERE rate_key = ?'
  ).bind(now, key).run();
  return true;
}

function buildResetUrl(env, token, lang) {
  const origin = String(env.FRONT_ORIGIN || 'https://albaspace.com.tr').replace(/\/$/, '');
  const path = lang === 'en'
    ? '/eng/reset-password.html'
    : lang === 'ru'
      ? '/rus/reset-password.html'
      : '/reset-password.html';
  const url = new URL(origin + path);
  url.searchParams.set('token', token);
  return url.toString();
}

async function sendResetEmail(env, data) {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

  const c = emailCopy(data.lang);
  const displayName = escapeHtml(data.name || c.fallbackName);
  const safeUrl = escapeHtml(data.resetUrl);
  const from = env.PASSWORD_RESET_FROM || 'AlbaSpace <no-reply@albaspace.com.tr>';

  const html = `<!doctype html>
<html><body style="margin:0;background:#020617;color:#e2e8f0;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:22px;font-weight:700;margin-bottom:22px">Alba<span style="color:#00c2ff">Space</span></div>
    <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:16px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 16px;color:#f8fafc">${c.heading}</h1>
      <p style="line-height:1.6;color:#cbd5e1">${c.hello} ${displayName},</p>
      <p style="line-height:1.6;color:#cbd5e1">${c.body}</p>
      <p style="margin:26px 0">
        <a href="${safeUrl}" style="display:inline-block;background:#00c2ff;color:#020617;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">${c.button}</a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#94a3b8">${c.expiry}</p>
      <p style="font-size:13px;line-height:1.6;color:#94a3b8">${c.ignore}</p>
    </div>
  </div>
</body></html>`;

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': data.idempotencyKey
    },
    body: JSON.stringify({
      from,
      to: [data.email],
      subject: c.subject,
      html
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend ${response.status}: ${detail.slice(0, 500)}`);
  }
}

function copyFor(lang) {
  if (lang === 'en') return {
    requested: 'If an account with this email exists, we sent a password reset link.',
    changed: 'Your password has been changed. Please sign in again.',
    invalidToken: 'This reset link is invalid or has expired.',
    shortPassword: 'Password must be at least 8 characters.',
    tooMany: 'Too many attempts. Please try again later.'
  };
  if (lang === 'ru') return {
    requested: 'Если аккаунт с таким e-mail существует, мы отправили ссылку для сброса пароля.',
    changed: 'Пароль изменён. Пожалуйста, войдите снова.',
    invalidToken: 'Ссылка для сброса недействительна или срок её действия истёк.',
    shortPassword: 'Пароль должен содержать не менее 8 символов.',
    tooMany: 'Слишком много попыток. Попробуйте позже.'
  };
  return {
    requested: 'Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısını gönderdik.',
    changed: 'Şifreniz değiştirildi. Lütfen tekrar giriş yapın.',
    invalidToken: 'Bu sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
    shortPassword: 'Şifre en az 8 karakter olmalıdır.',
    tooMany: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.'
  };
}

function emailCopy(lang) {
  if (lang === 'en') return {
    subject: 'AlbaSpace password reset',
    heading: 'Reset your password',
    hello: 'Hello',
    fallbackName: 'there',
    body: 'We received a request to reset the password for your AlbaSpace account.',
    button: 'Create a new password',
    expiry: 'This link is valid for 30 minutes and can be used only once.',
    ignore: 'If you did not request this change, you can ignore this email.'
  };
  if (lang === 'ru') return {
    subject: 'Сброс пароля AlbaSpace',
    heading: 'Сброс пароля',
    hello: 'Здравствуйте',
    fallbackName: 'пользователь',
    body: 'Мы получили запрос на сброс пароля вашей учётной записи AlbaSpace.',
    button: 'Создать новый пароль',
    expiry: 'Ссылка действует 30 минут и может быть использована только один раз.',
    ignore: 'Если вы не запрашивали смену пароля, просто проигнорируйте это письмо.'
  };
  return {
    subject: 'AlbaSpace şifre sıfırlama',
    heading: 'Şifrenizi sıfırlayın',
    hello: 'Merhaba',
    fallbackName: 'kullanıcı',
    body: 'AlbaSpace hesabınız için bir şifre sıfırlama talebi aldık.',
    button: 'Yeni şifre oluştur',
    expiry: 'Bu bağlantı 30 dakika boyunca geçerlidir ve yalnızca bir kez kullanılabilir.',
    ignore: 'Bu işlemi siz istemediyseniz bu e-postayı dikkate almayabilirsiniz.'
  };
}

function normalizeLang(value) {
  const lang = String(value || '').toLowerCase();
  return lang === 'en' || lang === 'ru' ? lang : 'tr';
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, keyMat, 256
  );
  return `pbkdf2:${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(new Uint8Array(digest));
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

function toHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildCors(request, env) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
  const origin = request.headers.get('Origin');
  const allowed = new Set();
  if (env.FRONT_ORIGIN) allowed.add(String(env.FRONT_ORIGIN).replace(/\/$/, ''));
  if (env.ALLOWED_ORIGINS) {
    for (const item of String(env.ALLOWED_ORIGINS).split(',')) {
      const normalized = item.trim().replace(/\/$/, '');
      if (normalized) allowed.add(normalized);
    }
  }
  if (origin && allowed.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
