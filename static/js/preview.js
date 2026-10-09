/* Workify design preview: runs before app.js and keeps it from talking to a server that is not there.
   Forms show a short note instead of sending, links to parts outside the preview explain themselves. */
(function () {
  "use strict";
  var bs = (document.documentElement.lang || "").indexOf("bs") === 0;
  var text = bs ? {
    send: "Ovo je pregled dizajna, pa se ovdje ništa ne šalje. U pravoj aplikaciji sve radi.",
    off: "Ovaj dio nije u pregledu. U pravoj aplikaciji je dostupan.",
    lang: "Pregled je na bosanskom i engleskom. Aplikacija ima 16 jezika."
  } : {
    send: "This is a design preview, so nothing is sent from here. Everything works in the real app.",
    off: "This part is not in the preview. It is available in the real app.",
    lang: "The preview is in Bosnian and English. The app has 16 languages."
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
    event.preventDefault();
    event.stopPropagation();
    var go = form.getAttribute("data-pv-go");
    if (go) {
      window.location.href = go;
    } else {
      toast(text.send);
    }
  }, true);
  if (window.HTMLFormElement) {
    HTMLFormElement.prototype.submit = function () { toast(text.send); };
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
