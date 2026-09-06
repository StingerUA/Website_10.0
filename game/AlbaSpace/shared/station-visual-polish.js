/* AlbaSpace visual polish: interior differentiation, SMALL restraint seats, and pressurized-station cadets. */
(function () {
  if (!window.AlbaStation3D || window.AlbaStationVisualPolish) return;

  const TOPIC_COLORS = {
    PLANETS: "#b58cff",
    SATELLITES: "#66b7ff",
    TELESCOPES: "#71e0a1",
    ROVERS: "#ffad66",
    TURKISH_SATELLITES: "#ffd166"
  };

  const SKINS = ["#f0c7aa", "#d9a07f", "#b97a5c", "#8b563e", "#6b422f"];
  const HAIRS = ["#241a17", "#4a2d1e", "#7d5336", "#d2b27c", "#16191f"];

  function hashSeed(value) {
    const text = String(value || "alba");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function box(scene, name, size, pos, parent, material) {
    const mesh = BABYLON.MeshBuilder.CreateBox(name, size, scene);
    mesh.position.copyFrom(pos);
    mesh.parent = parent;
    mesh.material = material;
    return mesh;
  }

  function capsule(scene, name, height, radius, pos, rot, parent, material) {
    const mesh = BABYLON.MeshBuilder.CreateCapsule(name, { height, radius, subdivisions: 3 }, scene);
    mesh.position.copyFrom(pos);
    mesh.rotation.copyFrom(rot || BABYLON.Vector3.Zero());
    mesh.parent = parent;
    mesh.material = material;
    return mesh;
  }

  function addSmallSeats(renderer, meta, root, length, diameter, accent) {
    const seatMat = renderer.material("#263847", 1);
    const cushionMat = renderer.material("#516777", 1);
    const accentMat = renderer.material(accent, 0.8, true);
    const screenMat = renderer.material("#5ddff4", 0.8, true);

    [-0.43, 0.43].forEach((x, index) => {
      const seatRoot = new BABYLON.TransformNode(`${meta.id}_RestraintSeat_${index + 1}`, renderer.scene);
      seatRoot.parent = root;
      seatRoot.position.set(x, -diameter * 0.18, diameter * 0.08);

      box(renderer.scene, `${meta.id}_SeatBack_${index + 1}`, { width: 0.48, height: 0.62, depth: 0.12 }, new BABYLON.Vector3(0, 0.25, 0.1), seatRoot, seatMat);
      box(renderer.scene, `${meta.id}_SeatCushion_${index + 1}`, { width: 0.46, height: 0.1, depth: 0.42 }, new BABYLON.Vector3(0, -0.03, -0.06), seatRoot, cushionMat);
      box(renderer.scene, `${meta.id}_Harness_${index + 1}`, { width: 0.055, height: 0.45, depth: 0.035 }, new BABYLON.Vector3(index ? -0.12 : 0.12, 0.25, 0.02), seatRoot, accentMat).rotation.z = index ? -0.35 : 0.35;
      box(renderer.scene, `${meta.id}_ControlScreen_${index + 1}`, { width: 0.34, height: 0.22, depth: 0.035 }, new BABYLON.Vector3(0, 0.1, -0.42), seatRoot, screenMat).rotation.x = -0.18;
      box(renderer.scene, `${meta.id}_ControlGripL_${index + 1}`, { width: 0.05, height: 0.2, depth: 0.05 }, new BABYLON.Vector3(-0.25, 0.02, -0.27), seatRoot, accentMat);
      box(renderer.scene, `${meta.id}_ControlGripR_${index + 1}`, { width: 0.05, height: 0.2, depth: 0.05 }, new BABYLON.Vector3(0.25, 0.02, -0.27), seatRoot, accentMat);
    });

    const railMat = renderer.material("#a9bac4", 0.9);
    box(renderer.scene, `${meta.id}_SmallHandrail`, { width: length * 0.7, height: 0.035, depth: 0.035 }, new BABYLON.Vector3(0, diameter * 0.27, -diameter * 0.32), root, railMat);
  }

  function addCommandInterior(renderer, meta, root, length, diameter, accent) {
    const dark = renderer.material("#102b3d", 1);
    const glow = renderer.material(accent, 0.82, true);
    [-0.62, 0, 0.62].forEach((x, index) => {
      box(renderer.scene, `${meta.id}_CommandScreen_${index + 1}`, { width: 0.52, height: 0.34, depth: 0.04 }, new BABYLON.Vector3(x, 0.28, diameter * 0.27), root, glow);
      box(renderer.scene, `${meta.id}_CommandConsole_${index + 1}`, { width: 0.62, height: 0.18, depth: 0.34 }, new BABYLON.Vector3(x, -0.35, -0.2), root, dark).rotation.x = -0.18;
    });
  }

  function addScienceInterior(renderer, meta, root, length, diameter, accent) {
    const rack = renderer.material("#324757", 1);
    const glow = renderer.material(accent, 0.78, true);
    [-0.72, 0.72].forEach((x, index) => {
      box(renderer.scene, `${meta.id}_ScienceRack_${index + 1}`, { width: 0.5, height: 0.78, depth: 0.28 }, new BABYLON.Vector3(x, -0.02, diameter * 0.22), root, rack);
      for (let y = -1; y <= 1; y++) {
        const sample = BABYLON.MeshBuilder.CreateSphere(`${meta.id}_Sample_${index}_${y}`, { diameter: 0.12, segments: 8 }, renderer.scene);
        sample.position.set(x, y * 0.2, diameter * 0.04);
        sample.parent = root;
        sample.material = glow;
      }
    });
    box(renderer.scene, `${meta.id}_LabBench`, { width: length * 0.48, height: 0.1, depth: 0.5 }, new BABYLON.Vector3(0, -0.32, -0.1), root, rack);
  }

  function addOperationsInterior(renderer, meta, root, length, diameter, accent) {
    const rack = renderer.material("#2c3d49", 1);
    const glow = renderer.material(accent, 0.76, true);
    [-0.78, -0.26, 0.26, 0.78].forEach((x, index) => {
      box(renderer.scene, `${meta.id}_OpsLocker_${index + 1}`, { width: 0.34, height: 0.64, depth: 0.26 }, new BABYLON.Vector3(x, 0.02, diameter * 0.22), root, rack);
      box(renderer.scene, `${meta.id}_OpsStatus_${index + 1}`, { width: 0.2, height: 0.08, depth: 0.025 }, new BABYLON.Vector3(x, 0.15, diameter * 0.075), root, glow);
    });
    box(renderer.scene, `${meta.id}_ToolRail`, { width: length * 0.64, height: 0.05, depth: 0.05 }, new BABYLON.Vector3(0, -0.46, -0.22), root, glow);
  }

  function createCadet(renderer, module, local, cadet, slotId) {
    const root = new BABYLON.TransformNode(`Cadet_${cadet.id}`, renderer.scene);
    root.parent = renderer.stationRoot;
    root.position = module.position.add(local);
    const seed = hashSeed(cadet.visualSeed || cadet.id);
    const topicColor = TOPIC_COLORS[cadet.topic] || "#6ee7ff";
    const skin = SKINS[seed % SKINS.length];
    const hair = HAIRS[(seed >>> 3) % HAIRS.length];
    const bodyScale = 0.92 + ((seed >>> 6) % 7) * 0.018;

    const suit = renderer.material("#d8e1e6", 1);
    const suitDark = renderer.material("#697987", 1);
    const skinMat = renderer.material(skin, 1);
    const hairMat = renderer.material(hair, 1);
    const accentMat = renderer.material(topicColor, 1, true);
    const eyeMat = renderer.material("#111923", 1);

    const torso = capsule(renderer.scene, `CadetBody_${cadet.id}`, 0.6 * bodyScale, 0.16 * bodyScale, new BABYLON.Vector3(0, 0, 0), BABYLON.Vector3.Zero(), root, suit);
    torso.scaling.x = 1.08;

    const belt = box(renderer.scene, `CadetBelt_${cadet.id}`, { width: 0.31, height: 0.07, depth: 0.28 }, new BABYLON.Vector3(0, -0.19, 0), root, suitDark);
    const chestPanel = box(renderer.scene, `CadetChest_${cadet.id}`, { width: 0.19, height: 0.11, depth: 0.035 }, new BABYLON.Vector3(0, 0.08, -0.16), root, suitDark);
    const patch = box(renderer.scene, `Patch_${cadet.id}`, { width: 0.1, height: 0.1, depth: 0.025 }, new BABYLON.Vector3(0.13, 0.12, -0.19), root, accentMat);

    const head = BABYLON.MeshBuilder.CreateSphere(`CadetHead_${cadet.id}`, { diameter: 0.27, segments: 14 }, renderer.scene);
    head.position.y = 0.39;
    head.parent = root;
    head.material = skinMat;

    const hairTop = BABYLON.MeshBuilder.CreateSphere(`CadetHair_${cadet.id}`, { diameter: 0.285, segments: 12 }, renderer.scene);
    hairTop.position.set(0, 0.445, 0.015);
    hairTop.scaling.set(1.02, 0.48 + ((seed >>> 10) % 3) * 0.12, 1.02);
    hairTop.parent = root;
    hairTop.material = hairMat;

    const fringeStyle = (seed >>> 12) % 3;
    if (fringeStyle) {
      const fringe = box(renderer.scene, `CadetFringe_${cadet.id}`, { width: fringeStyle === 1 ? 0.2 : 0.13, height: 0.06, depth: 0.05 }, new BABYLON.Vector3(fringeStyle === 2 ? -0.05 : 0, 0.48, -0.125), root, hairMat);
      fringe.rotation.z = fringeStyle === 2 ? 0.18 : -0.08;
    }

    [-1, 1].forEach(side => {
      const eye = BABYLON.MeshBuilder.CreateSphere(`CadetEye_${cadet.id}_${side}`, { diameter: 0.026, segments: 6 }, renderer.scene);
      eye.position.set(side * 0.047, 0.41, -0.126);
      eye.scaling.z = 0.45;
      eye.parent = root;
      eye.material = eyeMat;

      const arm = capsule(renderer.scene, `CadetArm_${cadet.id}_${side}`, 0.34, 0.055, new BABYLON.Vector3(side * 0.21, 0.02, -0.01), new BABYLON.Vector3(0, 0, side * (0.26 + ((seed >>> 15) % 4) * 0.06)), root, suit);
      const glove = BABYLON.MeshBuilder.CreateSphere(`CadetHand_${cadet.id}_${side}`, { diameter: 0.105, segments: 8 }, renderer.scene);
      glove.position.set(side * 0.29, -0.1, -0.01);
      glove.parent = root;
      glove.material = suitDark;

      const leg = capsule(renderer.scene, `CadetLeg_${cadet.id}_${side}`, 0.38, 0.065, new BABYLON.Vector3(side * 0.085, -0.37, 0.01), new BABYLON.Vector3(0, 0, side * 0.08), root, suit);
      const boot = box(renderer.scene, `CadetBoot_${cadet.id}_${side}`, { width: 0.12, height: 0.09, depth: 0.17 }, new BABYLON.Vector3(side * 0.1, -0.58, -0.04), root, suitDark);
    });

    root.rotation.z = renderer.poseRotation(cadet.poseId);
    root.rotation.x = (((seed >>> 18) % 5) - 2) * 0.025;
    root.metadata = { kind: "cadet", id: cadet.id, cadet, module, slotId };
    root.getChildMeshes().forEach(mesh => {
      mesh.actionManager = new BABYLON.ActionManager(renderer.scene);
      mesh.actionManager.hoverCursor = "pointer";
      mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => renderer.onSelect({ kind: "cadet", cadet, module, slotId })));
    });

    const topicLabel = cadet.name || cadet.topic || "Cadet";
    renderer.label(root, topicLabel, new BABYLON.Vector3(0, 0.82, 0));
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaVisualPolishPatched) {
    const originalInterior = proto.buildInterior;
    proto.buildInterior = function (meta, root, length, diameter, accent, accentMat) {
      originalInterior.call(this, meta, root, length, diameter, accent, accentMat);
      if (meta.type === "SMALL") addSmallSeats(this, meta, root, length, diameter, accent);
      else if (meta.role === "SCIENCE" || meta.name === "SCIENCE") addScienceInterior(this, meta, root, length, diameter, accent);
      else if (meta.role === "OPERATIONS" || meta.name === "OPERATIONS") addOperationsInterior(this, meta, root, length, diameter, accent);
      else addCommandInterior(this, meta, root, length, diameter, accent);
    };

    proto.buildCadet = function (module, local, cadet, slotId) {
      return createCadet(this, module, local, cadet, slotId);
    };

    proto.__albaVisualPolishPatched = true;
  }

  window.AlbaStationVisualPolish = { version: "20260906-visual1" };
})();
