(() => {
  const GAME_URL = "https://space-junkz-shooter.vercel.app/game.html";
  const isMetaInAppBrowser = /(?:FBAN|FBAV|FB_IAB|Messenger)/i.test(navigator.userAgent || "");
  const STORAGE_KEY = "sj_display_scale";
  const SCALE_VALUES = Object.freeze({ auto: 1, "100": 1, "90": 0.9, "80": 0.8, "70": 0.7 });
  const hasScale = (value) =>
    Object.prototype.hasOwnProperty.call(SCALE_VALUES, value);

  let selected = "auto";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && hasScale(stored)) selected = stored;
  } catch (_) {}

  function applyScale() {
    const mobileViewport = window.matchMedia("(max-width: 767px)").matches || window.innerWidth < 768;
    const effectiveScale = mobileViewport ? 1 : (SCALE_VALUES[selected] || 1);
    const manual = !mobileViewport && selected !== "auto";
    document.documentElement.classList.toggle("display-scale-manual", manual);
    document.documentElement.style.setProperty("--display-scale", String(effectiveScale));
    const select = document.getElementById("displayScale");
    if (select && mobileViewport) select.value = "auto";
  }

  function setScale(value) {
    selected = hasScale(String(value)) ? String(value) : "auto";
    applyScale();
    try { localStorage.setItem(STORAGE_KEY, selected); } catch (_) {}
    return selected;
  }

  applyScale();

  window.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("displayScale");
    if (!select) return;
    select.value = window.matchMedia("(max-width: 767px)").matches ? "auto" : selected;
    select.addEventListener("change", () => {
      select.value = setScale(select.value);
    });
  });

  window.addEventListener("resize", applyScale);
  window.addEventListener("orientationchange", applyScale);
  document.addEventListener("fullscreenchange", applyScale);
  window.visualViewport?.addEventListener("resize", applyScale);

  window.addEventListener("DOMContentLoaded", () => {
    if (!isMetaInAppBrowser) return;
    const modal = document.getElementById("externalGameModal");
    const close = document.getElementById("externalGameClose");
    const open = document.getElementById("openGameChrome");
    const copy = document.getElementById("copyGameLink");
    const status = document.getElementById("externalGameStatus");
    if (!modal || !close || !open || !copy) return;

    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove("external-game-modal-open");
    };
    const showModal = () => {
      modal.hidden = false;
      document.body.classList.add("external-game-modal-open");
      close.focus();
    };

    document.querySelectorAll(`a[href="${GAME_URL}"]`).forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showModal();
      });
    });

    close.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });

    open.addEventListener("click", () => {
      if (/Android/i.test(navigator.userAgent || "")) {
        const fallback = encodeURIComponent(GAME_URL);
        window.location.href = `intent://space-junkz-shooter.vercel.app/game.html#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
        return;
      }
      window.open(GAME_URL, "_blank", "noopener,noreferrer");
    });

    copy.addEventListener("click", async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(GAME_URL);
        } else {
          const field = document.createElement("textarea");
          field.value = GAME_URL;
          field.setAttribute("readonly", "");
          field.style.position = "fixed";
          field.style.opacity = "0";
          document.body.appendChild(field);
          field.select();
          document.execCommand("copy");
          field.remove();
        }
        if (status) status.textContent = "Game link copied.";
      } catch (_) {
        if (status) status.textContent = GAME_URL;
      }
    });
  });
})();
