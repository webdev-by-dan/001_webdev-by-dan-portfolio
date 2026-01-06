/* =========================================================
   THEME TOGGLE + IMAGE SWAP (robust click handling)
   - toggles html[data-theme]="light|dark"
   - persists to localStorage("theme")
   - swaps <img data-src-light data-src-dark> and <source data-srcset-light data-srcset-dark>
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
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    syncButtons(theme);
    swapThemeAssets(theme);
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
   SITE INTERACTIONS
========================================================= */
(function () {
  "use strict";

  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) =>
    Array.prototype.slice.call((root || document).querySelectorAll(sel));

  // Year
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile menu
  const btn = qs("#mobileMenuBtn");
  const menu = qs("#mobileMenu");

  if (btn && menu) {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      menu.hidden = expanded;

      if (!expanded) {
        const firstLink = qs("a", menu);
        firstLink && firstLink.focus();
      } else {
        btn.focus();
      }
    });

    // Close menu on link click
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      btn.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    });
  }

  // Active nav highlighting
  const navLinks = qsa(".navlink, .mobilebar__menu a");
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

  // Portfolio filter
  const filterWrap = qs("#myBtnContainer");
  const columns = qsa(".column");

  function filterSelection(c) {
    const cat = c === "all" ? "" : c;
    columns.forEach((col) => {
      col.classList.remove("show");
      if (!cat || col.className.indexOf(cat) > -1) {
        col.classList.add("show");
      }
    });
  }

  filterSelection("all");

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

  // Accessible modal
  const modal = qs("#modal");
  const modalContent = qs("#modalContent");
  let lastFocus = null;

  function focusables(container) {
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
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const f = focusables(modal);
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
    lastFocus = document.activeElement;
    modalContent.innerHTML = html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const f = focusables(modal);
    (f[0] || qs(".modal__dialog"))?.focus?.();

    document.addEventListener("keydown", onModalKeydown);
  }

  function closeModal() {
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

  // Newsletter demo (no backend)
  const newsForm = qs("#newsletterForm");
  const newsMsg = qs("#newsletterMsg");

  if (newsForm && newsMsg) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = (qs("#newsletterEmail")?.value || "").trim();
      newsMsg.className = "formMsg";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newsMsg.textContent = "Please enter a valid email address.";
        newsMsg.classList.add("is-error");
        return;
      }

      newsMsg.textContent = "Thanks! (Static demo — wire to Netlify if desired.)";
      newsMsg.classList.add("is-success");
      newsForm.reset();
    });
  }

  // Contact form validation (Netlify handles submit)
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
   STICKY-LOCK NAV:
   - locks (fixed) when nav hits y <= 0
   - unlocks ONLY when the nav's original spot reaches y >= 0 again
   (uses a placeholder to track the nav's "spot" in the document flow)
========================================================= */
(() => {
  const nav = document.querySelector(".mobileHeroWrap .mobilebar");
  if (!nav) return;

  // Create an in-flow placeholder right where the nav normally sits
  const ph = document.createElement("div");
  ph.className = "mobilebar-placeholder";
  ph.style.height = `${nav.offsetHeight}px`;
  ph.style.display = "none"; // only visible (in effect) while locked

  // Insert placeholder immediately before nav
  nav.parentNode.insertBefore(ph, nav);

  let locked = false;
  let ticking = false;

  const lock = () => {
    if (locked) return;
    locked = true;
    ph.style.display = ""; // keep layout from jumping
    nav.classList.add("is-lockedTop");
  };

  const unlock = () => {
    if (!locked) return;
    locked = false;
    nav.classList.remove("is-lockedTop");
    ph.style.display = "none";
  };

  const update = () => {
    ticking = false;

    if (!locked) {
      // Gain sticky when nav hits the threshold (viewport top)
      const navRect = nav.getBoundingClientRect();
      if (navRect.top <= 0) lock();
      return;
    }

    // Lose sticky only when the TOP of the nav's original spot
    // is back at (or below) the top of the viewport.
    // When scrolling up, ph.top increases; unlock when ph.top >= 0.
    const phRect = ph.getBoundingClientRect();
    if (phRect.top >= 0) unlock();
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    // Keep placeholder height synced if nav height changes
    ph.style.height = `${nav.offsetHeight}px`;
    onScroll();
  }, { passive: true });

  // Init
  requestAnimationFrame(update);
})();


/* =========================================================
   SET mobileHeroWrap max-height = 100vh - mobilebar height
========================================================= */
(() => {
  const wrap = document.querySelector(".mobileHeroWrap");
  const nav  = document.querySelector(".mobileHeroWrap .mobilebar");

  if (!wrap || !nav) return;

  const update = () => {
    const navH = nav.getBoundingClientRect().height;
    const maxH = window.innerHeight - navH;

    wrap.style.setProperty("--heroMaxH", `${Math.max(0, Math.ceil(maxH))}px`);
  };

  // Run on load + resize (orientation changes)
  window.addEventListener("load", update);
  window.addEventListener("resize", update);

  // Recalc after fonts load (nav height can change slightly)
  document.fonts?.ready?.then(update);
})();
