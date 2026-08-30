(() => {
  "use strict";

  const locale = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  const target = locale === "tr" ? "tr" : locale === "ru" ? "ru" : locale === "ar" ? "ar" : "en";
  if (target === "en") return;

  const CACHE_PREFIX = "oa-dynamic-translation-v1:";
  const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
  const encoder = new TextEncoder();

  const labelsToTranslate = {
    tr: new Set(["açıklama", "hava durumu kısıtları", "durum", "yörünge"]),
    ru: new Set(["описание", "погодные ограничения", "статус", "орбита"]),
    ar: new Set(["الوصف", "الطقس", "الحالة", "المدار"])
  }[target] || new Set();

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function readCache(text) {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${target}:${hash(text)}`);
      if (!raw) return "";
      const saved = JSON.parse(raw);
      if (!saved?.time || Date.now() - saved.time > CACHE_TTL) return "";
      return typeof saved.text === "string" ? saved.text : "";
    } catch {
      return "";
    }
  }

  function writeCache(source, translated) {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${target}:${hash(source)}`, JSON.stringify({ time: Date.now(), text: translated }));
    } catch {}
  }

  function htmlDecode(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(value || "");
    return textarea.value;
  }

  function splitForTranslation(text, maxBytes = 430) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return [];
    if (encoder.encode(clean).length <= maxBytes) return [clean];

    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const chunks = [];
    let current = "";

    const pushWords = sentence => {
      const words = sentence.trim().split(/\s+/);
      let part = "";
      for (const word of words) {
        const next = part ? `${part} ${word}` : word;
        if (encoder.encode(next).length > maxBytes && part) {
          chunks.push(part);
          part = word;
        } else {
          part = next;
        }
      }
      if (part) chunks.push(part);
    };

    for (const sentence of sentences) {
      const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
      if (encoder.encode(next).length <= maxBytes) {
        current = next;
        continue;
      }
      if (current) chunks.push(current);
      current = "";
      if (encoder.encode(sentence.trim()).length <= maxBytes) current = sentence.trim();
      else pushWords(sentence);
    }
    if (current) chunks.push(current);
    return chunks;
  }

  async function translateChunkWithMyMemory(text) {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", `en|${target}`);
    url.searchParams.set("mt", "1");
    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`);
    const data = await response.json();
    const translated = htmlDecode(data?.responseData?.translatedText || "").trim();
    if (!translated || /^QUERY LENGTH LIMIT/i.test(translated)) throw new Error("MyMemory returned no translation");
    return translated;
  }

  async function translateChunkWithGoogle(text) {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "en");
    url.searchParams.set("tl", target);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Translate fallback HTTP ${response.status}`);
    const data = await response.json();
    const translated = Array.isArray(data?.[0]) ? data[0].map(row => row?.[0] || "").join("").trim() : "";
    if (!translated) throw new Error("Translate fallback returned no translation");
    return translated;
  }

  async function translateText(text) {
    const source = String(text || "").replace(/\s+/g, " ").trim();
    if (!source) return source;
    const cached = readCache(source);
    if (cached) return cached;

    const chunks = splitForTranslation(source);
    const output = [];
    for (const chunk of chunks) {
      let translated = "";
      try {
        translated = await translateChunkWithMyMemory(chunk);
      } catch (primaryError) {
        try {
          translated = await translateChunkWithGoogle(chunk);
        } catch (fallbackError) {
          console.warn("[Orbital Atlas] dynamic translation unavailable", primaryError, fallbackError);
          return source;
        }
      }
      output.push(translated);
    }
    const result = output.join(" ").replace(/\s+/g, " ").trim() || source;
    writeCache(source, result);
    return result;
  }

  async function translateNode(node) {
    if (!node || node.dataset.ocTranslatedFor === target || node.dataset.ocTranslating === "1") return;
    const source = (node.textContent || "").trim();
    if (!source || source.length < 2) return;
    node.dataset.ocTranslating = "1";
    try {
      const translated = await translateText(source);
      if (translated) node.textContent = translated;
      node.dataset.ocTranslatedFor = target;
    } finally {
      delete node.dataset.ocTranslating;
    }
  }

  async function localize(root) {
    if (!root) return;
    const jobs = [];

    root.querySelectorAll(".oc-detail-lead").forEach(node => jobs.push(translateNode(node)));

    const statusBadge = root.querySelector(".oc-detail-badges .oc-badge:first-child");
    if (statusBadge) jobs.push(translateNode(statusBadge));

    root.querySelectorAll(".oc-info-item").forEach(item => {
      const label = (item.querySelector("span")?.textContent || "").trim().toLowerCase();
      if (!labelsToTranslate.has(label)) return;
      const value = item.querySelector("strong");
      if (value) jobs.push(translateNode(value));
    });

    await Promise.allSettled(jobs);
  }

  const root = document.getElementById("ocLaunchDetail") || document.getElementById("ocRocketDetail");
  if (!root) return;

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      localize(root);
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
})();
