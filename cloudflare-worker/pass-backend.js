const STAFF_ROLES = new Set(['employee', 'admin', 'superadmin']);
const ADMIN_ROLES = new Set(['admin', 'superadmin']);
const PAYMENT_METHODS = new Set(['cash', 'iban']);
const ENTITLEMENT_UNITS = new Set(['use', 'minute']);

export async function handlePassRequest(request, env, user, cors = {}) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    if (path === '/api/pass/offers' && request.method === 'GET') {
      return listOffers(env, url, cors);
    }

    if (path === '/api/pass/orders' && request.method === 'POST') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      return createOrder(request, env, user, cors);
    }

    if (path === '/api/pass/my' && request.method === 'GET') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      return getMyPassData(env, user, cors);
    }

    if (path === '/api/staff/me' && request.method === 'GET') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, STAFF_ROLES)) return json({ error: 'STAFF_REQUIRED' }, 403, cors);
      return json({ user, roles }, 200, cors);
    }

    if (path === '/api/staff/payments/pending' && request.method === 'GET') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, STAFF_ROLES)) return json({ error: 'STAFF_REQUIRED' }, 403, cors);
      return listPendingPayments(env, cors);
    }

    if (path === '/api/staff/customers/search' && request.method === 'GET') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, STAFF_ROLES)) return json({ error: 'STAFF_REQUIRED' }, 403, cors);
      return searchCustomers(env, url, cors);
    }

    if (path === '/api/staff/pass/lookup' && request.method === 'POST') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, STAFF_ROLES)) return json({ error: 'STAFF_REQUIRED' }, 403, cors);
      return lookupPass(request, env, cors);
    }

    if (path === '/api/staff/pass/redeem' && request.method === 'POST') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, STAFF_ROLES)) return json({ error: 'STAFF_REQUIRED' }, 403, cors);
      return redeemEntitlement(request, env, user, cors);
    }

    const paymentConfirm = path.match(/^\/api\/staff\/payments\/([^/]+)\/confirm$/);
    if (paymentConfirm && request.method === 'POST') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, STAFF_ROLES)) return json({ error: 'STAFF_REQUIRED' }, 403, cors);
      return confirmPayment(request, env, user, paymentConfirm[1], cors);
    }

    if (path === '/api/staff/recent' && request.method === 'GET') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, STAFF_ROLES)) return json({ error: 'STAFF_REQUIRED' }, 403, cors);
      return recentActivity(env, cors);
    }

    if (path === '/api/admin/pass/events' && request.method === 'POST') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, ADMIN_ROLES)) return json({ error: 'ADMIN_REQUIRED' }, 403, cors);
      return adminCreateEvent(request, env, user, cors);
    }

    if (path === '/api/admin/pass/offers' && request.method === 'POST') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, ADMIN_ROLES)) return json({ error: 'ADMIN_REQUIRED' }, 403, cors);
      return adminCreateOffer(request, env, user, cors);
    }

    if (path === '/api/admin/pass/roles' && request.method === 'POST') {
      if (!user) return json({ error: 'AUTH_REQUIRED' }, 401, cors);
      const roles = await getRoles(env, user.id);
      if (!hasAnyRole(roles, ADMIN_ROLES)) return json({ error: 'ADMIN_REQUIRED' }, 403, cors);
      return adminSetRole(request, env, user, cors);
    }

    return json({ error: 'PASS_ROUTE_NOT_FOUND' }, 404, cors);
  } catch (error) {
    console.error('ALBA Pass API error', error);
    return json({ error: 'PASS_INTERNAL_ERROR' }, 500, cors);
  }
}

async function listOffers(env, url, cors) {
  const eventCode = cleanText(url.searchParams.get('event'), 80);
  const now = nowSec();
  const clauses = [
    'o.active = 1',
    "e.status = 'active'",
    '(o.sales_start_at IS NULL OR o.sales_start_at <= ?)',
    '(o.sales_end_at IS NULL OR o.sales_end_at >= ?)'
  ];
  const binds = [now, now];
  if (eventCode) {
    clauses.push('e.code = ?');
    binds.push(eventCode);
  }

  const result = await env.DB.prepare(`
    SELECT o.id, o.title, o.description, o.price_amount, o.currency,
           p.slug AS product_slug,
           e.id AS event_id, e.code AS event_code, e.name AS event_name,
           e.venue, e.starts_at, e.ends_at, e.timezone
    FROM pass_product_offers o
    JOIN products p ON p.id = o.product_id
    JOIN experience_events e ON e.id = o.event_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY o.price_amount ASC, o.id ASC
  `).bind(...binds).all();

  const offers = result.results || [];
  for (const offer of offers) {
    offer.entitlements = await entitlementTemplates(env, offer.id);
  }
  return json({ offers }, 200, cors);
}

