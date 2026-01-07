/* =========================================================
   app.js
   - Theme toggle + image swap
   - Site interactions
   - Mobile fullscreen menu (ONLY closes via X button)
   - Active nav highlighting
   - Portfolio filter
   - Accessible modal
   - Contact form validation
   - Mobile sticky bar (bottom/flow/top)
========================================================= */

/* =========================================================
   THEME TOGGLE + IMAGE SWAP (robust click handling)
========================================================= */
(function () {
  const STORAGE_KEY = "theme"; // "light" | "dark"
  const root = document.documentElement;

  const toggles = () =>
    Array.from(document.querySelectorAll("[data-theme-toggle]"));

    function withThemeTransition() {
    // Avoid stacking timers
    root.classList.add("theme-transition");
    window.clearTimeout(withThemeTransition._t);
    withThemeTransition._t = window.setTimeout(() => {
        root.classList.remove("theme-transition");
    }, 450);
    }

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;

    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function swapThemeAssets(theme) {
    const isDark = theme === "dark";

    // <img data-src-light data-src-dark>
    document
      .querySelectorAll("img[data-src-light][data-src-dark]")
      .forEach((img) => {
        const nextSrc = isDark
          ? img.getAttribute("data-src-dark")
          : img.getAttribute("data-src-light");

        if (nextSrc && img.getAttribute("src") !== nextSrc) {
          img.setAttribute("src", nextSrc);
        }

        // Optional: <img data-srcset-light data-srcset-dark>
        const lightSet = img.getAttribute("data-srcset-light");
        const darkSet = img.getAttribute("data-srcset-dark");
        if (lightSet && darkSet) {
          const nextSet = isDark ? darkSet : lightSet;
          if (img.getAttribute("srcset") !== nextSet) {
            img.setAttribute("srcset", nextSet);
          }
        }
      });

    // <source data-srcset-light data-srcset-dark> inside <picture>
    document
      .querySelectorAll("source[data-srcset-light][data-srcset-dark]")
      .forEach((source) => {
        const nextSet = isDark
          ? source.getAttribute("data-srcset-dark")
          : source.getAttribute("data-srcset-light");

        if (nextSet && source.getAttribute("srcset") !== nextSet) {
          source.setAttribute("srcset", nextSet);
        }

        // Force picture refresh (some browsers cache selection)
        const pic = source.closest("picture");
        const img = pic && pic.querySelector("img");
        if (img) {
          img.style.display = "none";
          img.offsetHeight; // reflow
          img.style.display = "";
        }
      });

    // Optional helper attribute for CSS hooks
    root.toggleAttribute("data-theme-dark", isDark);
  }

  function syncButtons(theme) {
    const isDark = theme === "dark";

    toggles().forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute(
        "aria-label",
        isDark ? "Disable dark mode" : "Enable dark mode"
      );

      const icon = btn.querySelector(".themeToggle__icon");
      if (icon) icon.textContent = isDark ? "☀️" : "🌙";

      const text = btn.querySelector(".themeToggle__text");
      if (text) text.textContent = isDark ? "Light mode" : "Dark mode";
    });
  }

  function setTheme(theme) {
    root.classList.add("theme-transition"); // 1️⃣ enable transitions
    root.setAttribute("data-theme", theme); // 2️⃣ change theme
    localStorage.setItem(STORAGE_KEY, theme);
    syncButtons(theme);
    swapThemeAssets(theme);

    clearTimeout(setTheme._t);
    setTheme._t = setTimeout(() => {
        root.classList.remove("theme-transition"); // 3️⃣ cleanup
    }, 250);
    }

  // Init
  setTheme(getPreferredTheme());

  // Toggle click (robust: prevents link navigation / other click handlers hijacking)
  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-theme-toggle]");
    if (!toggleBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  // OS theme changes (if no stored pref)
  const mql = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  if (mql) {
    mql.addEventListener("change", () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== "light" && stored !== "dark") {
        setTheme(mql.matches ? "dark" : "light");
      }
    });
  }
})();

