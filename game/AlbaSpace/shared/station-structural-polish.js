/* AlbaSpace structural polish: segmented pressure hulls, docking collars, cutaway lips, handrails and exterior service detail. */
(function () {
  if (!window.AlbaStation3D || window.AlbaStationStructuralPolish) return;

  function mat(renderer, key, color, alpha = 1, emissive = false) {
    renderer.__albaStructuralMaterials ||= {};
    if (!renderer.__albaStructuralMaterials[key]) renderer.__albaStructuralMaterials[key] = renderer.material(color, alpha, emissive);
    return renderer.__albaStructuralMaterials[key];
  }

  function box(renderer, name, size, position, parent, material, rotation = null) {
    const mesh = BABYLON.MeshBuilder.CreateBox(name, size, renderer.scene);
    mesh.position.copyFrom(position);
    if (rotation) mesh.rotation.copyFrom(rotation);
    mesh.parent = parent;
    mesh.material = material;
    mesh.isPickable = false;
    return mesh;
  }

  function torus(renderer, name, diameter, thickness, position, parent, material, rotation = null) {
    const mesh = BABYLON.MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation: 28 }, renderer.scene);
    mesh.position.copyFrom(position);
    if (rotation) mesh.rotation.copyFrom(rotation);
    mesh.parent = parent;
    mesh.material = material;
    mesh.isPickable = false;
    return mesh;
  }

  function cylinder(renderer, name, height, diameter, position, parent, material, rotation = null) {
    const mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height, diameter, tessellation: 24 }, renderer.scene);
    mesh.position.copyFrom(position);
    if (rotation) mesh.rotation.copyFrom(rotation);
    mesh.parent = parent;
    mesh.material = material;
    mesh.isPickable = false;
    return mesh;
  }

  function addSegmentedHull(renderer, meta, root, length, diameter, isLarge) {
    const radius = diameter / 2;
    const hull = mat(renderer, isLarge ? "struct-hull-large" : "struct-hull-small", isLarge ? "#aeb8bd" : "#9da9af", 0.98);
    const inner = mat(renderer, "struct-inner-lip", "#33424d", 1);
    const mli = mat(renderer, "struct-mli", "#d7dde0", 0.86);

    const angles = [-130, -100, -70, -40, -12, 12, 40, 70, 100, 130];
    const segmentHeight = radius * 0.58;
    angles.forEach((degrees, index) => {
      const angle = degrees * Math.PI / 180;
      const y = Math.sin(angle) * radius * 0.97;
      const z = Math.cos(angle) * radius * 0.97;
      const panel = box(
        renderer,
        `${meta.id}_HullPanel_${index + 1}`,
        { width: length * 0.96, height: segmentHeight, depth: 0.09 },
        new BABYLON.Vector3(0, y, z),
        root,
        index % 3 === 0 ? mli : hull,
        new BABYLON.Vector3(angle, 0, 0)
      );
      panel.metadata = { decorative: true, kind: "pressure-hull" };
    });

    const lipY = radius * 0.54;
    const frontZ = -radius * 0.82;
    box(renderer, `${meta.id}_CutawayLipTop`, { width: length * 0.98, height: 0.11, depth: 0.18 }, new BABYLON.Vector3(0, lipY, frontZ), root, inner);
    box(renderer, `${meta.id}_CutawayLipBottom`, { width: length * 0.98, height: 0.11, depth: 0.18 }, new BABYLON.Vector3(0, -lipY, frontZ), root, inner);
    [-1, 1].forEach(side => box(renderer, `${meta.id}_CutawayLipSide_${side}`, { width: 0.12, height: diameter * 0.98, depth: 0.18 }, new BABYLON.Vector3(side * length * 0.49, 0, frontZ), root, inner));

    const rib = mat(renderer, "struct-rib", "#71818b", 1);
    const ribPositions = isLarge ? [-0.42, 0, 0.42] : [-0.34, 0.34];
    ribPositions.forEach((ratio, index) => {
      torus(renderer, `${meta.id}_PressureRib_${index + 1}`, diameter * 1.03, isLarge ? 0.07 : 0.055, new BABYLON.Vector3(length * ratio, 0, 0), root, rib, new BABYLON.Vector3(0, 0, Math.PI / 2));
    });
  }

  function addDockingHardware(renderer, meta, root, length, diameter, isLarge) {
    const ring = mat(renderer, "struct-dock-ring", "#7c8c95", 1);
    const dark = mat(renderer, "struct-dock-dark", "#18252e", 1);
    const marker = mat(renderer, "struct-dock-marker", "#65dff0", 0.82, true);
    const radius = diameter / 2;

    if (isLarge) {
      [-1, 1].forEach((side, index) => {
        const x = side * length * 0.545;
        torus(renderer, `${meta.id}_AxialDockRing_${index + 1}`, diameter * 0.79, 0.095, new BABYLON.Vector3(x, 0, 0), root, ring, new BABYLON.Vector3(0, 0, Math.PI / 2));
        cylinder(renderer, `${meta.id}_AxialTunnel_${index + 1}`, 0.18, diameter * 0.61, new BABYLON.Vector3(side * length * 0.575, 0, 0), root, dark, new BABYLON.Vector3(0, 0, Math.PI / 2));
      });

      const radial = [
        { name: "Radial_1", p: new BABYLON.Vector3(0, -radius * 0.98, 0), r: BABYLON.Vector3.Zero() },
        { name: "Radial_2", p: new BABYLON.Vector3(0, radius * 0.98, 0), r: BABYLON.Vector3.Zero() },
        { name: "Radial_3", p: new BABYLON.Vector3(0, 0, -radius * 0.98), r: new BABYLON.Vector3(Math.PI / 2, 0, 0) },
        { name: "Radial_4", p: new BABYLON.Vector3(0, 0, radius * 0.98), r: new BABYLON.Vector3(Math.PI / 2, 0, 0) }
      ];
      radial.forEach((item, index) => {
        torus(renderer, `${meta.id}_${item.name}_Collar`, diameter * 0.44, 0.065, item.p, root, ring, item.r);
        const lightPos = item.p.scale(1.05);
        const beacon = BABYLON.MeshBuilder.CreateSphere(`${meta.id}_${item.name}_Beacon`, { diameter: 0.075, segments: 8 }, renderer.scene);
        beacon.position.copyFrom(lightPos);
        beacon.parent = root;
        beacon.material = marker;
        beacon.isPickable = false;
      });
    } else {
      [-1, 1].forEach((side, index) => {
        const y = side * radius * 0.98;
        torus(renderer, `${meta.id}_SmallDock_${index + 1}`, diameter * 0.54, 0.065, new BABYLON.Vector3(0, y, 0), root, ring);
      });
    }
  }

  function addHandrails(renderer, meta, root, length, diameter, isLarge) {
    const rail = mat(renderer, "struct-handrail", "#d0d7da", 1);
    const accent = mat(renderer, "struct-handrail-accent", isLarge ? "#70deec" : "#f0c45d", 0.74, true);
    const radius = diameter / 2;

    const rails = [
      { y: radius * 0.78, z: -radius * 0.5 },
      { y: -radius * 0.78, z: -radius * 0.5 }
    ];
    rails.forEach((line, index) => {
      box(renderer, `${meta.id}_ExteriorRail_${index + 1}`, { width: length * 0.78, height: 0.035, depth: 0.035 }, new BABYLON.Vector3(0, line.y, line.z), root, rail);
      [-0.34, 0, 0.34].forEach((ratio, supportIndex) => {
        box(renderer, `${meta.id}_RailStand_${index + 1}_${supportIndex + 1}`, { width: 0.035, height: 0.12, depth: 0.035 }, new BABYLON.Vector3(length * ratio, line.y + (index ? -0.05 : 0.05), line.z), root, accent);
      });
    });
  }

  function addServiceDetail(renderer, meta, root, length, diameter, isLarge) {
    const equipment = mat(renderer, "struct-equipment", "#4b5962", 1);
    const cable = mat(renderer, "struct-cable", "#27333a", 1);
    const cableAccent = mat(renderer, "struct-cable-accent", "#c98343", 0.95);
    const windowMat = mat(renderer, "struct-window", "#07121c", 1);
    const glow = mat(renderer, "struct-window-glow", "#5ebed3", 0.28, true);
    const radius = diameter / 2;

    const equipmentCount = isLarge ? 3 : 2;
    for (let i = 0; i < equipmentCount; i++) {
      const x = (i - (equipmentCount - 1) / 2) * (isLarge ? 0.72 : 0.58);
      box(renderer, `${meta.id}_ExteriorEquipment_${i + 1}`, { width: isLarge ? 0.46 : 0.34, height: 0.24, depth: 0.18 }, new BABYLON.Vector3(x, radius * 0.18, radius * 0.82), root, equipment);
    }

    box(renderer, `${meta.id}_CableTray`, { width: length * 0.68, height: 0.045, depth: 0.07 }, new BABYLON.Vector3(0, -radius * 0.56, radius * 0.77), root, cable);
    box(renderer, `${meta.id}_CableRun`, { width: length * 0.59, height: 0.018, depth: 0.025 }, new BABYLON.Vector3(0, -radius * 0.53, radius * 0.72), root, cableAccent);

    if (isLarge && (meta.role === "COMMAND" || meta.name === "COMMAND")) {
      [-0.5, 0, 0.5].forEach((x, index) => {
        const window = box(renderer, `${meta.id}_ObservationWindow_${index + 1}`, { width: 0.34, height: 0.23, depth: 0.035 }, new BABYLON.Vector3(x, radius * 0.08, -radius * 0.86), root, windowMat);
        window.rotation.x = -0.08;
        box(renderer, `${meta.id}_ObservationGlow_${index + 1}`, { width: 0.25, height: 0.035, depth: 0.018 }, new BABYLON.Vector3(x, radius * 0.18, -radius * 0.885), root, glow);
      });
    }
  }

  function addStationStructure(renderer, meta, root) {
    if (!root || !meta) return;
    const isLarge = meta.type === "LARGE";
    const length = isLarge ? 3.05 : 2.2;
    const diameter = isLarge ? 2.35 : 1.72;
    addSegmentedHull(renderer, meta, root, length, diameter, isLarge);
    addDockingHardware(renderer, meta, root, length, diameter, isLarge);
    addHandrails(renderer, meta, root, length, diameter, isLarge);
    addServiceDetail(renderer, meta, root, length, diameter, isLarge);
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaStructuralPolishPatched) {
    const originalBuildModule = proto.buildModule;
    proto.buildModule = function (meta) {
      const root = originalBuildModule.call(this, meta);
      try { addStationStructure(this, meta, root); } catch (error) { if (new URLSearchParams(location.search).has("debug3d")) console.warn("AlbaSpace structural polish failed", error); }
      return root;
    };
    proto.__albaStructuralPolishPatched = true;
  }

  window.AlbaStationStructuralPolish = { version: "20260908-structure1" };
})();
