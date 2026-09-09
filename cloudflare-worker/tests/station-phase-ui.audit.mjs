import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = fs.readFileSync('game/AlbaSpace/shared/station-phase-ui.js', 'utf8');
new vm.Script(source, { filename: 'station-phase-ui.js' });

for (const token of [
  'STATION PHASE',
  'İSTASYON AŞAMASI',
  'ФАЗА СТАНЦИИ',
  'data-station-action-switch',
  'data-station-section',
  'moduleBuiltThisRound',
  'startSlotPulse',
  'AlbaStationBuildMode',
  'AlbaCrewSlotMode',
  'station-action-flash',
  'station-next-question-transition',
  'prefers-reduced-motion',
  '20260909-stationphase1'
]) assert.ok(source.includes(token), `missing station-phase token: ${token}`);

assert.match(source, /phase === "STATION"/);
assert.match(source, /lastPhase === "STATION" && phase === "QUESTION"/);
assert.match(source, /modules > lastModuleCount/);
assert.match(source, /active > lastActiveCadets/);

for (const locale of ['ru', 'tr', 'en']) {
  const html = fs.readFileSync(`game/AlbaSpace/${locale}/player.html`, 'utf8');
  assert.match(html, /station-phase-ui\.js\?v=20260909-stationphase1/);
  const phaseIndex = html.indexOf('station-phase-ui.js');
  const livingIndex = html.indexOf('station-living-motion.js');
  const playerIndex = html.indexOf('./assets/js/player.js');
  assert.ok(phaseIndex > livingIndex, `${locale}: station phase UI should load after living motion`);
  assert.ok(phaseIndex < playerIndex, `${locale}: station phase UI should load before localized player runtime`);
}

const buildMode = fs.readFileSync('game/AlbaSpace/shared/station-build-mode.js', 'utf8');
assert.match(buildMode, /BUY_MODULE/);
assert.match(buildMode, /parentModuleId/);
assert.match(buildMode, /parentPort/);

const crewMode = fs.readFileSync('game/AlbaSpace/shared/station-crew-mode.js', 'utf8');
assert.match(crewMode, /RECRUIT_CADET/);
assert.match(crewMode, /moduleId/);
assert.match(crewMode, /slotId/);

console.log('AlbaSpace station phase UI audit passed');
