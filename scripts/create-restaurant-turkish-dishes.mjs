#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'assets/models/restaurant/ar');
const TAU = Math.PI * 2;

function align4(value) {
  return (value + 3) & ~3;
}

function quaternion(axis, angle) {
  const length = Math.hypot(...axis);
  const half = angle / 2;
  const sine = Math.sin(half) / length;
  return [axis[0] * sine, axis[1] * sine, axis[2] * sine, Math.cos(half)];
}

class GlbBuilder {
  constructor(name) {
    this.name = name;
    this.materials = [];
    this.meshes = [];
    this.nodes = [];
    this.accessors = [];
    this.bufferViews = [];
    this.buffers = [];
  }

  addMaterial(name, color, roughness = 0.65, metallic = 0, extras = {}) {
    const material = {
      name,
      pbrMetallicRoughness: {
        baseColorFactor: color,
        metallicFactor: metallic,
        roughnessFactor: roughness
      }
    };
    if (extras.doubleSided) material.doubleSided = true;
    if (extras.emissiveFactor) material.emissiveFactor = extras.emissiveFactor;
    this.materials.push(material);
    return this.materials.length - 1;
  }

  addAccessor(values, size, componentType, type, target) {
    const ArrayType = componentType === 5125 ? Uint32Array : componentType === 5123 ? Uint16Array : Float32Array;
    const typedArray = new ArrayType(values);
    const currentLength = this.buffers.reduce((sum, part) => sum + part.length, 0);
    const byteOffset = align4(currentLength);
    const paddingBefore = byteOffset - currentLength;
    if (paddingBefore) this.buffers.push(Buffer.alloc(paddingBefore));
    const data = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const bufferView = this.bufferViews.push({buffer: 0, byteOffset, byteLength: data.length, target}) - 1;
    this.buffers.push(data);

    const accessor = {
      bufferView,
      componentType,
      count: values.length / size,
      type
    };
    if (componentType === 5126 && type === 'VEC3') {
      accessor.min = [Infinity, Infinity, Infinity];
      accessor.max = [-Infinity, -Infinity, -Infinity];
      for (let index = 0; index < values.length; index += 3) {
        for (let axis = 0; axis < 3; axis += 1) {
          accessor.min[axis] = Math.min(accessor.min[axis], values[index + axis]);
          accessor.max[axis] = Math.max(accessor.max[axis], values[index + axis]);
        }
      }
    }
    this.accessors.push(accessor);
    return this.accessors.length - 1;
  }

  addNode(name, geometry, material, transform = {}) {
    const position = this.addAccessor(geometry.positions, 3, 5126, 'VEC3', 34962);
    const normal = this.addAccessor(geometry.normals, 3, 5126, 'VEC3', 34962);
    const componentType = geometry.positions.length / 3 > 65535 ? 5125 : 5123;
    const indices = this.addAccessor(geometry.indices, 1, componentType, 'SCALAR', 34963);
    const mesh = this.meshes.push({
      name,
      primitives: [{attributes: {POSITION: position, NORMAL: normal}, indices, material}]
    }) - 1;
    const node = {name, mesh};
    if (transform.translation) node.translation = transform.translation;
    if (transform.rotation) node.rotation = transform.rotation;
    if (transform.scale) node.scale = transform.scale;
    this.nodes.push(node);
    return this.nodes.length - 1;
  }

  write(filename) {
    const binary = Buffer.concat(this.buffers);
    const document = {
      asset: {version: '2.0', generator: 'Alba Space Turkish menu asset generator'},
      scene: 0,
      scenes: [{name: this.name, nodes: this.nodes.map((_, index) => index)}],
      nodes: this.nodes,
      meshes: this.meshes,
      materials: this.materials,
      accessors: this.accessors,
      bufferViews: this.bufferViews,
      buffers: [{byteLength: binary.length}]
    };
    const json = Buffer.from(JSON.stringify(document));
    const paddedJson = Buffer.concat([json, Buffer.alloc(align4(json.length) - json.length, 0x20)]);
    const paddedBinary = Buffer.concat([binary, Buffer.alloc(align4(binary.length) - binary.length)]);
    const header = Buffer.alloc(12);
    const jsonHeader = Buffer.alloc(8);
    const binaryHeader = Buffer.alloc(8);
    const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(totalLength, 8);
    jsonHeader.writeUInt32LE(paddedJson.length, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4);
    binaryHeader.writeUInt32LE(paddedBinary.length, 0);
    binaryHeader.writeUInt32LE(0x004e4942, 4);
    fs.writeFileSync(path.join(outputRoot, filename), Buffer.concat([
      header, jsonHeader, paddedJson, binaryHeader, paddedBinary
    ]));
    process.stdout.write(`${filename}: ${totalLength} bytes, ${this.meshes.length} meshes\n`);
  }
}

