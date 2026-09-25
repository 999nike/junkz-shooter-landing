(() => {
  const viewers = [...document.querySelectorAll("[data-glb-viewer]")];
  if (!viewers.length) return;

  function showError(el) {
    const label = el.querySelector("span");
    if (label) label.textContent = "3D preview unavailable";
  }

  function mount(el) {
    if (el.dataset.mounted === "true") return;
    el.dataset.mounted = "true";

    if (!window.THREE || !THREE.GLTFLoader) {
      showError(el);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    el.innerHTML = "";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xbde9ff, 0x050713, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.7);
    key.position.set(4, 5, 6);
    const rim = new THREE.DirectionalLight(0x39d7ff, 1.8);
    rim.position.set(-4, 2, -3);
    scene.add(key, rim);

    const root = new THREE.Group();
    scene.add(root);

    let modelReady = false;
    const loader = new THREE.GLTFLoader();
    loader.load(el.dataset.model, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const maxSide = Math.max(size.x, size.y, size.z) || 1;
      root.scale.setScalar(2.45 / maxSide);
      root.add(model);
      root.rotation.x = 0.12;
      modelReady = true;
    }, undefined, () => showError(el));

    const resize = () => {
      const w = Math.max(el.clientWidth, 1);
      const h = Math.max(el.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    }, { rootMargin: "250px 0px" });
    io.observe(el);

    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (visible) {
        if (modelReady) root.rotation.y += dt * 0.55;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const boot = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      boot.unobserve(entry.target);
      mount(entry.target);
    }
  }, { rootMargin: "500px 0px" });

  viewers.forEach((el) => boot.observe(el));
})();