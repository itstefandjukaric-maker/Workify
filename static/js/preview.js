/* Workify design preview: menus, the console sidebar, and short notes where the real app would act. */
(function () {
  "use strict";
  var bs = (document.documentElement.lang || "").indexOf("bs") === 0;
  var text = bs ? {
    send: "Ovo je pregled dizajna, pa se ovdje ništa ne šalje. U pravoj aplikaciji sve radi.",
    off: "Ovaj dio nije u pregledu. U pravoj aplikaciji je dostupan.",
    lang: "Pregled je na bosanskom i engleskom. Aplikacija ima 13 jezika."
  } : {
    send: "This is a design preview, so nothing is sent from here. Everything works in the real app.",
    off: "This part is not in the preview. It is available in the real app.",
    lang: "The preview is in Bosnian and English. The app has 13 languages."
  };

  var toastEl = null;
  var timer = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "pv-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.style.animation = "none";
    void toastEl.offsetWidth;
    toastEl.style.animation = "";
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { toastEl.hidden = true; }, 3800);
  }

  /* Forms: the job search opens the job list, everything else explains itself. */
  document.addEventListener("submit", function (event) {
    var form = event.target;
    event.preventDefault();
    var go = form.getAttribute("data-pv-go");
    if (go) {
      window.location.href = go;
    } else {
      toast(text.send);
    }
  }, true);

  function closeMenus(except) {
    document.querySelectorAll("details.menu[open]").forEach(function (d) {
      if (d !== except) d.removeAttribute("open");
    });
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-pv-off], a[data-pv-lang]");
    if (link) {
      event.preventDefault();
      toast(link.hasAttribute("data-pv-lang") ? text.lang : text.off);
    }
    closeMenus(event.target.closest("details.menu"));
  });

  /* Console sidebar on small screens. */
  var consoleEl = document.querySelector("[data-console]");
  var toggleBtn = document.querySelector("[data-sidebar-toggle]");
  function toggleSidebar(open) {
    if (!consoleEl || !toggleBtn) return;
    var next = typeof open === "boolean" ? open : !consoleEl.classList.contains("sidebar-open");
    consoleEl.classList.toggle("sidebar-open", next);
    toggleBtn.setAttribute("aria-expanded", String(next));
  }
  if (toggleBtn) toggleBtn.addEventListener("click", function () { toggleSidebar(); });
  document.querySelectorAll("[data-sidebar-close]").forEach(function (el) {
    el.addEventListener("click", function () { toggleSidebar(false); });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenus(null);
      toggleSidebar(false);
    }
  });
})();
