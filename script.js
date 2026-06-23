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
