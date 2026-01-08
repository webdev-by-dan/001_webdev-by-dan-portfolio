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

document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    if (isOpen) setExpanded(false);
});

const mq = window.matchMedia("(min-width: 56rem)");
function handleMQ() {
    if (mq.matches) setExpanded(false);
}
mq.addEventListener?.("change", handleMQ);
handleMQ();
})();

(function () {
  const screen = document.querySelector(".heroTnc__screen");
  if (!screen) return;

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

  screen.style.backgroundImage = `url("${images[0]}")`;

  setInterval(swapImage, 2500);
})();