async function createOrder(request, env, user, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);

  const offerId = Number(body.offer_id || 0);
  const paymentMethod = String(body.payment_method || '').toLowerCase();
  if (!Number.isInteger(offerId) || offerId <= 0) return json({ error: 'INVALID_OFFER' }, 400, cors);
  if (!PAYMENT_METHODS.has(paymentMethod)) return json({ error: 'INVALID_PAYMENT_METHOD' }, 400, cors);

  const now = nowSec();
  const offer = await env.DB.prepare(`
    SELECT o.id, o.event_id, o.product_id, o.title, o.price_amount, o.currency,
           p.slug AS product_slug, e.status AS event_status,
           o.active, o.sales_start_at, o.sales_end_at
    FROM pass_product_offers o
    JOIN products p ON p.id = o.product_id
    JOIN experience_events e ON e.id = o.event_id
    WHERE o.id = ? LIMIT 1
  `).bind(offerId).first();

  if (!offer || !offer.active || offer.event_status !== 'active') {
    return json({ error: 'OFFER_NOT_AVAILABLE' }, 404, cors);
  }
  if (offer.sales_start_at && now < Number(offer.sales_start_at)) return json({ error: 'SALES_NOT_STARTED' }, 409, cors);
  if (offer.sales_end_at && now > Number(offer.sales_end_at)) return json({ error: 'SALES_ENDED' }, 409, cors);

  const templateCount = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM product_entitlement_templates WHERE offer_id = ?'
  ).bind(offerId).first();
  if (Number(templateCount?.count || 0) < 1) {
    return json({ error: 'OFFER_HAS_NO_ENTITLEMENTS' }, 409, cors);
  }

  const orderId = newId('ord');
  const paymentId = newId('pay');
  const passId = newId('pass');
  const referenceCode = paymentReference();
  const amount = Number(offer.price_amount);
  const currency = String(offer.currency || 'TRY');

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders
      (id, user_id, event_id, status, payment_method, currency, total_amount, created_at, updated_at)
      VALUES (?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?)`)
      .bind(orderId, user.id, offer.event_id, paymentMethod, currency, amount, now, now),
    env.DB.prepare(`INSERT INTO order_items
      (order_id, offer_id, product_id, product_slug, title, quantity, unit_price, total_price, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`)
      .bind(orderId, offer.id, offer.product_id, offer.product_slug, offer.title, amount, amount, now),
    env.DB.prepare(`INSERT INTO payments
      (id, order_id, method, status, amount, currency, reference_code, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)`)
      .bind(paymentId, orderId, paymentMethod, amount, currency, referenceCode, now, now),
    env.DB.prepare(`INSERT INTO passes
      (id, order_id, user_id, event_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'inactive', ?, ?)`)
      .bind(passId, orderId, user.id, offer.event_id, now, now),
    env.DB.prepare(`INSERT INTO audit_log
      (event_type, actor_user_id, target_type, target_id, payload_json, created_at)
      VALUES ('order_created', ?, 'order', ?, ?, ?)`)
      .bind(user.id, orderId, JSON.stringify({ payment_method: paymentMethod, amount, currency, offer_id: offer.id }), now)
  ]);

  return json({
    ok: true,
    order: {
      id: orderId,
      status: 'pending_payment',
      payment_method: paymentMethod,
      amount,
      currency,
      reference_code: referenceCode,
      title: offer.title
    },
    iban: paymentMethod === 'iban' ? ibanInfo(env) : null
  }, 201, cors);
}

async function getMyPassData(env, user, cors) {
  const orderRows = await env.DB.prepare(`
    SELECT o.id, o.status, o.payment_method, o.total_amount, o.currency, o.created_at,
           p.id AS payment_id, p.status AS payment_status, p.reference_code,
           p.confirmed_at, p.method,
           e.code AS event_code, e.name AS event_name, e.starts_at, e.ends_at,
           i.title, i.product_slug
    FROM orders o
    JOIN payments p ON p.order_id = o.id
    JOIN experience_events e ON e.id = o.event_id
    LEFT JOIN order_items i ON i.order_id = o.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
    LIMIT 100
  `).bind(user.id).all();

  const passRows = await env.DB.prepare(`
    SELECT ps.id, ps.status, ps.activated_at, ps.expires_at, ps.created_at,
           ps.order_id, e.code AS event_code, e.name AS event_name,
           e.starts_at, e.ends_at, i.title, i.product_slug
    FROM passes ps
    JOIN experience_events e ON e.id = ps.event_id
    LEFT JOIN order_items i ON i.order_id = ps.order_id
    WHERE ps.user_id = ?
    ORDER BY ps.created_at DESC
    LIMIT 100
  `).bind(user.id).all();

  const passes = [];
  for (const pass of passRows.results || []) {
    const entitlements = await passEntitlements(env, pass.id);
    let token = null;
    let qrPayload = null;
    let qrReady = false;
    if (pass.status === 'active') {
      token = await createPassToken(env, pass.id);
      if (token) {
        qrPayload = `ALBAPASS:${token}`;
        qrReady = true;
      }
    }
    passes.push({ ...pass, entitlements, token, qr_payload: qrPayload, qr_ready: qrReady });
  }

  return json({
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    orders: orderRows.results || [],
    passes,
    iban: ibanInfo(env)
  }, 200, cors);
}

async function listPendingPayments(env, cors) {
  const rows = await env.DB.prepare(`
    SELECT p.id, p.order_id, p.method, p.status, p.amount, p.currency,
           p.reference_code, p.created_at,
           o.user_id, u.email, u.name,
           i.title, i.product_slug,
           e.name AS event_name
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items i ON i.order_id = o.id
    JOIN experience_events e ON e.id = o.event_id
    WHERE p.status = 'pending' AND o.status = 'pending_payment'
    ORDER BY p.created_at ASC
    LIMIT 200
  `).all();
  return json({ payments: rows.results || [] }, 200, cors);
}

async function searchCustomers(env, url, cors) {
  const q = cleanText(url.searchParams.get('q'), 120).toLowerCase();
  if (q.length < 2) return json({ customers: [] }, 200, cors);
  const like = `%${q.replace(/[%_]/g, '')}%`;
  const rows = await env.DB.prepare(`
    SELECT id, email, name, avatar
    FROM users
    WHERE lower(email) LIKE ? OR lower(COALESCE(name, '')) LIKE ?
    ORDER BY email ASC
    LIMIT 20
  `).bind(like, like).all();

  const customers = [];
  for (const customer of rows.results || []) {
    const orders = await env.DB.prepare(`
      SELECT o.id, o.status, o.total_amount, o.currency, o.payment_method, o.created_at,
             p.status AS payment_status, p.reference_code,
             i.title, i.product_slug
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      LEFT JOIN order_items i ON i.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC LIMIT 10
    `).bind(customer.id).all();
    customers.push({ ...customer, orders: orders.results || [] });
  }
  return json({ customers }, 200, cors);
}

async function lookupPass(request, env, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);
  const token = normalizeScannedToken(body.token);
  if (!token) return json({ error: 'PASS_TOKEN_REQUIRED' }, 400, cors);

  const passId = await verifyPassToken(env, token);
  if (!passId) return json({ error: 'INVALID_PASS_TOKEN' }, 404, cors);
  const data = await staffPassRecord(env, passId);
  if (!data) return json({ error: 'PASS_NOT_FOUND' }, 404, cors);
  return json({ pass: data }, 200, cors);
}

async function confirmPayment(request, env, actor, paymentId, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);
  const requestId = cleanRequestId(body.request_id);
  if (!requestId) return json({ error: 'REQUEST_ID_REQUIRED' }, 400, cors);

  const previous = await readIdempotency(env, 'payment_confirm', actor.id, requestId);
  if (previous) return json(previous, 200, cors);

  const payment = await env.DB.prepare(`
    SELECT p.id, p.order_id, p.method, p.status, p.amount, p.currency, p.reference_code,
           o.status AS order_status, o.user_id,
           ps.id AS pass_id,
           oi.offer_id, oi.title
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN passes ps ON ps.order_id = o.id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE p.id = ? LIMIT 1
  `).bind(paymentId).first();

  if (!payment) return json({ error: 'PAYMENT_NOT_FOUND' }, 404, cors);
  if (payment.status === 'confirmed') {
    return json({ ok: true, already_confirmed: true, payment_id: payment.id, order_id: payment.order_id }, 200, cors);
  }
  if (payment.status !== 'pending' || payment.order_status !== 'pending_payment') {
    return json({ error: 'PAYMENT_NOT_PENDING', status: payment.status }, 409, cors);
  }

  const templateCount = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM product_entitlement_templates WHERE offer_id = ?'
  ).bind(payment.offer_id).first();
  if (Number(templateCount?.count || 0) < 1) {
    return json({ error: 'OFFER_HAS_NO_ENTITLEMENTS' }, 409, cors);
  }

  const now = nowSec();
  const bankReference = cleanText(body.bank_reference, 120) || null;
  const note = cleanText(body.note, 500) || null;
  const auditPayload = JSON.stringify({
    payment_id: payment.id,
    order_id: payment.order_id,
    method: payment.method,
    amount: payment.amount,
    currency: payment.currency,
    reference_code: payment.reference_code,
    bank_reference: bankReference,
    note
  });

  const statements = [
    env.DB.prepare(`
      INSERT OR IGNORE INTO pass_entitlements
        (id, pass_id, entitlement_code, label, unit, total_quantity, remaining_quantity,
         day_no, valid_from, valid_until, status, created_at, updated_at)
      SELECT 'ent_' || ? || '_' || t.id, ?, t.entitlement_code, t.label, t.unit,
             t.quantity, t.quantity, t.day_no, t.valid_from, t.valid_until,
             'available', ?, ?
      FROM product_entitlement_templates t
      WHERE t.offer_id = ?
        AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'pending')
    `).bind(payment.pass_id, payment.pass_id, now, now, payment.offer_id, payment.id),
    env.DB.prepare(`
      INSERT OR IGNORE INTO audit_log
        (event_type, actor_user_id, target_type, target_id, payload_json, created_at, request_id)
      SELECT 'payment_confirmed', ?, 'payment', ?, ?, ?, ?
      WHERE EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'pending')
    `).bind(actor.id, payment.id, auditPayload, now, requestId, payment.id),
    env.DB.prepare(`
      UPDATE passes SET status = 'active', activated_at = ?, updated_at = ?
      WHERE id = ? AND status = 'inactive'
        AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'pending')
    `).bind(now, now, payment.pass_id, payment.id),
    env.DB.prepare(`
      UPDATE orders SET status = 'paid', updated_at = ?
      WHERE id = ? AND status = 'pending_payment'
        AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'pending')
    `).bind(now, payment.order_id, payment.id),
    env.DB.prepare(`
      UPDATE payments
      SET status = 'confirmed', confirmed_by = ?, confirmed_at = ?,
          bank_reference = ?, note = ?, updated_at = ?
      WHERE id = ? AND status = 'pending'
    `).bind(actor.id, now, bankReference, note, now, payment.id)
  ];

  const results = await env.DB.batch(statements);
  const paymentChanges = Number(results?.[results.length - 1]?.meta?.changes || 0);
  if (paymentChanges !== 1) {
    const latest = await env.DB.prepare('SELECT status, confirmed_by, confirmed_at FROM payments WHERE id = ?').bind(payment.id).first();
    if (latest?.status === 'confirmed') {
      return json({ ok: true, already_confirmed: true, payment_id: payment.id, order_id: payment.order_id }, 200, cors);
    }
    return json({ error: 'PAYMENT_CONFIRM_CONFLICT' }, 409, cors);
  }

  const response = {
    ok: true,
    payment_id: payment.id,
    order_id: payment.order_id,
    pass_id: payment.pass_id,
    status: 'confirmed',
    confirmed_at: now
  };
  await writeIdempotency(env, 'payment_confirm', actor.id, requestId, response);
  return json(response, 200, cors);
}

async function redeemEntitlement(request, env, actor, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);

  const requestId = cleanRequestId(body.request_id);
  if (!requestId) return json({ error: 'REQUEST_ID_REQUIRED' }, 400, cors);
  const previous = await readIdempotency(env, 'redeem', actor.id, requestId);
  if (previous) return json(previous, 200, cors);

  const token = normalizeScannedToken(body.token);
  const passId = token ? await verifyPassToken(env, token) : null;
  if (!passId) return json({ error: 'INVALID_PASS_TOKEN' }, 404, cors);

  const entitlementId = cleanText(body.entitlement_id, 180);
  const amount = Math.max(1, Math.min(120, Number.parseInt(body.amount || '1', 10) || 1));
  if (!entitlementId) return json({ error: 'ENTITLEMENT_REQUIRED' }, 400, cors);

  const entitlement = await env.DB.prepare(`
    SELECT pe.id, pe.pass_id, pe.entitlement_code, pe.label, pe.unit,
           pe.total_quantity, pe.remaining_quantity, pe.day_no,
           pe.valid_from, pe.valid_until, pe.status,
           ps.status AS pass_status
    FROM pass_entitlements pe
    JOIN passes ps ON ps.id = pe.pass_id
    WHERE pe.id = ? AND pe.pass_id = ? LIMIT 1
  `).bind(entitlementId, passId).first();

  if (!entitlement) return json({ error: 'ENTITLEMENT_NOT_FOUND' }, 404, cors);
  if (entitlement.pass_status !== 'active') return json({ error: 'PASS_NOT_ACTIVE' }, 409, cors);
  if (entitlement.status !== 'available') return json({ error: 'ENTITLEMENT_NOT_AVAILABLE' }, 409, cors);
  if (Number(entitlement.remaining_quantity) < amount) {
    return json({ error: 'INSUFFICIENT_ENTITLEMENT', remaining: Number(entitlement.remaining_quantity) }, 409, cors);
  }

  const now = nowSec();
  if (entitlement.valid_from && now < Number(entitlement.valid_from)) return json({ error: 'ENTITLEMENT_NOT_YET_VALID' }, 409, cors);
  if (entitlement.valid_until && now > Number(entitlement.valid_until)) return json({ error: 'ENTITLEMENT_EXPIRED' }, 409, cors);

  const before = Number(entitlement.remaining_quantity);
  const after = before - amount;
  const usageId = newId('use');
  const note = cleanText(body.note, 500) || null;
  const response = {
    ok: true,
    pass_id: passId,
    entitlement_id: entitlement.id,
    entitlement_code: entitlement.entitlement_code,
    amount,
    remaining_quantity: after,
    used_at: now
  };
  const responseJson = JSON.stringify(response);
  const auditPayload = JSON.stringify({
    pass_id: passId,
    entitlement_id: entitlement.id,
    code: entitlement.entitlement_code,
    label: entitlement.label,
    unit: entitlement.unit,
    amount,
    remaining_quantity: after,
    note
  });

  const results = await env.DB.batch([
    env.DB.prepare(`
      UPDATE pass_entitlements
      SET remaining_quantity = remaining_quantity - ?,
          status = CASE WHEN remaining_quantity - ? <= 0 THEN 'used' ELSE 'available' END,
          last_request_id = ?, last_actor_user_id = ?, last_used_at = ?, updated_at = ?
      WHERE id = ? AND pass_id = ? AND status = 'available'
        AND remaining_quantity = ? AND remaining_quantity >= ?
        AND (last_request_id IS NULL OR last_request_id <> ?)
        AND (valid_from IS NULL OR valid_from <= ?)
        AND (valid_until IS NULL OR valid_until >= ?)
        AND EXISTS (SELECT 1 FROM passes WHERE id = ? AND status = 'active')
    `).bind(amount, amount, requestId, actor.id, now, now, entitlement.id, passId,
      before, amount, requestId, now, now, passId),
    env.DB.prepare(`
      INSERT OR IGNORE INTO entitlement_usage
        (id, entitlement_id, pass_id, amount, actor_user_id, request_id, note, created_at)
      SELECT ?, id, pass_id, ?, ?, ?, ?, ?
      FROM pass_entitlements
      WHERE id = ? AND last_request_id = ? AND last_actor_user_id = ?
    `).bind(usageId, amount, actor.id, requestId, note, now, entitlement.id, requestId, actor.id),
    env.DB.prepare(`
      INSERT OR IGNORE INTO audit_log
        (event_type, actor_user_id, target_type, target_id, payload_json, created_at, request_id)
      SELECT 'entitlement_used', ?, 'entitlement', ?, ?, ?, ?
      FROM pass_entitlements
      WHERE id = ? AND last_request_id = ? AND last_actor_user_id = ?
    `).bind(actor.id, entitlement.id, auditPayload, now, requestId, entitlement.id, requestId, actor.id),
    env.DB.prepare(`
      INSERT OR IGNORE INTO pass_idempotency
        (scope, actor_user_id, request_id, response_json, created_at)
      SELECT 'redeem', ?, ?, ?, ?
      FROM pass_entitlements
      WHERE id = ? AND last_request_id = ? AND last_actor_user_id = ?
    `).bind(actor.id, requestId, responseJson, now, entitlement.id, requestId, actor.id)
  ]);

  const changed = Number(results?.[0]?.meta?.changes || 0);
  if (changed !== 1) {
    const replay = await readIdempotency(env, 'redeem', actor.id, requestId);
    if (replay) return json(replay, 200, cors);
    return json({ error: 'ENTITLEMENT_REDEEM_CONFLICT', retry: true }, 409, cors);
  }

  return json(response, 200, cors);
}

async function recentActivity(env, cors) {
  const rows = await env.DB.prepare(`
    SELECT a.id, a.event_type, a.actor_user_id, a.target_type, a.target_id,
           a.payload_json, a.created_at, u.email AS actor_email, u.name AS actor_name
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.actor_user_id
    WHERE a.event_type IN ('payment_confirmed','entitlement_used','pass_revoked','payment_reversed')
    ORDER BY a.id DESC
    LIMIT 100
  `).all();
  const events = (rows.results || []).map(row => ({ ...row, payload: safeJson(row.payload_json) }));
  return json({ events }, 200, cors);
}

async function adminCreateEvent(request, env, actor, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);
  const code = slugCode(body.code);
  const name = cleanText(body.name, 160);
  if (!code || !name) return json({ error: 'CODE_AND_NAME_REQUIRED' }, 400, cors);
  const venue = cleanText(body.venue, 240);
  const timezone = cleanText(body.timezone, 80) || 'Europe/Istanbul';
  const status = ['draft', 'active', 'closed', 'cancelled'].includes(body.status) ? body.status : 'draft';
  const startsAt = nullableInt(body.starts_at);
  const endsAt = nullableInt(body.ends_at);
  const now = nowSec();

  const result = await env.DB.prepare(`
    INSERT INTO experience_events
      (code, name, venue, timezone, starts_at, ends_at, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(code, name, venue, timezone, startsAt, endsAt, status, now, now).run();

  const eventId = Number(result?.meta?.last_row_id || 0);
  await audit(env, 'event_created', actor.id, 'event', String(eventId), { code, name, status }, null);
  return json({ ok: true, event_id: eventId, code, name, status }, 201, cors);
}

