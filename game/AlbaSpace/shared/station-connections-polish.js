/* AlbaSpace connection polish: physical module tunnels, central utility truss and solar support booms. Presentation only. */
(function () {
  if (!window.AlbaStation3D || window.AlbaStationConnectionsPolish) return;

  const DIMS = {
    LARGE: { length: 3.05, radius: 2.35 / 2 },
    SMALL: { length: 2.2, radius: 1.72 / 2 }
  };

  function material(renderer, key, color, alpha = 1, emissive = false) {
    renderer.__albaConnectionMaterials ||= {};
    const cached = renderer.__albaConnectionMaterials[key];
    if (cached && !cached.isDisposed?.()) return cached;
    const created = renderer.material(color, alpha, emissive);
    renderer.__albaConnectionMaterials[key] = created;
    return created;
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
    const mesh = BABYLON.MeshBuilder.CreateCylinder(name, {
      height: distance,
      diameter,
      tessellation,
      cap: BABYLON.Mesh.CAP_ALL
    }, renderer.scene);
    mesh.position = BABYLON.Vector3.Center(start, end);
    mesh.rotationQuaternion = rotationFromY(delta);
    mesh.parent = renderer.stationRoot;
    mesh.material = mat;
    mesh.isPickable = false;
    return mesh;
  }

  function torusAt(renderer, name, position, direction, diameter, thickness, mat) {
    const ring = BABYLON.MeshBuilder.CreateTorus(name, {
      diameter,
      thickness,
      tessellation: 18
    }, renderer.scene);
    ring.position.copyFrom(position);
    ring.rotationQuaternion = rotationFromY(direction);
    ring.parent = renderer.stationRoot;
    ring.material = mat;
    ring.isPickable = false;
    return ring;
  }

  function perpendicular(direction) {
    const normalized = direction.normalize();
    const reference = Math.abs(normalized.y) < 0.82 ? BABYLON.Axis.Y : BABYLON.Axis.Z;
    return BABYLON.Vector3.Cross(normalized, reference).normalize();
  }

  function tunnelEndpoints(parent, child, axial = false) {
    const delta = child.position.subtract(parent.position);
    const direction = delta.normalize();
    const parentDims = DIMS[parent.type] || DIMS.SMALL;
    const childDims = DIMS[child.type] || DIMS.SMALL;
    const parentReach = axial ? parentDims.length / 2 : parentDims.radius;
    const childReach = axial ? childDims.length / 2 : childDims.radius;
    return {
      direction,
      start: parent.position.add(direction.scale(parentReach)),
      end: child.position.subtract(direction.scale(childReach))
    };
  }

  function addTunnel(renderer, parent, child, axial = false) {
    const { start, end, direction } = tunnelEndpoints(parent, child, axial);
    const gap = BABYLON.Vector3.Distance(start, end);
    if (gap < 0.04) return;

    const largePair = parent.type === "LARGE" && child.type === "LARGE";
    const shellDiameter = largePair ? 0.72 : 0.56;
    const collarDiameter = largePair ? 0.88 : 0.7;
    const shell = material(renderer, "tunnel-shell", "#aab8c1", 1);
    const dark = material(renderer, "tunnel-dark", "#223440", 1);
    const light = material(renderer, "tunnel-light", "#75e6f5", 0.72, true);
    const rail = material(renderer, "tunnel-rail", "#d7e1e6", 0.95);
    const id = `${parent.id}_${child.id}`;

    cylinderBetween(renderer, `ConnectionTunnel_${id}`, start, end, shellDiameter, shell, 18);
    cylinderBetween(renderer, `ConnectionPassageLight_${id}`, start.add(direction.scale(0.025)), end.subtract(direction.scale(0.025)), shellDiameter * 0.48, dark, 14);
    torusAt(renderer, `ConnectionCollar_A_${id}`, start, direction, collarDiameter, 0.105, shell);
    torusAt(renderer, `ConnectionCollar_B_${id}`, end, direction, collarDiameter, 0.105, shell);

    const side = perpendicular(direction).scale(shellDiameter * 0.6);
    const lift = BABYLON.Vector3.Cross(direction, side.normalize()).normalize().scale(shellDiameter * 0.42);
    cylinderBetween(renderer, `ConnectionRail_L_${id}`, start.add(side).add(lift), end.add(side).add(lift), 0.045, rail, 8);
    cylinderBetween(renderer, `ConnectionRail_R_${id}`, start.subtract(side).add(lift), end.subtract(side).add(lift), 0.045, rail, 8);

    const midpoint = BABYLON.Vector3.Center(start, end).add(lift.scale(0.55));
    const beacon = BABYLON.MeshBuilder.CreateSphere(`ConnectionBeacon_${id}`, { diameter: 0.095, segments: 8 }, renderer.scene);
    beacon.position.copyFrom(midpoint);
    beacon.parent = renderer.stationRoot;
    beacon.material = light;
    beacon.isPickable = false;
  }

  function addPhysicalConnections(renderer, modules) {
    const byId = new Map(modules.map(module => [module.id, module]));
    const connected = new Set();

    const large = modules
      .filter(module => module.type === "LARGE")
      .sort((a, b) => Number(a.spineIndex || 0) - Number(b.spineIndex || 0));
    for (let index = 1; index < large.length; index++) {
      const parent = large[index - 1];
      const child = large[index];
      addTunnel(renderer, parent, child, true);
      connected.add(`${parent.id}:${child.id}`);
      connected.add(`${child.id}:${parent.id}`);
    }

    modules.filter(module => module.type === "SMALL" && module.parentModuleId).forEach(child => {
      const parent = byId.get(child.parentModuleId);
      if (!parent || connected.has(`${parent.id}:${child.id}`)) return;
      addTunnel(renderer, parent, child, false);
    });
  }

  function addTrussSegment(renderer, name, start, end, diameter, mat) {
    return cylinderBetween(renderer, name, start, end, diameter, mat, 8);
  }

  function addCentralTruss(renderer, modules) {
    const large = modules.filter(module => module.type === "LARGE");
    if (!large.length) return;

    const xs = large.map(module => module.position.x);
    const minX = Math.min(...xs) - 1.35;
    const maxX = Math.max(...xs) + 1.35;
    const centerX = (minX + maxX) / 2;
    const y = 1.58;
    const z = 0.92;
    const railY = 0.18;
    const railZ = 0.25;
    const frameMat = material(renderer, "truss-frame", "#8799a4", 1);
    const brightMat = material(renderer, "truss-bright", "#c4d2d9", 0.98);
    const utilityMat = material(renderer, "truss-utility", "#62dbe9", 0.7, true);

    const corners = [
      [railY, railZ], [railY, -railZ], [-railY, railZ], [-railY, -railZ]
    ];
    corners.forEach(([dy, dz], index) => {
      addTrussSegment(renderer, `MainTruss_Longerons_${index + 1}`,
        new BABYLON.Vector3(minX, y + dy, z + dz),
        new BABYLON.Vector3(maxX, y + dy, z + dz),
        0.085, frameMat);
    });

    const length = maxX - minX;
    const bays = Math.max(3, Math.ceil(length / 0.72));
    for (let i = 0; i <= bays; i++) {
      const x = minX + (length * i) / bays;
      addTrussSegment(renderer, `MainTruss_CrossTop_${i}`,
        new BABYLON.Vector3(x, y + railY, z - railZ),
        new BABYLON.Vector3(x, y + railY, z + railZ), 0.055, brightMat);
      addTrussSegment(renderer, `MainTruss_CrossBottom_${i}`,
        new BABYLON.Vector3(x, y - railY, z - railZ),
        new BABYLON.Vector3(x, y - railY, z + railZ), 0.055, brightMat);
      if (i < bays) {
        const nextX = minX + (length * (i + 1)) / bays;
        const flip = i % 2 ? 1 : -1;
        addTrussSegment(renderer, `MainTruss_Diagonal_${i}`,
          new BABYLON.Vector3(x, y - railY, z + flip * railZ),
          new BABYLON.Vector3(nextX, y + railY, z - flip * railZ), 0.048, frameMat);
      }
    }

    large.forEach((module, index) => {
      const top = new BABYLON.Vector3(module.position.x, DIMS.LARGE.radius * 0.96, module.position.z + 0.2);
      const left = new BABYLON.Vector3(module.position.x - 0.22, y - railY, z - railZ);
      const right = new BABYLON.Vector3(module.position.x + 0.22, y - railY, z + railZ);
      addTrussSegment(renderer, `TrussModuleSupport_L_${index}`, top, left, 0.065, brightMat);
      addTrussSegment(renderer, `TrussModuleSupport_R_${index}`, top, right, 0.065, brightMat);
    });

    addTrussSegment(renderer, "MainTruss_UtilityConduit",
      new BABYLON.Vector3(minX, y + 0.03, z + railZ + 0.13),
      new BABYLON.Vector3(maxX, y + 0.03, z + railZ + 0.13), 0.07, utilityMat);

    const mastBottom = new BABYLON.Vector3(centerX, y + railY, z);
    const mastTop = new BABYLON.Vector3(centerX, 3.72, z + 0.18);
    addTrussSegment(renderer, "SolarPowerMast_Main", mastBottom, mastTop, 0.12, frameMat);
    addTrussSegment(renderer, "SolarPowerMast_BraceL", new BABYLON.Vector3(centerX - 0.58, y + railY, z), mastTop, 0.055, frameMat);
    addTrussSegment(renderer, "SolarPowerMast_BraceR", new BABYLON.Vector3(centerX + 0.58, y + railY, z), mastTop, 0.055, frameMat);

    const panels = renderer.scene.meshes.filter(mesh => /^SolarArray_\d+$/.test(mesh.name || "") && mesh.parent === renderer.stationRoot);
    panels.forEach((panel, index) => {
      const attach = panel.position.add(new BABYLON.Vector3(0, -0.08, 0));
      const busPoint = new BABYLON.Vector3(attach.x, mastTop.y + 0.18, attach.z);
      addTrussSegment(renderer, `SolarBus_${index + 1}`, mastTop, busPoint, 0.07, frameMat);
      addTrussSegment(renderer, `SolarBoom_${index + 1}`, busPoint, attach, 0.07, brightMat);
    });
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaConnectionsPolishPatched) {
    const originalSolarArrays = proto.buildSolarArrays;
    proto.buildSolarArrays = function (modules) {
      originalSolarArrays.call(this, modules);
      addPhysicalConnections(this, modules);
      addCentralTruss(this, modules);
    };
    proto.__albaConnectionsPolishPatched = true;
  }

  window.AlbaStationConnectionsPolish = {
    version: "20260909-connections1"
  };
})();
