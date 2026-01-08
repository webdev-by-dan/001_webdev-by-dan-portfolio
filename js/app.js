/* =========================================================
   THEME TOGGLE + IMAGE SWAP
========================================================= */
(function () {
  const STORAGE_KEY = "theme";
  const root = document.documentElement;

  const toggles = () => Array.from(document.querySelectorAll("[data-theme-toggle]"));

  function withThemeTransition() {
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
        const nextSrc = isDark ? img.getAttribute("data-src-dark") : img.getAttribute("data-src-light");
        if (nextSrc && img.getAttribute("src") !== nextSrc) img.setAttribute("src", nextSrc);

        // optional srcset swap on <img>
        const lightSet = img.getAttribute("data-srcset-light");
        const darkSet = img.getAttribute("data-srcset-dark");
        if (lightSet && darkSet) {
          const nextSet = isDark ? darkSet : lightSet;
          if (img.getAttribute("srcset") !== nextSet) img.setAttribute("srcset", nextSet);
        }
      });

    // <source data-srcset-light data-srcset-dark>
    document
      .querySelectorAll("source[data-srcset-light][data-srcset-dark]")
      .forEach((source) => {
        const nextSet = isDark ? source.getAttribute("data-srcset-dark") : source.getAttribute("data-srcset-light");
        if (nextSet && source.getAttribute("srcset") !== nextSet) source.setAttribute("srcset", nextSet);

        // Force picture refresh (some browsers cache selection)
        const pic = source.closest("picture");
        const img = pic && pic.querySelector("img");
        if (img) {
          img.style.display = "none";
          img.offsetHeight;
          img.style.display = "";
        }
      });

    root.toggleAttribute("data-theme-dark", isDark);
  }

  function syncButtons(theme) {
    const isDark = theme === "dark";

    toggles().forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? "Disable dark mode" : "Enable dark mode");

      const icon = btn.querySelector(".themeToggle__icon");
      if (icon) icon.textContent = isDark ? "☀️" : "🌙";

      const text = btn.querySelector(".themeToggle__text");
      if (text) text.textContent = isDark ? "Light mode" : "Dark mode";
    });
  }

  function setTheme(theme) {
    withThemeTransition();
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    syncButtons(theme);
    swapThemeAssets(theme);

    clearTimeout(setTheme._t);
    setTheme._t = setTimeout(() => root.classList.remove("theme-transition"), 250);
  }

  // Init
  setTheme(getPreferredTheme());

  // Toggle click
  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-theme-toggle]");
    if (!toggleBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  // OS theme changes (only if user hasn’t stored a pref)
  const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (mql) {
    mql.addEventListener("change", () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== "light" && stored !== "dark") setTheme(mql.matches ? "dark" : "light");
    });
  }
})();

/* =========================================================
   SITE INTERACTIONS
========================================================= */
(function () {
  "use strict";

  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const MOBILE_MQ = window.matchMedia("(max-width: 700px)"); // ✅ matches your CSS breakpoint
  const MENU_ANIM_MS = 350;
  const FOCUS_DELAY_MS = 50;

  const nav = qs(".mobileHeroWrap .mobilebar");
  const getNavH = () => (nav ? nav.offsetHeight : 0);

  const getY = (el) => {
    const r = el.getBoundingClientRect();
    return (window.pageYOffset || window.scrollY || 0) + r.top;
  };

  const smoothScrollWithOffset = (target) => {
    const y = Math.max(0, Math.round(getY(target) - getNavH()));
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const focusTarget = (target) => {
    window.setTimeout(() => {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, FOCUS_DELAY_MS);
  };

  /* ===== Year ===== */
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     MOBILE FULLSCREEN MENU
  ========================================================= */
  const menuBtn = qs("#mobileMenuBtn");
  const closeBtn = qs("[data-menu-close]");
  const menuRoot = qs("aside.left, .left");

  const isMenuOpen = () => document.body.classList.contains("menu-open");

  function openMenu() {
    if (!MOBILE_MQ.matches) return;
    document.body.classList.add("menu-visible");
    requestAnimationFrame(() => document.body.classList.add("menu-open"));

    document.body.style.overflow = "hidden";

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Menu open");
      menuBtn.classList.remove("is-open"); // keep hamburger (no X anim)
    }
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
      menuBtn.classList.remove("is-open");
    }

    window.setTimeout(() => {
      document.body.classList.remove("menu-visible");
    }, MENU_ANIM_MS);
  }

  if (menuBtn) {
    document.body.classList.remove("menu-open", "menu-visible");
    document.body.style.overflow = "";
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    menuBtn.classList.remove("is-open");

    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isMenuOpen()) openMenu();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu();
    });
  }

  MOBILE_MQ.addEventListener("change", () => closeMenu());

  /* =========================================================
     ACTIVE NAV HIGHLIGHTING
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

  /* =========================================================
     PORTFOLIO FILTER
  ========================================================= */
  (() => {
    const portfolio = qs("#portfolio");
    const filterWrap = qs("#myBtnContainer", portfolio || document);
    const grid = qs("#portfolioGrid", portfolio || document);
    if (!filterWrap || !grid) return;

    if (filterWrap.dataset.bound === "1") return;
    filterWrap.dataset.bound = "1";

    const items = Array.from(grid.querySelectorAll(".portfolioItem"));

    function setVisible(el, isVisible) {
      el.hidden = !isVisible;
      el.style.display = isVisible ? "" : "none";
      el.classList.toggle("show", isVisible);
    }

    function applyFilter(filter) {
      const cat = (filter || "all").toLowerCase().trim();
      items.forEach((item) => {
        const match = cat === "all" ? true : item.classList.contains(cat);
        setVisible(item, match);
      });
    }

    const activeBtn =
      filterWrap.querySelector("button[data-filter].is-active") ||
      filterWrap.querySelector("button[data-filter]");

    applyFilter(activeBtn ? activeBtn.getAttribute("data-filter") : "all");

    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;

      filterWrap.querySelectorAll("button[data-filter]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });

      applyFilter(btn.getAttribute("data-filter"));
    });
  })();

  /* =========================================================
     ACCESSIBLE MODAL
  ========================================================= */
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

  /* =========================================================
     CONTACT FORM VALIDATION
  ========================================================= */
  const contactForm = qs("#contactForm");
  const contactMsg = qs("#contactMsg");
  const mapErr = { name: "#nameErr", email: "#emailErr", message: "#msgErr" };

  function setErr(input, msg) {
    if (!input) return;
    const err = qs(mapErr[input.name]);
    if (err) err.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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
        if (firstInvalid) firstInvalid.focus();

        if (contactMsg) {
          contactMsg.textContent = "Please fix the highlighted fields.";
          contactMsg.classList.add("is-error");
        }
        return;
      }

      if (contactMsg) contactMsg.textContent = "Sending…";
    });
  }

  /* =========================================================
     MOBILE: ANCHOR CLICKS
     - If menu is open and click a menu link: close, then scroll with offset
     - Otherwise (mobile): scroll with offset
========================================================= */
  document.addEventListener(
    "click",
    (e) => {
      if (!MOBILE_MQ.matches) return;

      const link = e.target.closest("a[href^='#']");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const id = href.slice(1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      const clickedInsideMenu = menuRoot ? menuRoot.contains(link) : false;

      // Only intercept if it's a real in-page section anchor.
      e.preventDefault();

      if (isMenuOpen() && clickedInsideMenu) {
        closeMenu();
        window.setTimeout(() => {
          smoothScrollWithOffset(target);
          focusTarget(target);
        }, MENU_ANIM_MS + 10);
        return;
      }

      // Normal mobile anchor behavior (not menu-open)
      smoothScrollWithOffset(target);
      focusTarget(target);
    },
    true
  );
})();

