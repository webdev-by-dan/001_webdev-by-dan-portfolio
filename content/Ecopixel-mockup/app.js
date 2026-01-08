// Accessible mobile menu: toggles aria-expanded and visibility class.
(function () {
const btn = document.querySelector(".nav__toggle");
const menu = document.getElementById("primary-menu");
if (!btn || !menu) return;

function setExpanded(isOpen) {
    btn.setAttribute("aria-expanded", String(isOpen));
    btn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", isOpen);
}

btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    setExpanded(!isOpen);
});

// Close on Escape when open
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    if (isOpen) setExpanded(false);
});

// Ensure menu resets when switching to desktop layout (CSS controls display)
const mq = window.matchMedia("(min-width: 56rem)");
function handleMQ() {
    if (mq.matches) setExpanded(false);
}
mq.addEventListener?.("change", handleMQ);
handleMQ();
})();

/* =========================================================
   HERO SITE IMAGE ROTATOR
   - Cycles site1.png → site2.png → site3.png
   - Respects prefers-reduced-motion
   - Safe if element not present
========================================================= */
(function () {
  const screen = document.querySelector(".heroTnc__screen");
  if (!screen) return;

  // Respect reduced motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const images = [
    "images/site1.png",
    "images/site2.png",
    "images/site3.png"
  ];

  let index = 0;

  function swapImage() {
    index = (index + 1) % images.length;
    screen.style.backgroundImage = `url("${images[index]}")`;
  }

  // Initial image safety (in case CSS didn’t load yet)
  screen.style.backgroundImage = `url("${images[0]}")`;

  // Rotate every 4.5 seconds (adjust if desired)
  setInterval(swapImage, 2500);
})();

