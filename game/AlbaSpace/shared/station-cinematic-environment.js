/* AlbaSpace cinematic environment: procedural Earth, atmosphere, cinematic lighting, PBR materials and station shadows. Presentation only. */
(function () {
  if (!window.AlbaStation3D || window.AlbaStationCinematicEnvironment) return;

  function color(hex) { return BABYLON.Color3.FromHexString(hex); }

  function seedRand(seed) {
    let value = seed >>> 0;
    return function () {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function drawEarthTexture(scene) {
    const texture = new BABYLON.DynamicTexture("EarthSurfaceTexture", { width: 1024, height: 512 }, scene, false);
    const ctx = texture.getContext();
    const w = 1024, h = 512;
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, "#071d38"); ocean.addColorStop(0.5, "#0b3151"); ocean.addColorStop(1, "#07182d");
    ctx.fillStyle = ocean; ctx.fillRect(0, 0, w, h);

    function blob(points, fill) {
      ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i += 3) {
        const p1 = points[i], p2 = points[i + 1] || p1, p3 = points[i + 2] || p2;
        ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
      }
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    }
    blob([[80,185],[118,125],[210,115],[252,165],[285,205],[255,250],[205,280],[170,325],[105,290],[72,235]], "#3f5f43");
    blob([[300,135],[355,92],[430,112],[466,145],[490,182],[446,220],[402,245],[378,300],[332,270],[306,218]], "#294d3f");
    blob([[442,206],[492,180],[565,194],[604,228],[636,278],[612,335],[568,382],[510,364],[474,316],[444,260]], "#806a45");
    blob([[600,118],[664,86],[742,108],[778,143],[810,181],[772,214],[720,222],[676,252],[632,224],[605,174]], "#3f5f43");
    blob([[760,262],[818,238],[876,259],[922,300],[897,342],[845,365],[790,343],[756,302]], "#294d3f");
    blob([[905,125],[944,105],[982,130],[1008,166],[990,206],[952,226],[918,198],[900,159]], "#3f5f43");
    blob([[18,136],[44,111],[70,126],[88,160],[65,193],[33,190],[14,163]], "#294d3f");

    const rand = seedRand(92831);
    for (let i = 0; i < 520; i++) {
      const x = rand() * w, y = 80 + rand() * (h - 160);
      if (rand() < 0.6) continue;
      ctx.fillStyle = rand() > 0.35 ? "rgba(255,207,121,0.72)" : "rgba(149,209,255,0.55)";
      ctx.fillRect(x, y, 1.2 + rand() * 1.8, 1.2 + rand() * 1.8);
    }
    const north = ctx.createLinearGradient(0, 0, 0, 72);
    north.addColorStop(0, "rgba(238,248,255,.95)"); north.addColorStop(1, "rgba(238,248,255,0)");
    ctx.fillStyle = north; ctx.fillRect(0, 0, w, 72);
    const south = ctx.createLinearGradient(0, h, 0, h - 70);
    south.addColorStop(0, "rgba(238,248,255,.92)"); south.addColorStop(1, "rgba(238,248,255,0)");
    ctx.fillStyle = south; ctx.fillRect(0, h - 70, w, 70);
    texture.update(false); texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    return texture;
  }

  function drawCloudTexture(scene) {
    const texture = new BABYLON.DynamicTexture("EarthCloudTexture", { width: 1024, height: 512 }, scene, false);
    const ctx = texture.getContext(); ctx.clearRect(0, 0, 1024, 512);
    const rand = seedRand(516221);
    for (let i = 0; i < 95; i++) {
      const x = rand() * 1024, y = 55 + rand() * 400, rx = 18 + rand() * 65, ry = 4 + rand() * 16;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rx);
      grad.addColorStop(0, `rgba(238,248,255,${0.09 + rand() * 0.12})`); grad.addColorStop(1, "rgba(238,248,255,0)");
      ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rand() * 0.6 - 0.3, 0, Math.PI * 2); ctx.fill();
    }
    texture.hasAlpha = true; texture.update(false); return texture;
  }

  function configureImageProcessing(scene) {
    const config = scene.imageProcessingConfiguration;
    config.toneMappingEnabled = true;
    if (BABYLON.ImageProcessingConfiguration?.TONEMAPPING_ACES !== undefined) config.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    config.exposure = 1.08; config.contrast = 1.16; config.vignetteEnabled = true; config.vignetteWeight = 1.2; config.vignetteStretch = 0.15;
    config.vignetteColor = new BABYLON.Color4(0.01, 0.02, 0.045, 1);
  }

  function configureCinematicLights(renderer) {
    const scene = renderer.scene;
    scene.lights.slice().forEach(light => { if (["soft-space-light", "cyan-rim", "earth-light"].includes(light.name)) light.dispose(); });
    const sun = new BABYLON.DirectionalLight("OrbitalSun", new BABYLON.Vector3(-0.72, -0.46, 0.5), scene);
    sun.diffuse = color("#fff4df"); sun.specular = color("#ffffff"); sun.intensity = 2.2; sun.position = new BABYLON.Vector3(16, 13, -12);
    const earthBounce = new BABYLON.HemisphericLight("EarthBounce", new BABYLON.Vector3(0.2, -1, 0.35), scene);
    earthBounce.diffuse = color("#66b8e8"); earthBounce.groundColor = color("#06101b"); earthBounce.intensity = 0.46;
    const coolRim = new BABYLON.PointLight("StationCoolRim", new BABYLON.Vector3(-6, 7, -8), scene);
    coolRim.diffuse = color("#62dff5"); coolRim.specular = color("#86ecff"); coolRim.intensity = 1.4; coolRim.range = 24;
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, sun);
    shadowGenerator.usePercentageCloserFiltering = true; shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
    shadowGenerator.bias = 0.0008; shadowGenerator.normalBias = 0.02; renderer.__albaShadowGenerator = shadowGenerator;
  }

  function createStarField(renderer) {
    const scene = renderer.scene, rand = seedRand(734511);
    const starMat = new BABYLON.StandardMaterial("CinematicStarMaterial", scene);
    starMat.emissiveColor = color("#d7ecff"); starMat.disableLighting = true; starMat.freeze();
    for (let i = 0; i < 110; i++) {
      const star = BABYLON.MeshBuilder.CreateSphere(`CinematicStar_${i}`, { diameter: 0.018 + rand() * 0.035, segments: 3 }, scene);
      const theta = rand() * Math.PI * 2, phi = Math.acos(2 * rand() - 1), radius = 24 + rand() * 18;
      star.position.set(Math.sin(phi) * Math.cos(theta) * radius, Math.cos(phi) * radius, Math.sin(phi) * Math.sin(theta) * radius);
      star.material = starMat; star.isPickable = false;
    }
  }

  function createEarth(renderer) {
    const scene = renderer.scene;
    const earth = BABYLON.MeshBuilder.CreateSphere("Earth", { diameter: 10.8, segments: 48 }, scene);
    earth.position.set(6.3, -9.3, 7.8); earth.rotation.y = -0.55; earth.isPickable = false;
    const earthMat = new BABYLON.PBRMaterial("EarthPBR", scene);
    earthMat.albedoTexture = drawEarthTexture(scene); earthMat.albedoColor = color("#ffffff"); earthMat.metallic = 0; earthMat.roughness = 0.78; earthMat.environmentIntensity = 0.65;
    earth.material = earthMat;

    const clouds = BABYLON.MeshBuilder.CreateSphere("EarthClouds", { diameter: 10.89, segments: 42 }, scene);
    clouds.position.copyFrom(earth.position); clouds.rotation.y = -0.48; clouds.isPickable = false;
    const cloudMat = new BABYLON.StandardMaterial("EarthCloudMaterial", scene);
    cloudMat.diffuseTexture = drawCloudTexture(scene); cloudMat.opacityTexture = cloudMat.diffuseTexture; cloudMat.emissiveColor = color("#3a5262"); cloudMat.specularColor = BABYLON.Color3.Black(); cloudMat.alpha = 0.52;
    clouds.material = cloudMat;

    const atmosphere = BABYLON.MeshBuilder.CreateSphere("EarthAtmosphere", { diameter: 11.12, segments: 42 }, scene);
    atmosphere.position.copyFrom(earth.position); atmosphere.isPickable = false;
    const atmosphereMat = new BABYLON.StandardMaterial("EarthAtmosphereMaterial", scene);
    atmosphereMat.diffuseColor = color("#2f91bf"); atmosphereMat.emissiveColor = color("#1f6b9f"); atmosphereMat.alpha = 0.13; atmosphereMat.backFaceCulling = false; atmosphereMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
    atmosphereMat.diffuseFresnelParameters = new BABYLON.FresnelParameters(); atmosphereMat.diffuseFresnelParameters.bias = 0.05; atmosphereMat.diffuseFresnelParameters.power = 4.2;
    atmosphereMat.diffuseFresnelParameters.leftColor = color("#73d6ff"); atmosphereMat.diffuseFresnelParameters.rightColor = color("#07111e");
    atmosphere.material = atmosphereMat;
    scene.onBeforeRenderObservable.add(() => { earth.rotation.y += 0.000025; clouds.rotation.y += 0.000045; });
  }

  function createSunGlow(renderer) {
    const scene = renderer.scene;
    const sun = BABYLON.MeshBuilder.CreateSphere("SunDisc", { diameter: 1.1, segments: 12 }, scene);
    sun.position.set(-19, 13, -22); sun.isPickable = false;
    const mat = new BABYLON.StandardMaterial("SunDiscMaterial", scene); mat.emissiveColor = color("#fff0c2"); mat.disableLighting = true; sun.material = mat;
    const glow = new BABYLON.GlowLayer("OrbitalGlow", scene, { blurKernelSize: 32 }); glow.intensity = 0.34; glow.addIncludedOnlyMesh(sun);
  }

  function registerStationShadows(renderer) {
    const generator = renderer.__albaShadowGenerator;
    if (!generator || !renderer.stationRoot) return;
    renderer.stationRoot.getChildMeshes(false).forEach(mesh => {
      const alpha = Number(mesh.material?.alpha ?? 1), name = String(mesh.name || "");
      const transparent = alpha < 0.58 || /CrewSlot_|Status|Beacon|Glow|Light|Label|Hologram/.test(name);
      mesh.receiveShadows = !transparent;
      if (!transparent) generator.addShadowCaster(mesh, false);
    });
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaCinematicEnvironmentPatched) {
    proto.material = function (hex, alpha = 1, emissive = false) {
      const material = new BABYLON.PBRMaterial(`pbr_${hex}_${alpha}_${emissive}_${Math.random()}`, this.scene);
      material.albedoColor = color(hex); material.metallic = emissive ? 0.05 : 0.28; material.roughness = emissive ? 0.48 : 0.58; material.alpha = alpha; material.environmentIntensity = 0.7;
      if (emissive) { material.emissiveColor = color(hex).scale(0.72); material.emissiveIntensity = 0.85; }
      return material;
    };

    proto.createBackground = function () {
      configureImageProcessing(this.scene); configureCinematicLights(this); createEarth(this); createStarField(this); createSunGlow(this);
      this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2; this.scene.fogDensity = 0.0045; this.scene.fogColor = color("#030817");
    };

    const originalUpdate = proto.update;
    proto.update = function (nextState, nextPlayer) { originalUpdate.call(this, nextState, nextPlayer); registerStationShadows(this); };
    proto.__albaCinematicEnvironmentPatched = true;
  }

  window.AlbaStationCinematicEnvironment = { version: "20260909-cinematic1" };
})();
