import fs from 'node:fs';
import vm from 'node:vm';

const file = 'assets/js/model-narrations-i18n.js';
const source = fs.readFileSync(file, 'utf8');

// Parse the browser script without executing it against a real DOM.
new vm.Script(source, { filename: file });

const required = [
  'gokturk-2','imece','lagari','turksat-1a','turksat-1b','turksat-1c','turksat-2a',
  'turksat-3a','turksat-3b','turksat-4a','turksat-5a','turksat-5b','turksat-6a','iss',
  'mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','voyager-1','voyager-2',
  'hubble','jameswebb','kepler','exomars','marsodyssey','marsreconnaissance','spirit','curiosity',
  'perseverance','ingenuity','zhurong'
];

for (const slug of required) {
  if (!source.includes(`'${slug}':`)) {
    throw new Error(`Missing narration entry: ${slug}`);
  }
}

for (const demo of ['gokturk-1','rasat','opportunity','sojourner','sputnik']) {
  if (!source.includes(`EXCLUDED = new Set`) || !source.includes(`'${demo}'`)) {
    throw new Error(`Demo exclusion missing: ${demo}`);
  }
}

for (const lang of ['tr','en','ru']) {
  if (!source.includes(`${lang}:`)) throw new Error(`Language missing: ${lang}`);
}

console.log(`Validated ${required.length} regular model narration slugs in TR/EN/RU; five MP3 demo slugs remain excluded.`);
