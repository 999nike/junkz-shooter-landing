import * as THREE from "../../vendor/three-r160.module.min.js";

// One bounded, decorative weapon pass. All times are in the existing 12s loop.
export const WEAPON_TIMING = Object.freeze({ charge: 4.05, fire: 4.8, release: 6.05, end: 6.7 });
const smooth = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const envelope = (t, start, rise, stop, fall) => smooth((t - start) / rise) * (1 - smooth((t - stop) / fall));
const TAU = Math.PI * 2;

const planeVertex = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const plasmaNoise = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
      mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float turbulence(vec2 p) {
    return .57 * noise(p) + .28 * noise(p * 2.03 + 7.1) + .15 * noise(p * 4.07 - 3.8);
  }
`;

function plasmaMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, strength: { value: 0 }, phase: { value: 0 } },
    vertexShader: planeVertex,
    fragmentShader: `
      ${plasmaNoise}
      varying vec2 vUv;
      uniform float time, strength, phase;
      void main() {
        vec2 p = (vUv - .5) * 2.0;
        float r = length(p), a = atan(p.y, p.x);
        vec2 drift = vec2(time * .12, -time * .08 + phase);
        float cloud = turbulence(p * 5.0 + drift);
        float filaments = turbulence(p * 12.0 - drift + cloud * 2.0);
        float edge = .62 + .08 * sin(a * 5.0 + time * .4 + phase) + (cloud - .5) * .22;
        float corona = exp(-pow((r - edge) / .115, 2.0));
        float center = exp(-r * r * 10.0);
        float boundary = 1.0 - smoothstep(.74, 1.0, r);
        float alpha = boundary * (corona * (.16 + filaments * .85) + center * .22) * strength;
        vec3 color = mix(vec3(.65, .005, .002), vec3(1.0, .18, .016), filaments * corona + center * .45);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false
  });
}