/* =========================================================
   BOTTOM -> FLOW -> TOP STICKY NAV (MOBILEBAR)
========================================================= */
(() => {
  const nav = document.querySelector(".mobileHeroWrap .mobilebar");
  if (!nav) return;

  function getVH() {
    if (window.visualViewport && window.visualViewport.height) {
      return Math.round(window.visualViewport.height);
    }
    return document.documentElement.clientHeight;
  }

  // Placeholder to prevent layout jump when nav becomes fixed
  const ph = document.createElement("div");
  ph.className = "mobilebar-placeholder";
  ph.style.height = `${nav.offsetHeight}px`;
  ph.style.display = "none";
  nav.parentNode.insertBefore(ph, nav);

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

  function initBottomLockIfNeeded() {
    const vh = getVH();
    const navRect = nav.getBoundingClientRect();
    const EPS = 1;
    if (navRect.bottom > vh + EPS) setMode("bottom");
    else setMode("flow");
  }

  const update = () => {
    ticking = false;

    const vh = getVH();
    const y = window.scrollY || window.pageYOffset || 0;

    const EPS = 1;
    const HYST = 0;

    if (y < 0) return;

    const navH = nav.offsetHeight;

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
      if (phRect.top <= flowTopY - HYST) setMode("flow");
      return;
    }

    if (mode === "top") {
      if (phRect.top >= 0 + HYST) {
        setMode("flow");
        return;
      }

      const flowTopY = vh - navH;
      if (phRect.top > flowTopY + HYST) setMode("bottom");
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

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onScroll, { passive: true });
    window.visualViewport.addEventListener("scroll", onScroll, { passive: true });
  }

  window.addEventListener("load", () => {
    ph.style.height = `${nav.offsetHeight}px`;
    initBottomLockIfNeeded();
    onScroll();
  });

  requestAnimationFrame(() => {
    ph.style.height = `${nav.offsetHeight}px`;
    initBottomLockIfNeeded();
    update();
  });
})();

/* =========================================================
   Dark-mode-only: remove mobile hero half-circle
========================================================= */
(() => {
  const STYLE_ID = "no-half-circle-style";
  const WRAP_SEL = ".mobileHeroWrap";
  const MQ = window.matchMedia("(max-width: 700px)");
  const root = document.documentElement;

  const isDark = () => root.getAttribute("data-theme") === "dark";

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        @media (max-width: 700px){
          .mobileHeroWrap.noHalfCircle .hero::after{
            content: none !important;
            display: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function setState() {
    const wrap = document.querySelector(WRAP_SEL);
    if (!wrap) return;

    const shouldKill = MQ.matches && isDark();
    wrap.classList.toggle("noHalfCircle", shouldKill);
    if (shouldKill) ensureStyle();
  }

  setState();

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "attributes" && m.attributeName === "data-theme") {
        setState();
        break;
      }
    }
  });
  mo.observe(root, { attributes: true });

  MQ.addEventListener("change", setState);
  window.addEventListener("resize", setState, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setState, { passive: true });
  }
})();