async function adminCreateOffer(request, env, actor, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);
  const eventId = Number(body.event_id || 0);
  const productSlug = cleanText(body.product_slug, 120);
  const title = cleanText(body.title, 180);
  const priceAmount = Number.parseInt(body.price_amount, 10);
  const currency = cleanText(body.currency, 8).toUpperCase() || 'TRY';
  const description = cleanText(body.description, 1000);
  const entitlements = Array.isArray(body.entitlements) ? body.entitlements : [];

  if (!Number.isInteger(eventId) || eventId <= 0 || !productSlug || !title || !Number.isInteger(priceAmount) || priceAmount < 0) {
    return json({ error: 'INVALID_OFFER_DATA' }, 400, cors);
  }
  if (entitlements.length < 1 || entitlements.length > 30) {
    return json({ error: 'ENTITLEMENTS_REQUIRED' }, 400, cors);
  }

  const product = await env.DB.prepare('SELECT id, slug FROM products WHERE slug = ? LIMIT 1').bind(productSlug).first();
  if (!product) return json({ error: 'PRODUCT_NOT_FOUND', product_slug: productSlug }, 404, cors);
  const event = await env.DB.prepare('SELECT id FROM experience_events WHERE id = ? LIMIT 1').bind(eventId).first();
  if (!event) return json({ error: 'EVENT_NOT_FOUND' }, 404, cors);

  const templates = [];
  for (let i = 0; i < entitlements.length; i += 1) {
    const raw = entitlements[i] || {};
    const code = slugCode(raw.code).toUpperCase();
    const label = cleanText(raw.label, 160);
    const unit = ENTITLEMENT_UNITS.has(raw.unit) ? raw.unit : 'use';
    const quantity = Number.parseInt(raw.quantity || '1', 10);
    const dayNo = nullableInt(raw.day_no);
    const validFrom = nullableInt(raw.valid_from);
    const validUntil = nullableInt(raw.valid_until);
    if (!code || !label || !Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) {
      return json({ error: 'INVALID_ENTITLEMENT', index: i }, 400, cors);
    }
    templates.push({ code, label, unit, quantity, dayNo, validFrom, validUntil, sortOrder: i });
  }

  const now = nowSec();
  const insertOffer = await env.DB.prepare(`
    INSERT INTO pass_product_offers
      (event_id, product_id, title, description, price_amount, currency, active,
       sales_start_at, sales_end_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventId, product.id, title, description, priceAmount, currency,
    body.active === false ? 0 : 1,
    nullableInt(body.sales_start_at), nullableInt(body.sales_end_at), now, now
  ).run();

  const offerId = Number(insertOffer?.meta?.last_row_id || 0);
  const statements = templates.map(t => env.DB.prepare(`
    INSERT INTO product_entitlement_templates
      (offer_id, entitlement_code, label, unit, quantity, day_no, valid_from, valid_until, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(offerId, t.code, t.label, t.unit, t.quantity, t.dayNo, t.validFrom, t.validUntil, t.sortOrder, now));
  if (statements.length) await env.DB.batch(statements);

  await audit(env, 'offer_created', actor.id, 'offer', String(offerId), {
    event_id: eventId, product_slug: productSlug, title, price_amount: priceAmount, currency, entitlements: templates
  }, null);
  return json({ ok: true, offer_id: offerId }, 201, cors);
}

