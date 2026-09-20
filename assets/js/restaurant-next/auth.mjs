const API = 'https://api.albaspace.com.tr';
const TOKEN_KEY = 'albaspace_access_token';

export function consumeToken(location = window.location, history = window.history, storage = window.localStorage) {
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get(TOKEN_KEY) || params.get('access_token');
  if (token) { try { storage.setItem(TOKEN_KEY, token); } catch { /* private browsing */ } }
  if (params.has(TOKEN_KEY) || params.has('access_token')) {
    params.delete(TOKEN_KEY); params.delete('access_token');
    history.replaceState({}, '', location.pathname + location.search + (params.size ? '#' + params : ''));
  }
  return token;
}

export function hasIdentity(user) {
  return Boolean(user && (user.id || user.email || user.google_id || user.name));
}

export async function checkSession() {
  // Keep quick Uzaydash accounts working without rewriting window.fetch.
  let token = '';
  try { token = consumeToken() || localStorage.getItem(TOKEN_KEY) || ''; } catch { /* storage unavailable */ }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API}/me`, {
      credentials: 'include', mode: 'cors', signal: controller.signal,
      headers: token ? {Authorization: `Bearer ${token}`} : {},
    });
    if (!response.ok) return false;
    return hasIdentity(await response.json());
  } catch { return false; }
  finally { clearTimeout(timeout); }
}

export function rememberReturn() {
  try { sessionStorage.setItem('albaspace_auth_return_to', location.pathname + location.search); } catch { /* optional storage */ }
}
