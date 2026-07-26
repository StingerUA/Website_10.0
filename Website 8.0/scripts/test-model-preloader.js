const fs = require('fs');
const { JSDOM } = require('jsdom');

function runTest(lang, expectedSubstring) {
  const html = `<!doctype html><html lang="${lang}"><head></head><body><model-viewer src="/assets/models/test.glb"></model-viewer></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
  const win = dom.window;
  // inject minimal globals used by the script
  win.window = win;
  // Ensure readyState is not 'loading' so the script runs init immediately
  Object.defineProperty(win.document, 'readyState', { value: 'complete', configurable: true });

  const scriptSource = fs.readFileSync(require('path').resolve(__dirname, '../assets/js/model-preloader.js'), 'utf8');

  // Evaluate the script in the jsdom window context
  const vm = require('vm');
  const script = new vm.Script(scriptSource, { filename: 'model-preloader.js' });
  const context = vm.createContext(win);
  script.runInContext(context);

  // Allow microtasks
  return new Promise((resolve) => {
    setTimeout(() => {
      const overlay = win.document.querySelector('.model-loading-overlay');
      if (!overlay) {
        resolve({ ok: false, reason: 'no overlay' });
        return;
      }
      const text = overlay.textContent || '';
      resolve({ ok: text.includes(expectedSubstring), text });
    }, 50);
  });
}

(async function(){
  console.log('Testing TR...');
  const tr = await runTest('tr', 'Lütfen bekleyin');
  console.log('TR result:', tr);

  console.log('Testing EN...');
  const en = await runTest('en', 'Please wait');
  console.log('EN result:', en);

  process.exit(tr.ok && en.ok ? 0 : 2);
})();
