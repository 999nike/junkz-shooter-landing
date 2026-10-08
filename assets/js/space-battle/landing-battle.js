const host = document.querySelector("[data-landing-space-battle]");
const status = document.querySelector("[data-battle-status]");

let controller = null;
let started = false;
let disposed = false;
let observer = null;

async function bootBattle() {
  if (!host || started || disposed) return;
  started = true;
  if (status) status.textContent = "3D PREVIEW • LOADING MODELS";

  try {
    const { createSpaceBattle } = await import("./battle-scene.js?v=landing-reskin-1");
    if (disposed) return;

    controller = await createSpaceBattle({
      container: host,
      visualMode: "full-visual",
      enableAudio: false
    });

    if (disposed) {
      controller?.dispose();
      controller = null;
      return;
    }

    host.dataset.ready = "true";
    if (status) status.textContent = "LIVE 3D PROTOTYPE • THREE.JS";
  } catch (error) {
    console.warn("Space Junkz 3D landing preview skipped:", error);
    host.dataset.ready = "error";
    if (status) status.textContent = "3D PREVIEW • UNAVAILABLE";
  }
}

function dispose() {
  if (disposed) return;
  disposed = true;
  observer?.disconnect();
  observer = null;
  controller?.dispose();
  controller = null;
}

if (host) {
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      observer = null;
      bootBattle();
    }, { rootMargin: "700px 0px" });
    observer.observe(host);
  } else {
    bootBattle();
  }

  window.addEventListener("pagehide", dispose, { once: true });
}
