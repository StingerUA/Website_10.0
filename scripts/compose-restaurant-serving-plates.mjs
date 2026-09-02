#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const CLI_VERSION = '4.4.2';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelRoot = path.join(projectRoot, 'assets/models/restaurant');
const platePath = path.join(modelRoot, 'realistic-porcelain-plate.glb');

const compositions = [
  {
    dish: 'ar/turkish-shish-kebab.glb',
    output: 'ar/turkish-shish-kebab-plated.glb',
    dishLift: 0.035,
    plateScale: 1.7
  },
  {
    dish: 'ar/turkish-adana-kebab.glb',
    output: 'ar/turkish-adana-kebab-plated.glb',
    dishLift: 0.035,
    plateScale: 1.7
  },
  {
    dish: 'ar/realistic-dessert-cake.glb',
    output: 'ar/realistic-dessert-cake-plated.glb',
    dishLift: 0.30407,
    plateScale: 2.45
  },
  {
    dish: 'ar/strawberry-chocolate-cake.glb',
    output: 'ar/strawberry-chocolate-cake-plated.glb',
    dishLift: 0.03,
    plateScale: 1.55
  }
];

function padChunk(buffer, fillByte) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, fillByte)]) : buffer;
}

function wrapSceneRoots(sourcePath, destinationPath, transform, label) {
  const glb = fs.readFileSync(sourcePath);
  if (glb.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`${sourcePath} is not a GLB file`);

  const version = glb.readUInt32LE(4);
  const chunks = [];
  let offset = 12;
  let documentJson = null;

  while (offset < glb.length) {
    const byteLength = glb.readUInt32LE(offset);
    const type = glb.readUInt32LE(offset + 4);
    const data = glb.subarray(offset + 8, offset + 8 + byteLength);
    if (type === JSON_CHUNK) {
      documentJson = JSON.parse(data.toString('utf8').replace(/[\u0000\u0020]+$/g, ''));
      chunks.push({type, data: null});
    } else {
      chunks.push({type, data});
    }
    offset += 8 + byteLength;
  }

  if (!documentJson) throw new Error(`${sourcePath} does not contain a JSON chunk`);
  const sceneIndex = documentJson.scene ?? 0;
  const scene = documentJson.scenes?.[sceneIndex];
  const rootNodes = scene?.nodes || [];
  if (!rootNodes.length) throw new Error(`${sourcePath} does not contain scene roots`);

  documentJson.nodes ||= [];
  const wrapper = {name: label, children: [...rootNodes]};
  if (transform.translation) wrapper.translation = transform.translation;
  if (transform.rotation) wrapper.rotation = transform.rotation;
  if (transform.scale) wrapper.scale = transform.scale;
  scene.nodes = [documentJson.nodes.push(wrapper) - 1];

  const jsonData = padChunk(Buffer.from(JSON.stringify(documentJson)), 0x20);
  const encodedChunks = chunks.map((chunk) => {
    const data = chunk.type === JSON_CHUNK ? jsonData : padChunk(chunk.data, 0x00);
    const header = Buffer.alloc(8);
    header.writeUInt32LE(data.length, 0);
    header.writeUInt32LE(chunk.type, 4);
    return Buffer.concat([header, data]);
  });
  const body = Buffer.concat(encodedChunks);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(version, 4);
  header.writeUInt32LE(header.length + body.length, 8);
  fs.writeFileSync(destinationPath, Buffer.concat([header, body]));
}

function mergeModels(dishPath, preparedPlatePath, outputPath) {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(executable, [
    '--yes',
    `@gltf-transform/cli@${CLI_VERSION}`,
    'merge',
    dishPath,
    preparedPlatePath,
    outputPath,
    '--merge-scenes'
  ], {stdio: 'inherit'});
}

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'alba-serving-plates-'));

try {
  for (const composition of compositions) {
    const dishPath = path.join(modelRoot, composition.dish);
    const outputPath = path.join(modelRoot, composition.output);
    const preparedDishPath = path.join(temporaryDirectory, `dish-${path.basename(composition.dish)}`);
    const preparedPlatePath = path.join(temporaryDirectory, `plate-${path.basename(composition.dish)}`);

    wrapSceneRoots(
      dishPath,
      preparedDishPath,
      {translation: [0, composition.dishLift, 0], rotation: composition.dishRotation},
      'Alba dish lift'
    );
    wrapSceneRoots(
      platePath,
      preparedPlatePath,
      {scale: [composition.plateScale, 0.5, composition.plateScale]},
      'Alba porcelain serving plate'
    );
    mergeModels(preparedDishPath, preparedPlatePath, outputPath);
    process.stdout.write(`${composition.output}: ${fs.statSync(outputPath).size} bytes\n`);
  }
} finally {
  fs.rmSync(temporaryDirectory, {recursive: true, force: true});
}