function uvSphere(segments = 18, rings = 12) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const phi = Math.PI * ring / rings;
    for (let segment = 0; segment <= segments; segment += 1) {
      const theta = TAU * segment / segments;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      positions.push(x, y, z);
      normals.push(x, y, z);
    }
  }
  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const first = ring * (segments + 1) + segment;
      const second = first + segments + 1;
      indices.push(first, second, first + 1, second, second + 1, first + 1);
    }
  }
  return {positions, normals, indices};
}

function cylinder(radial = 18, topRadius = 1, bottomRadius = 1) {
  const positions = [];
  const normals = [];
  const indices = [];
  const slope = bottomRadius - topRadius;
  for (let row = 0; row < 2; row += 1) {
    const y = row ? 0.5 : -0.5;
    const radius = row ? topRadius : bottomRadius;
    for (let segment = 0; segment <= radial; segment += 1) {
      const angle = TAU * segment / radial;
      const x = Math.cos(angle);
      const z = Math.sin(angle);
      const normalLength = Math.hypot(x, slope, z);
      positions.push(radius * x, y, radius * z);
      normals.push(x / normalLength, slope / normalLength, z / normalLength);
    }
  }
  for (let segment = 0; segment < radial; segment += 1) {
    const next = segment + 1;
    indices.push(segment, radial + 1 + segment, next, next, radial + 1 + segment, radial + 1 + next);
  }
  for (const [y, sign, radius] of [[-0.5, -1, bottomRadius], [0.5, 1, topRadius]]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, sign, 0);
    const start = positions.length / 3;
    for (let segment = 0; segment <= radial; segment += 1) {
      const angle = TAU * segment / radial;
      positions.push(radius * Math.cos(angle), y, radius * Math.sin(angle));
      normals.push(0, sign, 0);
    }
    for (let segment = 0; segment < radial; segment += 1) {
      if (sign > 0) indices.push(center, start + segment, start + segment + 1);
      else indices.push(center, start + segment + 1, start + segment);
    }
  }
  return {positions, normals, indices};
}

function box() {
  const positions = [];
  const normals = [];
  const indices = [];
  const faces = [
    [[1, 0, 0], [[0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5]]],
    [[-1, 0, 0], [[-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5], [-0.5, -0.5, -0.5]]],
    [[0, 1, 0], [[-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5]]],
    [[0, -1, 0], [[-0.5, -0.5, 0.5], [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5]]],
    [[0, 0, 1], [[0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, -0.5, 0.5]]],
    [[0, 0, -1], [[-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, -0.5, -0.5]]]
  ];
  for (const [normal, corners] of faces) {
    const offset = positions.length / 3;
    for (const corner of corners) {
      positions.push(...corner);
      normals.push(...normal);
    }
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  return {positions, normals, indices};
}

function torus(majorSegments = 32, minorSegments = 10, tubeRatio = 0.1) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let major = 0; major <= majorSegments; major += 1) {
    const majorAngle = TAU * major / majorSegments;
    for (let minor = 0; minor <= minorSegments; minor += 1) {
      const minorAngle = TAU * minor / minorSegments;
      const radius = 1 + tubeRatio * Math.cos(minorAngle);
      positions.push(radius * Math.cos(majorAngle), Math.sin(minorAngle), radius * Math.sin(majorAngle));
      normals.push(
        Math.cos(minorAngle) * Math.cos(majorAngle),
        Math.sin(minorAngle),
        Math.cos(minorAngle) * Math.sin(majorAngle)
      );
    }
  }
  for (let major = 0; major < majorSegments; major += 1) {
    for (let minor = 0; minor < minorSegments; minor += 1) {
      const first = major * (minorSegments + 1) + minor;
      const second = first + minorSegments + 1;
      indices.push(first, second, first + 1, second, second + 1, first + 1);
    }
  }
  return {positions, normals, indices};
}

