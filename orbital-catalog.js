(() => {
  "use strict";

  window.ORBITAL_LIBRARY_API = window.ORBITAL_LIBRARY_API || "https://albaspace-api.nncdecdgc.workers.dev/api/orbital/ll2";

  const existing = document.querySelector('script[data-orbital-catalog-core]');
  if (existing) return;

  const script = document.createElement("script");
  script.src = "/orbital-catalog-core.js?v=20260830-worker-cache-1";
  script.async = false;
  script.dataset.orbitalCatalogCore = "1";
  script.onerror = () => console.error("[Orbital Atlas] Failed to load catalogue core");
  document.head.appendChild(script);
})();
