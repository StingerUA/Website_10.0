const STAFF_ROLES = new Set(['employee', 'admin', 'superadmin']);
const OFFLINE_ZONES = new Set(['readonly', 'sun', 'moon', 'vr', 'payments']);
const WRITE_ZONES = new Set(['sun', 'moon', 'vr', 'payments']);
const OFFLINE_TTL_SECONDS = 20 * 60;
const OFFLINE_SYNC_GRACE_SECONDS = 24 * 60 * 60;
const LEASE_SCOPE = 'active-events';

export async function handleOfflinePassRequest(request, env, user, cors = {}, passHandler) {
  const url = new URL(request.url);
  if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
  if (!(await isStaff(env, user.id))) return json({ error: 'STAFF_REQUIRED' }, 403, cors);

  try {
    if (url.pathname === '/api/staff/offline/bootstrap' && request.method === 'POST') {
      return bootstrapOffline(request, env, user, cors);
    }
    if (url.pathname === '/api/staff/offline/sync' && request.method === 'POST') {
      if (typeof passHandler !== 'function') return json({ error: 'OFFLINE_SYNC_HANDLER_MISSING' }, 500, cors);
      return syncOffline(request, env, user, cors, passHandler);
    }
    return json({ error: 'OFFLINE_ROUTE_NOT_FOUND' }, 404, cors);
  } catch (error) {
    console.error('ALBA Pass offline API error', error);
    return json({ error: 'OFFLINE_INTERNAL_ERROR' }, 500, cors);
  }
}

async function bootstrapOffline(request, env, user, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);

  const deviceId = cleanDeviceId(body.device_id);
  const zone = cleanZone(body.zone);
  if (!deviceId) return json({ error: 'OFFLINE_DEVICE_ID_REQUIRED' }, 400, cors);
  if (!zone) return json({ error: 'OFFLINE_ZONE_INVALID' }, 400, cors);
  if (!String(env.PASS_SIGNING_SECRET || '')) return json({ error: 'OFFLINE_SIGNING_UNAVAILABLE' }, 503, cors);

  const now = nowSec();
  const expiresAt = now + OFFLINE_TTL_SECONDS;
  let lease = null;

  if (WRITE_ZONES.has(zone)) {
    lease = await acquireZoneLease(env, zone, deviceId, user.id, now, expiresAt);
    if (!lease.ok) {
      return json({
        error: 'OFFLINE_ZONE_IN_USE',
        zone,
        expires_at: lease.current?.expires_at || null,
        current_user_id: lease.current?.user_id || null
      }, 409, cors);
    }
  }

  const snapshot = await buildSnapshot(env);
  const roles = await getStaffRoles(env, user.id);
  const payload = {
    v: 1,
    uid: String(user.id),
    device: deviceId,
    zone,
    scope: LEASE_SCOPE,
    lease: lease?.lease_id || null,
    iat: now,
    exp: expiresAt
  };
  const ticket = await createOfflineTicket(env, payload);

  return json({
    ok: true,
    offline: {
      ttl_seconds: OFFLINE_TTL_SECONDS,
      issued_at: now,
      expires_at: expiresAt,
      zone,
      device_id: deviceId,
      ticket
    },
    staff: { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, roles },
    snapshot
  }, 200, cors);
}

