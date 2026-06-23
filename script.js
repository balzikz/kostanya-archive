document.documentElement.classList.add("motion-ready");

// Подключаем стили второй версии ко всем страницам из одного места.
if (!document.querySelector('link[href="v2.css"]')) {
  const v2Styles = document.createElement("link");
  v2Styles.rel = "stylesheet";
  v2Styles.href = "v2.css";
  document.head.appendChild(v2Styles);
}

const body = document.body;
const menuButton = document.querySelector(".menu-button");
const drawer = document.querySelector(".site-drawer");
const menuOpenButtons = document.querySelectorAll("[data-menu-open]");
const menuCloseButtons = document.querySelectorAll("[data-menu-close]");

const setMenu = (isOpen) => {
  body.classList.toggle("menu-open", isOpen);
  menuButton?.setAttribute("aria-expanded", String(isOpen));
  drawer?.setAttribute("aria-hidden", String(!isOpen));
};

menuButton?.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
menuOpenButtons.forEach((button) => button.addEventListener("click", () => setMenu(true)));
menuCloseButtons.forEach((button) => button.addEventListener("click", () => setMenu(false)));
drawer?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

const currentPage = body.dataset.page;
if (currentPage) {
  document.querySelector(`[data-nav="${currentPage}"]`)?.classList.add("active");
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
}

const counters = document.querySelectorAll("[data-count]");

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count);
        const duration = target > 100 ? 1300 : 700;
        const start = performance.now();

        const animate = (time) => {
          const progress = Math.min((time - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = Math.round(target * eased);
          if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
        counterObserver.unobserve(element);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach((counter) => {
    counter.textContent = counter.dataset.count;
  });
}

const loadExternalScript = (src) => new Promise((resolve, reject) => {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    if (window.skinview3d) resolve();
    else existing.addEventListener("load", resolve, { once: true });
    return;
  }

  const script = document.createElement("script");
  const timeout = window.setTimeout(() => {
    script.remove();
    reject(new Error("script timeout"));
  }, 9000);

  script.src = src;
  script.async = true;
  script.onload = () => {
    window.clearTimeout(timeout);
    if (window.skinview3d) resolve();
    else reject(new Error("skinview3d global missing"));
  };
  script.onerror = () => {
    window.clearTimeout(timeout);
    script.remove();
    reject(new Error("script load failed"));
  };
  document.head.appendChild(script);
});

const ensureSkinView3D = async () => {
  if (window.skinview3d) return true;

  const sources = [
    "https://cdn.jsdelivr.net/npm/skinview3d@3.4.2/bundles/skinview3d.bundle.js",
    "https://unpkg.com/skinview3d@3.4.2/bundles/skinview3d.bundle.js"
  ];

  for (const source of sources) {
    try {
      await loadExternalScript(source);
      if (window.skinview3d) return true;
    } catch (error) {
      console.warn("Не удалось загрузить источник skinview3d:", source, error);
    }
  }

  return false;
};

const initSkinViewers = async () => {
  const canvases = [...document.querySelectorAll(".skin-viewer")];
  if (!canvases.length) return;

  const libraryReady = await ensureSkinView3D();
  if (!libraryReady) {
    canvases.forEach((canvas) => {
      const errorBox = canvas.parentElement?.querySelector(".skin-viewer-error");
      if (errorBox) errorBox.textContent = "Не удалось загрузить 3D-модель";
    });
    return;
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  canvases.forEach((canvas) => {
    const stage = canvas.closest(".player-skin-stage");
    const errorBox = stage?.querySelector(".skin-viewer-error");
    if (!stage || canvas.dataset.initialized === "true") return;

    try {
      const viewer = new window.skinview3d.SkinViewer({
        canvas,
        width: Math.max(260, Math.round(stage.clientWidth)),
        height: Math.max(300, Math.round(stage.clientHeight)),
        skin: canvas.dataset.skin
      });

      viewer.fov = 50;
      viewer.zoom = 0.72;
      viewer.autoRotate = !reducedMotion;
      viewer.autoRotateSpeed = 0.45;

      if (viewer.controls) {
        viewer.controls.enableZoom = false;
        viewer.controls.enablePan = false;
      }
      if (viewer.cameraLight) viewer.cameraLight.intensity = 0.9;
      if (viewer.globalLight) viewer.globalLight.intensity = 2.2;

      canvas.dataset.initialized = "true";
      if (errorBox) errorBox.textContent = "";

      if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(() => {
          viewer.width = Math.max(260, Math.round(stage.clientWidth));
          viewer.height = Math.max(300, Math.round(stage.clientHeight));
        });
        resizeObserver.observe(stage);
      }
    } catch (error) {
      console.error("Не удалось создать 3D-модель скина:", error);
      if (errorBox) errorBox.textContent = "Ошибка отображения 3D-модели";
    }
  });
};

initSkinViewers();
