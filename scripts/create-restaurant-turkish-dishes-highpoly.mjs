#!/usr/bin/env node

// Reproducible, texture-free high-detail replacements for the three Turkish
// restaurant dishes. Geometry and PBR materials are authored for Alba Space.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets/models/restaurant/ar');
const TAU = Math.PI * 2;
const align4 = (n) => (n + 3) & ~3;

function quat(axis, angle) {
  const length = Math.hypot(...axis);
  const sine = Math.sin(angle / 2) / length;
  return [axis[0] * sine, axis[1] * sine, axis[2] * sine, Math.cos(angle / 2)];
}

class GLB {
  constructor(name) {
    this.name = name;
    this.materials = [];
    this.meshes = [];
    this.nodes = [];
    this.accessors = [];
    this.views = [];
    this.parts = [];
  }
  material(name, rgba, roughness = 0.65, metallic = 0) {
    this.materials.push({
      name,
      pbrMetallicRoughness: {
        baseColorFactor: rgba,
        roughnessFactor: roughness,
        metallicFactor: metallic
      }
    });
    return this.materials.length - 1;
  }
  accessor(values, size, componentType, type, target) {
    const Type = componentType === 5125 ? Uint32Array : componentType === 5123 ? Uint16Array : Float32Array;
    const typed = new Type(values);
    const used = this.parts.reduce((sum, part) => sum + part.length, 0);
    const offset = align4(used);
    if (offset > used) this.parts.push(Buffer.alloc(offset - used));
    const data = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    const view = this.views.push({buffer: 0, byteOffset: offset, byteLength: data.length, target}) - 1;
    this.parts.push(data);
    const accessor = {bufferView: view, componentType, count: values.length / size, type};
    if (componentType === 5126 && type === 'VEC3') {
      accessor.min = [Infinity, Infinity, Infinity];
      accessor.max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < values.length; i += 3) {
        for (let a = 0; a < 3; a += 1) {
          accessor.min[a] = Math.min(accessor.min[a], values[i + a]);
          accessor.max[a] = Math.max(accessor.max[a], values[i + a]);
        }
      }
    }
    this.accessors.push(accessor);
    return this.accessors.length - 1;
  }
  node(name, geometry, material, transform = {}) {
    const vertexCount = geometry.positions.length / 3;
    const position = this.accessor(geometry.positions, 3, 5126, 'VEC3', 34962);
    const normal = this.accessor(geometry.normals, 3, 5126, 'VEC3', 34962);
    const componentType = vertexCount > 65535 ? 5125 : 5123;
    const indices = this.accessor(geometry.indices, 1, componentType, 'SCALAR', 34963);
    const attributes = {POSITION: position, NORMAL: normal};
    if (geometry.colors) attributes.COLOR_0 = this.accessor(geometry.colors, 4, 5126, 'VEC4', 34962);
    const mesh = this.meshes.push({name, primitives: [{attributes, indices, material}]}) - 1;
    const node = {name, mesh};
    if (transform.translation) node.translation = transform.translation;
    if (transform.rotation) node.rotation = transform.rotation;
    if (transform.scale) node.scale = transform.scale;
    this.nodes.push(node);
  }
  write(filename) {
    const binary = Buffer.concat(this.parts);
    const document = {
      asset: {version: '2.0', generator: 'Alba Space high-detail Turkish food generator'},
      scene: 0,
      scenes: [{name: this.name, nodes: this.nodes.map((_, i) => i)}],
      nodes: this.nodes,
      meshes: this.meshes,
      materials: this.materials,
      accessors: this.accessors,
      bufferViews: this.views,
      buffers: [{byteLength: binary.length}]
    };
    const json = Buffer.from(JSON.stringify(document));
    const jsonPadded = Buffer.concat([json, Buffer.alloc(align4(json.length) - json.length, 0x20)]);
    const binPadded = Buffer.concat([binary, Buffer.alloc(align4(binary.length) - binary.length)]);
    const header = Buffer.alloc(12);
    const jsonHeader = Buffer.alloc(8);
    const binHeader = Buffer.alloc(8);
    const total = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(total, 8);
    jsonHeader.writeUInt32LE(jsonPadded.length, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4);
    binHeader.writeUInt32LE(binPadded.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);
    fs.writeFileSync(path.join(output, filename), Buffer.concat([header, jsonHeader, jsonPadded, binHeader, binPadded]));
    const triangles = this.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((s, p) => s + this.accessors[p.indices].count / 3, 0), 0);
    console.log(`${filename}: ${(total / 1048576).toFixed(2)} MB, ${Math.round(triangles).toLocaleString()} triangles`);
  }
}