/* =========================================================
   SITE INTERACTIONS (NEAT)
========================================================= */
(function () {
  "use strict";

  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ===== Year ===== */
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     MOBILE FULLSCREEN MENU (re-uses EXISTING desktop sidebar)
     Requirements (you already have most):
     - button#mobileMenuBtn
     - Add an X button inside <div class="left__inner">:
         <button class="menuClose" type="button" data-menu-close aria-label="Close menu">×</button>

     Behavior:
     - Starts CLOSED on mobile
     - Opens ONLY via hamburger
     - Closes ONLY via X button (NOT Esc, NOT outside click, NOT link click)
     - Locks background scroll while open
     - Adds body.menu-open class for your CSS to render fullscreen
     - Toggles .is-open on #mobileMenuBtn for hamburger->X animation
  ========================================================= */
    /* ===== Mobile fullscreen menu (animated) ===== */
    const menuBtn = qs("#mobileMenuBtn");
    const closeBtn = qs("[data-menu-close]");
    const mq = window.matchMedia("(max-width: 900px)");
    const ANIM_MS = 350;

    function isMenuOpen() {
    return document.body.classList.contains("menu-open");
    }

    function openMenu() {
    if (!mq.matches) return;

    // Mount + start closed position (CSS: translateX(-100%))
    document.body.classList.add("menu-visible");

    // Next frame -> slide in (CSS transition to translateX(0))
    requestAnimationFrame(() => {
        document.body.classList.add("menu-open");
    });

    document.body.style.overflow = "hidden";
    if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "true");
        menuBtn.setAttribute("aria-label", "Menu open");
        // (optional) remove animation class entirely if you don't want hamburger->X:
        menuBtn.classList.remove("is-open");
    }
    }

    function closeMenu() {
    // Slide out
    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";

    if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open menu");
        menuBtn.classList.remove("is-open");
    }

    // After transition finishes, unmount
    window.setTimeout(() => {
        document.body.classList.remove("menu-visible");
    }, ANIM_MS);
    }

    if (menuBtn) {
    // Start closed
    document.body.classList.remove("menu-open", "menu-visible");
    document.body.style.overflow = "";
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    menuBtn.classList.remove("is-open");

    // Click hamburger: OPEN only (does not close)
    menuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!isMenuOpen()) openMenu();
    });
    }

    // Close ONLY via X
    if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeMenu();
    });
    }

    // If resized to desktop, ensure closed
    mq.addEventListener("change", () => {
    closeMenu();
    });


  /* =========================================================
     ACTIVE NAV HIGHLIGHTING
     (Keeps working for both desktop sidebar and the fullscreen mobile state)
  ========================================================= */
  const navLinks = qsa(".navlink, nav[aria-label='Primary'] .navlink");
  const sections = qsa("main .section, footer").filter((el) => el.id);

  function setActiveLink() {
    const y = window.scrollY + 140;
    let activeId = "home";

    sections.forEach((sec) => {
      if (sec.offsetTop <= y) activeId = sec.id;
    });

    navLinks.forEach((a) => {
      const id = (a.getAttribute("href") || "").replace("#", "");
      a.classList.toggle("is-active", id === activeId);
    });
  }

  window.addEventListener("scroll", setActiveLink, { passive: true });
  window.addEventListener("load", setActiveLink);

  /* ===== Portfolio filter ===== */
  const filterWrap = qs("#myBtnContainer");
  const columns = qsa(".column");

  function filterSelection(c) {
    const cat = c === "all" ? "" : c;
    columns.forEach((col) => {
      col.classList.remove("show");
      if (!cat || col.className.indexOf(cat) > -1) col.classList.add("show");
    });
  }

  if (columns.length) filterSelection("all");

  if (filterWrap) {
    filterWrap.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-filter]");
      if (!b) return;

      qsa(".filterBtn", filterWrap).forEach((x) =>
        x.classList.remove("is-active")
      );
      b.classList.add("is-active");
      filterSelection(b.getAttribute("data-filter") || "all");
    });
  }

  /* ===== Accessible modal ===== */
  const modal = qs("#modal");
  const modalContent = qs("#modalContent");
  let lastFocus = null;

  function modalFocusables(container) {
    return qsa(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "textarea:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
      container
    ).filter((el) => el.offsetParent !== null);
  }

  function onModalKeydown(e) {
    if (!modal || !modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const f = modalFocusables(modal);
      if (!f.length) return;

      const first = f[0];
      const last = f[f.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openModal(html) {
    if (!modal || !modalContent) return;

    lastFocus = document.activeElement;
    modalContent.innerHTML = html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const f = modalFocusables(modal);
    (f[0] || qs(".modal__dialog"))?.focus?.();

    document.addEventListener("keydown", onModalKeydown);
  }

  function closeModal() {
    if (!modal || !modalContent) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalContent.innerHTML = "";
    document.body.style.overflow = "";

    document.removeEventListener("keydown", onModalKeydown);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-modal-close]");
    if (close) {
      closeModal();
      return;
    }

    const openBtn = e.target.closest("button[data-modal]");
    if (openBtn) {
      const sel = openBtn.getAttribute("data-modal");
      const tpl = sel ? qs(sel) : null;
      if (tpl && tpl.content) openModal(tpl.innerHTML);
    }
  });

  /* ===== Contact form validation (Netlify handles submit) ===== */
  const contactForm = qs("#contactForm");
  const contactMsg = qs("#contactMsg");
  const mapErr = { name: "#nameErr", email: "#emailErr", message: "#msgErr" };

  function setErr(input, msg) {
    if (!input) return;
    const err = qs(mapErr[input.name]);
    if (err) err.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      if (contactMsg) {
        contactMsg.textContent = "";
        contactMsg.className = "formMsg";
      }

      const nameEl = qs("#name");
      const emailEl = qs("#email");
      const msgEl = qs("#message");

      setErr(nameEl, "");
      setErr(emailEl, "");
      setErr(msgEl, "");

      let ok = true;

      if (!nameEl || !nameEl.value.trim()) {
        setErr(nameEl, "Please enter your name.");
        ok = false;
      }
      if (!emailEl || !emailEl.value.trim()) {
        setErr(emailEl, "Please enter your email.");
        ok = false;
      } else if (!isEmail(emailEl.value.trim())) {
        setErr(emailEl, "Please enter a valid email address.");
        ok = false;
      }
      if (!msgEl || !msgEl.value.trim()) {
        setErr(msgEl, "Please enter a message.");
        ok = false;
      }

      if (!ok) {
        e.preventDefault();
        const firstInvalid = qs('[aria-invalid="true"]', contactForm);
        firstInvalid && firstInvalid.focus();

        if (contactMsg) {
          contactMsg.textContent = "Please fix the highlighted fields.";
          contactMsg.classList.add("is-error");
        }
        return;
      }

      // allow Netlify submit normally
      if (contactMsg) contactMsg.textContent = "Sending…";
    });
  }
})();

