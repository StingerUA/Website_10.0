/* AlbaSpace external equipment polish: articulated solar blankets, rotary joints, radiators, antennas and service hardware. Presentation only. */
(function () {
  if (!window.AlbaStation3D || window.AlbaStationExternalEquipment) return;

  function material(renderer, key, color, alpha = 1, emissive = false) {
    renderer.__albaExternalMaterials ||= {};
    const cached = renderer.__albaExternalMaterials[key];
    if (cached && !cached.isDisposed?.()) return cached;
    const created = renderer.material(color, alpha, emissive);
    renderer.__albaExternalMaterials[key] = created;
    return created;
  }

  function box(renderer, name, size, position, parent, mat, rotation = null) {
    const mesh = BABYLON.MeshBuilder.CreateBox(name, size, renderer.scene);
    mesh.position.copyFrom(position);
    if (rotation) mesh.rotation.copyFrom(rotation);
    mesh.parent = parent;
    mesh.material = mat;
    mesh.isPickable = false;
    return mesh;
  }

  function rotationFromY(direction) {
    const from = BABYLON.Axis.Y;
    const to = direction.normalize();
    const dot = Math.max(-1, Math.min(1, BABYLON.Vector3.Dot(from, to)));
    if (dot > 0.99999) return BABYLON.Quaternion.Identity();
    if (dot < -0.99999) return BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, Math.PI);
    const axis = BABYLON.Vector3.Cross(from, to).normalize();
    return BABYLON.Quaternion.RotationAxis(axis, Math.acos(dot));
  }

  function cylinderBetween(renderer, name, start, end, diameter, mat, tessellation = 12) {
    const delta = end.subtract(start);
    const distance = delta.length();
    if (distance < 0.015) return null;
    const mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height: distance, diameter, tessellation, cap: BABYLON.Mesh.CAP_ALL }, renderer.scene);
    mesh.position = BABYLON.Vector3.Center(start, end);
    mesh.rotationQuaternion = rotationFromY(delta);
    mesh.parent = renderer.stationRoot;
    mesh.material = mat;
    mesh.isPickable = false;
    return mesh;
  }

  function torus(renderer, name, position, diameter, thickness, mat, rotation = null, parent = null) {
    const mesh = BABYLON.MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation: 22 }, renderer.scene);
    mesh.position.copyFrom(position);
    if (rotation) mesh.rotation.copyFrom(rotation);
    mesh.parent = parent || renderer.stationRoot;
    mesh.material = mat;
    mesh.isPickable = false;
    return mesh;
  }

  function panelCell(renderer, parent, name, x, z, width, depth, mat, frameMat) {
    const cell = box(renderer, name, { width, height: 0.026, depth }, new BABYLON.Vector3(x, 0, z), parent, mat);
    const frame = 0.025;
    box(renderer, `${name}_FrameL`, { width: frame, height: 0.038, depth: depth + 0.03 }, new BABYLON.Vector3(x - width / 2, 0.012, z), parent, frameMat);
    box(renderer, `${name}_FrameR`, { width: frame, height: 0.038, depth: depth + 0.03 }, new BABYLON.Vector3(x + width / 2, 0.012, z), parent, frameMat);
    box(renderer, `${name}_FrameA`, { width: width + 0.03, height: 0.038, depth: frame }, new BABYLON.Vector3(x, 0.012, z - depth / 2), parent, frameMat);
    box(renderer, `${name}_FrameB`, { width: width + 0.03, height: 0.038, depth: frame }, new BABYLON.Vector3(x, 0.012, z + depth / 2), parent, frameMat);
    return cell;
  }

  function addSolarBlanket(renderer, panel, index) {
    const deepBlue = material(renderer, "solar-cell", "#183f6e", 0.98, true);
    const blue2 = material(renderer, "solar-cell-alt", "#24588d", 0.94, true);
    const frame = material(renderer, "solar-frame", "#b9c8cf", 0.96);
    const gold = material(renderer, "solar-gold", "#c99f45", 0.95);
    const joint = material(renderer, "solar-joint", "#637681", 1);
    const jointDark = material(renderer, "solar-joint-dark", "#243741", 1);
    const glow = material(renderer, "solar-status", "#66e4f3", 0.86, true);

    panel.visibility = 0.03;
    renderer.scene.meshes.filter(mesh => String(mesh.name || "").startsWith(`SolarLine_${index - 1}_`)).forEach(mesh => { mesh.isVisible = false; });

    const pivot = new BABYLON.TransformNode(`SolarRotaryPivot_${index}`, renderer.scene);
    pivot.parent = renderer.stationRoot;
    pivot.position.copyFrom(panel.position);
    pivot.rotation.y = index % 2 ? 0.055 : -0.055;

    const hub = BABYLON.MeshBuilder.CreateCylinder(`SolarRotaryJoint_${index}`, { height: 0.34, diameter: 0.5, tessellation: 18 }, renderer.scene);
    hub.parent = pivot;
    hub.position.y = -0.02;
    hub.material = jointDark;
    hub.isPickable = false;
    torus(renderer, `SolarAlphaJoint_${index}`, new BABYLON.Vector3(0, 0.12, 0), 0.66, 0.1, joint, null, pivot);
    torus(renderer, `SolarBetaJoint_${index}`, new BABYLON.Vector3(0, -0.08, 0), 0.5, 0.065, gold, new BABYLON.Vector3(Math.PI / 2, 0, 0), pivot);

    const drive = box(renderer, `SolarDriveBox_${index}`, { width: 0.34, height: 0.22, depth: 0.32 }, new BABYLON.Vector3(0.36, -0.02, 0), pivot, joint);
    const status = BABYLON.MeshBuilder.CreateSphere(`SolarDriveStatus_${index}`, { diameter: 0.08, segments: 8 }, renderer.scene);
    status.parent = pivot;
    status.position.set(0.36, 0.08, -0.18);
    status.material = glow;
    status.isPickable = false;

    const wingWidth = 1.02;
    const segmentDepth = 0.54;
    const segmentGap = 0.045;
    const segments = 5;
    const baseOffset = 0.48;

    [-1, 1].forEach(side => {
      const wing = new BABYLON.TransformNode(`SolarWing_${index}_${side < 0 ? "A" : "B"}`, renderer.scene);
      wing.parent = pivot;
      wing.rotation.x = (index % 2 ? 1 : -1) * 0.035;
      wing.rotation.z = side * 0.012;

      const rootZ = side * baseOffset;
      const sparStart = new BABYLON.Vector3(0, 0.03, rootZ);
      const sparEnd = new BABYLON.Vector3(0, 0.03, side * (baseOffset + segments * (segmentDepth + segmentGap)));
      const spar = BABYLON.MeshBuilder.CreateCylinder(`SolarWingSpar_${index}_${side}`, {
        height: BABYLON.Vector3.Distance(sparStart, sparEnd), diameter: 0.065, tessellation: 10
      }, renderer.scene);
      spar.position = BABYLON.Vector3.Center(sparStart, sparEnd);
      spar.rotationQuaternion = rotationFromY(sparEnd.subtract(sparStart));
      spar.parent = wing;
      spar.material = frame;
      spar.isPickable = false;

      for (let segment = 0; segment < segments; segment++) {
        const z = side * (baseOffset + segmentDepth / 2 + segment * (segmentDepth + segmentGap));
        const cellMat = segment % 2 ? blue2 : deepBlue;
        panelCell(renderer, wing, `SolarBlanket_${index}_${side}_${segment + 1}`, 0, z, wingWidth, segmentDepth, cellMat, frame);

        [-0.26, 0, 0.26].forEach((x, lineIndex) => {
          box(renderer, `SolarCellGrid_${index}_${side}_${segment}_${lineIndex}`, { width: 0.012, height: 0.042, depth: segmentDepth * 0.92 }, new BABYLON.Vector3(x, 0.024, z), wing, frame);
        });
        [-0.16, 0.16].forEach((dz, lineIndex) => {
          box(renderer, `SolarCellBus_${index}_${side}_${segment}_${lineIndex}`, { width: wingWidth * 0.92, height: 0.043, depth: 0.012 }, new BABYLON.Vector3(0, 0.024, z + dz), wing, gold);
        });
      }

      const tipZ = side * (baseOffset + segments * (segmentDepth + segmentGap) + 0.12);
      box(renderer, `SolarTipBeam_${index}_${side}`, { width: wingWidth * 1.08, height: 0.08, depth: 0.08 }, new BABYLON.Vector3(0, 0.02, tipZ), wing, frame);
      const tipLight = BABYLON.MeshBuilder.CreateSphere(`SolarTipBeacon_${index}_${side}`, { diameter: 0.075, segments: 8 }, renderer.scene);
      tipLight.parent = wing;
      tipLight.position.set(side * 0.42, 0.07, tipZ);
      tipLight.material = glow;
      tipLight.isPickable = false;
    });
  }

  function stationBounds(modules) {
    if (!modules.length) return { minX: -1.5, maxX: 1.5, centerX: 0, centerZ: 0 };
    const xs = modules.map(module => module.position.x);
    const zs = modules.map(module => module.position.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    return {
      minX,
      maxX,
      centerX: (minX + maxX) / 2,
      centerZ: (Math.min(...zs) + Math.max(...zs)) / 2
    };
  }

  function addRadiators(renderer, modules) {
    const { centerX, centerZ, minX, maxX } = stationBounds(modules);
    const panelMat = material(renderer, "radiator-panel", "#d9e0e2", 0.98);
    const finMat = material(renderer, "radiator-fin", "#aab8bf", 1);
    const hingeMat = material(renderer, "radiator-hinge", "#536773", 1);
    const coolant = material(renderer, "radiator-coolant", "#68d9e8", 0.75, true);

    const anchors = [
      new BABYLON.Vector3(Math.max(minX, centerX - 1.15), 2.25, centerZ - 1.35),
      new BABYLON.Vector3(Math.min(maxX, centerX + 1.15), 2.25, centerZ - 1.35)
    ];

    anchors.forEach((anchor, index) => {
      const root = new BABYLON.TransformNode(`RadiatorWing_${index + 1}`, renderer.scene);
      root.parent = renderer.stationRoot;
      root.position.copyFrom(anchor);
      root.rotation.x = index ? -0.28 : 0.28;
      root.rotation.y = index ? -0.09 : 0.09;

      const hinge = BABYLON.MeshBuilder.CreateCylinder(`RadiatorRotaryJoint_${index + 1}`, { height: 0.28, diameter: 0.34, tessellation: 14 }, renderer.scene);
      hinge.parent = root;
      hinge.rotation.z = Math.PI / 2;
      hinge.material = hingeMat;
      hinge.isPickable = false;

      const panelCount = 4;
      for (let segment = 0; segment < panelCount; segment++) {
        const z = 0.48 + segment * 0.58;
        box(renderer, `RadiatorPanel_${index + 1}_${segment + 1}`, { width: 1.1, height: 0.045, depth: 0.52 }, new BABYLON.Vector3(0, 0, z), root, panelMat);
        box(renderer, `RadiatorFrame_${index + 1}_${segment + 1}`, { width: 1.18, height: 0.07, depth: 0.045 }, new BABYLON.Vector3(0, 0.02, z - 0.25), root, finMat);
        box(renderer, `RadiatorFrameB_${index + 1}_${segment + 1}`, { width: 1.18, height: 0.07, depth: 0.045 }, new BABYLON.Vector3(0, 0.02, z + 0.25), root, finMat);
        [-0.36, -0.12, 0.12, 0.36].forEach((x, finIndex) => {
          box(renderer, `RadiatorFin_${index + 1}_${segment}_${finIndex}`, { width: 0.018, height: 0.06, depth: 0.45 }, new BABYLON.Vector3(x, 0.03, z), root, finMat);
        });
      }

      const base = new BABYLON.Vector3(anchor.x, 1.6, centerZ + 0.85);
      const tip = anchor.add(new BABYLON.Vector3(0, 0, 0.18));
      cylinderBetween(renderer, `RadiatorCoolantFeed_${index + 1}`, base, tip, 0.055, coolant, 8);
      cylinderBetween(renderer, `RadiatorSupport_${index + 1}`, base.add(new BABYLON.Vector3(index ? 0.18 : -0.18, 0, 0)), tip, 0.075, hingeMat, 8);
    });
  }

  function addDish(renderer, name, base, direction, diameter) {
    const white = material(renderer, "antenna-white", "#d9e0e4", 1);
    const dark = material(renderer, "antenna-dark", "#344852", 1);
    const gold = material(renderer, "antenna-feed", "#c5a55a", 0.95);
    const glow = material(renderer, "antenna-glow", "#6ce4f0", 0.8, true);
    const mastTop = base.add(new BABYLON.Vector3(0, 0.68, 0));
    cylinderBetween(renderer, `${name}_Mast`, base, mastTop, 0.08, dark, 10);

    const dish = BABYLON.MeshBuilder.CreateCylinder(`${name}_Dish`, {
      height: 0.18,
      diameterTop: Math.max(0.08, diameter * 0.12),
      diameterBottom: diameter,
      tessellation: 28,
      cap: BABYLON.Mesh.CAP_ALL
    }, renderer.scene);
    dish.position.copyFrom(mastTop);
    dish.rotationQuaternion = rotationFromY(direction);
    dish.parent = renderer.stationRoot;
    dish.material = white;
    dish.isPickable = false;

    const rimPos = mastTop.add(direction.normalize().scale(0.09));
    const rim = BABYLON.MeshBuilder.CreateTorus(`${name}_DishRim`, { diameter: diameter * 1.02, thickness: 0.035, tessellation: 28 }, renderer.scene);
    rim.position.copyFrom(rimPos);
    rim.rotationQuaternion = rotationFromY(direction);
    rim.parent = renderer.stationRoot;
    rim.material = dark;
    rim.isPickable = false;

    const feedStart = mastTop.add(direction.normalize().scale(0.11));
    const feedEnd = mastTop.add(direction.normalize().scale(0.42));
    cylinderBetween(renderer, `${name}_FeedArm`, feedStart, feedEnd, 0.035, gold, 8);
    const horn = BABYLON.MeshBuilder.CreateSphere(`${name}_FeedHorn`, { diameter: 0.09, segments: 8 }, renderer.scene);
    horn.position.copyFrom(feedEnd);
    horn.parent = renderer.stationRoot;
    horn.material = glow;
    horn.isPickable = false;
  }

  function addAntennas(renderer, modules) {
    const large = modules.filter(module => module.type === "LARGE").sort((a, b) => Number(a.spineIndex || 0) - Number(b.spineIndex || 0));
    if (!large.length) return;
    const first = large[0];
    const last = large[large.length - 1];

    addDish(renderer, "HighGainAntenna", first.position.add(new BABYLON.Vector3(-0.65, 1.2, -0.88)), new BABYLON.Vector3(-0.25, 0.35, -1).normalize(), 0.72);
    if (large.length > 1) addDish(renderer, "TrackingAntenna", last.position.add(new BABYLON.Vector3(0.65, 1.08, 0.82)), new BABYLON.Vector3(0.4, 0.22, 1).normalize(), 0.52);

    const dark = material(renderer, "antenna-boom", "#455b66", 1);
    const white = material(renderer, "antenna-white", "#d9e0e4", 1);
    const center = stationBounds(modules);
    const boomBase = new BABYLON.Vector3(center.centerX, 1.9, center.centerZ + 0.95);
    const boomTip = boomBase.add(new BABYLON.Vector3(0, 1.18, 0.22));
    cylinderBetween(renderer, "TelemetryMast", boomBase, boomTip, 0.07, dark, 8);
    for (let i = 0; i < 4; i++) {
      const y = boomTip.y - 0.18 - i * 0.18;
      cylinderBetween(renderer, `TelemetryCrossDipole_${i + 1}`, new BABYLON.Vector3(boomTip.x - 0.35 + i * 0.035, y, boomTip.z), new BABYLON.Vector3(boomTip.x + 0.35 - i * 0.035, y, boomTip.z), 0.028, white, 6);
    }
  }

  function addServiceBlocks(renderer, modules) {
    const avionics = material(renderer, "service-avionics", "#4e626d", 1);
    const blanket = material(renderer, "service-blanket", "#c5c9c7", 0.95);
    const dark = material(renderer, "service-dark", "#253844", 1);
    const status = material(renderer, "service-status", "#65e1ef", 0.8, true);

    modules.filter(module => module.type === "LARGE").forEach((module, index) => {
      const x = module.position.x;
      const y = module.position.y + 1.28;
      const z = module.position.z + (index % 2 ? -0.78 : 0.78);
      const root = new BABYLON.TransformNode(`ExternalServicePackage_${index + 1}`, renderer.scene);
      root.parent = renderer.stationRoot;
      root.position.set(x, y, z);

      box(renderer, `ExternalAvionicsBox_${index + 1}`, { width: 0.62, height: 0.34, depth: 0.46 }, BABYLON.Vector3.Zero(), root, avionics);
      box(renderer, `ExternalMLIBlanket_${index + 1}`, { width: 0.68, height: 0.06, depth: 0.5 }, new BABYLON.Vector3(0, 0.2, 0), root, blanket);
      [-0.19, 0, 0.19].forEach((xOffset, lineIndex) => {
        box(renderer, `ExternalPanelRib_${index + 1}_${lineIndex}`, { width: 0.035, height: 0.38, depth: 0.49 }, new BABYLON.Vector3(xOffset, 0, 0), root, dark);
      });
      const indicator = BABYLON.MeshBuilder.CreateSphere(`ExternalStatusLight_${index + 1}`, { diameter: 0.07, segments: 8 }, renderer.scene);
      indicator.parent = root;
      indicator.position.set(0.24, 0.08, -0.25);
      indicator.material = status;
      indicator.isPickable = false;
    });
  }

  function addExternalEquipment(renderer, modules) {
    const panels = renderer.scene.meshes.filter(mesh => /^SolarArray_\d+$/.test(String(mesh.name || "")) && mesh.parent === renderer.stationRoot);
    panels.forEach((panel, index) => addSolarBlanket(renderer, panel, index + 1));
    addRadiators(renderer, modules);
    addAntennas(renderer, modules);
    addServiceBlocks(renderer, modules);
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaExternalEquipmentPatched) {
    const originalSolarArrays = proto.buildSolarArrays;
    proto.buildSolarArrays = function (modules) {
      originalSolarArrays.call(this, modules);
      addExternalEquipment(this, modules);
    };
    proto.__albaExternalEquipmentPatched = true;
  }

  window.AlbaStationExternalEquipment = {
    version: "20260909-external1"
  };
})();