function lathe(profile, segments = 40) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let segment = 0; segment <= segments; segment += 1) {
    const angle = TAU * segment / segments;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let point = 0; point < profile.length; point += 1) {
      const [radius, y] = profile[point];
      const previous = profile[Math.max(0, point - 1)];
      const next = profile[Math.min(profile.length - 1, point + 1)];
      const tangentRadius = next[0] - previous[0];
      const tangentY = next[1] - previous[1];
      const length = Math.hypot(tangentY, tangentRadius) || 1;
      positions.push(radius * cosine, y, radius * sine);
      normals.push(tangentY * cosine / length, -tangentRadius / length, tangentY * sine / length);
    }
  }
  for (let segment = 0; segment < segments; segment += 1) {
    for (let point = 0; point < profile.length - 1; point += 1) {
      const first = segment * profile.length + point;
      const second = first + profile.length;
      indices.push(first, second, first + 1, second, second + 1, first + 1);
    }
  }
  return {positions, normals, indices};
}

const SPHERE = uvSphere();
const CYLINDER = cylinder();
const BOX = box();
const TORUS = torus();
const HORIZONTAL = quaternion([0, 0, 1], -Math.PI / 2);

function addShishKebab() {
  const scene = new GlbBuilder('Turkish şiş kebab');
  const meat = [
    scene.addMaterial('char-grilled lamb', [0.32, 0.095, 0.035, 1], 0.74),
    scene.addMaterial('caramelised lamb', [0.54, 0.19, 0.06, 1], 0.68),
    scene.addMaterial('roasted lamb edge', [0.18, 0.045, 0.018, 1], 0.82)
  ];
  const redPepper = scene.addMaterial('roasted red pepper', [0.72, 0.045, 0.018, 1], 0.58);
  const greenPepper = scene.addMaterial('roasted green pepper', [0.13, 0.34, 0.045, 1], 0.65);
  const onion = scene.addMaterial('grilled onion', [0.92, 0.72, 0.46, 1], 0.72);
  const tomato = scene.addMaterial('roasted tomato', [0.78, 0.055, 0.025, 1], 0.5);
  const wood = scene.addMaterial('wooden skewer', [0.64, 0.39, 0.16, 1], 0.82);
  const char = scene.addMaterial('grill marks', [0.055, 0.018, 0.008, 1], 0.92);
  const parsley = scene.addMaterial('fresh parsley', [0.045, 0.27, 0.055, 1], 0.74);
  const lemon = scene.addMaterial('lemon', [0.94, 0.66, 0.04, 1], 0.56);

  const rows = [-0.055, 0, 0.055];
  for (let row = 0; row < rows.length; row += 1) {
    const z = rows[row];
    scene.addNode(`wooden skewer ${row + 1}`, CYLINDER, wood, {
      translation: [0, 0.027, z], rotation: HORIZONTAL, scale: [0.0022, 0.27, 0.0022]
    });
    const ingredients = [meat[0], greenPepper, meat[1], onion, meat[2], redPepper, meat[1]];
    ingredients.forEach((material, index) => {
      const x = -0.092 + index * 0.031;
      const isVegetable = material === greenPepper || material === redPepper || material === onion;
      scene.addNode(`şiş ${row + 1} ingredient ${index + 1}`, SPHERE, material, {
        translation: [x, 0.043 + (index % 2) * 0.0015, z],
        rotation: quaternion([0, 1, 0], (row * 0.31 + index * 0.47) % Math.PI),
        scale: isVegetable ? [0.012, 0.017, 0.017] : [0.019, 0.018, 0.017]
      });
      if (!isVegetable && index % 2 === 0) {
        for (let mark = -1; mark <= 1; mark += 1) {
          scene.addNode(`şiş ${row + 1} grill mark ${index}-${mark}`, BOX, char, {
            translation: [x + mark * 0.006, 0.061, z],
            rotation: quaternion([0, 1, 0], 0.45),
            scale: [0.0022, 0.0014, 0.020]
          });
        }
      }
    });
  }
  scene.addNode('roasted tomato half', SPHERE, tomato, {
    translation: [-0.07, 0.017, 0.092], scale: [0.031, 0.015, 0.031]
  });
  scene.addNode('roasted green pepper garnish', CYLINDER, greenPepper, {
    translation: [0.035, 0.017, 0.094], rotation: quaternion([0, 0, 1], -1.34), scale: [0.006, 0.12, 0.006]
  });
  scene.addNode('lemon wedge', SPHERE, lemon, {
    translation: [0.09, 0.013, 0.083], scale: [0.030, 0.012, 0.022]
  });
  for (let index = 0; index < 16; index += 1) {
    const angle = index * 2.4;
    const radius = 0.009 + (index % 4) * 0.002;
    scene.addNode(`parsley leaf ${index + 1}`, SPHERE, parsley, {
      translation: [0.055 + Math.cos(angle) * radius, 0.012 + (index % 3) * 0.003, -0.095 + Math.sin(angle) * radius],
      rotation: quaternion([0, 1, 0], angle), scale: [0.010, 0.002, 0.004]
    });
  }
  scene.write('turkish-shish-kebab.glb');
}