/* =========================================================
   BOTTOM -> FLOW -> TOP STICKY NAV (WITH HYSTERESIS)
========================================================= */
(() => {
  const nav = document.querySelector(".mobileHeroWrap .mobilebar");
  if (!nav) return;

  // Placeholder keeps layout from jumping when nav is fixed
  const ph = document.createElement("div");
  ph.className = "mobilebar-placeholder";
  ph.style.height = `${nav.offsetHeight}px`;
  ph.style.display = "none";
  nav.parentNode.insertBefore(ph, nav);

  // Modes: "flow" (normal) | "bottom" (fixed bottom) | "top" (fixed top)
  let mode = "flow";
  let ticking = false;

  const setMode = (next) => {
    if (next === mode) return;
    mode = next;

    const fixed = mode === "bottom" || mode === "top";
    ph.style.display = fixed ? "" : "none";

    nav.classList.toggle("is-lockedBottom", mode === "bottom");
    nav.classList.toggle("is-lockedTop", mode === "top");
  };

  const update = () => {
    ticking = false;

    const navH = nav.getBoundingClientRect().height;
    const vh = window.innerHeight;

    const EPS = 1;

    if (mode === "flow") {
      const navRect = nav.getBoundingClientRect();

      if (navRect.bottom > vh + EPS) {
        setMode("bottom");
        return;
      }

      if (navRect.top <= 0 + EPS) {
        setMode("top");
        return;
      }

      return;
    }

    const phRect = ph.getBoundingClientRect();

    // Add a small hysteresis buffer so it doesn't flicker when near the threshold
    const HYST = 10; // px (try 8–16)

    if (mode === "bottom") {
    // In bottom-locked mode, we only return to flow once the placeholder
    // is clearly above the bottom-lock line (with hysteresis).
    const flowTopY = vh - navH;

    if (phRect.top <= flowTopY - HYST) {
        setMode("flow");
    }
    return;
    }

    if (mode === "top") {
    // In top-locked mode, we only return to flow once the placeholder
    // is clearly below the top edge (with hysteresis).
    if (phRect.top >= 0 + HYST) {
        setMode("flow");
        return;
    }

    // And only switch to bottom when it's clearly below the bottom-lock line
    const flowTopY = vh - navH;
    if (phRect.top > flowTopY + HYST) {
        setMode("bottom");
    }
    return;
    }

  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      ph.style.height = `${nav.offsetHeight}px`;
      onScroll();
    },
    { passive: true }
  );

  requestAnimationFrame(update);
})();
