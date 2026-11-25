/* ============================================================
   GTA VI fan site: motion (GSAP + ScrollTrigger, Lenis smooth scroll)
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

/* ---------- characters for "Meet the locals" (edit names, bios and images here) ---------- */
const CHARACTERS = [
  { name: "Jason & Lucia", img: "assets/vi/char-1.jpg", bio: "Two people with nothing to lose, one score away from getting out for good.", ph: 7 },
  { name: "Real Dimez",    img: "assets/vi/char-2.jpg", bio: "Best friends who turned going viral into a full-time hustle on Ocean Drive.", ph: 5 },
  { name: "The Crew",      img: "assets/vi/char-3.jpg", bio: "Fixers, dealers and dreamers. Everyone in this town is working an angle.", ph: 8 },
  { name: "Leonida Riders", img: "assets/vi/char-4.jpg", bio: "Chrome, leather and loyalty. They own the highway out past the Keys.", ph: 4 },
  { name: "The Mechanic",  img: "assets/vi/char-5.jpg", bio: "Parts bought and sold, no questions asked. Ask anyway and the price goes up.", ph: 6 },
];
const track = document.getElementById("track");
CHARACTERS.forEach(c => {
  const a = document.createElement("article");
  a.className = "card";
  a.innerHTML = `
    <div class="card__img ph-${c.ph}"><img src="${c.img}" alt="${c.name}" /></div>
    <h3 class="display card__name">${c.name.split(" ").join("<br/>")}</h3>
    <div class="card__info"><h3>${c.name}</h3><p>${c.bio}</p></div>`;
  track.appendChild(a);
});
// image fallbacks: a gradient shows if a picture is missing
document.querySelectorAll("img").forEach(img => {
  const miss = () => img.classList.add("is-missing");
  if (img.complete && img.naturalWidth === 0) miss();
  img.addEventListener("error", miss);
});
const RECORDING = location.search.includes("record");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && !RECORDING && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToEl = (el) => lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: "smooth" });

/* ---------- nav: solid on scroll, hides going down, mobile menu ---------- */
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: "max",
  onUpdate: self => {
    const y = self.scroll();
    nav.classList.toggle("is-solid", y > 60);
    nav.classList.toggle("is-hidden", y > lastY && y > 400 && !nav.classList.contains("is-open"));
    lastY = y;
  }
});
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
});
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  const el = document.querySelector(a.getAttribute("href"));
  if (!el) return;
  e.preventDefault();
  nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", false);
  scrollToEl(el);
  if (a.hasAttribute("data-play")) playTrailer(true);
}));

/* ---------- trailer video ---------- */
const video = document.getElementById("trailerVideo");
const toggle = document.getElementById("trailerToggle");
let userPaused = false;
function playTrailer(force) { if (force) userPaused = false; if (!userPaused) video.play().catch(() => {}); syncLabels(); }
function pauseTrailer(byUser) { if (byUser) userPaused = true; video.pause(); syncLabels(); }
function syncLabels() {
  const label = video.paused ? "Play" : "Pause";
  toggle.textContent = label;
  if (cursorMode === "pause") cursorLabel.textContent = label;
}
ScrollTrigger.create({
  trigger: ".trailer", start: "top 60%", end: "bottom top",
  onToggle: s => s.isActive ? playTrailer() : pauseTrailer()
});
const togglePlay = () => video.paused ? playTrailer(true) : pauseTrailer(true);
toggle.addEventListener("click", togglePlay);
document.querySelector(".trailer__stage").addEventListener("click", () => { if (finePointer) togglePlay(); });

