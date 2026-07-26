import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const targets = ['hizmetler.html', 'hakkimizda.html', 'albamen.html'];

  async function testDropdownOnPage(page, pageUrl) {
    console.log('Opening', pageUrl);
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('.main-nav', { timeout: 5000 });

    for (const hrefEnd of targets) {
      const triggerSel = `.main-nav .dropdown > .dropdown-trigger[href$="${hrefEnd}"]`;
      const menuSel = `${triggerSel} + .dropdown-menu`;

      const trigger = await page.$(triggerSel);
      if (!trigger) {
        console.error('No dropdown trigger found for', hrefEnd, 'on', pageUrl);
        return false;
      }

      try {
        await trigger.click();
      } catch (err) {
        await page.evaluate((s) => { const t = document.querySelector(s); if (t) t.click(); }, triggerSel);
      }

      await page.waitForTimeout(200);

      const isVisible = await page.isVisible(menuSel);
      if (!isVisible) {
        await page.evaluate((s) => {
          const t = document.querySelector(s);
          if (!t) return;
          const d = t.closest('.dropdown');
          if (d) {
            d.classList.add('active');
            t.setAttribute('aria-expanded', 'true');
          }
        }, triggerSel);
      }

      try {
        await page.waitForSelector(menuSel, { state: 'visible', timeout: 5000 });
      } catch (err) {
        console.error('Dropdown menu not visible for', hrefEnd, 'on', pageUrl);
        return false;
      }

      const menu = await page.$(menuSel);
      if (!menu) {
        console.error('Dropdown menu not found for', hrefEnd, 'on', pageUrl);
        return false;
      }

      const firstItem = await menu.$('a, button, [role="menuitem"]');
      if (!firstItem) {
        console.error('No menu item found for', hrefEnd, 'on', pageUrl);
        return false;
      }

      const box = await firstItem.boundingBox();
      if (!box) {
        console.error('Menu item has no bounding box for', hrefEnd, 'on', pageUrl);
        return false;
      }

      const centerX = Math.round(box.x + box.width / 2);
      const centerY = Math.round(box.y + box.height / 2);

      const topEl = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        const menuItem = el.closest('.dropdown-menu a, .dropdown-menu button, .dropdown-menu [role="menuitem"]');
        return menuItem ? menuItem.outerHTML : null;
      }, { x: centerX, y: centerY });

      if (!topEl) {
        console.error('An overlay or other element is covering the menu item at point', centerX, centerY, 'for', hrefEnd, 'on', pageUrl);
        return false;
      }

      console.log('SUCCESS:', hrefEnd, 'menu item is topmost at', centerX, centerY, 'on', pageUrl);

      await page.evaluate(() => { document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active')); });
      await page.waitForTimeout(120);
    }

    return true;
  }

  const desktopContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await desktopContext.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('albaCookieSeen', 'true'); } catch (e) {} });

  const pagesToCheck = [
    'http://localhost:8000/index.html',
    'http://localhost:8000/shop.html',
    'http://localhost:8000/eng/index.html',
    'http://localhost:8000/rus/index.html'
  ];

  for (const p of pagesToCheck) {
    const ok = await testDropdownOnPage(page, p);
    if (!ok) {
      await browser.close();
      process.exit(21);
    }
  }

  await browser.close();
  process.exit(0);
})();
