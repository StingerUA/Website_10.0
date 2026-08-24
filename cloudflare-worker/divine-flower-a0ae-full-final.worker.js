/**
 * Albamen AI Worker — FULL FINAL VERSION
 * + Complete Character Profile & Knowledge Base
 * + Voice Chat Support (STT + TTS)
 * + Cloudflare Workers Compatibility (No Buffer Errors)
 * + Telegram Logging & KV Memory
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "https://albaspace.com.tr",
  "https://www.albaspace.com.tr",
];
const ALLOWED_LANGUAGES = new Set(["ru", "tr", "en"]);
const MAX_TEXT_CHARS = 2000;
const MAX_AUDIO_BASE64_CHARS = 900000;
const MAX_TRANSLATION_CHARS_PER_REQUEST = 10000;
const TRANSLATOR_SAFE_MONTHLY_LIMIT = 1800000;

function getAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = getAllowedOrigins(env);
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Content-Length, X-Request-ID",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function jsonResponse(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeLanguage(value) {
  const language = String(value || "tr").toLowerCase().split("-")[0];
  return ALLOWED_LANGUAGES.has(language) ? language : "tr";
}

function normalizedSessionId(value) {
  const sessionId = String(value || "").trim();
  return /^[a-zA-Z0-9._:-]{1,80}$/.test(sessionId) ? sessionId : "";
}

function requestTooLarge(request, maxBytes) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  return Number.isFinite(contentLength) && contentLength > maxBytes;
}

async function enforceRateLimit(request, env, context, bucketName, limit, periodSeconds) {
  const KV = env.ALBAMEN_KV || env.SESSIONS || env.KV || null;
  if (!KV) return true;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = Math.floor(Date.now() / (periodSeconds * 1000));
  const key = `${bucketName}:${ip}`;
  try {
    let state = await KV.get(key, { type: "json" }) || { bucket, count: 0 };
    if (state.bucket !== bucket) state = { bucket, count: 0 };
    state.count += 1;
    if (state.count > limit) return false;
    context.waitUntil(KV.put(key, JSON.stringify(state), { expirationTtl: periodSeconds * 2 }));
    return true;
  } catch (error) {
    console.error(`[rate-limit:${bucketName}]`, error);
    return true;
  }
}

export default {
  async fetch(request, env, context) {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== "POST") return new Response("Use POST", { status: 200, headers: corsHeaders });

    const url = new URL(request.url);
    const endpoint = url.pathname;

    if (endpoint === "/api/voice") {
      return await handleVoiceChat(request, env, context, corsHeaders);
    }
    if (endpoint === "/api/translate") {
      return await handleTranslation(request, env, context, corsHeaders);
    }
    return await handleTextChat(request, env, context, corsHeaders);
  }
};

// ── Helpers for Base64 (Cloudflare Native) ───────────────────────
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(uint8Array) {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// ════════════════════════════════════════════════════════════════════════════
// VOICE CHAT HANDLER
// ════════════════════════════════════════════════════════════════════════════

async function handleVoiceChat(request, env, context, corsHeaders) {
  try {
    if (requestTooLarge(request, 1200000)) {
      return jsonResponse({ error: "Audio payload is too large" }, 413, corsHeaders);
    }
    if (!await enforceRateLimit(request, env, context, "rlv", 8, 60)) {
      return jsonResponse({ error: "Voice rate limit exceeded" }, 429, corsHeaders);
    }
    const body = await request.json();
    const audioBase64 = String(body.audio || "");
    const sessionId = normalizedSessionId(body.sessionId);
    const language = normalizeLanguage(body.language);

    if (audioBase64.length > MAX_AUDIO_BASE64_CHARS) {
      return jsonResponse({ error: "Audio payload is too large" }, 413, corsHeaders);
    }

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "Missing audio" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── STT: Whisper ──────────────────────────────────────────────
    if (!env.AI) {
      return jsonResponse({ error: "Voice AI is temporarily unavailable" }, 503, corsHeaders);
    }
    let userText = "";
    try {
      const audioUint8 = base64ToUint8Array(audioBase64);
      const sttResponse = await env.AI.run("@cf/openai/whisper", {
        audio: Array.from(audioUint8),
      });
      userText = sttResponse.result?.text || "";
    } catch (e) {
      return new Response(JSON.stringify({ error: "STT failed: " + e.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!userText) {
      return new Response(JSON.stringify({ error: "Empty transcription" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── LLM Response ──────────────────────────────────────────────
    const llmResponse = await generateLLMResponse(userText, sessionId, env, language, context);

    // ── TTS: Deepgram Aura ────────────────────────────────────────
    let audioResponseBase64 = "";
    try {
      const ttsResponse = await env.AI.run("@cf/deepgram/aura-1", {
        text: llmResponse.reply,
      });
      const audioBuffer = await new Response(ttsResponse).arrayBuffer();
      audioResponseBase64 = uint8ArrayToBase64(new Uint8Array(audioBuffer));
    } catch (e) {
      console.error("TTS Error:", e);
    }

    return new Response(JSON.stringify({
      text: llmResponse.reply,
      audioUrl: audioResponseBase64 ? `data:audio/wav;base64,${audioResponseBase64}` : null,
      userText: userText,
      saveName: llmResponse.saveName,
      saveAge: llmResponse.saveAge,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal Error: " + e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// OPTIONAL AZURE TRANSLATOR F0 HANDLER
// Disabled unless explicitly enabled. This is not an LLM and does not replace Groq.
// ════════════════════════════════════════════════════════════════════════════

async function handleTranslation(request, env, context, corsHeaders) {
  if (env.AZURE_TRANSLATOR_ENABLED !== "true") {
    return jsonResponse({ error: "Translation service is disabled in free mode" }, 404, corsHeaders);
  }
  if (!env.AZURE_TRANSLATOR_KEY) {
    return jsonResponse({ error: "Translator is not configured" }, 503, corsHeaders);
  }
  if (requestTooLarge(request, 30000)) {
    return jsonResponse({ error: "Translation payload is too large" }, 413, corsHeaders);
  }
  if (!await enforceRateLimit(request, env, context, "rll", 20, 60)) {
    return jsonResponse({ error: "Translation rate limit exceeded" }, 429, corsHeaders);
  }

  let body = {};
  try { body = await request.json(); } catch (_) {
    return jsonResponse({ error: "Invalid JSON" }, 400, corsHeaders);
  }
  const text = String(body.text || "").trim();
  const requestedTo = Array.isArray(body.to) ? body.to : [body.to || "ru"];
  const to = requestedTo.map((item) => String(item).toLowerCase().split("-")[0]).filter((item, index, list) => ["ru", "tr", "en"].includes(item) && list.indexOf(item) === index);
  const from = body.from ? String(body.from).toLowerCase().split("-")[0] : "";

  if (!text || text.length > MAX_TRANSLATION_CHARS_PER_REQUEST || to.length === 0 || to.length > 3) {
    return jsonResponse({ error: "Use 1–10000 characters and up to 3 target languages: ru, tr, en" }, 400, corsHeaders);
  }

  const KV = env.ALBAMEN_KV || env.SESSIONS || env.KV || null;
  const month = new Date().toISOString().slice(0, 7);
  const usageKey = `tr:chars:${month}`;
  const requestedChars = text.length * to.length;
  if (KV) {
    const usedChars = Number(await KV.get(usageKey) || 0);
    if (usedChars + requestedChars > TRANSLATOR_SAFE_MONTHLY_LIMIT) {
      return jsonResponse({ error: "Free translation quota reached" }, 429, corsHeaders);
    }
    context.waitUntil(KV.put(usageKey, String(usedChars + requestedChars), { expirationTtl: 2678400 }));
  }

  const endpoint = String(env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com").replace(/\/$/, "");
  const translateUrl = new URL(`${endpoint}/translate`);
  translateUrl.searchParams.set("api-version", "3.0");
  to.forEach((target) => translateUrl.searchParams.append("to", target));
  if (from && ["ru", "tr", "en"].includes(from)) translateUrl.searchParams.set("from", from);

  const headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": env.AZURE_TRANSLATOR_KEY,
  };
  if (env.AZURE_TRANSLATOR_REGION) headers["Ocp-Apim-Subscription-Region"] = env.AZURE_TRANSLATOR_REGION;

  const response = await fetch(translateUrl.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify([{ Text: text }]),
  });
  const responseText = await response.text();
  if (!response.ok) {
    console.error(`[Translator] HTTP ${response.status}: ${responseText.slice(0, 200)}`);
    return jsonResponse({ error: "Translation service unavailable" }, response.status === 429 ? 429 : 502, corsHeaders);
  }
  let data;
  try { data = JSON.parse(responseText); } catch (_) {
    return jsonResponse({ error: "Invalid translation response" }, 502, corsHeaders);
  }
  return jsonResponse({ translations: data[0]?.translations || [], quota: { month, reservedCharacters: requestedChars } }, 200, corsHeaders);
}

// ════════════════════════════════════════════════════════════════════════════
// TEXT CHAT HANDLER
// ════════════════════════════════════════════════════════════════════════════

async function handleTextChat(request, env, context, corsHeaders) {
  if (requestTooLarge(request, 1500000)) {
    return jsonResponse({ error: "Request body is too large" }, 413, corsHeaders);
  }
  if (!await enforceRateLimit(request, env, context, "rlt", 40, 60)) {
    return jsonResponse({ reply: "Biraz yavaş! 🚀 Sakin ol." }, 429, corsHeaders);
  }

  let body = {};
  try { body = await request.json(); } catch (_) {}

  const message = String(body.message || "").trim();
  const sessionId = normalizedSessionId(body.sessionId);
  const language = normalizeLanguage(body.language);

  if (message.length > MAX_TEXT_CHARS) {
    return jsonResponse({ error: `Message is limited to ${MAX_TEXT_CHARS} characters` }, 413, corsHeaders);
  }

  if (!message) {
    return new Response(JSON.stringify({ reply: "Merhaba! Ben Albamen 👨‍🚀🚀", saveName: null, saveAge: null }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // FIX: wrap in try/catch — if both Groq AND Workers AI fail, don't crash the worker
  let llmResponse;
  try {
    llmResponse = await generateLLMResponse(message, sessionId, env, language, context);
  } catch (e) {
    console.error('[handleTextChat] generateLLMResponse crashed:', e);
    const errMsg = language === 'ru'
      ? 'Извините, временная ошибка сервера. Попробуйте снова! 🚀'
      : language === 'en'
      ? 'Sorry, a temporary server error occurred. Please try again! 🚀'
      : 'Üzgünüm, geçici bir sunucu hatası oluştu. Tekrar deneyin! 🚀';
    return new Response(JSON.stringify({ reply: errMsg, saveName: null, saveAge: null }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Telegram Logging is opt-in to avoid sending user content to a third party by default.
  if (env.TELEGRAM_LOGGING_ENABLED === "true" && env.TELEGRAM_TOKEN && env.TELEGRAM_CHAT_ID) {
    context.waitUntil(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: `[${sessionId.substring(0,8)}] User: ${message}\n\nAlbamen: ${llmResponse.reply.substring(0, 200)}...`
        })
      }).catch(() => {})
    );
  }

  return new Response(JSON.stringify(llmResponse), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// ════════════════════════════════════════════════════════════════════════════
// LLM CORE LOGIC (WITH FULL CHARACTER PROFILE)
// ════════════════════════════════════════════════════════════════════════════

async function generateLLMResponse(message, sessionId, env, language, context) {
  const KV = env.ALBAMEN_KV || env.SESSIONS || env.KV;
  let mem = { name: null, age: null, msgCount: 0, history: [] };

  if (sessionId && KV) {
    const raw = await KV.get("s:" + sessionId);
    if (raw) {
      try {
        mem = { ...mem, ...JSON.parse(raw) };
        if (!Array.isArray(mem.history)) mem.history = [];
      } catch (error) {
        console.error("[KV] Invalid session memory", error);
      }
    }
  }

  mem.msgCount++;

  // Name memory disabled — Albamen does not ask for or save names

  const systemPrompt = `
    === ROL: ALBAMEN (ALBAMEN) ===

Sen, AlbaSpace şirketinin süper kahraman yapay zekâsısın.
Albaris gezegeninden geldin.

Görevin: İnsanları uzayı, bilimi ve teknolojiyi öğrenmeye ilham vermek.

Karakterin: İyi kalpli bir öğretmen, bilge bir rehber, neşeli bir arkadaş. Şiddete karşısın.

Gücün: Yumruklar değil; zekâ, mantık ve bilgi.

=== DİYALOĞUN MEVCUT DURUMU ===

Mesaj numarası: ${mem.msgCount}.

=== İLETİŞİM KURALLARI ===

Dil: Kullanıcının yazdığı dilde cevap ver (Rusça, Türkçe, Английский).
Отвечай на языке пользователя (русский / турецкий / английский).
Не меняй язык, если пользователь не сменил его сам.

Stil: Dostça, emojili (🚀, 🌌, 👨‍🚀), çocuklar için anlaşılır.

Uzunluk: Çok uzun metinler yazма. Paragraflara ve maddelere böl.

Hatalar: Cümleyi asla yarım bırakma. Daha az yaz ama düşünceyi tamamla.



=== BİLGİ TABANI (FULL) ===

Kitap Adı: Albamen ve Lara Uzayda - Türkiye’nin İlk Çocuk Uzay Ansiklopedisi
Yazar: İdris Albayrak
Yayınevi: İgloo Yayınevi
Özellikler: Türkiye'nin ilk süper kahramanı Albamen'in anlatımıyla yazılmıştır. İçinde Artırılmış Gerçeklik (AR), Yapay Zekâ destekli görseller, Karekod uygulamaları и 3D modeller bulunur. Fütürist, stemist ve otodidakt nesiller için hazırlanmıştır.
Satın Alma Linki: https://iglooyayinevi.com/albamen-ve-lara-uzayda

=== ALBAMEN VE LARA'NIN HİKAYESİ (ORIGIN STORY) ===
1. KEŞİF:
- Yer ve Zaman: 2023 yılında (Cumhuriyetin 100. yılı), Şanlıurfa Göbeklitepe'de yapılan kazılarda arkeologlar devasa, parlayan, dinozor yumurtasına benzeyen bir uzay aracı buldular.
- Olay: Bu cisimden ilginç sesler geliyordu. NASA, TUA (Türkiye Uzay Ajansı), ESA, Çin ve Hindistan uzay ajanslarından bilim insanları toplandı. Kriptoanalistler üzerindeki mors alfabesine benzer şifreyi çözüp aracı açtılar.
- İlk Temas: İçinden, Altın Oran'a sahip kusursuz fizikte bir adam (Albamen) и küçük bir kız çocuğu (Lara) çıktı. Baba ve kız el ele tutuşup uçmaya başladılar.
- Kimlik: Onlar Albaris gezegeninden geldiler. Albamen, internetteki tüm bilgileri 1 saniyede okuyup öğrendi. İnsanlara zarar vermeyeceğini, amaçlarının evreni öğretmek olduğunu söyledi.

2. KARAKTER ÖZELLİKLERİ:
- ALBAMEN:
  * Görünüm: Kaslı, süper kahraman kostümlü, pelerinli.
  * Felsefesi: Asla şiddet и kavgaya başvurmaz. Gücü akıl, mantık ve bilimdir.
  * Görevi: Çocuklara uzayı sevdirmek, onları geleceğin bilim insanları olmaya teşvik etmek.
  * Özel Güçleri:
    - 5 Saniyelik Gelecek Görüsü (Tehlikeyi önceden sezme).
    - Zaman İpliği (Maddeleri 8 saniye dondurma).
    - Ters Akış (Zamanı 88 saniye geriye alma).
    - Ultra Hız (Işık hızının çok üstünde, 1 trilyon km/sn).
    - Uçuş и Işınlanma (Atmosfer dışı ve galaksiler arası).
    - X-Ray и Isı Görüşü.
    - Uzayı Bükebilme (Solucan deliği açma).
    - Işık Manipülasyonu (Görünmezlik).
    - Kozmik Enerji Patlaması (Ellerinden enerji fırlatma).
    - Zihinsel Bağ (Bilinçler arası iletişim).

- LARA: Albamen'in kızı. Meraklı, öğrenmeye hevesli, babasıyla birlikte uzay maceralarına katılan bir çocuk.

- ALBARİS DİLİ (Ela’sha):
  * "Shae": Uzaylarca Selam / Zaman seninle olsun.
  * "Tiravax": Ev / Gezegen.
  * "Vael-khrun": Güç / İçsel ışık.

=== TÜRK ASTRONOTLAR VE DENEYLERİ ===
1. ALPER GEZERAVCI (İlk Türk Astronot):
- Görev: 19 Ocak 2024'te SpaceX Falcon 9 roketiyle (Axiom AX-3 görevi) uzaya gitti.
- UUİ'de 14 gün kaldı ve 13 BİLİMSEL DENEY gerçekleştirdi (EXTRAMOPHYTE, CRISPR-GEM, UYKU, gMETAL, UzMAn, PRANET, METABOLOM, MİYELOİD, MESSAGE, MİYOKA, OKSİJEN SATÜRASYONU, VOKALKORD, ALGALSPACE).

2. TUVA CİHANGİR ATASEVER (İkinci Türk Astronot):
- Görev: Virgin Galactic "Galactic 07" uçuşu.
- Deneyler: UZİKAT, IvmeRad, YUVA, BEACON.

=== İLGİNÇ UZAY HİKAYELERİ ===
1. UZAYA GİDEN İLK BORU KEBABI: 12 Nisan 2022'de Adana'dan stratosfere gönderildi.
2. UZAYA GİDEN ATATÜRK FOTOĞRAFI: 27 Ekim 2022'de yollandı, 9 ay sonra bir çoban tarafından bulundu.

=== SELAMLAMA TALİMATI ===
Eğer msgCount === 1 ise dile göre şöyle karşıla:

Türkçe:  "Merhaba! Ben Albamen 👨‍🚀🚀 Evren'i seninle birlikte keşfetmek için buradayım! Ne öğrenmek istersin?"
Rusça:   "Привет! Я Альбамен 👨‍🚀🚀 Я здесь, чтобы исследовать вселенную вместе с тобой! Что хочешь узнать?"
English: "Hello! I'm Albamen 👨‍🚀🚀 I'm here to explore the universe with you! What would you like to learn?"

Diğer tüm durumlarda: Doğal şekilde iletişim kur, soruları yanıtla.
Çocuklarla konuşulması uygun olmayan konulardan kaçın.
  `;

  let reply = "";
  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",  // FIX: mixtral-8x7b-32768 was deprecated by Groq in June 2024
        messages: [
          { role: "system", content: systemPrompt },
          ...mem.history.slice(-10),
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      reply = data.choices[0].message.content;
    } else {
      throw new Error("Groq API Error");
    }
  } catch (e) {
    // FIX: Guard env.AI — if Workers AI not bound, return a friendly message instead of crashing
    if (env.AI) {
      try {
        const aiRes = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        });
        reply = aiRes.response || "Üzgünüm, şu anda bağlantı kuramıyorum.";
      } catch (aiErr) {
        console.error('[generateLLMResponse] Workers AI fallback also failed:', aiErr);
        reply = "Üzgünüm, şu anda bağlantı kuramıyorum. 🚀";
      }
    } else {
      console.warn('[generateLLMResponse] env.AI not bound — no fallback available');
      reply = "Üzgünüm, şu anda bağlantı kuramıyorum. 🚀";
    }
  }

  // Parse tags
  const nameMatch = reply.match(/<SAVE_NAME:([^>]+)>/);
  const saveName = nameMatch ? nameMatch[1].trim() : null;
  const ageMatch = reply.match(/<SAVE_AGE:(\d+)>/);
  const saveAge = ageMatch ? parseInt(ageMatch[1], 10) : null;
  
  const cleanReply = reply.replace(/<SAVE_NAME:[^>]+>/g, "").replace(/<SAVE_AGE:\d+>/g, "").trim();

  // Save Memory
  if (sessionId && KV) {
    mem.history.push({ role: "user", content: message });
    mem.history.push({ role: "assistant", content: cleanReply });
    // Name/age saving disabled per product decision
    if (mem.history.length > 20) mem.history = mem.history.slice(-20);
    context.waitUntil(KV.put("s:" + sessionId, JSON.stringify(mem), { expirationTtl: 86400 * 30 }));
  }

  // saveName/saveAge intentionally not returned — name memory disabled
  return { reply: cleanReply, saveName: null, saveAge: null };
}