/* ---------- custom cursor ---------- */
const cursor = document.getElementById("cursor");
const cursorLabel = document.getElementById("cursorLabel");
let cursorMode = null;
if (finePointer && !reduce) {
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });
  addEventListener("pointermove", e => { xTo(e.clientX); yTo(e.clientY); });
  const setMode = (mode) => {
    if (mode === cursorMode) return;
    cursorMode = mode;
    cursor.classList.toggle("is-watch", mode === "watch");
    cursor.classList.toggle("is-pause", mode === "pause");
    if (mode === "watch") cursorLabel.innerHTML = "Watch<br/>Trailer";
    if (mode === "pause") cursorLabel.textContent = video.paused ? "Play" : "Pause";
    gsap.to(cursor, { scale: mode ? 1 : 0, duration: 0.45, ease: mode ? "back.out(1.6)" : "power2.in" });
  };
  // decide the cursor style from whatever is under the pointer (also while scrolling)
  let px = -1, py = -1;
  const updateMode = () => {
    if (px < 0) return;
    const el = document.elementFromPoint(px, py);
    const sec = el && el.closest("[data-cursor]");
    setMode(sec ? sec.dataset.cursor : null);
  };
  addEventListener("pointermove", e => { px = e.clientX; py = e.clientY; updateMode(); });
  addEventListener("scroll", updateMode, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => setMode(null));
  document.querySelector(".waited").addEventListener("click", () => { scrollToEl(document.getElementById("trailer")); playTrailer(true); });
  // start in the middle of the screen so it's visible in the "12 years" section
  gsap.set(cursor, { x: innerWidth * 0.62, y: innerHeight * 0.58 });
}