function sphere(segments = 52, rings = 34, seed = 0) {
  const positions = [], normals = [], colors = [], indices = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const phi = Math.PI * ring / rings;
    for (let segment = 0; segment <= segments; segment += 1) {
      const theta = TAU * segment / segments;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      const noise = 1 + 0.035 * Math.sin(theta * 5 + seed) * Math.sin(phi * 4 + seed * 0.7)
        + 0.018 * Math.cos(theta * 9 - phi * 3 + seed * 1.3);
      positions.push(x * noise, y * noise, z * noise);
      normals.push(x, y, z);
      const freckles = Math.sin(theta * 17 + seed * 2.1) * Math.cos(phi * 13 - seed);
      const variation = Math.max(.46, Math.min(1.12, .86 + .17 * freckles + .08 * Math.sin(theta * 31 + phi * 9)));
      colors.push(variation, variation * .96, variation * .90, 1);
    }
  }
  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = ring * (segments + 1) + segment;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return {positions, normals, colors, indices};
}

function cylinder(radial = 48, top = 1, bottom = 1) {
  const positions = [], normals = [], indices = [];
  const slope = bottom - top;
  for (let row = 0; row < 2; row += 1) {
    const y = row ? 0.5 : -0.5;
    const radius = row ? top : bottom;
    for (let segment = 0; segment <= radial; segment += 1) {
      const angle = TAU * segment / radial;
      const x = Math.cos(angle), z = Math.sin(angle), length = Math.hypot(x, slope, z);
      positions.push(radius * x, y, radius * z);
      normals.push(x / length, slope / length, z / length);
    }
  }
  for (let segment = 0; segment < radial; segment += 1) {
    const b = radial + 1 + segment;
    indices.push(segment, b, segment + 1, segment + 1, b, b + 1);
  }
  for (const [y, sign, radius] of [[-0.5, -1, bottom], [0.5, 1, top]]) {
    const center = positions.length / 3;
    positions.push(0, y, 0); normals.push(0, sign, 0);
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
  const positions = [], normals = [], indices = [];
  const faces = [
    [[1,0,0], [[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],
    [[-1,0,0], [[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],
    [[0,1,0], [[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],
    [[0,-1,0], [[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],
    [[0,0,1], [[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]]],
    [[0,0,-1], [[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]]]
  ];
  for (const [normal, corners] of faces) {
    const offset = positions.length / 3;
    corners.forEach((corner) => { positions.push(...corner); normals.push(...normal); });
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  return {positions, normals, indices};
}

function torus(major = 72, minor = 20, tube = 0.1) {
  const positions = [], normals = [], indices = [];
  for (let a = 0; a <= major; a += 1) {
    const u = TAU * a / major;
    for (let b = 0; b <= minor; b += 1) {
      const v = TAU * b / minor, radius = 1 + tube * Math.cos(v);
      positions.push(radius * Math.cos(u), Math.sin(v), radius * Math.sin(u));
      normals.push(Math.cos(v) * Math.cos(u), Math.sin(v), Math.cos(v) * Math.sin(u));
    }
  }
  for (let a = 0; a < major; a += 1) for (let b = 0; b < minor; b += 1) {
    const first = a * (minor + 1) + b, second = first + minor + 1;
    indices.push(first, second, first + 1, second, second + 1, first + 1);
  }
  return {positions, normals, indices};
}

function lathe(profile, segments = 128) {
  const positions = [], normals = [], indices = [];
  for (let segment = 0; segment <= segments; segment += 1) {
    const angle = TAU * segment / segments, c = Math.cos(angle), s = Math.sin(angle);
    for (let i = 0; i < profile.length; i += 1) {
      const [radius, y] = profile[i], prev = profile[Math.max(0, i - 1)], next = profile[Math.min(profile.length - 1, i + 1)];
      const dr = next[0] - prev[0], dy = next[1] - prev[1], length = Math.hypot(dy, dr) || 1;
      positions.push(radius * c, y, radius * s);
      normals.push(dy * c / length, -dr / length, dy * s / length);
    }
  }
  for (let segment = 0; segment < segments; segment += 1) for (let i = 0; i < profile.length - 1; i += 1) {
    const first = segment * profile.length + i, second = first + profile.length;
    indices.push(first, second, first + 1, second, second + 1, first + 1);
  }
  return {positions, normals, indices};
}

function ridgedKebab(seed = 0, lengthSegments = 220, radial = 56) {
  const positions = [], normals = [], colors = [], indices = [];
  for (let xIndex = 0; xIndex <= lengthSegments; xIndex += 1) {
    const t = xIndex / lengthSegments;
    const x = -0.105 + t * 0.21;
    const taper = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.22;
    const irregular = 1 + 0.09 * Math.sin(t * Math.PI * 15 + seed) + 0.035 * Math.sin(t * Math.PI * 37 + seed * 1.9);
    for (let side = 0; side <= radial; side += 1) {
      const angle = TAU * side / radial;
      const ridge = 1 + 0.10 * Math.cos(angle * 7 + t * 6 + seed);
      const radius = 0.0175 * taper * irregular * ridge;
      const y = radius * Math.cos(angle), z = 1.08 * radius * Math.sin(angle);
      positions.push(x, y, z);
      const nl = Math.hypot(0.08 * Math.sin(t * 31 + seed), Math.cos(angle), Math.sin(angle));
      normals.push(0.08 * Math.sin(t * 31 + seed) / nl, Math.cos(angle) / nl, Math.sin(angle) / nl);
      const sear = Math.sin(t * Math.PI * 22 + seed) * Math.cos(angle * 5 - seed);
      const browned = sear > .72 ? .37 : (.76 + .18 * Math.sin(t * 41 + angle * 7 + seed));
      colors.push(browned, browned * .88, browned * .78, 1);
    }
  }
  for (let x = 0; x < lengthSegments; x += 1) for (let side = 0; side < radial; side += 1) {
    const a = x * (radial + 1) + side, b = a + radial + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return {positions, normals, colors, indices};
}

const SPHERES = Array.from({length: 8}, (_, i) => sphere(52, 34, i + 1));
const SMALL_SPHERE = sphere(30, 20, 3);
const CYLINDER = cylinder();
const BOX = box();
const TORUS = torus();
const HORIZONTAL = quat([0, 0, 1], -Math.PI / 2);

function shish() {
  const scene = new GLB('High-detail Turkish şiş kebab');
  const meat = [
    scene.material('charred lamb', [0.23, 0.045, 0.012, 1], 0.88),
    scene.material('roasted lamb', [0.48, 0.13, 0.035, 1], 0.7),
    scene.material('caramelised lamb', [0.66, 0.24, 0.065, 1], 0.57),
    scene.material('juicy lamb highlight', [0.39, 0.075, 0.018, 1], 0.42)
  ];
  const red = scene.material('roasted red pepper', [0.74, 0.025, 0.008, 1], 0.5);
  const green = scene.material('roasted green pepper', [0.055, 0.25, 0.025, 1], 0.62);
  const onion = scene.material('grilled onion', [0.88, 0.66, 0.36, 1], 0.7);
  const tomato = scene.material('roasted tomato', [0.78, 0.025, 0.008, 1], 0.42);
  const wood = scene.material('wood skewer', [0.58, 0.31, 0.10, 1], 0.82);
  const char = scene.material('grill sear', [0.025, 0.006, 0.003, 1], 0.94);
  const parsley = scene.material('fresh parsley', [0.025, 0.24, 0.035, 1], 0.67);
  const lemon = scene.material('lemon peel', [0.96, 0.64, 0.025, 1], 0.48);
  [-0.057, 0, 0.057].forEach((z, row) => {
    scene.node(`wood skewer ${row + 1}`, CYLINDER, wood, {translation: [0, .026, z], rotation: HORIZONTAL, scale: [.002, .275, .002]});
    const ingredients = [meat[1], green, meat[2], onion, meat[0], red, meat[3]];
    ingredients.forEach((material, index) => {
      const x = -.094 + index * .0315;
      const vegetable = [green, red, onion].includes(material);
      scene.node(`skewer ${row + 1} ingredient ${index + 1}`, SPHERES[(row * 3 + index) % SPHERES.length], material, {
        translation: [x, .044 + ((row + index) % 3) * .001, z],
        rotation: quat([0, 1, 0], row * .33 + index * .49),
        scale: vegetable ? [.012, .017, .017] : [.0205, .0185, .018]
      });
      if (!vegetable) for (let mark = -1; mark <= 1; mark += 1) {
        scene.node(`sear ${row}-${index}-${mark}`, BOX, char, {translation: [x + mark * .006, .0625, z], rotation: quat([0, 1, 0], .42), scale: [.0017, .001, .021]});
      }
    });
  });
  scene.node('roasted tomato half', SPHERES[2], tomato, {translation: [-.073, .018, .095], scale: [.034, .016, .034]});
  scene.node('roasted green pepper', CYLINDER, green, {translation: [.028, .018, .098], rotation: quat([0, 0, 1], -1.35), scale: [.006, .125, .006]});
  scene.node('lemon wedge', SPHERES[5], lemon, {translation: [.09, .014, .087], rotation: quat([0, 1, 0], -.3), scale: [.031, .012, .023]});
  for (let i = 0; i < 28; i += 1) {
    const angle = i * 2.37, radius = .007 + (i % 7) * .002;
    scene.node(`parsley ${i}`, SMALL_SPHERE, parsley, {translation: [.055 + Math.cos(angle) * radius, .013 + (i % 3) * .0015, -.098 + Math.sin(angle) * radius], rotation: quat([0, 1, 0], angle), scale: [.008, .0012, .0033]});
  }
  scene.write('turkish-shish-kebab.glb');
}

function adana() {
  const scene = new GLB('High-detail Adana kebab');
  const meat = [
    scene.material('spiced minced lamb', [0.48, 0.085, 0.018, 1], .66),
    scene.material('roasted meat highlights', [0.65, 0.17, 0.035, 1], .54)
  ];
  const metal = scene.material('steel skewer', [.44, .47, .48, 1], .22, .82);
  const char = scene.material('charred crust', [.035, .006, .003, 1], .95);
  const pita = scene.material('toasted pide', [.78, .48, .18, 1], .78);
  const pitaToast = scene.material('pide toast', [.31, .085, .018, 1], .9);
  const tomato = scene.material('roasted tomato', [.77, .025, .008, 1], .44);
  const pepper = scene.material('charred pepper', [.045, .22, .02, 1], .72);
  const onion = scene.material('sumac onion', [.73, .43, .57, 1], .68);
  const parsley = scene.material('parsley', [.025, .25, .035, 1], .68);
  const sumac = scene.material('sumac', [.34, .025, .035, 1], .92);
  [-.035, .035].forEach((z, row) => {
    scene.node(`steel skewer ${row + 1}`, CYLINDER, metal, {translation: [0, .032, z], rotation: HORIZONTAL, scale: [.0022, .292, .0022]});
    scene.node(`continuous Adana kebab ${row + 1}`, ridgedKebab(row + 2), meat[row], {translation: [0, .047, z]});
    for (let mark = 0; mark < 10; mark += 1) {
      scene.node(`char mark ${row}-${mark}`, BOX, char, {translation: [-.087 + mark * .019, .064, z], rotation: quat([0, 1, 0], .25 + (mark % 2) * .17), scale: [.0028, .0011, .021]});
    }
  });
  for (let i = 0; i < 4; i += 1) {
    const x = -.075 + i * .047;
    scene.node(`pide ${i}`, BOX, pita, {translation: [x, .010, .098], rotation: quat([0, 1, 0], -.4 + i * .2), scale: [.043, .008, .032]});
    for (let mark = -1; mark <= 1; mark += 1) scene.node(`pide toast ${i}-${mark}`, BOX, pitaToast, {translation: [x + mark * .010, .0145, .098], rotation: quat([0, 1, 0], -.4 + i * .2), scale: [.0026, .0008, .032]});
  }
  scene.node('tomato', SPHERES[3], tomato, {translation: [.085, .018, -.092], scale: [.035, .017, .033]});
  scene.node('pepper', CYLINDER, pepper, {translation: [-.018, .018, -.096], rotation: quat([0, 0, 1], -1.4), scale: [.006, .13, .006]});
  for (let i = 0; i < 18; i += 1) {
    const angle = i * .51;
    scene.node(`onion ${i}`, TORUS, onion, {translation: [.057 + Math.cos(angle) * .024, .014 + i * .00025, .085 + Math.sin(angle) * .018], rotation: quat([1, 0, 0], Math.PI / 2), scale: [.0085, .0011, .0085]});
    scene.node(`sumac ${i}`, SMALL_SPHERE, sumac, {translation: [.057 + Math.cos(angle * 2.1) * .023, .019, .085 + Math.sin(angle * 1.7) * .017], scale: [.0015, .0008, .0015]});
    scene.node(`parsley ${i}`, SMALL_SPHERE, parsley, {translation: [.057 + Math.cos(angle * 2.5) * .021, .019, .085 + Math.sin(angle * 2) * .015], rotation: quat([0, 1, 0], angle), scale: [.007, .001, .003]});
  }
  scene.write('turkish-adana-kebab.glb');
}

function soup() {
  const scene = new GLB('High-detail Turkish lentil soup');
  const porcelain = scene.material('warm porcelain', [.96, .93, .86, 1], .22);
  const gold = scene.material('gold rim', [.74, .45, .16, 1], .28, .18);
  const soup = scene.material('velvety red lentil soup', [.91, .245, .032, 1], .3);
  const soupDark = scene.material('soup depth', [.67, .095, .012, 1], .42);
  const oil = scene.material('olive oil', [.98, .69, .12, 1], .16);
  const paprika = scene.material('paprika', [.45, .018, .006, 1], .9);
  const parsley = scene.material('parsley', [.025, .27, .04, 1], .68);
  const lemon = scene.material('lemon peel', [.98, .72, .04, 1], .45);
  const pith = scene.material('lemon flesh', [.96, .91, .62, 1], .55);
  const bowlProfile = [[.050,0],[.059,.002],[.071,.006],[.083,.015],[.094,.029],[.102,.044],[.107,.056],[.107,.060],[.102,.063],[.097,.061],[.091,.054],[.083,.039],[.073,.022],[.060,.008],[.050,.003],[.050,0]];
  scene.node('ceramic bowl', lathe(bowlProfile, 144), porcelain);
  scene.node('gold rim', TORUS, gold, {translation: [0,.061,0], scale: [.103,.0011,.103]});
  scene.node('soup body', cylinder(144, 1, 1), soupDark, {translation: [0,.055,0], scale: [.092,.006,.092]});
  scene.node('soup surface', sphere(96, 44, 6), soup, {translation: [0,.060,0], scale: [.091,.0027,.091]});
  const swirl = [[-.043,-.004],[-.035,.016],[-.018,.03],[.008,.034],[.034,.023],[.045,.002],[.038,-.022],[.018,-.036],[-.009,-.036],[-.03,-.024],[-.032,-.007],[-.017,.004],[.004,.009],[.019,.004]];
  swirl.forEach(([x,z], i) => scene.node(`oil swirl ${i}`, SPHERES[i % SPHERES.length], oil, {translation:[x,.063,z], rotation: quat([0,1,0],i*.7), scale:[.011,.00055,.004]}));
  for (let i = 0; i < 52; i += 1) {
    const angle = i * 2.31, radius = .008 + (i % 11) * .0064;
    scene.node(`paprika ${i}`, SMALL_SPHERE, paprika, {translation:[Math.cos(angle)*radius,.0635,Math.sin(angle)*radius], scale:[.0008,.00035,.00055]});
  }
  for (let i = 0; i < 24; i += 1) {
    const angle = i * 2.43, radius = .005 + (i % 6) * .0025;
    scene.node(`parsley ${i}`, SMALL_SPHERE, parsley, {translation:[.018+Math.cos(angle)*radius,.064,-.008+Math.sin(angle)*radius], rotation:quat([0,1,0],angle), scale:[.006,.00055,.0022]});
  }
  scene.node('lemon peel', SPHERES[4], lemon, {translation:[.073,.073,-.056], rotation:quat([0,0,1],-.42), scale:[.036,.010,.028]});
  scene.node('lemon flesh', SPHERES[6], pith, {translation:[.071,.075,-.055], rotation:quat([0,0,1],-.42), scale:[.030,.0105,.022]});
  scene.write('turkish-lentil-soup.glb');
}

fs.mkdirSync(output, {recursive: true});
shish();
adana();
soup();
