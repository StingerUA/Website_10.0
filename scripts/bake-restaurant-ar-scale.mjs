#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

const MODEL_SCALES = new Map([
  ['realistic-steak-board.glb', 0.28],
  ['realistic-steak-slices.glb', 0.28],
  ['realistic-grilled-steak.glb', 0.28],
  ['realistic-dessert-cake.glb', 0.56],
  ['realistic-fruit-dessert.glb', 0.56],
  ['realistic-layered-dessert-cup.glb', 0.56],
  ['realistic-soup.glb', 0.56],
  ['realistic-yogurt-drink.glb', 0.56],
  ['realistic-coffee-cup.glb', 0.56],
  ['realistic-strawberry-lemonade.glb', 0.56]
]);

const sourceDirectory = path.resolve(process.argv[2] || 'assets/models/restaurant/ar');

function padChunk(buffer, fillByte) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, fillByte)]) : buffer;
}

function bakeScale(filePath, physicalScale) {
  const glb = fs.readFileSync(filePath);
  if (glb.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`${filePath} is not a GLB file`);

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

  if (!documentJson) throw new Error(`${filePath} does not contain a JSON chunk`);
  const sceneIndex = documentJson.scene ?? 0;
  const rootNodes = documentJson.scenes?.[sceneIndex]?.nodes || [];
  if (!rootNodes.length) throw new Error(`${filePath} does not contain a scene root`);

  for (const nodeIndex of rootNodes) {
    const node = documentJson.nodes[nodeIndex];
    if (node.matrix) throw new Error(`${filePath} uses a root matrix and cannot be scaled safely`);
    node.scale = [physicalScale, physicalScale, physicalScale];
  }

  documentJson.asset.extras = {
    ...(documentJson.asset.extras || {}),
    albaArPhysicalScale: physicalScale,
    albaArScaleUnit: 'meter'
  };

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
  fs.writeFileSync(filePath, Buffer.concat([header, body]));
}

for (const [filename, physicalScale] of MODEL_SCALES) {
  const filePath = path.join(sourceDirectory, filename);
  bakeScale(filePath, physicalScale);
  process.stdout.write(`${filename}: ${physicalScale} m scale baked\n`);
}