/* ---------- 1. hero: tiles fly in and lock into the collage ---------- */
const tiles = gsap.utils.toArray(".tile");
const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
intro
  .from(tiles, {
    x: () => gsap.utils.random(-55, 55) + "vw",
    y: () => gsap.utils.random(-45, 45) + "vh",
    rotation: () => gsap.utils.random(-25, 25),
    scale: 0.45, opacity: 0, filter: "blur(10px)",
    duration: 1.8, stagger: { each: 0.08, from: "random" }
  })
  .from(".collage__mark", { scale: 1.8, opacity: 0, duration: 1.4 }, "-=1.1")
  .from(".intro__meta > *", { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, "-=1")
  .from(".nav", { y: -30, opacity: 0, duration: 1 }, "-=1");

gsap.to(".collage", {
  scale: 0.82, y: "-6vh", opacity: 0, ease: "none",
  scrollTrigger: { trigger: ".intro", start: "top top", end: "bottom top", scrub: true }
});
gsap.to(".intro__meta", { opacity: 0, y: -30, ease: "none",
  scrollTrigger: { trigger: ".intro", start: "top top", end: "40% top", scrub: true } });

/* ---------- 2. "we waited 12 years" ---------- */
const line = document.getElementById("waitedLine");
gsap.timeline({ scrollTrigger: { trigger: ".waited", start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } })
  .fromTo(line, { x: 0 }, { x: () => -(line.scrollWidth - innerWidth * 0.2), ease: "none" }, 0)
  .fromTo(".waited__bg img", { scale: 1.15, yPercent: 6 }, { scale: 1, yPercent: -4, ease: "none" }, 0);
gsap.fromTo(".waited__bg", { opacity: 0 }, { opacity: 1, ease: "none",
  scrollTrigger: { trigger: ".waited", start: "top 70%", end: "top top", scrub: true } });

/* ---------- 3. trailer: credit text in, then fade to the "12 years" ghost ---------- */
document.querySelectorAll(".trailer__credit p").forEach(p => {
  p.innerHTML = [...p.textContent].map(c => `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`).join("");
});
gsap.timeline({ scrollTrigger: { trigger: ".trailer", start: "top top", end: "bottom bottom", scrub: 1 } })
  .fromTo(".trailer__video", { scale: 1.08 }, { scale: 1, duration: 1, ease: "none" }, 0)
  .from(".credit__a .ch", { opacity: 0, y: 40, filter: "blur(8px)", stagger: 0.012, duration: 0.12 }, 0.38)
  .from(".credit__b .ch", { opacity: 0, y: 40, filter: "blur(8px)", stagger: 0.012, duration: 0.12 }, 0.44)
  .to(".trailer__video", { opacity: 0, duration: 0.2, ease: "none" }, 0.72)
  .fromTo(".trailer__ghost span", { scale: 1.25 }, { scale: 1, duration: 0.3, ease: "none" }, 0.7)
  .to(".trailer__credit", { opacity: 0, y: -40, duration: 0.12 }, 0.9);

gsap.set(".story__cards", { xPercent: -50, yPercent: -6 });
gsap.set("#panel", { xPercent: -50, yPercent: -38 });

/* ---------- 4. new story: cards tilt in, frames draw ---------- */
gsap.timeline({ scrollTrigger: { trigger: ".story", start: "top 80%", end: "bottom bottom", scrub: 1 } })
  .fromTo(".story__head > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.15 }, 0)
  .from(".scard--a", { yPercent: 60, xPercent: -18, rotation: -14, duration: 0.35, ease: "power2.out" }, 0.05)
  .from(".scard--b", { yPercent: 80, xPercent: 18, rotation: 14, duration: 0.35, ease: "power2.out" }, 0.1)
  .to(".story__head", { yPercent: -120, opacity: 0, duration: 0.25, ease: "power1.in" }, 0.5)
  .to(".story__cards", { yPercent: -46, scale: 0.86, duration: 0.3, ease: "power1.inOut" }, 0.5)
  .fromTo(".scard__frame", { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, stagger: 0.04, duration: 0.18, ease: "power2.out" }, 0.62)
  .fromTo(".story__bg img", { scale: 1.12 }, { scale: 1, duration: 1, ease: "none" }, 0)
  .to({}, { duration: 0.1 });


/* ---------- 5. meet the locals: vertical scroll becomes horizontal ---------- */
const getShift = () => track.scrollWidth - window.innerWidth;
const peopleST = { trigger: ".people", start: "top top", end: () => "+=" + getShift() * 1.1, scrub: 1, invalidateOnRefresh: true };
const trackTween = gsap.to(track, { x: () => -getShift(), ease: "none",
  scrollTrigger: { ...peopleST, pin: ".people__stage" } });
gsap.to("#bar", { width: "100%", ease: "none", scrollTrigger: { ...peopleST } });
gsap.utils.toArray(".card").forEach(card => {
  gsap.fromTo(card.querySelector(".card__img img"), { xPercent: -6 }, {
    xPercent: 6, ease: "none",
    scrollTrigger: { trigger: card, containerAnimation: trackTween, start: "left right", end: "right left", scrub: true }
  });
  gsap.from(card.querySelector(".card__name"), {
    yPercent: 40, opacity: 0, ease: "power3.out",
    scrollTrigger: { trigger: card, containerAnimation: trackTween, start: "left 85%", end: "left 45%", scrub: true }
  });
});
gsap.from(".people__title, .people__intro", { y: 50, opacity: 0, stagger: 0.1, duration: 1, ease: "power3.out",
  scrollTrigger: { trigger: ".people", start: "top 70%" } });

/* ---------- 6. gameplay: film strips drift in opposite directions ---------- */
const FILM = ["film-1", "film-2", "film-3", "film-4", "film-5", "film-6", "film-7", "film-8"];
const buildStrip = (el, order, startNo) => {
  el.innerHTML = order.concat(order).map((n, i) => `
    <div class="frame"><div class="frame__img"><img src="assets/${FILM[n]}.jpg" alt="" /></div>
    <span class="frame__num">${startNo + i}</span><span class="frame__num">${startNo + i}A</span></div>`).join("");
};
buildStrip(document.getElementById("film1"), [0, 3, 5, 1, 6, 2], 8);
buildStrip(document.getElementById("film2"), [4, 7, 2, 6, 0, 5], 21);
gsap.from(".gameplay__head > *", { y: 50, opacity: 0, stagger: 0.1, duration: 1, ease: "power3.out",
  scrollTrigger: { trigger: ".gameplay", start: "top 70%" } });
gsap.timeline({ scrollTrigger: { trigger: ".gameplay", start: "top bottom", end: "bottom top", scrub: 0.8 } })
  .fromTo("#film1", { xPercent: 0 }, { xPercent: -28, ease: "none" }, 0)
  .fromTo("#film2", { xPercent: -30 }, { xPercent: -2, ease: "none" }, 0);

/* ---------- 7. coming soon: map card lands, then becomes the product card ---------- */
gsap.timeline({ scrollTrigger: { trigger: ".soon", start: "top 70%", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true } })
  .fromTo(".soon__head > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.1 }, 0)
  .fromTo("#panel", { rotationX: 32, rotationZ: -6, scale: 1.35, yPercent: -8 },
                    { rotationX: 6, rotationZ: -2, scale: 1, yPercent: -38, duration: 0.35, ease: "power2.out" }, 0.02)
  .to(".soon__head", { yPercent: -140, opacity: 0, duration: 0.15 }, 0.42)
  .to("#panel", { rotationX: 0, rotationZ: 0, yPercent: -50, duration: 0.25, ease: "power2.inOut",
      width: () => Math.min(560, innerWidth * 0.92), height: () => Math.min(innerHeight * 0.88, 740) }, 0.45)
  .to("#mapLayer", { opacity: 0, scale: 0.9, duration: 0.12 }, 0.5)
  .to("#product", { opacity: 1, duration: 0.12 }, 0.62)
  .fromTo(".panel__product > *", { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.02, duration: 0.1, immediateRender: false }, 0.62)
  .to({}, { duration: 0.2 });


/* ---------- 8. ride or die: the centre card grows to full screen ---------- */
const rc2 = document.querySelector(".rc2");
const fill = () => Math.max(innerWidth / rc2.offsetWidth, innerHeight / rc2.offsetHeight) * 1.03;
gsap.set([".ride__word", ".ride__card"], { opacity: 0 });
gsap.set(".ride__word--l", { xPercent: -40 });
gsap.set(".ride__word--r", { xPercent: 40 });
gsap.set(".ride__card", { yPercent: 30 });
const rd = gsap.timeline({
  defaults: { immediateRender: false },
  scrollTrigger: { trigger: ".ride", start: "top 75%", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true }
});
rd.to(".ride__word--l", { xPercent: 0, opacity: 1, duration: 0.18, ease: "power3.out" }, 0)
  .to(".ride__word--r", { xPercent: 0, opacity: 1, duration: 0.18, ease: "power3.out" }, 0)
  .to(".ride__card", { yPercent: 0, opacity: 1, stagger: 0.03, duration: 0.18, ease: "power3.out" }, 0.03)
  .to(".rc1", { xPercent: -260, rotation: -14, duration: 0.4, ease: "power2.in" }, 0.36)
  .to(".rc3", { xPercent: 260, rotation: 14, duration: 0.4, ease: "power2.in" }, 0.36)
  .to(".ride__word--l", { xPercent: -70, opacity: 0, duration: 0.36, ease: "power2.in" }, 0.36)
  .to(".ride__word--r", { xPercent: 70, opacity: 0, duration: 0.36, ease: "power2.in" }, 0.36)
  .to(rc2, { scale: fill, borderRadius: 0, duration: 0.42, ease: "power2.inOut" }, 0.38)
  .fromTo(".ride__final", { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.84)
  .fromTo(".ride__final > *", { y: 40 }, { y: 0, stagger: 0.02, duration: 0.12 }, 0.84);

/* ---------- 9. footer ---------- */
gsap.from(".footer__mark", { yPercent: 25, opacity: 0, ease: "none",
  scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

addEventListener("load", () => ScrollTrigger.refresh());
