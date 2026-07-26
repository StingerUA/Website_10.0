const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const SESSION_COOKIE = "albaspace_session";
const OAUTH_STATE_COOKIE = "albaspace_oauth_state";

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Worker error:", error);

      return json(
        { error: "Internal Server Error" },
        500,
        buildCorsHeaders(request, env)
      );
    }
  }
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const corsHeaders = buildCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (url.pathname === "/") {
    return json(
      {
        ok: true,
        service: "albaspace-auth-worker",
        routes: ["/auth/google", "/auth/google/callback", "/me", "/profile", "/logout"]
      },
      200,
      corsHeaders
    );
  }

  if (url.pathname === "/auth/google" && request.method === "GET") {
    return startGoogleAuth(env);
  }

  if (url.pathname === "/auth/google/callback" && request.method === "GET") {
    return handleGoogleCallback(request, env);
  }

  if (url.pathname === "/me" && request.method === "GET") {
    return getCurrentUser(request, env, corsHeaders);
  }

  if (url.pathname === "/profile" && request.method === "POST") {
    return saveUserProfile(request, env, corsHeaders);
  }

  if (url.pathname === "/logout" && (request.method === "POST" || request.method === "GET")) {
    return logout(request, env, corsHeaders);
  }

  return json({ error: "Not Found" }, 404, corsHeaders);
}

function startGoogleAuth(env) {
  assertRequiredEnv(env, [
    "GOOGLE_CLIENT_ID",
    "PUBLIC_BASE_URL",
    "FRONTEND_URL"
  ]);

  const state = randomToken();
  const redirectUri = getGoogleRedirectUri(env);
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");

  return redirect(authUrl.toString(), {
    "Set-Cookie": serializeCookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 600
    })
  });
}

async function handleGoogleCallback(request, env) {
  assertRequiredEnv(env, [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "PUBLIC_BASE_URL",
    "FRONTEND_URL",
    "DB"
  ]);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookies = parseCookies(request.headers.get("Cookie"));
  const cookieState = cookies[OAUTH_STATE_COOKIE];

  if (error) {
    return redirect(buildFrontendUrl(env, `/?login_error=${encodeURIComponent(error)}`), {
      "Set-Cookie": serializeCookie(OAUTH_STATE_COOKIE, "", {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 0
      })
    });
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getGoogleRedirectUri(env),
      grant_type: "authorization_code"
    })
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    console.error("Google token error:", tokenData);
    return new Response("Failed to exchange Google code", { status: 502 });
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  });

  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.sub || !profile.email) {
    console.error("Google userinfo error:", profile);
    return new Response("Failed to fetch Google profile", { status: 502 });
  }

  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO users (id, google_id, email, name, picture, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
     ON CONFLICT(id) DO UPDATE SET
       google_id = excluded.google_id,
       email = excluded.email,
       name = excluded.name,
       picture = excluded.picture,
       updated_at = excluded.updated_at`
  )
    .bind(
      profile.sub,
      profile.sub,
      profile.email,
      profile.name || profile.email,
      profile.picture || "",
      now
    )
    .run();

  const sessionId = randomToken();
  const sessionTtl = Number(env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
  const expiresAt = now + sessionTtl;

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, created_at)
     VALUES (?1, ?2, ?3, ?4)`
  )
    .bind(sessionId, profile.sub, expiresAt, now)
    .run();

  const setCookies = [
    serializeCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: env.COOKIE_SAME_SITE || "Lax",
      path: "/",
      maxAge: sessionTtl,
      domain: env.COOKIE_DOMAIN || undefined
    }),
    serializeCookie(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 0
    })
  ];

  return redirect(buildFrontendUrl(env, "/"), {
    "Set-Cookie": setCookies
  });
}

async function getCurrentUser(request, env, corsHeaders) {
  assertRequiredEnv(env, ["DB"]);

  const session = await getSessionUser(request, env);
  if (!session) {
    return json({ error: "Not logged in" }, 401, corsHeaders);
  }

  return json(
    {
      id: session.id,
      email: session.email,
      name: session.name,
      picture: session.picture,
      profile: {
        favorite_experience: session.favorite_experience || null,
        notes: session.notes || null
      }
    },
    200,
    corsHeaders
  );
}

async function saveUserProfile(request, env, corsHeaders) {
  assertRequiredEnv(env, ["DB"]);

  const session = await getSessionUser(request, env);
  if (!session) {
    return json({ error: "Not logged in" }, 401, corsHeaders);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ error: "Invalid JSON body" }, 400, corsHeaders);
  }

  const favoriteExperience = String(body.favorite_experience || body.favorite || "").trim();
  const notes = String(body.notes || "").trim();
  const now = Math.floor(Date.now() / 1000);
  const profileId = session.id;

  await env.DB.prepare(
    `INSERT INTO profiles (id, user_id, favorite_experience, notes, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)
     ON CONFLICT(id) DO UPDATE SET
       favorite_experience = excluded.favorite_experience,
       notes = excluded.notes,
       updated_at = excluded.updated_at`
  )
    .bind(profileId, session.id, favoriteExperience, notes, now)
    .run();

  return json(
    {
      ok: true,
      profile: {
        favorite_experience: favoriteExperience,
        notes
      }
    },
    200,
    corsHeaders
  );
}

async function logout(request, env, corsHeaders) {
  assertRequiredEnv(env, ["DB"]);

  const cookies = parseCookies(request.headers.get("Cookie"));
  const sessionId = cookies[SESSION_COOKIE];

  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(sessionId).run();
  }

  return json(
    { ok: true },
    200,
    {
      ...corsHeaders,
      "Set-Cookie": serializeCookie(SESSION_COOKIE, "", {
        httpOnly: true,
        secure: true,
        sameSite: env.COOKIE_SAME_SITE || "Lax",
        path: "/",
        maxAge: 0,
        domain: env.COOKIE_DOMAIN || undefined
      })
    }
  );
}

async function getSessionUser(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const result = await env.DB.prepare(
    `SELECT users.id, users.email, users.name, users.picture,
            profiles.favorite_experience, profiles.notes
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     LEFT JOIN profiles ON profiles.user_id = users.id
     WHERE sessions.id = ?1 AND sessions.expires_at > ?2
     LIMIT 1`
  )
    .bind(sessionId, now)
    .first();

  if (!result) {
    return null;
  }

  return result;
}

function buildCorsHeaders(request, env) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  const origin = request.headers.get("Origin");
  const allowedOrigins = getAllowedOrigins(env);

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

function getAllowedOrigins(env) {
  const values = new Set();

  if (env.FRONTEND_URL) {
    values.add(env.FRONTEND_URL.replace(/\/$/, ""));
  }

  if (env.ALLOWED_ORIGINS) {
    for (const value of env.ALLOWED_ORIGINS.split(",")) {
      const trimmed = value.trim().replace(/\/$/, "");
      if (trimmed) {
        values.add(trimmed);
      }
    }
  }

  return values;
}

function getGoogleRedirectUri(env) {
  return `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/auth/google/callback`;
}

function buildFrontendUrl(env, path) {
  return new URL(path, env.FRONTEND_URL).toString();
}

function json(payload, status, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

function redirect(location, headers = {}) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Location", location);
  return new Response(null, {
    status: 302,
    headers: responseHeaders
  });
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) {
      continue;
    }
    cookies[name] = decodeURIComponent(rest.join("=") || "");
  }

  return cookies;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (options.secure) {
    parts.push("Secure");
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  return parts.join("; ");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertRequiredEnv(env, keys) {
  for (const key of keys) {
    if (!env[key]) {
      throw new Error(`Missing environment value: ${key}`);
    }
  }
}
