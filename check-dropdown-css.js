#!/usr/bin/env node
/**
 * Validate shared header dropdown styling.
 * Regular TR/EN/RU/AR headers must share the homepage mobile dark-blue palette.
 * Desktop pages must reserve enough space below the header for dropdowns.
 * White shop/product header variants must keep their white dropdown palette.
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const entryCss = read('assets/css/dropdown-optimized.css');
const legacyCss = read('assets/css/dropdown-optimized-legacy.css');
const blueCss = read('assets/css/header-dropdown-blue.css');

const regularHeaders = ['header-tr.html', 'header-en.html', 'header-ru.html', 'header-ar.html'];
const whiteHeaders = ['header-tr-black.html', 'header-en-black.html', 'header-ru-black.html', 'header-ar-black.html'];

const checks = [];
const add = (name, pass) => checks.push({ name, pass: Boolean(pass) });

add('Dropdown entry imports legacy interaction/layout rules', /dropdown-optimized-legacy\.css/.test(entryCss));
add('Dropdown entry imports unified header theme', /header-dropdown-blue\.css/.test(entryCss));
add('Dropdown entry cache-busts desktop header clearance', /20260829-header-clearance/.test(entryCss));

add(
  'Legacy mobile inactive dropdown blocks pointer events',
  /\.dropdown:not\(\.active\)\s*\.dropdown-menu,[\s\S]*?pointer-events:\s*none\s*!important/.test(legacyCss)
);
add(
  'Legacy mobile active dropdown restores pointer events',
  /\.dropdown\.active\s*\.dropdown-menu,[\s\S]*?pointer-events:\s*auto\s*!important/.test(legacyCss)
);
add('Legacy mobile breakpoint remains present', /@media\s*\(max-width:\s*1023px\)/.test(legacyCss));

add('Canonical dropdown background is homepage mobile #020617', /--alba-dropdown-bg:\s*#020617/i.test(blueCss));
add('Canonical dropdown text is #e5e7eb', /--alba-dropdown-text:\s*#e5e7eb/i.test(blueCss));
add('Canonical cyan hover text is #00c2ff', /--alba-dropdown-hover-text:\s*#00c2ff/i.test(blueCss));
add('Desktop header clearance is exactly 112px', /--alba-desktop-header-clearance:\s*112px/i.test(blueCss));
add(
  'Desktop clearance only applies from 1024px',
  /@media\s*\(min-width:\s*1024px\)[\s\S]*?body:not\(\.home-page\)[\s\S]*?margin-bottom:\s*var\(--alba-desktop-header-clearance\)\s*!important/.test(blueCss)
);
add(
  'Home pages are excluded from extra desktop clearance',
  /body\.home-page[\s\S]*?margin-bottom:\s*0\s*!important/.test(blueCss)
);
add(
  'Regular main navigation dropdowns use non-black header scope',
  /\.site-header:not\(\.site-header--black\)\s+\.main-nav[\s\S]*?\.dropdown-menu/.test(blueCss)
);
add(
  'Regular language dropdown uses the same non-black scope',
  /\.site-header:not\(\.site-header--black\)\s+\.lang-dropdown-menu/.test(blueCss)
);
add(
  'Regular account dropdown uses the same non-black scope',
  /\.site-header:not\(\.site-header--black\)[\s\S]*?(?:\.alien-menu|#alienMenu)/.test(blueCss)
);
add('Unified theme explicitly defines desktop rules', /@media\s*\(min-width:\s*1024px\)/.test(blueCss));
add('Unified theme explicitly defines mobile rules', /@media\s*\(max-width:\s*1023px\)/.test(blueCss));
add(
  'White shop headers have a high-specificity exclusion',
  /\.site-header\.site-header--black\s+\.main-nav[\s\S]*?background:\s*#ffffff\s*!important/i.test(blueCss)
);
add(
  'product-text-black pages retain white dropdown protection',
  /html\.product-text-black[\s\S]*?background:\s*#ffffff\s*!important/i.test(blueCss)
);

for (const file of regularHeaders) {
  const html = read(file);
  add(`${file}: regular site-header class`, /<header\s+class="site-header"/.test(html));
  add(`${file}: does not use white header exclusion class`, !/site-header--black/.test(html.split('</header>')[0]));
  add(`${file}: loads shared dropdown entry`, /\/assets\/css\/dropdown-optimized\.css/.test(html));
}

for (const file of whiteHeaders) {
  const html = read(file);
  add(`${file}: marked as white shop header`, /<header\s+class="[^"]*site-header--black[^"]*"/.test(html));
  add(`${file}: loads shared dropdown entry safely`, /\/assets\/css\/dropdown-optimized\.css/.test(html));
}

console.log('🔍 Checking Alba Space header dropdown consistency...\n');
let allPassed = true;
for (const check of checks) {
  console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
  if (!check.pass) allPassed = false;
}

console.log(`\n${allPassed ? '✅ All header dropdown checks passed!' : '❌ Header dropdown consistency check failed!'}`);
process.exit(allPassed ? 0 : 1);
