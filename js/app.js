(function () {
  "use strict";

  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  // Year
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Active nav on scroll
  const navLinks = qsa(".nav__link");
  const sections = navLinks
    .map(a => qs(a.getAttribute("href")))
    .filter(Boolean);

  function setActiveLink() {
    const y = window.scrollY + 120;
    let activeId = "home";
    sections.forEach(sec => {
      if (sec.offsetTop <= y) activeId = sec.id;
    });
    navLinks.forEach(a => {
      const id = (a.getAttribute("href") || "").replace("#", "");
      a.classList.toggle("is-active", id === activeId);
    });
  }
  window.addEventListener("scroll", setActiveLink, { passive: true });
  window.addEventListener("load", setActiveLink);

  // Portfolio filtering
  const filterWrap = qs("#myBtnContainer");
  const columns = qsa(".column");

  function filterSelection(c) {
    const cat = (c === "all") ? "" : c;
    columns.forEach(col => {
      col.classList.remove("show");
      if (!cat || col.className.indexOf(cat) > -1) col.classList.add("show");
    });
  }
  filterSelection("all");

  if (filterWrap) {
    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;

      qsa(".filter__btn", filterWrap).forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      filterSelection(btn.getAttribute("data-filter") || "all");
    });
  }

  // Accessible modal (focus trap + ESC)
  const modal = qs("#modal");
  const modalContent = qs("#modalContent");
  let lastFocus = null;

  function getFocusable(container) {
    return qsa([
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(","), container).filter(el => el.offsetParent !== null);
  }

  function onModalKeydown(e) {
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const focusables = getFocusable(modal);
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

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

    const focusables = getFocusable(modal);
    (focusables[0] || qs(".modal__dialog")).focus?.();

    document.addEventListener("keydown", onModalKeydown);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalContent.innerHTML = "";
    document.body.style.overflow = "";

    document.removeEventListener("keydown", onModalKeydown);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("button[data-content]");
    if (openBtn) {
      const tplSel = openBtn.getAttribute("data-content");
      const tpl = qs(tplSel);
      if (tpl && tpl.content) openModal(tpl.innerHTML);
      return;
    }
    if (e.target.closest("[data-modal-close]")) closeModal();
  });

  // Contact form validation (Netlify does the submission)
  const contactForm = qs("#contactForm");
  const contactMsg = qs("#contactMsg");

  const mapErr = { name: "#nameErr", email: "#emailErr", message: "#msgErr" };

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function setFieldError(input, msg) {
    const errEl = qs(mapErr[input.name]);
    if (errEl) errEl.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
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

      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const message = msgEl.value.trim();

      let ok = true;

      setFieldError(nameEl, "");
      setFieldError(emailEl, "");
      setFieldError(msgEl, "");

      if (!name) { setFieldError(nameEl, "Please enter your name."); ok = false; }
      if (!email) { setFieldError(emailEl, "Please enter your email."); ok = false; }
      else if (!isEmail(email)) { setFieldError(emailEl, "Please enter a valid email address."); ok = false; }
      if (!message) { setFieldError(msgEl, "Please enter a message."); ok = false; }

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

      // Allow Netlify to submit normally.
      // Optional: show a message immediately (Netlify will redirect unless you set action)
      if (contactMsg) {
        contactMsg.textContent = "Sending…";
      }
    });
  }

  // Subscribe form (static demo)
  const subscribeForm = qs("#subscribeForm");
  const subscribeMsg = qs("#subscribeMsg");
  if (subscribeForm) {
    subscribeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      subscribeMsg.textContent = "";
      subscribeMsg.className = "formMsg";

      const emailEl = qs("#subscribeEmail");
      const email = emailEl.value.trim();
      emailEl.setAttribute("aria-invalid", "false");

      if (!email || !isEmail(email)) {
        subscribeMsg.textContent = "Please enter a valid email address.";
        subscribeMsg.classList.add("is-error");
        emailEl.setAttribute("aria-invalid", "true");
        emailEl.focus();
        return;
      }

      subscribeMsg.textContent = "Static demo (no backend).";
      subscribeMsg.classList.add("is-success");
      subscribeForm.reset();
    });
  }

})();
