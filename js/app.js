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

   Changes requested:
   - While mobile menu is open: disable smooth scrolling / force instant anchor jumps
   - Make mobile nav links jump instantly (no smooth animation) and prevent "walking" highlight
   - Add html[data-menu-open] attribute toggling so CSS can disable scroll-behavior reliably
========================================================= */

/* =========================================================
   THEME TOGGLE + IMAGE SWAP (robust click handling)
========================================================= */
(function () {
  const STORAGE_KEY = "theme"; // "light" | "dark"
  const root = document.documentElement;

  const toggles = () =>
    Array.from(document.querySelectorAll("[data-theme-toggle]"));

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
    // Enable global theme transition class for CSS
    root.classList.add("theme-transition");

    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    syncButtons(theme);
    swapThemeAssets(theme);

    clearTimeout(setTheme._t);
    setTheme._t = setTimeout(() => {
      root.classList.remove("theme-transition");
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
     Requirements:
     - button#mobileMenuBtn
     - X button inside <div class="left__inner">:
       <button class="menuClose" type="button" data-menu-close aria-label="Close menu">×</button>

     Behavior:
     - Starts CLOSED on mobile
     - Opens ONLY via hamburger
     - Closes ONLY via X button
     - Locks background scroll while open
     - Adds:
         body.menu-visible (mounted for animation)
         body.menu-open (open state)
         html[data-menu-open] (for CSS to disable smooth scroll reliably)
     - Nav links: instant jump (no smooth scroll) + avoid highlight "walking"
  ========================================================= */
  const menuBtn = qs("#mobileMenuBtn");
  const closeBtn = qs("[data-menu-close]");
  const menuRoot =
    qs("aside.left") || qs(".left") || qs("nav[aria-label='Primary']") || null;

  const mq = window.matchMedia("(max-width: 900px)");
  const ANIM_MS = 350;

  function isMenuOpen() {
    return document.body.classList.contains("menu-open");
  }

  function setMenuOpenAttr(open) {
    // Lets CSS do: html[data-menu-open="true"] { scroll-behavior:auto; }
    document.documentElement.toggleAttribute("data-menu-open", open);
  }

  function openMenu() {
    if (!mq.matches) return;

    // Mount (present but off-screen for animation)
    document.body.classList.add("menu-visible");
    setMenuOpenAttr(true);

    // Next frame -> slide in (CSS transition)
    requestAnimationFrame(() => {
      document.body.classList.add("menu-open");
    });

    document.body.style.overflow = "hidden";

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Menu open");
      // You said you don't want hamburger->X animation
      menuBtn.classList.remove("is-open");
    }
  }

  function closeMenu() {
    // Slide out
    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";
    setMenuOpenAttr(false);

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
    setMenuOpenAttr(false);

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
     INSTANT ANCHOR JUMPS (MOBILE MENU ONLY)
     - Prevent smooth scroll / highlight "walking" by:
       1) preventing default anchor
       2) closing menu
       3) scrollIntoView({behavior:"auto"})
  ========================================================= */
  document.addEventListener(
    "click",
    (e) => {
      if (!isMenuOpen()) return;
      if (!mq.matches) return;

      const link = e.target.closest("a[href^='#']");
      if (!link) return;

      // Only handle links that are inside the menu/sidebar area
      if (menuRoot && !menuRoot.contains(link)) return;

      const hash = link.getAttribute("href") || "";
      const id = hash.slice(1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();

      // Close menu first (so layout goes back to normal)
      closeMenu();

      // Instant jump (no smooth)
      target.scrollIntoView({ behavior: "auto", block: "start" });
    },
    true
  );

  /* =========================================================
     ACTIVE NAV HIGHLIGHTING
     (Keeps working for both desktop sidebar and fullscreen mobile state)
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

      qsa(".filterBtn", filterWrap).forEach((x) => x.classList.remove("is-active"));
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

    if (mode === "bottom") {
      const flowTopY = vh - navH;

      if (phRect.top <= flowTopY + EPS) {
        setMode("flow");
      }
      return;
    }

    if (mode === "top") {
      if (phRect.top >= 0 - EPS) {
        setMode("flow");
        return;
      }

      const flowTopY = vh - navH;
      if (phRect.top > flowTopY + EPS) {
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

   Changes requested:
   - While mobile menu is open: disable smooth scrolling / force instant anchor jumps
   - Make mobile nav links jump instantly (no smooth animation) and prevent "walking" highlight
   - Add html[data-menu-open] attribute toggling so CSS can disable scroll-behavior reliably
========================================================= */

/* =========================================================
   THEME TOGGLE + IMAGE SWAP (robust click handling)
========================================================= */
(function () {
  const STORAGE_KEY = "theme"; // "light" | "dark"
  const root = document.documentElement;

  const toggles = () =>
    Array.from(document.querySelectorAll("[data-theme-toggle]"));

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
    // Enable global theme transition class for CSS
    root.classList.add("theme-transition");

    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    syncButtons(theme);
    swapThemeAssets(theme);

    clearTimeout(setTheme._t);
    setTheme._t = setTimeout(() => {
      root.classList.remove("theme-transition");
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
     Requirements:
     - button#mobileMenuBtn
     - X button inside <div class="left__inner">:
       <button class="menuClose" type="button" data-menu-close aria-label="Close menu">×</button>

     Behavior:
     - Starts CLOSED on mobile
     - Opens ONLY via hamburger
     - Closes ONLY via X button
     - Locks background scroll while open
     - Adds:
         body.menu-visible (mounted for animation)
         body.menu-open (open state)
         html[data-menu-open] (for CSS to disable smooth scroll reliably)
     - Nav links: instant jump (no smooth scroll) + avoid highlight "walking"
  ========================================================= */
  const menuBtn = qs("#mobileMenuBtn");
  const closeBtn = qs("[data-menu-close]");
  const menuRoot =
    qs("aside.left") || qs(".left") || qs("nav[aria-label='Primary']") || null;

  const mq = window.matchMedia("(max-width: 900px)");
  const ANIM_MS = 350;

  function isMenuOpen() {
    return document.body.classList.contains("menu-open");
  }

  function setMenuOpenAttr(open) {
    // Lets CSS do: html[data-menu-open="true"] { scroll-behavior:auto; }
    document.documentElement.toggleAttribute("data-menu-open", open);
  }

  function openMenu() {
    if (!mq.matches) return;

    // Mount (present but off-screen for animation)
    document.body.classList.add("menu-visible");
    setMenuOpenAttr(true);

    // Next frame -> slide in (CSS transition)
    requestAnimationFrame(() => {
      document.body.classList.add("menu-open");
    });

    document.body.style.overflow = "hidden";

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Menu open");
      // You said you don't want hamburger->X animation
      menuBtn.classList.remove("is-open");
    }
  }

  function closeMenu() {
    // Slide out
    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";
    setMenuOpenAttr(false);

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
    setMenuOpenAttr(false);

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
     INSTANT ANCHOR JUMPS (MOBILE MENU ONLY)
     - Prevent smooth scroll / highlight "walking" by:
       1) preventing default anchor
       2) closing menu
       3) scrollIntoView({behavior:"auto"})
  ========================================================= */
  document.addEventListener(
    "click",
    (e) => {
      if (!isMenuOpen()) return;
      if (!mq.matches) return;

      const link = e.target.closest("a[href^='#']");
      if (!link) return;

      // Only handle links that are inside the menu/sidebar area
      if (menuRoot && !menuRoot.contains(link)) return;

      const hash = link.getAttribute("href") || "";
      const id = hash.slice(1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();

      // Close menu first (so layout goes back to normal)
      closeMenu();

      // Instant jump (no smooth)
      target.scrollIntoView({ behavior: "auto", block: "start" });
    },
    true
  );

  /* =========================================================
     ACTIVE NAV HIGHLIGHTING
     (Keeps working for both desktop sidebar and fullscreen mobile state)
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

      qsa(".filterBtn", filterWrap).forEach((x) => x.classList.remove("is-active"));
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
   + STOP STICKY as soon as the next section (#about) is visible
========================================================= */
(() => {
  const nav = document.querySelector(".mobileHeroWrap .mobilebar");
  if (!nav) return;

  // NEW: when this section becomes visible, disable sticky immediately
  const stopEl =
    document.querySelector("#about") ||
    document.querySelector("main .section:not(#home)");

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

    const vh = window.innerHeight;
    const EPS = 1;

    // ✅ NEW: if the next section is visible at all, force non-sticky and
    // do not allow bottom/top locking anymore.
    if (stopEl) {
      const stopRect = stopEl.getBoundingClientRect();

      // "shown on screen" = its top has entered the viewport
      if (stopRect.top < vh - EPS) {
        setMode("flow");
        return;
      }
    }

    const navH = nav.getBoundingClientRect().height;

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

    if (mode === "bottom") {
      const flowTopY = vh - navH;

      if (phRect.top <= flowTopY + EPS) {
        setMode("flow");
      }
      return;
    }

    if (mode === "top") {
      if (phRect.top >= 0 - EPS) {
        setMode("flow");
        return;
      }

      const flowTopY = vh - navH;
      if (phRect.top > flowTopY + EPS) {
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

})();
