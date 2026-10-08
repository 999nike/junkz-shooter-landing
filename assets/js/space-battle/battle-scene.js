import * as THREE from "../../vendor/three-r160.module.min.js";
import { GLTFLoader } from "../../vendor/GLTFLoader-r160.js";
import { createScorpionWeaponFX, WEAPON_TIMING } from "./scorpion-weapon-fx.js?v=cmd-bossfx-1";
import { createSpaceBattleAudio } from "./battle-audio.js?v=junkz-audio-2";

const LOOP_SECONDS = 12;
export const SPACE_BATTLE_BUILD = "cmd-full-visual-1";
const MODEL_URLS = {
  player: new URL("https://cdn.jsdelivr.net/gh/999nike/Smokey-Space@d8fb57f840582e8e322f0057f90a5b56311a9ed3/assets/space-battle/web/Twinflare_Valkyrie_web.glb"),
  boss: new URL("https://cdn.jsdelivr.net/gh/999nike/Smokey-Space@d8fb57f840582e8e322f0057f90a5b56311a9ed3/assets/space-battle/web/Neon_Scorpion_web.glb")
};

const PLAYER_SHOTS = [2.35, 2.68, 3.02, 9.25, 9.56, 9.87];
const SHOT_LIFETIME = 0.72;
const IMPACT_TIMES = PLAYER_SHOTS.map((time) => time + SHOT_LIFETIME * 0.92);
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const easeInOut = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function pulse(time, start, duration) {
  const t = (time - start) / duration;
  return t >= 0 && t <= 1 ? Math.sin(t * Math.PI) : 0;
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(.13, "rgba(140,238,255,.95)");
  gradient.addColorStop(.38, "rgba(24,151,255,.48)");
  gradient.addColorStop(1, "rgba(0,65,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSparkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(.15, "rgba(255,225,130,.95)");
  gradient.addColorStop(.46, "rgba(255,75,20,.52)");
  gradient.addColorStop(1, "rgba(255,20,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePlasmaWispTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 96, 96);
  context.globalCompositeOperation = "lighter";

  const lobes = [
    [46, 48, 29, 1],
    [31, 53, 20, .68],
    [58, 35, 18, .78],
    [65, 57, 17, .62],
    [42, 30, 14, .56]
  ];

  lobes.forEach(([x, y, radius, strength]) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(235,255,255,${.92 * strength})`);
    gradient.addColorStop(.2, `rgba(72,229,255,${.72 * strength})`);
    gradient.addColorStop(.52, `rgba(16,127,255,${.34 * strength})`);
    gradient.addColorStop(1, "rgba(0,55,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function additiveSprite(texture, color, scale = 1) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(scale);
  return sprite;
}

function normalizeModel(object, normalizationRoot, targetSize) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const largestSide = Math.max(size.x, size.y, size.z);

  const scale = targetSize / Math.max(largestSide, .001);
  normalizationRoot.scale.setScalar(scale);
  normalizationRoot.position.copy(center).multiplyScalar(-scale);
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material && "envMapIntensity" in material) material.envMapIntensity = .65;
    });
  });
}

async function loadActor(loader, scene, url, targetSize, modelOrientation) {
  const gltf = await loader.loadAsync(url.href);
  const pathRoot = new THREE.Group();
  const bankingRoot = new THREE.Group();
  const modelRoot = new THREE.Group();
  const normalizationRoot = new THREE.Group();

  pathRoot.add(bankingRoot);
  bankingRoot.add(modelRoot);
  modelRoot.add(normalizationRoot);
  normalizationRoot.add(gltf.scene);
  modelRoot.quaternion.copy(modelOrientation);
  normalizeModel(gltf.scene, normalizationRoot, targetSize);
  scene.add(pathRoot);

  return { pathRoot, bankingRoot, modelRoot, normalizationRoot, model: gltf.scene };
}

function createHardpoint(parent, x, y, z) {
  const hardpoint = new THREE.Object3D();
  hardpoint.position.set(x, y, z);
  parent.add(hardpoint);
  return hardpoint;
}

function createModelOrientation(sourceForward, sourceUp, targetUp) {
  const targetForward = new THREE.Vector3(1, 0, 0);
  const firstTurn = new THREE.Quaternion().setFromUnitVectors(
    sourceForward.clone().normalize(),
    targetForward
  );
  const alignedUp = sourceUp.clone().applyQuaternion(firstTurn);
  alignedUp.addScaledVector(targetForward, -alignedUp.dot(targetForward)).normalize();
  const desiredUp = targetUp.clone();
  desiredUp.addScaledVector(targetForward, -desiredUp.dot(targetForward)).normalize();
  const cross = alignedUp.clone().cross(desiredUp);
  const signedAngle = alignedUp.angleTo(desiredUp) * (targetForward.dot(cross) < 0 ? -1 : 1);
  const rollCorrection = new THREE.Quaternion().setFromAxisAngle(targetForward, signedAngle);
  return rollCorrection.multiply(firstTurn);
}

function aimAlongPath(
  actor,
  curve,
  progress,
  bankStrength,
  rollBoost = 0,
  targetDirection = null,
  aimWeight = 0,
  rotationAlpha = 1
) {
  const point = curve.getPointAt(clamp01(progress));
  const tangent = curve.getTangentAt(clamp01(progress)).normalize();
  const ahead = curve.getTangentAt(clamp01(progress + .006)).normalize();
  const turn = tangent.x * ahead.y - tangent.y * ahead.x;
  if (targetDirection && aimWeight > 0) {
    if (rotationAlpha < 1) {
      const pathAimQuaternion = actor.pathRoot.userData.pathAimQuaternion ??= new THREE.Quaternion();
      const targetAimQuaternion = actor.pathRoot.userData.targetAimQuaternion ??= new THREE.Quaternion();
      pathAimQuaternion.setFromUnitVectors(xAxis, tangent);
      targetAimQuaternion.setFromUnitVectors(xAxis, targetDirection);
      pathAimQuaternion.slerp(targetAimQuaternion, aimWeight);
      tangent.copy(xAxis).applyQuaternion(pathAimQuaternion).normalize();
    } else {
      tangent.lerp(targetDirection, aimWeight).normalize();
    }
  }
  const yaw = Math.atan2(tangent.y, tangent.x);
  const pitch = Math.atan2(-tangent.z, Math.hypot(tangent.x, tangent.y));

  actor.pathRoot.position.copy(point);
  if (rotationAlpha < 1) {
    const targetEuler = actor.pathRoot.userData.targetEuler ??= new THREE.Euler();
    const targetQuaternion = actor.pathRoot.userData.targetQuaternion ??= new THREE.Quaternion();
    targetEuler.set(0, pitch, yaw);
    targetQuaternion.setFromEuler(targetEuler);
    if (actor.pathRoot.userData.rotationReady) {
      actor.pathRoot.quaternion.slerp(targetQuaternion, rotationAlpha);
    } else {
      actor.pathRoot.quaternion.copy(targetQuaternion);
      actor.pathRoot.userData.rotationReady = true;
    }
  } else {
    actor.pathRoot.rotation.set(0, pitch, yaw);
  }
  const targetBank = (
    THREE.MathUtils.clamp(turn * bankStrength, -.72, .72) + rollBoost
  ) * (1 - aimWeight * .72);
  actor.bankingRoot.rotation.x = rotationAlpha < 1
    ? THREE.MathUtils.lerp(
      actor.bankingRoot.rotation.x,
      targetBank,
      Math.min(1, rotationAlpha * 1.35)
    )
    : targetBank;
  return tangent;
}

function aimBossGrounded(actor, curve, progress, targetDirection, aimWeight, rotationAlpha, time) {
  const point = curve.getPointAt(clamp01(progress));
  const forward = actor.pathRoot.userData.groundedForward ??= new THREE.Vector3();
  const surfaceNormal = actor.pathRoot.userData.surfaceNormal ??= new THREE.Vector3();
  const side = actor.pathRoot.userData.groundedSide ??= new THREE.Vector3();
  const targetPlanar = actor.pathRoot.userData.targetPlanar ??= new THREE.Vector3();
  const turnCross = actor.pathRoot.userData.turnCross ??= new THREE.Vector3();
  const yawAdjustQuaternion = actor.pathRoot.userData.yawAdjustQuaternion ??= new THREE.Quaternion();
  const attackPitchQuaternion = actor.pathRoot.userData.attackPitchQuaternion ??= new THREE.Quaternion();
  const matrix = actor.pathRoot.userData.groundedMatrix ??= new THREE.Matrix4();
  const targetQuaternion = actor.pathRoot.userData.groundedQuaternion ??= new THREE.Quaternion();

  curve.getTangentAt(clamp01(progress), forward).normalize();
  if (targetDirection && aimWeight > 0) forward.lerp(targetDirection, aimWeight).normalize();

  // Approximate the visible Earth's curved surface in battle-space.
  // +Z keeps the Scorpion's back visible; X/Y gently tilt the legs with the globe.
  surfaceNormal.set(
    point.x * .22,
    (point.y + 1.35) * .22,
    1
  ).normalize();

  // A grounded creature turns toward the target inside the local surface plane
  // instead of pitching/rolling like a spacecraft.
  forward.addScaledVector(surfaceNormal, -forward.dot(surfaceNormal));
  if (forward.lengthSq() < 1e-5) forward.set(-1, 0, 0);
  forward.normalize();

  // Give targeting the final small turn the eye expects without changing the route.
  // Clamp it to ten degrees so the Scorpion keeps its broad grounded silhouette.
  if (targetDirection && aimWeight > 0) {
    targetPlanar.copy(targetDirection);
    targetPlanar.addScaledVector(surfaceNormal, -targetPlanar.dot(surfaceNormal));

    if (targetPlanar.lengthSq() > 1e-5) {
      targetPlanar.normalize();
      turnCross.crossVectors(forward, targetPlanar);
      const signedAngle = Math.atan2(
        turnCross.dot(surfaceNormal),
        THREE.MathUtils.clamp(forward.dot(targetPlanar), -1, 1)
      );
      const extraYaw = THREE.MathUtils.clamp(
        signedAngle,
        -THREE.MathUtils.degToRad(10),
        THREE.MathUtils.degToRad(10)
      );
      yawAdjustQuaternion.setFromAxisAngle(surfaceNormal, extraYaw);
      forward.applyQuaternion(yawAdjustQuaternion).normalize();
    }
  }

  side.crossVectors(surfaceNormal, forward).normalize();
  surfaceNormal.crossVectors(forward, side).normalize();

  // Late Twinflare attack: as the player commits to the second burst and then
  // escapes, the Scorpion lowers its nose toward the fight instead of staying
  // perfectly level. The sine envelope gives a smooth dip and smooth recovery.
  const attackNoseDip = pulse(time, 8.65, 2.7) * THREE.MathUtils.degToRad(17);
  if (attackNoseDip > 0) {
    attackPitchQuaternion.setFromAxisAngle(side, attackNoseDip);
    forward.applyQuaternion(attackPitchQuaternion).normalize();
    surfaceNormal.applyQuaternion(attackPitchQuaternion).normalize();
  }

  matrix.makeBasis(forward, side, surfaceNormal);
  targetQuaternion.setFromRotationMatrix(matrix);

  actor.pathRoot.position.copy(point);
  if (actor.pathRoot.userData.rotationReady) {
    actor.pathRoot.quaternion.slerp(targetQuaternion, rotationAlpha);
  } else {
    actor.pathRoot.quaternion.copy(targetQuaternion);
    actor.pathRoot.userData.rotationReady = true;
  }

  // Never let the creature look mechanically frozen on its grounded axis.
  // A slow primary sway plus a tiny secondary motion gives a living hover/walk feel,
  // always returning through level instead of holding a permanent bank.
  const livingTilt =
    Math.sin(time * .92) * THREE.MathUtils.degToRad(5.2) +
    Math.sin(time * 1.73 + .8) * THREE.MathUtils.degToRad(1.3);
  actor.bankingRoot.rotation.x = THREE.MathUtils.lerp(
    actor.bankingRoot.rotation.x,
    livingTilt,
    Math.min(1, rotationAlpha * 1.35)
  );
  return forward;
}

function createTrail(scene, texture, pairCount) {
  const sprites = [];
  for (let sample = 0; sample < pairCount; sample += 1) {
    for (let engine = 0; engine < 2; engine += 1) {
      const sprite = additiveSprite(texture, 0x27bfff, .24);
      sprite.material.opacity = 0;
      sprite.renderOrder = 2;
      sprite.userData.sample = sample;
      sprite.userData.engine = engine;
      scene.add(sprite);
      sprites.push(sprite);
    }
  }
  return sprites;
}

function createPlayerBoltMaterial(phase) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      intensity: { value: 1 },
      phase: { value: phase }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float intensity;
      uniform float phase;

      void main() {
        float x = vUv.x;
        float y = abs(vUv.y - .5) * 2.0;
        float ends = smoothstep(.01, .13, x) * (1.0 - smoothstep(.91, 1.0, x));
        float forwardBias = mix(.34, 1.0, smoothstep(.05, .84, x));
        float core = exp(-pow(y / .105, 2.0));
        float inner = exp(-pow(y / .28, 2.0));
        float halo = exp(-pow(y / .72, 2.0));
        float head = exp(-pow((x - .79) / .14, 2.0));
        float ripple = .90 + .10 * sin(x * 42.0 - time * 58.0 + phase);
        float energy = ends * forwardBias * ripple;

        vec3 cyan = vec3(.015, .60, 1.0);
        vec3 ice = vec3(.30, .94, 1.0);
        vec3 whiteHot = vec3(1.0);
        vec3 color = mix(cyan, ice, inner);
        color = mix(color, whiteHot, clamp(core * .92 + head * .72, 0.0, 1.0));

        float alpha = energy * (halo * .16 + inner * .38 + core * .92 + head * .22) * intensity;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
}

function createProjectilePool(scene, texture, lowQuality) {
  return PLAYER_SHOTS.map((_, index) => {
    const group = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = createPlayerBoltMaterial(index * 1.713);

    const bolt = new THREE.Mesh(geometry, material);
    bolt.scale.set(1.08, .28, 1);
    bolt.renderOrder = 4;
    group.add(bolt);

    if (!lowQuality) {
      const cross = new THREE.Mesh(geometry, material);
      cross.rotation.x = Math.PI * .5;
      cross.scale.copy(bolt.scale);
      cross.renderOrder = 4;
      group.add(cross);
    }

    const head = additiveSprite(texture, 0xd9ffff, .24);
    head.position.x = .34;
    head.material.opacity = .94;
    head.renderOrder = 5;
    group.add(head);

    const muzzle = additiveSprite(texture, 0x59e7ff, .34);
    muzzle.visible = false;
    muzzle.renderOrder = 5;
    scene.add(muzzle);

    group.visible = false;
    group.renderOrder = 4;
    group.userData.start = new THREE.Vector3();
    group.userData.material = material;
    group.userData.head = head;
    group.userData.muzzle = muzzle;
    scene.add(group);
    return group;
  });
}

function createImpactPool(scene, hotTexture, plasmaWispTexture) {
  const cloudOffsets = [
    [-.18, .06, .02],
    [.15, .11, -.025],
    [-.06, -.14, .035],
    [.2, -.08, .01],
    [-.22, -.09, -.02],
    [.03, .19, .025]
  ];

  return IMPACT_TIMES.map((_, impactIndex) => {
    const group = new THREE.Group();
    const large = impactIndex === IMPACT_TIMES.length - 1;
    const glow = additiveSprite(hotTexture, large ? 0xff842f : 0x36eaff, 1);
    const core = additiveSprite(hotTexture, 0xf2ffff, .42);
    group.add(glow, core);

    const cloudPuffs = cloudOffsets.map((offset, puffIndex) => {
      const puff = additiveSprite(
        hotTexture,
        puffIndex % 3 === 0 ? 0xf4ffff : (puffIndex % 2 ? 0x46eaff : 0x159dff),
        .42
      );
      puff.position.set(offset[0], offset[1], offset[2]);
      puff.material.opacity = 0;
      puff.userData.baseX = offset[0];
      puff.userData.baseY = offset[1];
      puff.userData.spin = (puffIndex % 2 ? 1 : -1) * (.4 + puffIndex * .09);
      group.add(puff);
      return puff;
    });

    const plasmaDebris = [];
    const debrisCount = large ? 12 : 7;

    for (let index = 0; index < debrisCount; index += 1) {
      const debris = additiveSprite(
        plasmaWispTexture,
        index % 4 === 0 ? 0xf4ffff : (index % 2 ? 0x63efff : 0x168cff),
        .16
      );
      const angle = (index / debrisCount) * Math.PI * 2 + impactIndex * .71;
      debris.material.opacity = 0;
      debris.userData.angle = angle;
      debris.userData.bend = Math.sin((index + 1) * 1.91) * .34;
      debris.userData.spin = (index % 2 ? 1 : -1) * (.7 + (index % 5) * .16);
      debris.userData.baseRotation = angle + (index % 3) * .47;
      debris.userData.widthBias = .72 + (index % 4) * .13;
      debris.userData.heightBias = .58 + ((index + 2) % 5) * .11;
      group.add(debris);
      plasmaDebris.push(debris);
    }

    group.visible = false;
    group.renderOrder = 5;
    scene.add(group);
    return { group, glow, core, cloudPuffs, plasmaDebris, large };
  });
}

const xAxis = new THREE.Vector3(1, 0, 0);
const shotDirection = new THREE.Vector3();

function disposeObject(root) {
  const textures = new Set();
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value && value.isTexture) textures.add(value);
      });
      material.dispose();
    });
  });
  textures.forEach((texture) => texture.dispose());
}

/**
 * Mounts the standalone, pointer-transparent orbital battle renderer.
 * The returned controller owns every resource it creates and can be disposed independently.
 */
export async function createSpaceBattle({
  container,
  visualMode = "full",
  enableAudio = true
}) {
  if (!(container instanceof HTMLElement)) throw new Error("A battle container element is required.");

  const engineEnabled = ["engine-only", "projectiles", "boss-beam", "impacts", "boss-fx", "trails", "full-visual", "full"].includes(visualMode);
  const projectilesEnabled = ["projectiles", "boss-beam", "impacts", "boss-fx", "trails", "full-visual", "full"].includes(visualMode);
  const bossBeamEnabled = ["boss-beam", "impacts", "boss-fx", "trails", "full-visual", "full"].includes(visualMode);
  const impactEnabled = ["impacts", "boss-fx", "trails", "full-visual", "full"].includes(visualMode);
  const bossFxEnabled = ["boss-fx", "trails", "full-visual", "full"].includes(visualMode);
  const trailEnabled = ["trails", "full-visual", "full"].includes(visualMode);
  const bossAuraEnabled = ["boss-fx", "trails", "full-visual", "full"].includes(visualMode);
  const combatEnabled = visualMode === "full";
  container.dataset.battleBuild = SPACE_BATTLE_BUILD;
  container.dataset.battleMode = visualMode;
  console.info(`Orbital battle module loaded: ${SPACE_BATTLE_BUILD}`);

  const lowQuality = window.innerWidth < 760 || navigator.hardwareConcurrency <= 4;
  const reducedMotion = reducedMotionQuery.matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 100);
  camera.position.set(0, .15, 11.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: !lowQuality,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowQuality ? 1.15 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = false;
  renderer.domElement.style.pointerEvents = "none";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xaad8ff, 0x030713, 1.9));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
  keyLight.position.set(4, 6, 7);
  const cyanRim = new THREE.DirectionalLight(0x2bcfff, 2.8);
  cyanRim.position.set(-6, 3, -4);
  const warmRim = new THREE.DirectionalLight(0xff5f32, 1.25);
  warmRim.position.set(5, -2, 2);
  scene.add(keyLight, cyanRim, warmRim);

  const playerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.1, -3.2, .8),
    new THREE.Vector3(-4.8, -1.45, .15),
    new THREE.Vector3(-2.35, 1.75, -.45),
    new THREE.Vector3(.15, 2.85, -.8),
    new THREE.Vector3(3.25, 1.85, -.15),
    new THREE.Vector3(4.2, -.1, .55),
    new THREE.Vector3(2.25, -2.8, .8),
    new THREE.Vector3(-.8, -3.25, .35),
    new THREE.Vector3(-3.15, -.45, -.35),
    new THREE.Vector3(-1.05, 2.45, -.7),
    new THREE.Vector3(2.35, 2.7, -.3),
    new THREE.Vector3(4.65, 1.35, .2),
    new THREE.Vector3(7.15, .45, .85)
  ], false, "catmullrom", .48);

  const bossCurveDesktop = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.65, 1.9, -1.15),
    new THREE.Vector3(3.25, 2.3, -1.05),
    new THREE.Vector3(3.95, 1.55, -.75),
    new THREE.Vector3(4.45, .75, -.45),
    new THREE.Vector3(4.0, .25, -.65),
    new THREE.Vector3(3.15, 1.05, -.95)
  ], true, "centripetal");

  // Portrait phones have a much narrower horizontal frustum. Keep the same
  // choreography but tighten the Scorpion orbit toward Earth so its body,
  // charge corona and full beam remain on-screen.
  const bossCurveMobile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.12, 1.78, -1.15),
    new THREE.Vector3(1.84, 2.08, -1.05),
    new THREE.Vector3(2.26, 1.48, -.75),
    new THREE.Vector3(2.48, .72, -.45),
    new THREE.Vector3(2.24, .28, -.65),
    new THREE.Vector3(1.82, 1.0, -.95)
  ], true, "centripetal");

  let bossCurve = container.clientWidth < 700 ? bossCurveMobile : bossCurveDesktop;

  const loader = new GLTFLoader();
  let player;
  let boss;
  try {
    [player, boss] = await Promise.all([
      // Twinflare nose is source -X; rotate it onto actor-local +X.
      loadActor(loader, scene, MODEL_URLS.player, 1.18, createModelOrientation(
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, .18, 1)
      )),
      // Scorpion head/claws are source +Z; rotate them onto actor-local +X.
      loadActor(loader, scene, MODEL_URLS.boss, 2.05, createModelOrientation(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, .18, 1)
      ))
    ]);
  } catch (error) {
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }

  const glowTexture = makeGlowTexture();
  const hotTexture = makeSparkTexture();
  const plasmaWispTexture = makePlasmaWispTexture();
  const playerEngineHardpoints = [
    createHardpoint(player.normalizationRoot, .84, -.02, -.23),
    createHardpoint(player.normalizationRoot, .84, -.02, .23)
  ];
  const playerGunHardpoints = [
    createHardpoint(player.normalizationRoot, -.82, .015, -.1),
    createHardpoint(player.normalizationRoot, -.82, .015, .1)
  ];
  const bossStingerHardpoint = createHardpoint(boss.normalizationRoot, 0, .34, -1.02);
  const engineRig = new THREE.Group();
  const engineLeft = additiveSprite(glowTexture, 0x21c7ff, .53);
  const engineRight = additiveSprite(glowTexture, 0x21c7ff, .53);
  const engineCore = additiveSprite(glowTexture, 0xc3f9ff, .27);
  engineRig.add(engineLeft, engineRight, engineCore);
  scene.add(engineRig);

  const trailPairs = lowQuality ? 5 : 9;
  const trail = createTrail(scene, glowTexture, trailPairs);
  const projectiles = createProjectilePool(scene, glowTexture, lowQuality);
  const impacts = createImpactPool(scene, hotTexture, plasmaWispTexture);
  const bossWeapon = createScorpionWeaponFX(scene, hotTexture, lowQuality, {
    mode: bossFxEnabled ? "full" : "beam-only"
  });
  const battleAudio = combatEnabled && enableAudio
    ? createSpaceBattleAudio({
        playerShotTimes: PLAYER_SHOTS,
        impactTimes: IMPACT_TIMES,
        bossFireTime: WEAPON_TIMING.fire,
        loopSeconds: LOOP_SECONDS
      })
    : null;
  const bossAura = additiveSprite(glowTexture, 0x08aeea, 1.35);
  bossAura.material.opacity = .22;
  boss.bankingRoot.add(bossAura);
  bossAura.position.set(-.18, 0, -.18);

  const clock = new THREE.Clock();
  const tempPlayer = new THREE.Vector3();
  const tempBoss = new THREE.Vector3();
  const tempShotStart = new THREE.Vector3();
  const tempShotEnd = new THREE.Vector3();
  const playerAimDirection = new THREE.Vector3();
  const bossAimDirection = new THREE.Vector3();
  const engineWorldPositions = [new THREE.Vector3(), new THREE.Vector3()];
  const trailOffset = new THREE.Vector3();
  const trailPoint = new THREE.Vector3();
  const playerFacing = new THREE.Vector3(1, 0, 0);
  const bossFacing = new THREE.Vector3(1, 0, 0);
  let elapsedBeforePause = 0;
  let frameRequest = 0;
  let disposed = false;
  let lastUpdateTime = null;
  let bossAimBlend = 0;

  function getBossProgress(time) {
    return (time / LOOP_SECONDS + .02 * Math.sin((time / LOOP_SECONDS) * Math.PI * 2)) % 1;
  }

  function getPlayerProgress(time) {
    const loopProgress = (time % LOOP_SECONDS) / LOOP_SECONDS;
    const slowSectionEnd = .88;
    const slowRate = .9;
    if (loopProgress <= slowSectionEnd) return loopProgress * slowRate;

    // Recover the remaining distance only during the off-screen exit/reset section.
    const blend = (loopProgress - slowSectionEnd) / (1 - slowSectionEnd);
    const blend2 = blend * blend;
    const blend3 = blend2 * blend;
    const start = slowSectionEnd * slowRate;
    const startSlope = slowRate * (1 - slowSectionEnd);
    return (
      (2 * blend3 - 3 * blend2 + 1) * start +
      (blend3 - 2 * blend2 + blend) * startSlope +
      (-2 * blend3 + 3 * blend2)
    );
  }

  function getPlayerAimWeight(time) {
    return Math.max(pulse(time, 1.95, 1.55), pulse(time, 8.85, 1.45)) * .68;
  }

  function getBossAimWeight(time) {
    return pulse(time, 3.45, 3.35) * .8;
  }

  function update(time) {
    const progress = getPlayerProgress(time);
    const bossProgress = getBossProgress(time);
    const rawDelta = lastUpdateTime === null
      ? 1 / 60
      : time >= lastUpdateTime
        ? time - lastUpdateTime
        : LOOP_SECONDS - lastUpdateTime + time;
    const frameDelta = THREE.MathUtils.clamp(rawDelta, 0, .08);
    lastUpdateTime = time;
    const bossTurnAlpha = 1 - Math.exp(-frameDelta * .95);
    const bossAimAlpha = 1 - Math.exp(-frameDelta * 2.25);
    bossAimBlend += (getBossAimWeight(time) - bossAimBlend) * bossAimAlpha;
    const escapeRoll = pulse(time, 6.45, 2.7) * Math.sin((time - 6.45) * 4.2) * .58;
    playerCurve.getPointAt(progress, tempPlayer);
    bossCurve.getPointAt(bossProgress, tempBoss);
    playerAimDirection.copy(tempBoss).sub(tempPlayer).normalize();
    bossAimDirection.copy(tempPlayer).sub(tempBoss).normalize();
    playerFacing.copy(aimAlongPath(
      player,
      playerCurve,
      progress,
      24,
      escapeRoll,
      playerAimDirection,
      getPlayerAimWeight(time)
    ));
    bossFacing.copy(aimBossGrounded(
      boss,
      bossCurve,
      bossProgress,
      bossAimDirection,
      bossAimBlend,
      bossTurnAlpha,
      time
    ));

    if (engineEnabled || projectilesEnabled || bossBeamEnabled || impactEnabled || bossFxEnabled || trailEnabled || combatEnabled) {
      player.pathRoot.updateWorldMatrix(true, true);
      boss.pathRoot.updateWorldMatrix(true, true);
      playerEngineHardpoints.forEach((hardpoint, index) => {
        hardpoint.getWorldPosition(engineWorldPositions[index]);
      });
    }

    if (engineEnabled) {
      const engineBoost = .82 + pulse(time, .15, 1.9) * .75 + pulse(time, 6.35, 2.8) * 1.15;
      const exhaustAngle = Math.atan2(playerFacing.y, playerFacing.x);
      [engineLeft, engineRight].forEach((sprite, index) => {
        sprite.position.copy(engineWorldPositions[index]).addScaledVector(playerFacing, -.08);
        sprite.scale.set(.48 + engineBoost * .17, .22 + engineBoost * .065, 1);
        sprite.material.opacity = .68 + engineBoost * .12;
        sprite.material.rotation = exhaustAngle;
      });
      engineCore.position.copy(engineWorldPositions[0]).lerp(engineWorldPositions[1], .5).addScaledVector(playerFacing, -.13);
      engineCore.scale.set(.28 + engineBoost * .1, .14 + engineBoost * .045, 1);
      engineCore.material.opacity = .82;
      engineCore.material.rotation = exhaustAngle;
      engineRig.visible = player.pathRoot.visible;
    } else {
      engineRig.visible = false;
    }

    if (projectilesEnabled) {
      PLAYER_SHOTS.forEach((fireTime, index) => {
        const age = time - fireTime;
        const projectile = projectiles[index];
        const muzzle = projectile.userData.muzzle;
        if (age < 0 || age > SHOT_LIFETIME) {
          projectile.visible = false;
          muzzle.visible = false;
          return;
        }
        const shotProgress = easeInOut(age / SHOT_LIFETIME);
        if (!projectile.visible) {
          playerGunHardpoints[index % playerGunHardpoints.length].getWorldPosition(projectile.userData.start);
          muzzle.position.copy(projectile.userData.start);
        }
        tempShotStart.copy(projectile.userData.start);
        bossCurve.getPointAt(getBossProgress(fireTime + SHOT_LIFETIME), tempShotEnd);
        projectile.visible = true;
        projectile.position.lerpVectors(tempShotStart, tempShotEnd, shotProgress);
        projectile.position.z += Math.sin(shotProgress * Math.PI) * .18;
        shotDirection.copy(tempShotEnd).sub(tempShotStart).normalize();
        projectile.quaternion.setFromUnitVectors(xAxis, shotDirection);

        const flicker = .94 + Math.sin(age * 47 + index * .83) * .06;
        projectile.scale.set(.92 + Math.sin(age * 31 + index) * .07, 1, 1);
        projectile.userData.material.uniforms.time.value = time;
        projectile.userData.material.uniforms.intensity.value = flicker;
        projectile.userData.head.scale.setScalar(.20 + flicker * .055);
        projectile.userData.head.material.opacity = .82 + flicker * .12;

        const muzzleLife = age / .13;
        if (muzzleLife <= 1) {
          muzzle.visible = true;
          muzzle.scale.setScalar(.18 + Math.sin(muzzleLife * Math.PI) * .38);
          muzzle.material.opacity = Math.pow(1 - muzzleLife, 1.35) * .95;
        } else {
          muzzle.visible = false;
        }
      });

    } else {
      projectiles.forEach((projectile) => {
        projectile.visible = false;
        projectile.userData.muzzle.visible = false;
      });
    }

    if (bossBeamEnabled) {
      bossStingerHardpoint.getWorldPosition(tempBoss);
      bossWeapon.root.visible = true;
      bossWeapon.update(time, tempBoss, tempPlayer, boss.pathRoot.position, camera, renderer.domElement.height);
    } else {
      bossWeapon.root.visible = false;
    }

    if (impactEnabled) {
      impacts.forEach((impact, index) => {
        const age = time - IMPACT_TIMES[index];
        const lifetime = impact.large ? .95 : .52;
        if (age < 0 || age > lifetime) {
          impact.group.visible = false;
          return;
        }
        const local = age / lifetime;
        impact.group.visible = true;
        bossCurve.getPointAt(getBossProgress(IMPACT_TIMES[index]), impact.group.position);
        const impactScale = impact.large ? 1.55 : .75;
        const hitPulse = Math.sin(local * Math.PI);
        impact.glow.scale.setScalar(.25 + hitPulse * impactScale);
        impact.glow.material.opacity = Math.pow(1 - local, 1.15);
        impact.core.scale.setScalar(.12 + hitPulse * (impact.large ? .52 : .3));
        impact.core.material.opacity = Math.pow(1 - local, 2.2);

        impact.cloudPuffs.forEach((puff, puffIndex) => {
          const stagger = Math.max(0, local - puffIndex * .018);
          const burst = Math.sin(Math.min(1, stagger * 1.35) * Math.PI);
          const spread = stagger * (impact.large ? 1.15 : .62);
          puff.position.x = puff.userData.baseX * (1 + spread * 2.25);
          puff.position.y = puff.userData.baseY * (1 + spread * 2.0);
          puff.position.z = Math.sin((puffIndex + 1) * 2.17) * spread * .16;
          puff.scale.set(
            (.18 + burst * (impact.large ? .7 : .4)) * (1 + (puffIndex % 3) * .08),
            (.14 + burst * (impact.large ? .5 : .3)) * (1 + ((puffIndex + 1) % 3) * .1),
            1
          );
          puff.material.rotation += puff.userData.spin * .018;
          puff.material.opacity = Math.pow(1 - stagger, 1.8) * burst * .82;
        });

        impact.plasmaDebris.forEach((debris, debrisIndex) => {
          const angle = debris.userData.angle;
          const distance = local * (impact.large ? 1.0 : .54) * (1 + (debrisIndex % 3) * .09);
          const curl = Math.sin(local * Math.PI * (1.2 + (debrisIndex % 4) * .12) + debrisIndex) *
            debris.userData.bend * distance;
          const fade = Math.pow(1 - local, 1.55);
          const pulseShape = Math.sin(Math.min(1, local * 1.55) * Math.PI);

          debris.position.set(
            Math.cos(angle) * distance - Math.sin(angle) * curl,
            Math.sin(angle) * distance + Math.cos(angle) * curl,
            Math.sin(angle * 1.7 + local * 4.0) * distance * .16
          );
          debris.scale.set(
            (.07 + pulseShape * (impact.large ? .34 : .2)) * debris.userData.widthBias,
            (.06 + pulseShape * (impact.large ? .28 : .17)) * debris.userData.heightBias,
            1
          );
          debris.material.rotation = debris.userData.baseRotation + local * debris.userData.spin;
          debris.material.opacity = fade * pulseShape * .88;
        });
      });
    } else {
      impacts.forEach((impact) => { impact.group.visible = false; });
    }

    if (bossAuraEnabled) {
      bossAura.visible = true;
      bossAura.material.opacity = .13 + Math.sin(time * 3.1) * .035;
    } else {
      bossAura.visible = false;
    }

    if (trailEnabled) {
      const engineBoost = .82 + pulse(time, .15, 1.9) * .75 + pulse(time, 6.35, 2.8) * 1.15;
      const exhaustAngle = Math.atan2(playerFacing.y, playerFacing.x);
      trail.forEach((sprite) => {
        const sample = sprite.userData.sample;
        const engine = sprite.userData.engine;
        const trailProgress = progress - (sample + 1) * (lowQuality ? .006 : .0042);
        if (trailProgress <= 0 || time > 11.72) {
          sprite.visible = false;
          return;
        }
        sprite.visible = true;
        playerCurve.getPointAt(trailProgress, trailPoint);
        trailOffset.copy(trailPoint).sub(tempPlayer);
        sprite.position.copy(engineWorldPositions[engine]).add(trailOffset);
        const fade = 1 - sample / trailPairs;
        sprite.scale.set((.16 + engineBoost * .075) * fade, (.075 + engineBoost * .026) * fade, 1);
        sprite.material.opacity = .28 * fade * (pulse(time, .05, 2.2) * .7 + pulse(time, 6.2, 3.2) + .2);
        sprite.material.rotation = exhaustAngle;
      });
    } else {
      trail.forEach((sprite) => { sprite.visible = false; });
    }

    if (combatEnabled) battleAudio?.update(time);

    const edgeFade = Math.min(clamp01(time / .22), clamp01((LOOP_SECONDS - time) / .28));
    player.pathRoot.visible = edgeFade > .01;
    if (engineEnabled) engineRig.visible = player.pathRoot.visible;
    renderer.render(scene, camera);
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    bossCurve = width < 700 ? bossCurveMobile : bossCurveDesktop;
    camera.aspect = width / height;
    camera.fov = width < 700 ? 51 : 39;
    camera.position.z = width < 700 ? 15.5 : 11.2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowQuality ? 1.15 : 1.5));
    renderer.setSize(width, height, false);
    update(reducedMotionQuery.matches ? 7.65 : (clock.getElapsedTime() + elapsedBeforePause) % LOOP_SECONDS);
  }

  function frame() {
    if (disposed || document.hidden || reducedMotionQuery.matches) return;
    const time = (elapsedBeforePause + clock.getElapsedTime()) % LOOP_SECONDS;
    update(time);
    frameRequest = requestAnimationFrame(frame);
  }

  function handleVisibility() {
    if (disposed) return;
    if (document.hidden) {
      elapsedBeforePause = (elapsedBeforePause + clock.getElapsedTime()) % LOOP_SECONDS;
      clock.stop();
      cancelAnimationFrame(frameRequest);
    } else if (!reducedMotionQuery.matches) {
      clock.start();
      cancelAnimationFrame(frameRequest);
      frameRequest = requestAnimationFrame(frame);
    }
  }

  function handleMotionPreference(event) {
    cancelAnimationFrame(frameRequest);
    elapsedBeforePause = (elapsedBeforePause + clock.getElapsedTime()) % LOOP_SECONDS;
    clock.stop();
    if (event.matches) {
      update(7.65);
    } else if (!document.hidden) {
      clock.start();
      frameRequest = requestAnimationFrame(frame);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  document.addEventListener("visibilitychange", handleVisibility);
  reducedMotionQuery.addEventListener("change", handleMotionPreference);
  resize();
  if (!reducedMotion) frameRequest = requestAnimationFrame(frame);

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameRequest);
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.removeEventListener("change", handleMotionPreference);
    battleAudio?.dispose();
    disposeObject(scene);
    renderer.dispose();
    renderer.domElement.remove();
  }

  window.addEventListener("pagehide", dispose, { once: true });
  console.info(`Orbital battle ready (${lowQuality ? "reduced" : "full"} effects).`);
  return { dispose, renderer, scene, camera };
}
