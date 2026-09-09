import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = fs.readFileSync('game/AlbaSpace/shared/classroom-teacher-endgame.js', 'utf8');
new vm.Script(source, { filename: 'classroom-teacher-endgame.js' });

for (const token of [
  'MISSION FINALE',
  'ФИНАЛ МИССИИ',
  'GÖREV FİNALİ',
  '10 / 10 MODULES',
  'albaClassWinnerStation',
  'Station3DRenderer',
  'mountWinnerStation',
  'renderClassroom',
  'renderTeacher',
  'finalRanking',
  'openClassroom',
  'prefers-reduced-motion',
  'sessionComplete',
  'winnerId',
  '20260910-classfinal1'
]) assert.ok(source.includes(token), `missing classroom endgame token: ${token}`);

for (const locale of ['ru', 'tr', 'en']) {
  const classroom = fs.readFileSync(`game/AlbaSpace/${locale}/classroom.html`, 'utf8');
  const teacher = fs.readFileSync(`game/AlbaSpace/${locale}/teacher.html`, 'utf8');

  assert.match(classroom, /classroom-teacher-endgame\.js\?v=20260910-classfinal1/);
  assert.match(teacher, /classroom-teacher-endgame\.js\?v=20260910-classfinal1/);
  assert.match(classroom, /https:\/\/cdn\.babylonjs\.com\/babylon\.js/);
  assert.match(classroom, /station-3d\.js\?v=20260905-layout1/);
  assert.match(classroom, /station-visual-polish\.js\?v=20260906-visual1/);
  assert.match(classroom, /station-structural-polish\.js\?v=20260908-structure1/);
  assert.match(classroom, /station-connections-polish\.js\?v=20260909-connections1/);
  assert.match(classroom, /station-external-equipment\.js\?v=20260909-external1/);
  assert.match(classroom, /station-cinematic-environment\.js\?v=20260909-cinematic1/);

  const classroomBase = classroom.indexOf('./assets/js/classroom.js');
  const classroomEnd = classroom.indexOf('classroom-teacher-endgame.js');
  assert.ok(classroomEnd > classroomBase, `${locale}: endgame enhancer must load after classroom.js`);

  const teacherBase = teacher.indexOf('./assets/js/teacher.js');
  const teacherEnd = teacher.indexOf('classroom-teacher-endgame.js');
  assert.ok(teacherEnd > teacherBase, `${locale}: endgame enhancer must load after teacher.js`);
}

console.log('AlbaSpace Teacher + Classroom endgame audit passed');
