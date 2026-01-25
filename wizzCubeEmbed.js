// ===============================
// WIZZ CUBE EMBED v1.1
// PNG Logo → Neon 3D Cube
// Optional Inner Galaxy
// ===============================

(function () {
  // ---------- CONFIG ----------
  const cfg = window.WIZZ_CUBE || {};

  const mountId = cfg.mountId || null;

  const textureUrl = cfg.textureUrl || "wizzlab_logo.png";

  const cubeSize = cfg.cubeSize || 1.6;
  const spinSpeed = cfg.spin ?? 0.25;

  const faceOpacity = cfg.faceOpacity ?? 0.7;

  const edgeColor = cfg.edgeColor || 0x00ff66;
  const edgeGlow = cfg.edgeGlow ?? 1.6;

  // ---- INNER GALAXY ----
  const innerGalaxy = cfg.innerGalaxy ?? true;
  const innerTextureUrl = cfg.innerTextureUrl || "galaxy_inside.jpg";
  const innerOpacity = cfg.innerOpacity ?? 1.0;

  // ---------- LOAD THREE ----------
  if (!window.THREE) {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/three@0.158.0/build/three.min.js";
    s.onload = boot;
    document.head.appendChild(s);
  } else {
    boot();
  }

  function boot() {
    // ---------- MOUNT ----------
    let mount;
    if (mountId) {
      mount = document.getElementById(mountId);
    }
    if (!mount) {
      mount = document.createElement("div");
      mount.style.position = "fixed";
      mount.style.right = "30px";
      mount.style.bottom = "30px";
      mount.style.width = "260px";
      mount.style.height = "260px";
      mount.style.zIndex = "50";
      document.body.appendChild(mount);
    }

    // ---------- SCENE ----------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    mount.appendChild(renderer.domElement);

    // ---------- LIGHTS ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const keyLight = new THREE.PointLight(0x00ff88, 1.2);
    keyLight.position.set(3, 3, 3);
    scene.add(keyLight);

    // ---------- TEXTURE ----------
    const loader = new THREE.TextureLoader();
    const logoTex = loader.load(textureUrl, () => {
      renderer.render(scene, camera);
    });
    logoTex.anisotropy = 8;

    // ---------- FACE MATERIAL ----------
    const faceMat = new THREE.MeshStandardMaterial({
      map: logoTex,
      transparent: true,
      opacity: faceOpacity,
      metalness: 0.25,
      roughness: 0.35,
      emissive: new THREE.Color(0x002010),
      emissiveIntensity: 0.7,
    });

    const materials = Array(6).fill(faceMat);

    // ---------- CUBE ----------
    const geo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cube = new THREE.Mesh(geo, materials);
    scene.add(cube);

    // ---------- INNER GALAXY ----------
    if (innerGalaxy) {
      const galaxyTex = loader.load(innerTextureUrl, () => {
        renderer.render(scene, camera);
      });

      const innerMat = new THREE.MeshBasicMaterial({
        map: galaxyTex,
        side: THREE.BackSide,
        transparent: innerOpacity < 1,
        opacity: innerOpacity,
      });

      const innerGeo = new THREE.BoxGeometry(
        cubeSize * 0.98,
        cubeSize * 0.98,
        cubeSize * 0.98
      );

      const innerBox = new THREE.Mesh(innerGeo, innerMat);
      cube.add(innerBox);
    }

    // ---------- GLOWING EDGES ----------
    const edges = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      linewidth: 1,
      transparent: true,
      opacity: edgeGlow,
    });
    const wire = new THREE.LineSegments(edges, edgeMat);
    cube.add(wire);

    // ---------- RESIZE ----------
    window.addEventListener("resize", () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    // ---------- ANIMATE ----------
    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += spinSpeed * 0.002;
      cube.rotation.y += spinSpeed * 0.003;
      renderer.render(scene, camera);
    }
    animate();
  }
})();