function material(color, opacity = 0) {
  return new THREE.MeshBasicMaterial({ color, opacity, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
}

function sprite(texture, color) {
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color,
    transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
}

// Two GPU draw calls for all charge motes and impact debris, with per-particle alpha/size.
function particles(count, scene) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const geometry = new THREE.BufferGeometry();
  for (const [name, data, size] of [["position", positions, 3], ["color", colors, 3], ["size", sizes, 1], ["alpha", alphas, 1]]) {
    geometry.setAttribute(name, new THREE.BufferAttribute(data, size).setUsage(THREE.DynamicDrawUsage));
  }
  const shader = new THREE.ShaderMaterial({
    uniforms: { pixelScale: { value: 1 } },
    vertexShader: `
      attribute float size, alpha;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float pixelScale;
      void main() {
        vColor = color; vAlpha = alpha;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_PointSize = clamp(size * pixelScale / max(.1, -p.z), 1.0, 48.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - .5) * 2.0;
        float glow = pow(max(0.0, 1.0 - r), 2.0);
        gl_FragColor = vec4(mix(vColor, vec3(1.0, .85, .65), glow * .65), glow * vAlpha);
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
  });
  const object = new THREE.Points(geometry, shader);
  object.frustumCulled = false; // Pool positions move; do not use an initial zero-sized bound.
  scene.add(object);
  return { object, geometry, shader, positions, colors, sizes, alphas, count };
}

function upload(pool, pixelScale) {
  pool.shader.uniforms.pixelScale.value = pixelScale;
  pool.geometry.attributes.position.needsUpdate = true;
  pool.geometry.attributes.color.needsUpdate = true;
  pool.geometry.attributes.size.needsUpdate = true;
  pool.geometry.attributes.alpha.needsUpdate = true;
}

export function createScorpionWeaponFX(scene, hotTexture, lowQuality, { mode = "full" } = {}) {
  const beamOnly = mode === "beam-only";
  const root = new THREE.Group();
  root.name = "Scorpion super-beam FX";
  scene.add(root);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, lowQuality ? 8 : 12, 1, true);
  const plane = new THREE.PlaneGeometry(1, 1);
  const ringGeometry = new THREE.RingGeometry(.88, 1, lowQuality ? 32 : 48);
  const beam = new THREE.Group();
  beam.name = "Scorpion beam layers";
  root.add(beam);
  // Keep only the hot inner beam as geometry. The red/orange envelope is
  // handled by the blended plasma fringe below so it cannot read as rigid slabs.
  const layers = [
    { radius: .105, alpha: .52, color: 0xff8a16 },
    { radius: .05, alpha: .78, color: 0xffc35a },
    { radius: .022, alpha: .98, color: 0xffffee }
  ].map((spec) => {
    const mesh = new THREE.Mesh(cylinder, material(spec.color));
    beam.add(mesh);
    return { ...spec, mesh };
  });
  // Soft turbulent beam fringe and travelling hot spots, as in the Space Junkz reference.
  const fringe = new THREE.Mesh(plane, new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, strength: { value: 0 } },
    vertexShader: planeVertex,
    fragmentShader: `
      ${plasmaNoise}
      varying vec2 vUv;
      uniform float time, strength;
      void main() {
        float x = vUv.x;
        float d = abs(vUv.y - .5) * 2.0;
        float cloud = turbulence(vec2(x * 15.0 - time * 2.6, vUv.y * 7.0 + time * .35));
        float fine = turbulence(vec2(x * 31.0 + time * 3.8, vUv.y * 13.0 - time * .7));
        float wobble = (cloud - .5) * .13 + (fine - .5) * .045;
        float shaped = max(0.0, d + wobble);

        float outerRed = exp(-pow(shaped / .78, 2.0));
        float redOrange = exp(-pow(shaped / .48, 2.0));
        float orange = exp(-pow(shaped / .27, 2.0));
        float hot = exp(-pow(shaped / .105, 2.0));

        float ends = smoothstep(0.0, .075, x) * (1.0 - smoothstep(.91, 1.0, x));
        float travelling = .88 + .12 * sin(x * 23.0 - time * 7.5 + cloud * 3.0);

        vec3 red = vec3(1.0, .018, .003);
        vec3 ember = vec3(1.0, .16, .012);
        vec3 orangeHot = vec3(1.0, .48, .055);
        vec3 whiteHot = vec3(1.0, .94, .72);

        vec3 color = red * outerRed * .42;
        color += ember * redOrange * .52;
        color += orangeHot * orange * .72;
        color += whiteHot * hot * .52;

        float alpha = (outerRed * .07 + redOrange * .13 + orange * .22 + hot * .24);
        alpha *= ends * travelling * strength * (.82 + cloud * .28);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false
  }));
  root.add(fringe);

  const aura = [0, 1].map((index) => {
    const mesh = new THREE.Mesh(plane, plasmaMaterial());
    mesh.material.uniforms.phase.value = index * 2.4;
    root.add(mesh);
    return mesh;
  });
  const muzzle = sprite(hotTexture, 0xff3510);
  const muzzleCore = sprite(hotTexture, 0xffffff);
  const contact = sprite(hotTexture, 0xff5c35);
  const contactCore = sprite(hotTexture, 0xffffff);
  root.add(muzzle, muzzleCore, contact, contactCore);

  const bursts = [4.94, 5.62].map((start) => {
    const ring = new THREE.Mesh(ringGeometry, material(0xff5e2e));
    root.add(ring);
    return { start, ring, origin: new THREE.Vector3(), captured: false };
  });
  const chargePool = particles(lowQuality ? 16 : 30, root);
  const sparkPool = particles(lowQuality ? 22 : 40, root);
  chargePool.object.name = "Scorpion charge motes";
  sparkPool.object.name = "Scorpion sparks and plasma";
  // No point lights on low quality/mobile; both lights have zero intensity when inactive.
  const weaponLight = lowQuality ? null : new THREE.PointLight(0xff5018, 0, 3.5, 2);
  const impactLight = lowQuality ? null : new THREE.PointLight(0xff793a, 0, 2.4, 2);
  if (weaponLight) root.add(weaponLight, impactLight);

  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const endpoint = new THREE.Vector3();
  const contactPosition = new THREE.Vector3();
  const cameraBack = new THREE.Vector3();
  const fringeBasis = new THREE.Matrix4();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const red = new THREE.Color(0xd90902);
  const orange = new THREE.Color(0xff8c20);
  let lastTime = -1;

  function update(time, stinger, target, bossCenter, camera, pixelHeight) {
    const { charge, fire, release, end } = WEAPON_TIMING;
    if (time < lastTime && !beamOnly) bursts.forEach((burst) => { burst.captured = false; });
    lastTime = time;
    const field = envelope(time, charge, .75, release, .65);
    const firing = envelope(time, fire, .14, release, .22);
    const contactStrength = envelope(time, fire + .09, .12, release, .6);
    root.visible = time >= charge && time < end + .35;
    if (weaponLight) {
      weaponLight.intensity = field * (3.2 + firing * 2.8);
      impactLight.intensity = beamOnly ? 0 : contactStrength * 4.5;
    }
    if (!root.visible) return;

    direction.subVectors(target, stinger);
    const length = direction.length();
    direction.normalize();
    cameraBack.copy(zAxis).applyQuaternion(camera.quaternion);
    right.crossVectors(direction, cameraBack);
    if (right.lengthSq() < .001) right.copy(xAxisFallback);
    right.normalize();
    up.crossVectors(right, direction).normalize();
    const organic = 1 + .035 * Math.sin(time * 31) + .025 * Math.sin(time * 53 + .8);
    const extension = smooth((time - fire) / .1) * (1 - smooth((time - release) / .22));
    endpoint.copy(stinger).addScaledVector(direction, length * extension);
    beam.position.copy(stinger).lerp(endpoint, .5);
    beam.quaternion.setFromUnitVectors(yAxis, direction);
    beam.visible = firing > 0;
    offset.crossVectors(direction, right).normalize();
    fringeBasis.makeBasis(direction, right, offset);
    fringe.quaternion.setFromRotationMatrix(fringeBasis);
    fringe.position.copy(beam.position);
    fringe.scale.set(Math.max(.001, length * extension), .78 * organic, 1);
    fringe.material.uniforms.time.value = time;
    fringe.material.uniforms.strength.value = firing;
    fringe.visible = beam.visible;
    for (const layer of layers) {
      const width = layer.radius * Math.sqrt(firing) * organic;
      layer.mesh.scale.set(width, Math.max(.001, length * extension), width);
      layer.mesh.material.opacity = layer.alpha * firing;
    }

    // Full cinematic mode gets the surrounding red corona. Beam-only integration
    // deliberately excludes it so Earth regression testing isolates the weapon beam.
    aura.forEach((mesh, index) => {
      mesh.visible = !beamOnly;
      if (beamOnly) return;
      mesh.position.copy(bossCenter).addScaledVector(cameraBack, -1.15 - index * .18);
      mesh.quaternion.copy(camera.quaternion);
      mesh.rotateZ((index ? -1 : 1) * time * .12);
      mesh.scale.setScalar((index ? 5.0 : 4.4) * (.8 + .2 * field) * organic);
      mesh.material.uniforms.time.value = time;
      mesh.material.uniforms.strength.value = field * (index ? .42 : .72);
    });
    muzzle.position.copy(stinger);
    muzzleCore.position.copy(stinger);
    muzzle.material.color.copy(red).lerp(orange, smooth((time - charge) / .75));
    muzzle.scale.setScalar((.35 + field * .85) * organic);
    muzzle.material.opacity = field * .85;
    muzzleCore.scale.setScalar(.08 + .28 * field);
    muzzleCore.material.opacity = field * field * .95;
    contactPosition.copy(target).addScaledVector(direction, -.1);
    contact.visible = !beamOnly;
    contactCore.visible = !beamOnly;
    if (!beamOnly) {
      contact.position.copy(contactPosition);
      contactCore.position.copy(contactPosition);
      contact.scale.setScalar((.38 + contactStrength * .62) * organic);
      contactCore.scale.setScalar(.13 + contactStrength * .17);
      contact.material.opacity = contactStrength * .75;
      contactCore.material.opacity = contactStrength * .9;
    }
    if (weaponLight) {
      weaponLight.position.copy(stinger).addScaledVector(cameraBack, .28);
      weaponLight.color.copy(red).lerp(orange, smooth((time - charge) / .75));
      impactLight.position.copy(contactPosition).addScaledVector(cameraBack, .4);
    }

    chargePool.object.visible = !beamOnly;
    sparkPool.object.visible = !beamOnly;
    if (beamOnly) {
      bursts.forEach((burst) => { burst.ring.visible = false; });
      return;
    }

    const motes = field * (1 - .8 * smooth((time - fire) / .3));
    for (let i = 0; i < chargePool.count; i += 1) {
      const phase = ((time - charge) * .85 + i * .6180339 + 10) % 1;
      const radius = (1 - smooth(phase)) * (1.0 + .35 * Math.sin(i * 9)) + .035;
      const angle = i * 2.39996 + phase * TAU * 1.15;
      offset.copy(stinger).addScaledVector(right, Math.cos(angle) * radius)
        .addScaledVector(up, Math.sin(angle) * radius * .7)
        .addScaledVector(direction, -.22 * (1 - phase));
      offset.toArray(chargePool.positions, i * 3);
      chargePool.colors[i * 3] = 1;
      chargePool.colors[i * 3 + 1] = .06 + .4 * phase;
      chargePool.colors[i * 3 + 2] = .015;
      chargePool.sizes[i] = .065 + .055 * ((i % 5) / 4);
      chargePool.alphas[i] = motes * Math.pow(Math.sin(phase * Math.PI), 2);
    }

    bursts.forEach((burst) => {
      const age = time - burst.start;
      if (age >= 0 && !burst.captured) {
        burst.origin.copy(contactPosition);
        burst.captured = true;
      }
      const life = age / .95;
      const fade = life >= 0 && life <= 1 ? Math.sin(Math.PI * smooth(life)) * (1 - life) : 0;
      burst.ring.visible = fade > 0;
      burst.ring.position.copy(burst.origin);
      burst.ring.quaternion.copy(camera.quaternion);
      burst.ring.scale.setScalar(.16 + Math.max(0, life) * 1.15);
      burst.ring.material.opacity = fade * .55;
    });
    for (let i = 0; i < sparkPool.count; i += 1) {
      if (i < 8) {
        // Eight of the same pool slots vent plasma outward from the firing stinger.
        const phase = ((time - fire) * 2 + i / 8 + 10) % 1;
        const angle = i * 2.39996;
        offset.copy(stinger).addScaledVector(right, Math.cos(angle) * phase * .48)
          .addScaledVector(up, Math.sin(angle) * phase * .48)
          .addScaledVector(direction, phase * .7);
        offset.toArray(sparkPool.positions, i * 3);
        sparkPool.colors[i * 3] = 1;
        sparkPool.colors[i * 3 + 1] = .24;
        sparkPool.colors[i * 3 + 2] = .025;
        sparkPool.sizes[i] = .065 + (i % 3) * .025;
        sparkPool.alphas[i] = firing * Math.pow(Math.sin(phase * Math.PI), 2) * .85;
        continue;
      }
      const burst = bursts[i % 2];
      const age = time - burst.start - (i % 5) * .024;
      const life = age / (.7 + (i % 4) * .08);
      const active = life > 0 && life < 1;
      const a = i * 2.39996;
      const distance = Math.max(0, life) * (.65 + (i % 7) * .11);
      offset.copy(burst.origin).addScaledVector(right, Math.cos(a) * distance)
        .addScaledVector(up, Math.sin(a) * distance)
        .addScaledVector(direction, Math.sin(i * 7) * distance * .35);
      offset.toArray(sparkPool.positions, i * 3);
      sparkPool.colors[i * 3] = 1;
      sparkPool.colors[i * 3 + 1] = .12 + .42 * ((i % 5) / 4);
      sparkPool.colors[i * 3 + 2] = .018;
      sparkPool.sizes[i] = i % 6 === 0 ? .16 : .055 + (i % 3) * .023;
      sparkPool.alphas[i] = active ? smooth(life / .08) * Math.pow(1 - life, 2) : 0;
    }
    const pixelScale = pixelHeight * camera.projectionMatrix.elements[5] * .5;
    upload(chargePool, pixelScale);
    upload(sparkPool, pixelScale);
  }

  // Resources belong to scene and are covered by the battle controller's disposal traversal.
  return { update, root };
}

const xAxisFallback = new THREE.Vector3(1, 0, 0);
