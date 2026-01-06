(function () {
  "use strict";

  // Utilities
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---- Active nav link on scroll (simple + robust)
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

  // ---- Portfolio filter
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
      const c = btn.getAttribute("data-filter") || "all";

      qsa(".filter__btn", filterWrap).forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      filterSelection(c);
    });
  }

  // ---- Accessible Modal with focus trap + ESC close
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

  function openModal(html) {
    if (!modal || !modalContent) return;
    lastFocus = document.activeElement;

    modalContent.innerHTML = html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // Prevent background scroll
    document.body.style.overflow = "hidden";

    // Move focus into modal
    const focusables = getFocusable(modal);
    (focusables[0] || qs(".modal__dialog")).focus?.();

    document.addEventListener("keydown", onModalKeydown);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalContent.innerHTML = "";
    document.body.style.overflow = "";

    document.removeEventListener("keydown", onModalKeydown);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onModalKeydown(e) {
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    // Focus trap
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

  // Modal open triggers (buttons with data-content="#templateId")
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("button[data-modal][data-content]");
    if (openBtn) {
      const tplSel = openBtn.getAttribute("data-content");
      const tpl = qs(tplSel);
      if (tpl && tpl.content) {
        openModal(tpl.innerHTML);
      }
      return;
    }

    if (e.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }
  });

  // ---- Contact form validation + fetch submit (progressive enhancement)
  const contactForm = qs("#contactForm");
  const contactMsg = qs("#contactMsg");

  function setFieldError(input, msg) {
    const errId = input.getAttribute("aria-describedby") || "";
    // We used separate <p id="...Err">, so locate by convention:
    const map = { name: "#nameErr", email: "#emailErr", message: "#msgErr" };
    const errEl = qs(map[input.name]);
    if (errEl) errEl.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (contactMsg) {
        contactMsg.textContent = "";
        contactMsg.className = "formMsg";
      }

      const fd = new FormData(contactForm);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();

      let ok = true;

      const nameEl = qs("#name");
      const emailEl = qs("#email");
      const msgEl = qs("#message");

      setFieldError(nameEl, "");
      setFieldError(emailEl, "");
      setFieldError(msgEl, "");

      if (!name) { setFieldError(nameEl, "Please enter your name."); ok = false; }
      if (!email) { setFieldError(emailEl, "Please enter your email."); ok = false; }
      else if (!isEmail(email)) { setFieldError(emailEl, "Please enter a valid email address."); ok = false; }
      if (!message) { setFieldError(msgEl, "Please enter a message."); ok = false; }

      if (!ok) {
        // Focus first invalid field (WCAG usability)
        const firstInvalid = qs('[aria-invalid="true"]', contactForm);
        firstInvalid && firstInvalid.focus();
        return;
      }

      try {
        const res = await fetch(contactForm.action, {
          method: "POST",
          body: fd,
          headers: { "Accept": "application/json" }
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to send.");
        }

        contactForm.reset();
        if (contactMsg) {
          contactMsg.textContent = "Message sent. Thanks!";
          contactMsg.classList.add("is-success");
        }
      } catch (err) {
        if (contactMsg) {
          contactMsg.textContent = "Sorry — something went wrong sending your message.";
          contactMsg.classList.add("is-error");
        }
      }
    });
  }

  // ---- Subscribe (email)
  const subscribeForm = qs("#subscribeForm");
  const subscribeMsg = qs("#subscribeMsg");

  if (subscribeForm) {
    subscribeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      subscribeMsg.textContent = "";
      subscribeMsg.className = "formMsg";

      const fd = new FormData(subscribeForm);
      const email = (fd.get("email") || "").toString().trim();
      const emailEl = qs("#subscribeEmail");

      emailEl.setAttribute("aria-invalid", "false");

      if (!email || !isEmail(email)) {
        subscribeMsg.textContent = "Please enter a valid email address.";
        subscribeMsg.classList.add("is-error");
        emailEl.setAttribute("aria-invalid", "true");
        emailEl.focus();
        return;
      }

      try {
        const res = await fetch("api/subscribe.php", {
          method: "POST",
          body: fd,
          headers: { "Accept": "application/json" }
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed.");

        subscribeForm.reset();
        subscribeMsg.textContent = "Subscribed — thank you!";
        subscribeMsg.classList.add("is-success");
      } catch (err) {
        subscribeMsg.textContent = "Sorry — subscription failed. Try again later.";
        subscribeMsg.classList.add("is-error");
      }
    });
  }

})();
