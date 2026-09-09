import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = fs.readFileSync('game/AlbaSpace/shared/station-living-motion.js', 'utf8');
new vm.Script(source, { filename: 'station-living-motion.js' });

for (const token of [
  'cameraFrame',
  'earthFrame',
  'solarFrame',
  'antennaFrame',
  'cadetFrame',
  'SolarRotaryPivot_',
  'HighGainAntenna',
  'TrackingAntenna',
  'Cadet_',
  'prefers-reduced-motion',
  'data',
  '20260909-living1'
]) assert.ok(source.includes(token), `missing living-motion token: ${token}`);

for (const locale of ['ru', 'tr', 'en']) {
  const html = fs.readFileSync(`game/AlbaSpace/${locale}/player.html`, 'utf8');
  assert.match(html, /station-living-motion\.js\?v=20260909-living1/);
  const livingIndex = html.indexOf('station-living-motion.js');
  const resultIndex = html.indexOf('station-result-fx.js');
  assert.ok(livingIndex > resultIndex, `${locale}: living motion should load after result FX`);
}

console.log('AlbaSpace living motion audit passed');