function addAdanaKebab() {
  const scene = new GlbBuilder('Adana kebab');
  const meat = [
    scene.addMaterial('Adana spiced meat', [0.48, 0.095, 0.025, 1], 0.7),
    scene.addMaterial('Adana roasted ridge', [0.29, 0.045, 0.012, 1], 0.82),
    scene.addMaterial('Adana caramelised fat', [0.62, 0.19, 0.055, 1], 0.63)
  ];
  const metal = scene.addMaterial('steel skewer', [0.38, 0.41, 0.42, 1], 0.24, 0.76);
  const pita = scene.addMaterial('toasted pide', [0.76, 0.49, 0.20, 1], 0.8);
  const pitaToast = scene.addMaterial('pide toast marks', [0.34, 0.13, 0.035, 1], 0.9);
  const tomato = scene.addMaterial('roasted tomato', [0.76, 0.045, 0.018, 1], 0.52);
  const pepper = scene.addMaterial('charred green pepper', [0.085, 0.28, 0.035, 1], 0.72);
  const onion = scene.addMaterial('sumac onion', [0.72, 0.47, 0.60, 1], 0.7, 0, {doubleSided: true});
  const parsley = scene.addMaterial('parsley', [0.035, 0.27, 0.05, 1], 0.72);
  const sumac = scene.addMaterial('sumac', [0.38, 0.055, 0.055, 1], 0.9);

  for (let row = 0; row < 2; row += 1) {
    const z = -0.034 + row * 0.068;
    scene.addNode(`steel skewer ${row + 1}`, CYLINDER, metal, {
      translation: [0, 0.031, z], rotation: HORIZONTAL, scale: [0.0022, 0.29, 0.0022]
    });
    for (let segment = 0; segment < 12; segment += 1) {
      const x = -0.104 + segment * 0.019;
      const radius = segment % 2 ? 0.015 : 0.018;
      scene.addNode(`Adana kebab ${row + 1} ridge ${segment + 1}`, SPHERE, meat[segment % 3], {
        translation: [x, 0.043 + (segment % 3) * 0.001, z],
        scale: [0.015, radius, 0.019]
      });
      if (segment % 3 === 0) {
        scene.addNode(`Adana char ${row + 1}-${segment}`, BOX, meat[1], {
          translation: [x, 0.060, z], rotation: quaternion([0, 1, 0], 0.35), scale: [0.003, 0.0015, 0.021]
        });
      }
    }
  }
  for (let index = 0; index < 3; index += 1) {
    scene.addNode(`pide wedge ${index + 1}`, BOX, pita, {
      translation: [-0.065 + index * 0.05, 0.010, 0.092],
      rotation: quaternion([0, 1, 0], -0.35 + index * 0.22), scale: [0.048, 0.009, 0.032]
    });
    scene.addNode(`pide toast ${index + 1}`, BOX, pitaToast, {
      translation: [-0.065 + index * 0.05, 0.015, 0.092],
      rotation: quaternion([0, 1, 0], -0.35 + index * 0.22), scale: [0.004, 0.001, 0.034]
    });
  }
  scene.addNode('roasted tomato', SPHERE, tomato, {
    translation: [0.085, 0.018, -0.090], scale: [0.034, 0.017, 0.032]
  });
  scene.addNode('roasted pepper', CYLINDER, pepper, {
    translation: [-0.015, 0.017, -0.094], rotation: quaternion([0, 0, 1], -1.40), scale: [0.006, 0.13, 0.006]
  });
  for (let index = 0; index < 12; index += 1) {
    const angle = index * 0.47;
    scene.addNode(`onion curl ${index + 1}`, TORUS, onion, {
      translation: [0.055 + Math.cos(angle) * 0.023, 0.013 + index * 0.0004, 0.082 + Math.sin(angle) * 0.018],
      rotation: quaternion([1, 0, 0], Math.PI / 2), scale: [0.009, 0.0012, 0.009]
    });
    scene.addNode(`sumac dot ${index + 1}`, SPHERE, sumac, {
      translation: [0.055 + Math.cos(angle * 2.1) * 0.022, 0.018, 0.082 + Math.sin(angle * 1.7) * 0.016],
      scale: [0.0018, 0.0013, 0.0018]
    });
  }
  for (let index = 0; index < 10; index += 1) {
    const angle = index * 2.1;
    scene.addNode(`parsley garnish ${index + 1}`, SPHERE, parsley, {
      translation: [0.055 + Math.cos(angle) * 0.019, 0.019, 0.082 + Math.sin(angle) * 0.015],
      rotation: quaternion([0, 1, 0], angle), scale: [0.009, 0.0017, 0.004]
    });
  }
  scene.write('turkish-adana-kebab.glb');
}

