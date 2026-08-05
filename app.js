(() => {
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
    const manual = selected !== "auto";
    document.documentElement.classList.toggle("display-scale-manual", manual);
    document.documentElement.style.setProperty("--display-scale", String(SCALE_VALUES[selected] || 1));
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
    select.value = selected;
    select.addEventListener("change", () => {
      select.value = setScale(select.value);
    });
  });

  window.addEventListener("resize", applyScale);
  window.addEventListener("orientationchange", applyScale);
  document.addEventListener("fullscreenchange", applyScale);
  window.visualViewport?.addEventListener("resize", applyScale);
})();
