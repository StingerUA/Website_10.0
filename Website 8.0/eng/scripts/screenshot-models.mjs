#!/usr/bin/env node
import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import url from 'url';

async function startStaticServer(root, port=8000){
  const server = http.createServer(async (req, res) => {
    try{
      const parsed = url.parse(req.url || '/');
      let pathname = decodeURIComponent(parsed.pathname || '/');
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filePath = path.join(root, pathname.replace(/^[\/]+/, ''));
      const stat = await fs.stat(filePath).catch(()=>null);
      if (!stat || !stat.isFile()){
        res.statusCode = 404; res.end('Not found'); return;
      }
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const map = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml'};
      res.setHeader('Content-Type', map[ext] || 'application/octet-stream');
      res.end(data);
    }catch(err){ res.statusCode=500; res.end(String(err)); }
  });

  return new Promise((resolve,reject)=>{
    server.listen(port, ()=> resolve({server,port}));
    server.on('error', reject);
  });
}

async function ensurePuppeteer(){
  try{
    return (await import('puppeteer'));
  }catch(e){
    console.error('Puppeteer is not installed. Run: npm install puppeteer');
    process.exit(1);
  }
}

async function run(){
  const root = process.cwd();
  const { server, port } = await startStaticServer(root, 8000);
  console.log('Serving', root, 'on http://127.0.0.1:' + port);

  const puppeteer = await ensurePuppeteer();
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width:1280, height:900});

  // import atlas lists
  const atlas = await import(path.join(root, 'assets', 'data', 'atlas-pages.generated.js'));
  const tr = atlas.atlasTR || [];
  const en = atlas.atlasEN || [];

  // pick a small set of pages to verify: first 3 TR and first 3 EN or as many as available
  const samples = [];
  for (let i=0;i<Math.min(3,tr.length);i++) samples.push({lang:'tr', path:tr[i]});
  for (let i=0;i<Math.min(3,en.length);i++) samples.push({lang:'en', path:en[i]});

  const outDir = path.join(root, 'assets','screenshots');
  await fs.mkdir(outDir, {recursive:true});

  for (const s of samples){
    const urlPath = 'http://127.0.0.1:' + port + s.path;
    const name = (s.path.replace(/\//g,'_') || 'page') + '.png';
    console.log('Capturing', urlPath, '→', name);
    try{
      await page.goto(urlPath, {waitUntil:'networkidle2', timeout:30000});
      // wait for h1 injection (title wrapper) or model-viewer to be present
      await page.waitForTimeout(800); // allow loader to attach
      try{ await page.waitForSelector('.model-title-wrap, model-viewer', {timeout:5000}); }catch(e){}
      // take full page screenshot
      await page.screenshot({path:path.join(outDir, name), fullPage:true});
      console.log('Saved', name);
    }catch(err){ console.error('Failed to capture', s.path, err.message || err); }
  }

  await browser.close();
  server.close();
  console.log('Done. Screenshots saved to', outDir);
}

run().catch(err=>{ console.error(err); process.exit(1); });