async function adminSetRole(request, env, actor, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'INVALID_JSON' }, 400, cors);
  const email = cleanText(body.email, 254).toLowerCase();
  const roleCode = cleanText(body.role, 40).toLowerCase();
  const enabled = body.enabled !== false;
  if (!email || !['employee', 'admin', 'superadmin'].includes(roleCode)) {
    return json({ error: 'INVALID_ROLE_REQUEST' }, 400, cors);
  }

  const target = await env.DB.prepare('SELECT id, email FROM users WHERE lower(email) = ? LIMIT 1').bind(email).first();
  if (!target) return json({ error: 'USER_NOT_FOUND' }, 404, cors);
  const role = await env.DB.prepare('SELECT id, code FROM roles WHERE code = ? LIMIT 1').bind(roleCode).first();
  if (!role) return json({ error: 'ROLE_NOT_FOUND' }, 404, cors);
  const now = nowSec();

  if (enabled) {
    await env.DB.prepare(`
      INSERT INTO user_roles (user_id, role_id, granted_by, granted_at, revoked_at)
      VALUES (?, ?, ?, ?, NULL)
      ON CONFLICT(user_id, role_id) DO UPDATE SET granted_by = excluded.granted_by,
        granted_at = excluded.granted_at, revoked_at = NULL
    `).bind(target.id, role.id, actor.id, now).run();
  } else {
    await env.DB.prepare('UPDATE user_roles SET revoked_at = ? WHERE user_id = ? AND role_id = ?')
      .bind(now, target.id, role.id).run();
  }

  await audit(env, enabled ? 'role_granted' : 'role_revoked', actor.id, 'user', String(target.id), {
    email: target.email, role: roleCode
  }, null);
  return json({ ok: true, email: target.email, role: roleCode, enabled }, 200, cors);
}