function addLentilSoup() {
  const scene = new GlbBuilder('Turkish lentil soup');
  const porcelain = scene.addMaterial('warm white porcelain', [0.93, 0.90, 0.82, 1], 0.27);
  const porcelainAccent = scene.addMaterial('porcelain rim', [0.73, 0.53, 0.25, 1], 0.35, 0.03);
  const soup = scene.addMaterial('red lentil soup', [0.88, 0.26, 0.045, 1], 0.38);
  const oil = scene.addMaterial('olive oil swirl', [0.97, 0.67, 0.12, 1], 0.22);
  const paprika = scene.addMaterial('paprika flakes', [0.48, 0.035, 0.012, 1], 0.86);
  const parsley = scene.addMaterial('parsley', [0.035, 0.28, 0.055, 1], 0.72);
  const lemon = scene.addMaterial('lemon wedge', [0.97, 0.72, 0.06, 1], 0.48);
  const lemonPith = scene.addMaterial('lemon pith', [0.96, 0.91, 0.63, 1], 0.65);

  const bowlProfile = [
    [0.052, 0], [0.070, 0.004], [0.087, 0.022], [0.103, 0.049], [0.106, 0.058],
    [0.098, 0.061], [0.091, 0.054], [0.080, 0.032], [0.064, 0.011], [0.052, 0.006], [0.052, 0]
  ];
  scene.addNode('ceramic soup bowl', lathe(bowlProfile), porcelain);
  scene.addNode('golden bowl rim', TORUS, porcelainAccent, {
    translation: [0, 0.0595, 0], scale: [0.101, 0.0012, 0.101]
  });
  scene.addNode('lentil soup surface', CYLINDER, soup, {
    translation: [0, 0.0557, 0], scale: [0.091, 0.0026, 0.091]
  });
  const swirlPoints = [
    [-0.038, -0.004], [-0.024, 0.020], [0.006, 0.029], [0.037, 0.014], [0.040, -0.015],
    [0.017, -0.033], [-0.012, -0.032], [-0.027, -0.017], [-0.016, -0.002], [0.004, 0.004]
  ];
  swirlPoints.forEach(([x, z], index) => {
    scene.addNode(`olive oil swirl ${index + 1}`, SPHERE, oil, {
      translation: [x, 0.0582, z], scale: [0.012, 0.0008, 0.005]
    });
  });
  for (let index = 0; index < 18; index += 1) {
    const angle = index * 2.23;
    const radius = 0.010 + (index % 6) * 0.010;
    scene.addNode(`paprika flake ${index + 1}`, SPHERE, paprika, {
      translation: [Math.cos(angle) * radius, 0.059, Math.sin(angle) * radius], scale: [0.0015, 0.0006, 0.001]
    });
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = index * 2.4;
    const radius = 0.007 + (index % 4) * 0.003;
    scene.addNode(`parsley leaf ${index + 1}`, SPHERE, parsley, {
      translation: [0.018 + Math.cos(angle) * radius, 0.0595, -0.008 + Math.sin(angle) * radius],
      rotation: quaternion([0, 1, 0], angle), scale: [0.007, 0.0007, 0.0025]
    });
  }
  scene.addNode('lemon wedge peel', SPHERE, lemon, {
    translation: [0.072, 0.071, -0.055], rotation: quaternion([0, 0, 1], -0.42), scale: [0.035, 0.010, 0.027]
  });
  scene.addNode('lemon wedge flesh', SPHERE, lemonPith, {
    translation: [0.071, 0.073, -0.054], rotation: quaternion([0, 0, 1], -0.42), scale: [0.030, 0.0105, 0.022]
  });
  scene.write('turkish-lentil-soup.glb');
}

fs.mkdirSync(outputRoot, {recursive: true});
addShishKebab();
addAdanaKebab();
addLentilSoup();