async function syncOffline(request, env, user, cors, passHandler) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);

  const deviceId = cleanDeviceId(body.device_id);
  const ticket = cleanText(body.ticket, 3000);
  const actions = Array.isArray(body.actions) ? body.actions.slice(0, 100) : [];
  if (!deviceId || !ticket) return json({ error: 'OFFLINE_SESSION_REQUIRED' }, 400, cors);
  if (!actions.length) return json({ ok: true, results: [] }, 200, cors);

  const session = await verifyOfflineTicket(env, ticket);
  if (!session || String(session.uid) !== String(user.id) || session.device !== deviceId) {
    return json({ error: 'OFFLINE_SESSION_INVALID' }, 401, cors);
  }
  if (!OFFLINE_ZONES.has(session.zone)) return json({ error: 'OFFLINE_SESSION_INVALID_ZONE' }, 401, cors);

  const now = nowSec();
  if (now > Number(session.exp || 0) + OFFLINE_SYNC_GRACE_SECONDS) {
    return json({ error: 'OFFLINE_SYNC_GRACE_EXPIRED' }, 409, cors);
  }

  const results = [];
  for (const raw of actions) {
    const requestId = cleanRequestId(raw?.request_id);
    if (!requestId) {
      results.push({ request_id: null, ok: false, status: 400, error: 'REQUEST_ID_REQUIRED' });
      continue;
    }

    const occurredAt = Number.parseInt(raw?.occurred_at, 10);
    if (!Number.isFinite(occurredAt)
      || occurredAt < Number(session.iat || 0) - 60
      || occurredAt > Number(session.exp || 0) + 60) {
      results.push({ request_id: requestId, ok: false, status: 409, error: 'OFFLINE_ACTION_OUTSIDE_SESSION' });
      continue;
    }

    try {
      const prepared = await prepareSyncedAction(env, session, raw, requestId, deviceId);
      if (!prepared.ok) {
        results.push({ request_id: requestId, ok: false, status: prepared.status || 400, error: prepared.error });
        continue;
      }

      const origin = String(env.PUBLIC_BASE_URL || 'https://api.albaspace.com.tr').replace(/\/$/, '');
      const synthetic = new Request(origin + prepared.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prepared.body)
      });
      const response = await passHandler(synthetic, env, user, {});
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO audit_log
            (event_type, actor_user_id, target_type, target_id, payload_json, created_at, request_id)
          VALUES ('offline_action_synced', ?, 'offline_action', ?, ?, ?, ?)
        `).bind(
          user.id,
          requestId,
          JSON.stringify({ device_id: deviceId, zone: session.zone, type: raw.type, occurred_at: occurredAt }),
          now,
          requestId
        ).run();
      }

      results.push({
        request_id: requestId,
        ok: response.ok,
        status: response.status,
        data,
        error: response.ok ? null : (data?.error || `HTTP_${response.status}`)
      });
    } catch (error) {
      results.push({ request_id: requestId, ok: false, status: 500, error: error?.message || 'OFFLINE_SYNC_ACTION_FAILED' });
    }
  }

  return json({ ok: true, results, server_time: now }, 200, cors);
}

async function prepareSyncedAction(env, session, raw, requestId, deviceId) {
  const type = cleanText(raw?.type, 40);
  if (type === 'redeem') {
    if (!['sun', 'moon', 'vr'].includes(session.zone)) {
      return { ok: false, status: 403, error: 'OFFLINE_ZONE_REDEEM_NOT_ALLOWED' };
    }
    const entitlementId = cleanText(raw?.entitlement_id, 180);
    const token = cleanText(raw?.token, 800);
    const amount = Math.max(1, Math.min(120, Number.parseInt(raw?.amount || '1', 10) || 1));
    if (!entitlementId || !token) return { ok: false, status: 400, error: 'OFFLINE_REDEEM_DATA_REQUIRED' };

    const entitlement = await env.DB.prepare(
      'SELECT entitlement_code FROM pass_entitlements WHERE id = ? LIMIT 1'
    ).bind(entitlementId).first();
    if (!entitlement) return { ok: false, status: 404, error: 'ENTITLEMENT_NOT_FOUND' };
    if (zoneForEntitlement(entitlement.entitlement_code) !== session.zone) {
      return { ok: false, status: 403, error: 'OFFLINE_ZONE_MISMATCH' };
    }

    return {
      ok: true,
      path: '/api/staff/pass/redeem',
      body: {
        token,
        entitlement_id: entitlementId,
        amount,
        request_id: requestId,
        note: appendOfflineNote(raw?.note, deviceId, session.zone)
      }
    };
  }

  if (type === 'payment_confirm') {
    if (session.zone !== 'payments') {
      return { ok: false, status: 403, error: 'OFFLINE_ZONE_PAYMENT_NOT_ALLOWED' };
    }
    const paymentId = cleanText(raw?.payment_id, 180);
    if (!paymentId) return { ok: false, status: 400, error: 'PAYMENT_NOT_FOUND' };
    return {
      ok: true,
      path: `/api/staff/payments/${encodeURIComponent(paymentId)}/confirm`,
      body: {
        request_id: requestId,
        bank_reference: cleanText(raw?.bank_reference, 120),
        note: appendOfflineNote(raw?.note, deviceId, session.zone)
      }
    };
  }

  return { ok: false, status: 400, error: 'OFFLINE_ACTION_TYPE_UNSUPPORTED' };
}

async function acquireZoneLease(env, zone, deviceId, userId, now, expiresAt) {
  const leaseId = `ofl_${crypto.randomUUID().replace(/-/g, '')}`;
  const result = await env.DB.prepare(`
    INSERT INTO staff_offline_leases
      (id, scope, zone, device_id, user_id, issued_at, expires_at, last_seen_at, revoked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(scope, zone) DO UPDATE SET
      id = excluded.id,
      device_id = excluded.device_id,
      user_id = excluded.user_id,
      issued_at = excluded.issued_at,
      expires_at = excluded.expires_at,
      last_seen_at = excluded.last_seen_at,
      revoked_at = NULL
    WHERE staff_offline_leases.device_id = excluded.device_id
       OR staff_offline_leases.expires_at <= ?
       OR staff_offline_leases.revoked_at IS NOT NULL
  `).bind(leaseId, LEASE_SCOPE, zone, deviceId, String(userId), now, expiresAt, now, now).run();

  if (Number(result?.meta?.changes || 0) === 1) {
    return { ok: true, lease_id: leaseId };
  }

  const current = await env.DB.prepare(`
    SELECT device_id, user_id, issued_at, expires_at
    FROM staff_offline_leases
    WHERE scope = ? AND zone = ? AND revoked_at IS NULL
    LIMIT 1
  `).bind(LEASE_SCOPE, zone).first();
  return { ok: false, current };
}

async function buildSnapshot(env) {
  const passRows = await env.DB.prepare(`
    SELECT ps.id, ps.status, ps.activated_at, ps.expires_at, ps.created_at,
           ps.order_id, ps.user_id,
           u.email, u.name, u.avatar,
           o.total_amount, o.currency, o.payment_method, o.status AS order_status,
           py.status AS payment_status, py.confirmed_at,
           i.title, i.product_slug,
           e.code AS event_code, e.name AS event_name, e.starts_at, e.ends_at
    FROM passes ps
    JOIN users u ON u.id = ps.user_id
    JOIN orders o ON o.id = ps.order_id
    JOIN payments py ON py.order_id = o.id
    LEFT JOIN order_items i ON i.order_id = o.id
    JOIN experience_events e ON e.id = ps.event_id
    WHERE ps.status = 'active' AND py.status = 'confirmed' AND e.status = 'active'
    ORDER BY ps.created_at DESC
    LIMIT 1000
  `).all();

  const entitlementRows = await env.DB.prepare(`
    SELECT pe.id, pe.pass_id, pe.entitlement_code, pe.label, pe.unit,
           pe.total_quantity, pe.remaining_quantity, pe.day_no,
           pe.valid_from, pe.valid_until, pe.status, pe.last_used_at
    FROM pass_entitlements pe
    JOIN passes ps ON ps.id = pe.pass_id
    JOIN experience_events e ON e.id = ps.event_id
    WHERE ps.status = 'active' AND e.status = 'active'
    ORDER BY pe.pass_id, COALESCE(pe.day_no, 0), pe.id
    LIMIT 5000
  `).all();

  const entitlementsByPass = new Map();
  for (const row of entitlementRows.results || []) {
    if (!entitlementsByPass.has(row.pass_id)) entitlementsByPass.set(row.pass_id, []);
    entitlementsByPass.get(row.pass_id).push(row);
  }

  const passes = [];
  for (const pass of passRows.results || []) {
    const token = await createPassToken(env, pass.id);
    const tokenHash = token ? await sha256Hex(token) : null;
    passes.push({
      ...pass,
      token_hash: tokenHash,
      entitlements: entitlementsByPass.get(pass.id) || []
    });
  }

  const pendingRows = await env.DB.prepare(`
    SELECT p.id, p.order_id, p.method, p.status, p.amount, p.currency,
           p.reference_code, p.created_at,
           o.user_id, u.email, u.name,
           i.title, i.product_slug,
           e.name AS event_name, e.code AS event_code
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items i ON i.order_id = o.id
    JOIN experience_events e ON e.id = o.event_id
    WHERE p.status = 'pending' AND o.status = 'pending_payment' AND e.status = 'active'
    ORDER BY p.created_at ASC
    LIMIT 500
  `).all();

  const customerOrderRows = await env.DB.prepare(`
    SELECT u.id AS user_id, u.email, u.name, u.avatar,
           o.id, o.status, o.total_amount, o.currency, o.payment_method, o.created_at,
           p.status AS payment_status, p.reference_code,
           i.title, i.product_slug
    FROM orders o
    JOIN users u ON u.id = o.user_id
    JOIN payments p ON p.order_id = o.id
    LEFT JOIN order_items i ON i.order_id = o.id
    JOIN experience_events e ON e.id = o.event_id
    WHERE e.status = 'active'
    ORDER BY o.created_at DESC
    LIMIT 2000
  `).all();

  const customerMap = new Map();
  for (const row of customerOrderRows.results || []) {
    const key = String(row.user_id);
    if (!customerMap.has(key)) {
      customerMap.set(key, { id: row.user_id, email: row.email, name: row.name, avatar: row.avatar, orders: [] });
    }
    customerMap.get(key).orders.push({
      id: row.id,
      status: row.status,
      total_amount: row.total_amount,
      currency: row.currency,
      payment_method: row.payment_method,
      created_at: row.created_at,
      payment_status: row.payment_status,
      reference_code: row.reference_code,
      title: row.title,
      product_slug: row.product_slug
    });
  }

  const recentRows = await env.DB.prepare(`
    SELECT a.id, a.event_type, a.actor_user_id, a.target_type, a.target_id,
           a.payload_json, a.created_at, u.email AS actor_email, u.name AS actor_name
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.actor_user_id
    WHERE a.event_type IN ('payment_confirmed','entitlement_used','pass_revoked','payment_reversed')
    ORDER BY a.id DESC
    LIMIT 100
  `).all();

  return {
    version: 1,
    generated_at: nowSec(),
    passes,
    pending_payments: pendingRows.results || [],
    customers: [...customerMap.values()],
    recent: (recentRows.results || []).map(row => ({ ...row, payload: safeJson(row.payload_json) }))
  };
}

async function getStaffRoles(env, userId) {
  const rows = await env.DB.prepare(`
    SELECT r.code
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND ur.revoked_at IS NULL
  `).bind(userId).all();
  return (rows.results || []).map(row => row.code);
}

async function isStaff(env, userId) {
  const roles = await getStaffRoles(env, userId);
  return roles.some(role => STAFF_ROLES.has(role));
}

async function createOfflineTicket(env, payload) {
  const encoded = base64UrlBytes(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmac(String(env.PASS_SIGNING_SECRET || ''), `of1.${encoded}`);
  return `of1.${encoded}.${signature}`;
}

async function verifyOfflineTicket(env, ticket) {
  const parts = String(ticket || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'of1') return null;
  const secret = String(env.PASS_SIGNING_SECRET || '');
  if (!secret) return null;
  const expected = await hmac(secret, `of1.${parts[1]}`);
  if (!constantTimeEqual(expected, parts[2])) return null;
  try {
    const jsonText = new TextDecoder().decode(base64UrlDecode(parts[1]));
    const payload = JSON.parse(jsonText);
    return payload?.v === 1 ? payload : null;
  } catch {
    return null;
  }
}

async function createPassToken(env, passId) {
  const secret = String(env.PASS_SIGNING_SECRET || '');
  if (!secret) return null;
  const signature = await hmac(secret, `v1.${passId}`);
  return `v1.${passId}.${signature}`;
}

async function hmac(secret, value) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return base64UrlBytes(new Uint8Array(signature));
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function base64UrlBytes(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function zoneForEntitlement(code) {
  const value = String(code || '').toLowerCase();
  if (value.includes('sun')) return 'sun';
  if (value.includes('moon')) return 'moon';
  if (value.includes('vr')) return 'vr';
  return 'unknown';
}

function appendOfflineNote(note, deviceId, zone) {
  const base = cleanText(note, 380);
  const suffix = `[offline ${zone} device:${deviceId}]`;
  return cleanText(base ? `${base} ${suffix}` : suffix, 500);
}

function cleanZone(value) {
  const zone = cleanText(value, 40).toLowerCase();
  return OFFLINE_ZONES.has(zone) ? zone : '';
}

function cleanDeviceId(value) {
  const text = cleanText(value, 120);
  return /^[A-Za-z0-9._:-]{8,120}$/.test(text) ? text : '';
}

function cleanRequestId(value) {
  const text = cleanText(value, 120);
  return /^[A-Za-z0-9._:-]{8,120}$/.test(text) ? text : '';
}

function cleanText(value, max = 500) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function safeJson(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}
