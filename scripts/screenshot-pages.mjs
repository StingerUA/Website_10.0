import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';

const root = path.resolve('.');
const port = 8000;

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch (e) {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    // prevent path traversal
    const safePath = path.join(root, path.normalize(urlPath));
    const resolved = path.resolve(safePath);
    if (!resolved.startsWith(root)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const exists = await fileExists(resolved);
    if (!exists) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(resolved).toLowerCase();
    const map = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
    const content = await fs.readFile(resolved);
    res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
    res.end(content);
  } catch (err) {
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(port, async () => {
  console.log(`Server started at http://localhost:${port}`);

  const pages = [
    '/',
    '/eng/',
    '/albamen.html',
    '/eng/albaman.html',
    '/hakkimizda.html',
    '/eng/hakkimizda.html',
    '/galeri.html',
    '/atlas.html'
  ];

  const outDir = path.join(root, 'test-screenshots');
  await fs.mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    for (const p of pages) {
      const page = await browser.newPage();
      const url = `http://localhost:${port}${p}`;
      console.log('Visiting', url);
      const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }).catch(e => null);
      if (!resp) {
        console.warn('Failed to load', url);
      }
      // wait for the global widget or fallback
      try {
        await page.waitForSelector('#ai-launcher-btn-global, .ai-launcher-btn', { timeout: 4000 });
      } catch (e) {
        console.warn('Widget not found on', url);
      }
      // small delay to allow JS to finish
      await page.waitForTimeout(800);
      const fileName = p === '/' ? 'index' : p.replace(/\//g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
      const filePath = path.join(outDir, `${fileName}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log('Saved', filePath);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close(() => console.log('Server stopped'));
    process.exit(0);
  }
});