async function staffPassRecord(env, passId) {
  const pass = await env.DB.prepare(`
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
    WHERE ps.id = ? LIMIT 1
  `).bind(passId).first();
  if (!pass) return null;
  pass.entitlements = await passEntitlements(env, pass.id);
  return pass;
}

async function passEntitlements(env, passId) {
  const rows = await env.DB.prepare(`
    SELECT id, entitlement_code, label, unit, total_quantity, remaining_quantity,
           day_no, valid_from, valid_until, status, last_used_at
    FROM pass_entitlements
    WHERE pass_id = ?
    ORDER BY COALESCE(day_no, 0), id
  `).bind(passId).all();
  return rows.results || [];
}

async function entitlementTemplates(env, offerId) {
  const rows = await env.DB.prepare(`
    SELECT entitlement_code AS code, label, unit, quantity, day_no, valid_from, valid_until
    FROM product_entitlement_templates
    WHERE offer_id = ?
    ORDER BY sort_order ASC, id ASC
  `).bind(offerId).all();
  return rows.results || [];
}

async function getRoles(env, userId) {
  const rows = await env.DB.prepare(`
    SELECT r.code
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND ur.revoked_at IS NULL
  `).bind(userId).all();
  return (rows.results || []).map(row => row.code);
}

function hasAnyRole(roles, allowed) {
  return roles.some(role => allowed.has(role));
}

