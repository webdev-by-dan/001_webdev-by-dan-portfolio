/* =========================================================
   app.js
   - Match calendar height to left column
   - Toggle "My design" vs "Original"
   - Load local original.html
   - Allow FULL iframe interaction
   - Force ALL <a> href="" inside iframe
========================================================= */

/* =========================================================
   Match calendar height to left column
========================================================= */
(function () {
  function matchCalendarHeight() {
    const blog = document.querySelector(".box.blog");
    if (!blog) return;

    const leftContent = blog.querySelector(".col-6.col-12-medium .content");
    const calendar = blog.querySelector(".prwa-calendar");
    if (!leftContent || !calendar) return;

    calendar.style.maxHeight = `${leftContent.offsetHeight}px`;
    calendar.style.overflowY = "auto";
  }

  document.addEventListener("DOMContentLoaded", matchCalendarHeight);
  window.addEventListener("load", matchCalendarHeight);
})();

/* =========================================================
   View toggle + iframe handling
========================================================= */
(function () {
  const btnMy = document.getElementById("btnMyDesign");
  const btnOrig = document.getElementById("btnOriginal");
  const designView = document.getElementById("designView");
  const originalView = document.getElementById("originalView");
  const frame = document.getElementById("originalFrame");

  if (!btnMy || !btnOrig || !designView || !originalView || !frame) return;

  /* Load local original.html (same-origin required) */
  frame.src = "original.html";

  function setPressed(active, inactive) {
    active.classList.add("isActive");
    active.setAttribute("aria-pressed", "true");
    inactive.classList.remove("isActive");
    inactive.setAttribute("aria-pressed", "false");
  }

  function showMyDesign() {
    setPressed(btnMy, btnOrig);
    designView.style.display = "";
    originalView.style.display = "none";
    window.scrollTo(0, 0);
  }

  function showOriginal() {
    setPressed(btnOrig, btnMy);
    designView.style.display = "none";
    originalView.style.display = "block";
    window.scrollTo(0, 0);
  }

  btnMy.addEventListener("click", showMyDesign);
  btnOrig.addEventListener("click", showOriginal);

  /* =======================================================
     FORCE ALL iframe links to href=""
     (no click blocking, no overlays)
  ======================================================= */
  function forceIframeLinksBlank() {
    let doc;
    try {
      doc = frame.contentDocument || frame.contentWindow.document;
    } catch {
      return; // cross-origin or file:// restriction
    }
    if (!doc) return;

    const blankLinks = () => {
      doc.querySelectorAll("a").forEach(a => {
        a.setAttribute("href", "");
      });
    };

    // Initial run
    blankLinks();

    // Keep enforcing if original.html scripts mutate DOM
    const observer = new MutationObserver(blankLinks);
    observer.observe(doc.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["href"]
    });

    // Catch late loads
    setTimeout(blankLinks, 100);
    setTimeout(blankLinks, 500);
  }

  frame.addEventListener("load", forceIframeLinksBlank);

  /* Initial state */
  showMyDesign();
})();
