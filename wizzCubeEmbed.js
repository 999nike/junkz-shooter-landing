// === Wizz Cube Embed (logo cube) ===
// Drop-in Three.js cube that uses wizzlab_logo.png on all faces.

(function () {
  const THREE_SRC = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r146/build/three.min.js";

  function ensureThree(cb) {
    if (window.THREE) return cb();
    const s = document.createElement("script");
    s.src = THREE_SRC;
    s.onload = cb;
    document.head.appendChild(s);
  }

  function boot() {
    // ---- CONFIG ----
    const cfg = window.WIZZ_CUBE || {};
    const size = cfg.size ?? 240;                 // px
    const depth = cfg.depth ?? 0.6;               // cube size scale (visual)
    const spin = cfg.spin ?? 0.35;                // radians/sec (slow)
    const tilt = cfg.tilt ?? 0.25;                // radians
    const edgeColor = cfg.edgeColor ?? 0x00ff66;  // neon green
    const edgeOpacity = cfg.edgeOpacity ?? 0.9;
    const faceOpacity = cfg.faceOpacity ?? 1.0;

    // texture path: default assumes same folder as index.html
    const textureUrl = cfg.textureUrl ?? "wizzlab_logo.png";

    // ---- CONTAINER ----
    const mount = document.createElement("div");
    mount.id = "wizzCubeMount";
    mount.style.cssText = `
      position: relative;
      width: ${size}px;
      height: ${size}px;
      margin: 0 auto;
      pointer-events: none;
    `;
    // If you want to mount into a specific element, set window.WIZZ_CUBE.mountId = "someId"
    const target = cfg.mountId ? document.getElementById(cfg.mountId) : null;
    (target || document.body).appendChild(mount);

    // ---- THREE SETUP ----
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    // Lights (kept simple; faces mainly read via texture)
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 3, 4);
    scene.add(key);

    // ---- TEXTURE + MATERIALS ----
    const tex = new THREE.TextureLoader().load(textureUrl, () => {
      renderer.render(scene, camera);
    });
    tex.anisotropy = 8;

    const faceMat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: faceOpacity < 1,
      opacity: faceOpacity,
      metalness: 0.15,
      roughness: 0.35,
      emissive: new THREE.Color(0x001a10),
      emissiveIntensity: 0.6,
    });

    // Cube geometry
    const geo = new THREE.BoxGeometry(depth, depth, depth);
    const cube = new THREE.Mesh(geo, [
      faceMat, faceMat, faceMat, faceMat, faceMat, faceMat
    ]);
    cube.rotation.x = tilt;
    scene.add(cube);

    // Neon edges
    const edges = new THREE.EdgesGeometry(geo, 20);
    const edgeMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: edgeOpacity,
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMat);
    cube.add(edgeLines);

    // Outer glow “cheat” (sprite-like halo using a second edges pass)
    const glowMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.28,
    });
    const glowLines = new THREE.LineSegments(edges, glowMat);
    glowLines.scale.set(1.03, 1.03, 1.03);
    cube.add(glowLines);

    // ---- ANIMATE ----
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      cube.rotation.y += spin * dt;

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // ---- RESIZE (if you want responsive later) ----
    // Keeping fixed-size by default to avoid layout shifts.
  }

  ensureThree(boot);
})();
