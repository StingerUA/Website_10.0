import worker from './divine-flower-a0ae-full-final.worker.js';

class MemoryKV {
  constructor() { this.data = new Map(); }
  async get(key, options) {
    const value = this.data.get(key);
    if (options?.type === 'json') return value ? JSON.parse(value) : null;
    return value ?? null;
  }
  async put(key, value) { this.data.set(key, String(value)); }
}

const originalFetch = globalThis.fetch;
let calls = [];
globalThis.fetch = async (url, options = {}) => {
  calls.push(String(url));
  if (String(url).includes('api.groq.com')) {
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Test reply' } }] }), { status: 200 });
  }
  if (String(url).includes('cognitive.microsofttranslator.com')) {
    return new Response(JSON.stringify([{ translations: [{ text: 'Привет', to: 'ru' }] }]), { status: 200 });
  }
  throw new Error(`Unexpected external call: ${url}`);
};

function ctx() { return { waitUntil(promise) { promise.catch(() => {}); } }; }
function request(path, body, origin = 'https://albaspace.com.tr') {
  return new Request(`https://worker.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

const env = {
  GROQ_API_KEY: 'test-only',
  ALLOWED_ORIGINS: 'https://albaspace.com.tr,https://www.albaspace.com.tr',
  ALBAMEN_KV: new MemoryKV(),
  TELEGRAM_LOGGING_ENABLED: 'false',
};

const chat = await worker.fetch(request('/', { message: 'Hello', sessionId: 'test-1', language: 'en' }), env, ctx());
const chatBody = await chat.json();
if (chat.status !== 200 || chatBody.reply !== 'Test reply') throw new Error('Chat smoke test failed');
if (chat.headers.get('Access-Control-Allow-Origin') !== 'https://albaspace.com.tr') throw new Error('CORS allow test failed');

const forbidden = await worker.fetch(request('/', { message: 'Hello', sessionId: 'test-2' }, 'https://evil.example'), env, ctx());
if (forbidden.headers.get('Access-Control-Allow-Origin')) throw new Error('CORS deny test failed');

const oversized = await worker.fetch(request('/', { message: 'x'.repeat(2001) }), env, ctx());
if (oversized.status !== 413) throw new Error('Text size limit test failed');

const voiceUnavailable = await worker.fetch(request('/api/voice', { audio: 'AAAA' }), env, ctx());
if (voiceUnavailable.status !== 503) throw new Error('Voice availability guard failed');

const removedTranslation = await worker.fetch(request('/api/translate', { text: 'Hello', to: ['ru'] }), env, ctx());
if (removedTranslation.status !== 404) throw new Error('Removed Translator endpoint guard failed');
if (calls.some((url) => url.includes('cognitive.microsofttranslator.com'))) throw new Error('Removed Translator made an external call');

console.log('free-mode smoke tests passed');
globalThis.fetch = originalFetch;
