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

// Интерактивные 3D-модели Minecraft-скинов.
const skinCanvases = document.querySelectorAll(".skin-viewer");
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const createSkinViewer = (canvas) => {
  if (canvas.dataset.initialized === "true") return;

  const stage = canvas.closest(".player-skin-stage");
  if (!stage || !window.skinview3d) {
    stage?.classList.add("viewer-error");
    const fallback = stage?.querySelector(".skin-viewer-fallback");
    if (fallback) fallback.textContent = "3D-модель недоступна";
    return;
  }

  try {
    const getSize = () => ({
      width: Math.max(240, Math.round(stage.clientWidth)),
      height: Math.max(280, Math.round(stage.clientHeight))
    });

    const size = getSize();
    const viewer = new window.skinview3d.SkinViewer({
      canvas,
      width: size.width,
      height: size.height,
      skin: canvas.dataset.skin
    });

    viewer.fov = 48;
    viewer.zoom = 0.78;
    viewer.autoRotate = !reducedMotion;
    viewer.autoRotateSpeed = 0.45;

    if (viewer.controls) {
      viewer.controls.enableZoom = false;
      viewer.controls.enablePan = false;
    }

    if (viewer.cameraLight) viewer.cameraLight.intensity = 0.9;
    if (viewer.globalLight) viewer.globalLight.intensity = 2.2;

    canvas.dataset.initialized = "true";
    stage.classList.add("viewer-ready");

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        const nextSize = getSize();
        viewer.width = nextSize.width;
        viewer.height = nextSize.height;
      });
      resizeObserver.observe(stage);
    }
  } catch (error) {
    console.error("Не удалось создать 3D-модель скина:", error);
    stage.classList.add("viewer-error");
    const fallback = stage.querySelector(".skin-viewer-fallback");
    if (fallback) fallback.textContent = "Ошибка загрузки 3D-модели";
  }
};

if (skinCanvases.length) {
  if ("IntersectionObserver" in window) {
    const skinObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          createSkinViewer(entry.target);
          skinObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "240px 0px", threshold: 0.01 }
    );

    skinCanvases.forEach((canvas) => skinObserver.observe(canvas));
  } else {
    skinCanvases.forEach(createSkinViewer);
  }
}
