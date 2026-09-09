import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = fs.readFileSync('game/AlbaSpace/shared/station-endgame-ux.js', 'utf8');
new vm.Script(source, { filename: 'station-endgame-ux.js' });

for (const token of [
  'FINAL MODULE',
  'ПОСЛЕДНИЙ МОДУЛЬ',
  'SON MODÜL',
  '10 / 10',
  'ENDGAME',
  'winnerId',
  'sessionStorage',
  'tweenCamera',
  'pullBack',
  'prefers-reduced-motion',
  'alba-final-module-warning',
  'alba-endgame-overlay',
  '20260909-endgame1'
]) assert.ok(source.includes(token), `missing endgame UX token: ${token}`);

assert.ok(!source.includes('AlbaGame.command('), 'endgame UX must remain presentation-only');

for (const locale of ['ru', 'tr', 'en']) {
  const html = fs.readFileSync(`game/AlbaSpace/${locale}/player.html`, 'utf8');
  assert.match(html, /station-endgame-ux\.js\?v=20260909-endgame1/);
  const endgameIndex = html.indexOf('station-endgame-ux.js');
  const stationPhaseIndex = html.indexOf('station-phase-ui.js');
  const playerIndex = html.indexOf('./assets/js/player.js');
  assert.ok(endgameIndex > stationPhaseIndex, `${locale}: endgame UX should load after station phase UI`);
  assert.ok(endgameIndex < playerIndex, `${locale}: endgame UX should initialize before player bootstrap`);
}

const backend = fs.readFileSync('cloudflare-worker/game-backend.js', 'utf8');
assert.match(backend, /player\.small\s*===\s*MAX\.small\s*&&\s*player\.large\s*===\s*MAX\.large/);
assert.match(backend, /room\.winnerId\s*=\s*player\.id/);
assert.match(backend, /room\.phase\s*=\s*["']ENDGAME["']/);

console.log('AlbaSpace 9/10 warning + endgame UX audit passed');