async function readIdempotency(env, scope, actorUserId, requestId) {
  const row = await env.DB.prepare(`
    SELECT response_json FROM pass_idempotency
    WHERE scope = ? AND actor_user_id = ? AND request_id = ? LIMIT 1
  `).bind(scope, actorUserId, requestId).first();
  return row ? safeJson(row.response_json) : null;
}

async function writeIdempotency(env, scope, actorUserId, requestId, response) {
  try {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO pass_idempotency
        (scope, actor_user_id, request_id, response_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(scope, actorUserId, requestId, JSON.stringify(response), nowSec()).run();
  } catch (error) {
    console.warn('Pass idempotency write failed', error);
  }
}

async function audit(env, eventType, actorUserId, targetType, targetId, payload, requestId) {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO audit_log
      (event_type, actor_user_id, target_type, target_id, payload_json, created_at, request_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(eventType, actorUserId || null, targetType, targetId, JSON.stringify(payload || {}), nowSec(), requestId || null).run();
}

async function createPassToken(env, passId) {
  const secret = String(env.PASS_SIGNING_SECRET || '');
  if (!secret) return null;
  const signature = await hmac(secret, `v1.${passId}`);
  return `v1.${passId}.${signature}`;
}

async function verifyPassToken(env, token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const passId = parts[1];
  const supplied = parts[2];
  if (!/^pass_[a-f0-9]{32}$/i.test(passId) || !/^[A-Za-z0-9_-]{40,60}$/.test(supplied)) return null;
  const secret = String(env.PASS_SIGNING_SECRET || '');
  if (!secret) return null;
  const expected = await hmac(secret, `v1.${passId}`);
  return constantTimeEqual(expected, supplied) ? passId : null;
}

async function hmac(secret, value) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return base64Url(new Uint8Array(signature));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function normalizeScannedToken(raw) {
  let value = cleanText(raw, 800);
  if (!value) return '';
  if (value.startsWith('ALBAPASS:')) value = value.slice('ALBAPASS:'.length);
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      value = url.searchParams.get('pass') || url.hash.match(/(?:^#|[&#])pass=([^&]+)/)?.[1] || value;
      value = decodeURIComponent(value);
    } catch {}
  }
  return cleanText(value, 500);
}

function ibanInfo(env) {
  return {
    iban: cleanText(env.PAYMENT_IBAN, 80) || null,
    account_name: cleanText(env.PAYMENT_IBAN_NAME, 160) || null,
    bank_name: cleanText(env.PAYMENT_BANK_NAME, 160) || null
  };
}

function cleanText(value, max = 500) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanRequestId(value) {
  const text = cleanText(value, 120);
  return /^[A-Za-z0-9._:-]{8,120}$/.test(text) ? text : '';
}

function slugCode(value) {
  return cleanText(value, 100).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function nullableInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function paymentReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = 'ALBA-';
  for (const byte of bytes) out += chars[byte % chars.length];
  return out;
}

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
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
