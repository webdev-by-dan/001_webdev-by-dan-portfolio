/* =========================================================
   app.js
   - Match calendar height to left column
   - ✅ Removed: Original/My Design toggle + iframe handling
   - ✅ Ensure page links are clickable (no JS blanking hrefs, no blocked clicks)
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
   Make sure links are clickable on THIS page
   - removes any accidental click-blocking overlays
   - ensures body scroll isn't left locked
========================================================= */
(function () {
  function enableInteraction() {
    // 1) If something left the page unscrollable, unlock it
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    // 2) Kill common “transparent overlay” blockers if they exist
    const blockers = [
      "#iframeClickBlocker",
      ".iframeClickBlocker",
      "#originalView",         // leftover from old toggle builds
      "#originalFrameWrap",    // leftover wrapper that might be overlaying
      "#navPanel",             // some templates use an overlay panel
      "#titleBar .toggle"      // can accidentally cover the top on mobile
    ];

    blockers.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        // Only neutralize elements that are actually covering/catching taps
        const cs = window.getComputedStyle(el);
        if (cs.position === "fixed" || cs.position === "absolute") {
          el.style.pointerEvents = "none";
        }
      });
    });

    // 3) Don’t let any script blank out hrefs anymore (your old iframe code did this)
    // Nothing to do here now—just a reminder: DO NOT run “set href=''” anywhere.
  }

  document.addEventListener("DOMContentLoaded", enableInteraction);
  window.addEventListener("load", enableInteraction);

  // If something toggles classes later (menus, etc.), re-apply safely
  window.addEventListener("resize", enableInteraction, { passive: true });
})();
