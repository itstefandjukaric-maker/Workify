/* Workify design preview: runs before app.js and keeps it from talking to a server that is not there.
   Forms show a short note instead of sending, links to parts outside the preview explain themselves. */
(function () {
  "use strict";
  var bs = (document.documentElement.lang || "").indexOf("bs") === 0;
  var text = bs ? {
    send: "Slanje trenutno nije dostupno. Podaci nisu poslani.",
    off: "Ova funkcija trenutno nije dostupna.",
    lang: "Trenutno su dostupni bosanski i engleski jezik."
  } : {
    send: "Sending is currently unavailable. No data was sent.",
    off: "This feature is currently unavailable.",
    lang: "Bosnian and English are currently available."
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

  /* Forms: the job search opens the job list, everything else explains itself. The event is stopped
     here, in the capture phase, so app.js never tries to send the form in the background. */
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (form.matches('[data-register-steps]') && form.dataset.step === '1') return;
    event.preventDefault();
    event.stopPropagation();
    if (form.hasAttribute("data-pv-search")) { search(form); return; }
    var go = form.getAttribute("data-pv-go");
    if (go) {
      window.location.href = go;
    } else {
      toast(text.send);
    }
  }, true);
  if (window.HTMLFormElement) {
    HTMLFormElement.prototype.submit = function () { if (this.hasAttribute("data-pv-search")) search(this); else toast(text.send); };
  }

  function search(form) {
    var query = new URLSearchParams(new FormData(form));
    query.delete("view"); query.delete("csrf_token");
    if (!query.get("min_pay")) { query.delete("pay_currency"); query.delete("pay_period"); }
    Array.from(query.keys()).forEach(function (key) { if (!query.get(key)) query.delete(key); });
    window.location.href = form.getAttribute("data-pv-search") + (query.toString() ? "?" + query.toString() : "");
  }

  /* Search works against the complete, fictional demo list; no server or personal data is used. */
  var board = document.querySelector(".job-lines");
  var filterForm = document.querySelector(".filters[data-pv-search]");
  if (board && filterForm) {
    var params = new URLSearchParams(window.location.search);
    var keys = ["q", "region", "country", "category", "housing", "visa", "flight", "min_pay", "pay_currency", "pay_period", "pay_basis", "experience", "language"];
    keys.forEach(function (key) {
      var input = filterForm.elements.namedItem(key); if (!input || !params.has(key)) return;
      if (input.type === "checkbox") input.checked = params.get(key) === "1"; else input.value = params.get(key);
    });
    var active = keys.some(function (key) { return params.has(key) && params.get(key) !== ""; });
    var total = 0;
    function normalized(value) { return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(); }
    board.querySelectorAll("[data-job-search]").forEach(function (row) {
      var job = JSON.parse(row.getAttribute("data-job-search")), ok = true;
      ["region","country","category","pay_basis"].forEach(function (key) { if (params.get(key) && job[key] !== params.get(key)) ok = false; });
      ["housing","visa","flight"].forEach(function (key) { if (params.get(key) === "1" && !job[key]) ok = false; });
      if (params.get("q") && !normalized(job.q).includes(normalized(params.get("q")))) ok = false;
      var amount = Number(params.get("min_pay"));
      if (amount > 0 && (job.min_pay < amount || job.pay_currency !== params.get("pay_currency") || job.pay_period !== (params.get("pay_period") || "month"))) ok = false;
      if (params.has("experience") && params.get("experience") !== "" && job.experience > Number(params.get("experience"))) ok = false;
      var language = params.get("language");
      if (language && (language === "none" ? job.languages.length > 0 : !job.languages.includes(language))) ok = false;
      row.hidden = !ok; if (ok) total++;
    });
    var count = document.querySelector(".jobs-hero .page-hero-lead");
    if (count && active) count.textContent = (bs ? "Pronađeni oglasi: " : "Matching jobs: ") + total;
    if (active) {
      var side = document.querySelector(".jobs-side"), toggle = document.querySelector(".view-toggle"), split = document.querySelector(".jobs-split");
      if (side) side.hidden = true; if (toggle) toggle.hidden = true;
      if (split) { split.classList.remove("is-map"); split.classList.add("is-list", "preview-filtered"); }
      var reset = document.createElement("a"); reset.className = "btn btn-outline btn-sm preview-reset";
      reset.href = filterForm.getAttribute("data-pv-search"); reset.textContent = bs ? "Poništi filtere" : "Clear filters"; filterForm.appendChild(reset);
      if (params.get("min_pay") || params.get("pay_basis") || params.has("experience") || params.get("language")) filterForm.querySelector(".advanced-search").open = true;
      if (!total) {
        var empty = document.createElement("p"); empty.className = "empty-search card";
        empty.textContent = bs ? "Nema oglasa za odabrane uslove. Promijeni ili poništi filtere." : "No jobs match these conditions. Change or clear the filters.";
        board.insertAdjacentElement("afterend", empty);
      }
    }
  }

  /* app.js fetches the server's own addresses (chat, saved jobs…): here those fail at once, quietly.
     Files of the preview (the help bubble's questions) are relative addresses and load normally. */
  if (window.fetch) {
    var realFetch = window.fetch;
    window.fetch = function (resource, init) {
      var url = typeof resource === "string" ? resource : (resource && resource.url) || "";
      if (url.charAt(0) === "/" || (init && init.method && init.method.toUpperCase() !== "GET")) {
        return Promise.reject(new Error("preview"));
      }
      return realFetch.apply(this, arguments);
    };
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-pv-off], a[data-pv-lang]");
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      toast(link.hasAttribute("data-pv-lang") ? text.lang : text.off);
    }
  }, true);
})();

// The static demo supports offline snapshots of public ads; no form submissions are queued.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', function () { navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(function () {}); });
}
