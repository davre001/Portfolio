// Entry point — renders work, wires filters, nav, reveal, and forms.
import { loadProjects } from "./projects.js";
import { initLazyVideo } from "./lazy-video.js";

const CATEGORY_LABELS = {
  "video-editing": "Video Editing",
  "motion-graphics": "Motion Graphics",
  "ai-creation": "AI Creation",
};

const labelFor = (cat) => CATEGORY_LABELS[cat] ?? cat;

function cardHTML(p) {
  return `
    <a class="card" href="pages/project-detail.html?id=${p.id}" data-category="${p.category}">
      <div class="card__thumb cat-${p.category}">
        <video class="card__video" data-src="${p.video}" muted loop playsinline preload="none"></video>
        <span class="card__overlay-title">${p.title}</span>
        <span class="card__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        </span>
      </div>
      <div class="card__body">
        <div class="card__title">${p.title}</div>
        <div class="card__meta">${p.role} · ${p.year}</div>
        <span class="card__tag">${labelFor(p.category)}</span>
      </div>
    </a>`;
}

function buildFilter(projects) {
  const cats = [...new Set(projects.map((p) => p.category))];
  const filter = document.getElementById("filter");
  const all = [["all", "All"], ...cats.map((c) => [c, labelFor(c)])];

  filter.innerHTML = all
    .map(
      ([val, text], i) =>
        `<button class="filter__btn${i === 0 ? " is-active" : ""}" data-filter="${val}" role="tab">${text}</button>`
    )
    .join("");

  filter.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter__btn");
    if (!btn) return;
    filter.querySelectorAll(".filter__btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const f = btn.dataset.filter;
    document.querySelectorAll("#workGrid .card").forEach((card) => {
      const show = f === "all" || card.dataset.category === f;
      card.style.display = show ? "" : "none";
    });
  });
}

function renderProjects(projects) {
  const grid = document.getElementById("workGrid");
  grid.innerHTML = projects.map(cardHTML).join("");
}

function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          obs.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => obs.observe(el));
}

function initNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initCardVideo(grid) {
  // Lazy-load + play the cinematic clip on hover; pause when leaving.
  grid.addEventListener("mouseover", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const v = card.querySelector(".card__video");
    if (!v) return;
    if (!v.src) v.src = v.dataset.src;
    v.play().catch(() => {});
  });
  grid.addEventListener("mouseout", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    card.querySelector(".card__video")?.pause();
  });
}

function initReel() {
  const btn = document.getElementById("reelPlay");
  const video = document.querySelector(".reel__video");
  if (!btn || !video) return;
  // Hero autoplays muted (via lazy-video); button toggles sound.
  btn.addEventListener("click", () => {
    if (!video.src) video.src = video.dataset.src;
    video.muted = !video.muted;
    btn.setAttribute("aria-label", video.muted ? "Unmute showreel" : "Mute showreel");
  });
}

function initContact() {
  const form = document.getElementById("contactForm");
  const note = document.getElementById("contactNote");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      note.textContent = "Please fill in name, email, and message.";
      return;
    }
    // No backend yet — swap this for fetch() to your endpoint.
    note.textContent = "Thanks! This demo form isn't wired to a server yet.";
    form.reset();
  });
}

async function init() {
  const projects = await loadProjects().catch(() => []);
  renderProjects(projects);
  initCardVideo(document.getElementById("workGrid"));
  buildFilter(projects);
  initReveal();
  initNav();
  initReel();
  initContact();
  initLazyVideo();
  document.getElementById("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", init);
