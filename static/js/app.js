/* Workify – small progressive enhancements. Every page works without this file. */
(function () {
  "use strict";

  var lang = document.body.getAttribute("data-locale") || "en";
  var intlLang = lang === "bs" ? "hr" : lang;

  function formatLocal(iso) {
    var date = new Date(iso);
    if (isNaN(date)) return null;
    var today = new Date();
    var sameDay = date.toDateString() === today.toDateString();
    var opts = sameDay ? { hour: "2-digit", minute: "2-digit" }
                       : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
    try { return new Intl.DateTimeFormat(intlLang, opts).format(date); } catch (e) { return null; }
  }

  function localizeTimes(root) {
    (root || document).querySelectorAll("time[data-local]").forEach(function (el) {
      var text = formatLocal(el.getAttribute("datetime"));
      if (text) el.textContent = text;
    });
  }

  /* Dropdown menus built on <details>: one open at a time, close outside / on Escape. */
  function closeMenus(except) {
    document.querySelectorAll("details.menu[open]").forEach(function (d) {
      if (d !== except) d.removeAttribute("open");
    });
  }
  document.addEventListener("click", function (event) {
    var menu = event.target.closest("details.menu");
    closeMenus(menu);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { closeMenus(null); toggleSidebar(false); }
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

  /* Confirmation before destructive actions. */
  document.addEventListener("submit", function (event) {
    var form = event.target;
    var message = form.getAttribute("data-confirm");
    if (message && !window.confirm(message)) event.preventDefault();
  }, true);
  document.querySelectorAll("[data-confirm-click]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      if (!window.confirm(btn.getAttribute("data-confirm-click"))) event.preventDefault();
    });
  });

  /* Show the chosen file name (or how many files) in upload fields. */
  document.querySelectorAll("input.file-input").forEach(function (input) {
    input.addEventListener("change", function () {
      var label = document.querySelector('label[for="' + input.id + '"] [data-file-label]');
      if (label && input.files && input.files[0]) {
        var many = input.files.length > 1 && label.getAttribute("data-many");
        label.textContent = many ? many.replace("{count}", input.files.length) : input.files[0].name;
        label.parentElement.classList.add("has-file");
      }
    });
  });

  /* Fields that only matter for one choice of a radio group: data-show-if="name=value". */
  document.querySelectorAll("[data-show-if]").forEach(function (box) {
    var rule = box.getAttribute("data-show-if").split("=");
    var radios = document.querySelectorAll('input[name="' + rule[0] + '"]');
    var sync = function () {
      var checked = document.querySelector('input[name="' + rule[0] + '"]:checked');
      box.hidden = !!checked && checked.value !== rule[1];
    };
    radios.forEach(function (r) { r.addEventListener("change", sync); });
    sync();
  });

  /* Photo strips (job cards, job page): arrows and dots on top of native swiping. */
  var rtl = document.documentElement.dir === "rtl";
  document.querySelectorAll("[data-carousel]").forEach(function (track) {
    var box = track.parentElement;
    var prev = box.querySelector("[data-carousel-prev]");
    var next = box.querySelector("[data-carousel-next]");
    var dots = box.querySelectorAll(".jc-dots i");
    var go = function (dir) {
      track.scrollBy({ left: dir * track.clientWidth * 0.9 * (rtl ? -1 : 1), behavior: "smooth" });
    };
    var sync = function () {
      var max = track.scrollWidth - track.clientWidth;
      var pos = Math.abs(track.scrollLeft);
      if (prev) { prev.hidden = max <= 4; prev.disabled = pos <= 4; }
      if (next) { next.hidden = max <= 4; next.disabled = pos >= max - 4; }
      if (dots.length) {
        var index = Math.round(pos / Math.max(1, track.clientWidth));
        dots.forEach(function (d, i) { d.classList.toggle("is-on", i === index); });
      }
    };
    if (prev) prev.addEventListener("click", function (e) { e.preventDefault(); go(-1); });
    if (next) next.addEventListener("click", function (e) { e.preventDefault(); go(1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });

  /* Job map: keep bubbles and names readable at any screen size (the SVG scales with the screen),
     and hide a name that would cover another one; the chips under the map name every place. */
  document.querySelectorAll("[data-fit-map]").forEach(function (svg) {
    var vb = svg.viewBox.baseVal;
    var pins = Array.prototype.slice.call(svg.querySelectorAll(".pin"));
    pins.sort(function (a, b) { return b.getAttribute("data-n") - a.getAttribute("data-n"); });
    var fit = function () {
      var box = svg.getBoundingClientRect();
      if (!box.width || !vb || !vb.width) return;
      var scale = Math.max(box.width / vb.width, box.height / vb.height);  /* preserveAspectRatio slice */
      var px = function (n) { return n / scale; };
      var size = px(box.width < 520 ? 12 : 13.5);
      var taken = [];
      pins.forEach(function (pin) {
        var x = +pin.getAttribute("data-x"), y = +pin.getAttribute("data-y");
        var r = Math.max(+pin.getAttribute("data-r"), px(11 + 2.2 * Math.sqrt(+pin.getAttribute("data-n"))));
        pin.querySelectorAll("circle").forEach(function (c) { c.setAttribute("r", c.classList.contains("pin-glow") ? r * 1.6 : r); });
        var count = pin.querySelector(".pin-count");
        if (count) count.setAttribute("font-size", r * 1.05);
        taken.push([x - r, y - r, x + r, y + r]);
      });
      pins.forEach(function (pin) {
        var label = pin.querySelector(".pin-label");
        if (!label) return;
        var x = +pin.getAttribute("data-x"), y = +pin.getAttribute("data-y");
        var r = +pin.querySelector(".pin-dot").getAttribute("r");
        var width = (pin.getAttribute("data-label") || "").length * size * 0.56;
        var options = [[x, y + r + size * 1.05, "middle"], [x, y - r - size * 0.35, "middle"],
                       [x + r + size * 0.35, y + size * 0.35, "start"], [x - r - size * 0.35, y + size * 0.35, "end"]];
        var placed = false;
        for (var i = 0; i < options.length && !placed; i++) {
          var o = options[i];
          var left = o[2] === "middle" ? o[0] - width / 2 : (o[2] === "start" ? o[0] : o[0] - width);
          var b = [left, o[1] - size * 0.9, left + width, o[1] + size * 0.25];
          var clear = taken.every(function (t) { return b[2] <= t[0] || b[0] >= t[2] || b[3] <= t[1] || b[1] >= t[3]; });
          if (clear) {
            taken.push(b);
            label.setAttribute("x", o[0]); label.setAttribute("y", o[1]);
            label.setAttribute("text-anchor", o[2]); label.setAttribute("font-size", size);
            label.removeAttribute("visibility");
            placed = true;
          }
        }
        if (!placed) label.setAttribute("visibility", "hidden");
      });
    };
    fit();
    window.addEventListener("resize", fit);
  });

  /* Read aloud with the phone's own voice, for people who read slowly or not at all.
     Buttons stay hidden when the device has no voice for the page language. */
  var speech = window.speechSynthesis;
  var VOICE_LANGS = { bs: ["bs", "hr", "sr"], ur: ["ur"], ky: ["ky", "ru"], tg: ["tg", "fa"], uz: ["uz"] };
  var voice = null;
  var findVoice = function () {
    if (!speech) return null;
    var wanted = VOICE_LANGS[lang] || [lang];
    var voices = speech.getVoices();
    for (var i = 0; i < wanted.length; i++) {
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].lang && voices[j].lang.toLowerCase().indexOf(wanted[i]) === 0) return voices[j];
      }
    }
    return null;
  };
  var speakButtons = document.querySelectorAll("[data-speak]");
  var activeSpeak = null;
  var stopSpeaking = function () {
    if (speech) speech.cancel();
    if (activeSpeak) {
      activeSpeak.classList.remove("is-speaking");
      var span = activeSpeak.querySelector("span");
      if (span && activeSpeak.dataset.labelRead) span.textContent = activeSpeak.dataset.labelRead;
    }
    activeSpeak = null;
  };
  var speakText = function (text, button, done) {
    if (!speech || !voice || !text) { if (done) done(false); return; }
    stopSpeaking();
    var parts = text.replace(/\s+/g, " ").match(/[^.!?।۔]+[.!?।۔]*/g) || [text];
    activeSpeak = button || null;
    if (button) {
      button.classList.add("is-speaking");
      var span = button.querySelector("span");
      if (span) { button.dataset.labelRead = span.textContent; span.textContent = button.getAttribute("data-label-stop") || span.textContent; }
    }
    parts.forEach(function (part, i) {
      var u = new SpeechSynthesisUtterance(part.trim());
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.95;
      if (i === parts.length - 1) u.onend = function () { if (activeSpeak === button) stopSpeaking(); if (done) done(true); };
      speech.speak(u);
    });
  };
  window.WorkifySpeak = { say: function (text, button, done) { speakText(text, button, done); }, stop: stopSpeaking,
                          ready: function () { return !!voice; } };
  var setupVoices = function () {
    voice = findVoice();
    speakButtons.forEach(function (b) { b.hidden = !voice; });
    document.dispatchEvent(new CustomEvent("workify:voices", { detail: { ready: !!voice } }));
  };
  if (speech) {
    setupVoices();
    if (typeof speech.addEventListener === "function") speech.addEventListener("voiceschanged", setupVoices);
  }
  speakButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (activeSpeak === button) { stopSpeaking(); return; }
      var target = document.querySelector(button.getAttribute("data-speak"));
      if (!target) return;
      var clone = target.cloneNode(true);
      clone.querySelectorAll("button, .speak-btn, script, style").forEach(function (el) { el.remove(); });
      speakText(clone.textContent, button);
    });
  });
  window.addEventListener("pagehide", stopSpeaking);

  /* Filter forms submit on change. */
  document.querySelectorAll("form[data-autosubmit]").forEach(function (form) {
    form.addEventListener("change", function (event) {
      if (event.target.matches("select, input[type=checkbox]")) form.submit();
    });
  });

  document.querySelectorAll("[data-back]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (window.history.length > 1) { event.preventDefault(); window.history.back(); }
    });
  });

  /* Chat: send without reloading, poll for new messages. */
  var chat = document.querySelector("[data-chat]");
  if (chat) {
    var log = chat.querySelector("[data-chat-log]");
    var form = chat.querySelector("[data-chat-form]");
    var errorBox = chat.querySelector("[data-chat-error]");
    var lastId = parseInt(chat.getAttribute("data-last-id"), 10) || 0;
    var pollUrl = chat.getAttribute("data-poll-url");
    var delay = 4000;

    var scrollToEnd = function () { log.scrollTop = log.scrollHeight; };

    /* Optional machine translation of the other side's messages. */
    var trUrl = chat.getAttribute("data-translate-url");
    var csrfInput = document.querySelector('input[name="csrf_token"]');
    var addTranslate = function (bubble) {
      if (!trUrl || bubble.classList.contains("mine") || bubble.querySelector(".bubble-tr")) return;
      var body = bubble.querySelector(".bubble-body");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bubble-tr";
      btn.textContent = chat.getAttribute("data-tr-label");
      btn.addEventListener("click", function () {
        if (bubble.dataset.translated) {
          var showingOriginal = bubble.classList.toggle("show-original");
          body.textContent = showingOriginal ? bubble.dataset.original : bubble.dataset.translated;
          btn.textContent = chat.getAttribute(showingOriginal ? "data-tr-again" : "data-tr-original");
          return;
        }
        btn.disabled = true;
        fetch(trUrl.replace("/0/", "/" + bubble.getAttribute("data-id") + "/"), {
          method: "POST",
          headers: { Accept: "application/json", "X-CSRF-Token": csrfInput ? csrfInput.value : "" },
          credentials: "same-origin"
        })
          .then(function (res) {
            return res.json().then(function (data) { return { ok: res.ok, data: data }; });
          })
          .then(function (result) {
            if (!result.ok) throw new Error(result.data.error || "error");
            bubble.dataset.original = body.textContent;
            bubble.dataset.translated = result.data.body;
            body.textContent = result.data.body;
            var note = document.createElement("span");
            note.className = "bubble-tr-note";
            note.textContent = chat.getAttribute("data-tr-note");
            bubble.insertBefore(note, btn);
            btn.textContent = chat.getAttribute("data-tr-original");
            bubble.classList.add("is-translated");
          })
          .catch(function (err) {
            if (errorBox) { errorBox.textContent = err.message; errorBox.hidden = false; }
          })
          .finally(function () { btn.disabled = false; });
      });
      bubble.appendChild(btn);
    };
    log.querySelectorAll(".bubble").forEach(addTranslate);
    var nearEnd = function () { return log.scrollHeight - log.scrollTop - log.clientHeight < 80; };

    var addMessage = function (msg) {
      if (log.querySelector('[data-id="' + msg.id + '"]')) return;
      var empty = log.querySelector("[data-chat-empty]");
      if (empty) empty.remove();
      var bubble = document.createElement("div");
      bubble.className = "bubble" + (msg.mine ? " mine" : "");
      bubble.setAttribute("data-id", msg.id);
      if (!msg.mine && msg.sender) {
        var sender = document.createElement("span");
        sender.className = "bubble-sender";
        sender.textContent = msg.sender;
        bubble.appendChild(sender);
      }
      var body = document.createElement("p");
      body.className = "bubble-body";
      body.textContent = msg.body;
      var time = document.createElement("time");
      time.className = "bubble-time";
      time.setAttribute("datetime", msg.at);
      time.setAttribute("data-local", "");
      time.textContent = formatLocal(msg.at) || "";
      bubble.appendChild(body);
      bubble.appendChild(time);
      log.appendChild(bubble);
      addTranslate(bubble);
      lastId = Math.max(lastId, msg.id);
    };

    var poll = function () {
      if (document.hidden) { window.setTimeout(poll, delay); return; }
      fetch(pollUrl + "?after=" + lastId, { headers: { Accept: "application/json" }, credentials: "same-origin" })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (items) {
          var stick = nearEnd();
          items.forEach(addMessage);
          if (items.length && stick) scrollToEnd();
          delay = 4000;
        })
        .catch(function () { delay = Math.min(delay * 2, 60000); })
        .finally(function () { window.setTimeout(poll, delay); });
    };

    scrollToEnd();
    window.setTimeout(poll, delay);

    if (form) {
      var textarea = form.querySelector("textarea");
      var grow = function () {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
      };
      textarea.addEventListener("input", grow);
      var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      textarea.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey && !coarse) {
          event.preventDefault();
          form.requestSubmit ? form.requestSubmit() : form.submit();
        }
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var text = textarea.value.trim();
        if (!text) return;
        var button = form.querySelector("button");
        button.disabled = true;
        fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
          credentials: "same-origin"
        })
          .then(function (res) {
            return res.json().then(function (data) { return { ok: res.ok, data: data }; });
          })
          .then(function (result) {
            if (!result.ok) throw new Error(result.data.error || "error");
            addMessage(result.data);
            textarea.value = "";
            grow();
            scrollToEnd();
            if (errorBox) errorBox.hidden = true;
          })
          .catch(function (err) {
            if (errorBox) { errorBox.textContent = err.message; errorBox.hidden = false; }
          })
          .finally(function () { button.disabled = false; textarea.focus(); });
      });
    }
  }

  /* Job form: tick the documents usually needed for the chosen trade. */
  var docBox = document.querySelector("[data-doc-suggest]");
  if (docBox) {
    var applyBtn = docBox.querySelector("[data-doc-suggest-apply]");
    var category = document.getElementById("f-category");
    var suggestions = {};
    try { suggestions = JSON.parse(docBox.getAttribute("data-doc-suggest")) || {}; } catch (e) { suggestions = {}; }
    if (applyBtn && category) {
      applyBtn.hidden = false;
      applyBtn.addEventListener("click", function () {
        var wanted = suggestions[category.value] || suggestions.other || [];
        docBox.querySelectorAll('input[name="required_documents"]').forEach(function (box) {
          box.checked = wanted.indexOf(box.value) !== -1;
        });
      });
    }
  }

  /* Job form: suggest the local currency when the country changes (unless one was picked by hand). */
  var countrySelect = document.querySelector("select[data-currency-map]");
  var currencySelect = document.getElementById("f-salary_currency");
  if (countrySelect && currencySelect) {
    var currencyMap = {};
    try { currencyMap = JSON.parse(countrySelect.getAttribute("data-currency-map")) || {}; } catch (e) { currencyMap = {}; }
    var previousCountry = countrySelect.value;
    countrySelect.addEventListener("change", function () {
      if (currencySelect.value === currencyMap[previousCountry] && currencyMap[countrySelect.value]) {
        currencySelect.value = currencyMap[countrySelect.value];
      }
      previousCountry = countrySelect.value;
    });
  }

  /* Interview times are written in the agency's time zone; add the reader's own clock when it differs. */
  var ownZone = null;
  try { ownZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { ownZone = null; }
  document.querySelectorAll("[data-local-alt]").forEach(function (el) {
    var zone = el.getAttribute("data-zone");
    var date = new Date(el.getAttribute("data-local-alt"));
    if (!ownZone || !zone || isNaN(date)) return;
    var opts = { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
    try {
      var theirs = new Intl.DateTimeFormat(intlLang, Object.assign({ timeZone: zone }, opts)).format(date);
      var mine = new Intl.DateTimeFormat(intlLang, opts).format(date);
      if (theirs === mine) return;
      el.textContent = el.getAttribute("data-label") + ": " + mine;
      el.hidden = false;
    } catch (e) { /* unknown zone: keep the server text */ }
  });

  /* Save jobs (heart) without leaving the page. */
  var csrfField = function (form) { var f = form.querySelector('input[name="csrf_token"]'); return f ? f.value : ""; };
  document.querySelectorAll("form[data-save]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!window.fetch) return;
      event.preventDefault();
      var btn = form.querySelector("button");
      btn.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form), credentials: "same-origin",
                           headers: { Accept: "application/json", "X-CSRF-Token": csrfField(form) } })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (data) {
          btn.classList.toggle("is-saved", data.saved);
          btn.classList.toggle("just-saved", data.saved);
          btn.setAttribute("aria-pressed", data.saved ? "true" : "false");
          var label = btn.getAttribute(data.saved ? "data-label-on" : "data-label-off");
          btn.title = label;
          var sr = btn.querySelector(".sr-only");
          if (sr) sr.textContent = label;
        })
        .catch(function () { form.submit(); })
        .finally(function () { btn.disabled = false; });
    });
  });

  /* Pre-departure checklist: tick items in place. */
  var checklist = document.querySelector("[data-checklist]");
  if (checklist) {
    var counter = document.querySelector("[data-checklist-count]");
    checklist.querySelectorAll("form[data-check-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        if (!window.fetch) return;
        event.preventDefault();
        var btn = form.querySelector("button");
        btn.disabled = true;
        fetch(form.action, { method: "POST", body: new FormData(form), credentials: "same-origin",
                             headers: { Accept: "application/json", "X-CSRF-Token": csrfField(form) } })
          .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
          .then(function (data) {
            btn.classList.toggle("is-done", data.done);
            btn.setAttribute("aria-pressed", data.done ? "true" : "false");
            if (counter) counter.textContent = data.count + "/" + data.total;
          })
          .catch(function () { form.submit(); })
          .finally(function () { btn.disabled = false; });
      });
    });
  }

  /* Copy a link (job pages). */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    if (!navigator.clipboard) return;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
        var label = btn.querySelector("span");
        if (label) label.textContent = btn.getAttribute("data-copied");
      });
    });
  });

  /* Installed app (PWA): service worker for the offline page, install button, iOS hint, offline language. */
  var nativeApp = /WorkifyApp/.test(navigator.userAgent);
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  var store = {
    get: function (key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } },
    set: function (key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ } }
  };
  var offlinePage = document.body.classList.contains("offline-page");
  if (!offlinePage) store.set("workify-locale", lang);
  if (offlinePage) {
    var wanted = store.get("workify-locale");
    var blocks = document.querySelectorAll("[data-offline-lang]");
    var match = wanted && document.querySelector('[data-offline-lang="' + wanted + '"]');
    if (match) blocks.forEach(function (b) { b.hidden = b !== match; });
    document.querySelectorAll("[data-reload]").forEach(function (b) {
      b.addEventListener("click", function () { window.location.reload(); });
    });
  }
  var installable = !!document.querySelector('link[rel="manifest"]');   /* the static design preview has no manifest */
  if ("serviceWorker" in navigator && !nativeApp && window.isSecureContext && installable) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }
  var installBtn = document.querySelector("[data-install-app]");
  var iosHint = document.querySelector("[data-install-ios]");
  var deferredPrompt = null;
  if (!nativeApp && !standalone) {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredPrompt = event;
      if (installBtn) installBtn.hidden = false;
    });
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios && iosHint) iosHint.hidden = false;
  }
  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; installBtn.hidden = true; });
    });
  }

  /* Photo upload: send as soon as a picture is chosen. */
  document.querySelectorAll("form[data-autosubmit-file]").forEach(function (form) {
    var input = form.querySelector("input[type=file]");
    var submit = form.querySelector("[data-file-submit]");
    if (submit) submit.hidden = true;
    if (input) input.addEventListener("change", function () { if (input.files && input.files[0]) form.submit(); });
  });

  /* Slow actions (AI): show that something is happening and avoid double clicks. */
  document.querySelectorAll("form[data-busy]").forEach(function (form) {
    form.addEventListener("submit", function () {
      var btn = form.querySelector("button[type=submit]");
      if (!btn) return;
      window.setTimeout(function () { btn.disabled = true; }, 0);
      btn.classList.add("is-busy");
      var span = btn.lastChild;
      if (span && span.nodeType === 3) span.textContent = form.getAttribute("data-busy");
    });
  });

  /* Waiting list: join or leave a country in place. */
  var waitCount = document.querySelector("[data-wait-count]");
  document.querySelectorAll("form[data-waitlist]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!window.fetch) return;
      event.preventDefault();
      var btn = form.querySelector("button");
      btn.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form), credentials: "same-origin",
                           headers: { Accept: "application/json", "X-CSRF-Token": csrfField(form) } })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (data) {
          if (data.result === "limit") { form.submit(); return; }
          var tile = form.closest(".wait-tile");
          if (tile) tile.classList.toggle("is-on", data.on);
          btn.classList.toggle("btn-gold", data.on);
          btn.classList.toggle("btn-outline", !data.on);
          btn.setAttribute("aria-pressed", data.on ? "true" : "false");
          var span = btn.querySelector("span");
          if (span) span.textContent = data.label;
          var num = tile && tile.querySelector(".wait-nums div:last-child dd");
          if (num) {
            var n = parseInt(num.textContent.replace(/\D/g, ""), 10) || 0;
            num.textContent = String(Math.max(0, n + (data.on ? 1 : -1)));
          }
          if (waitCount) {
            var on = document.querySelectorAll(".wait-tile.is-on").length;
            var tpl = waitCount.getAttribute("data-template");
            if (!tpl) { tpl = waitCount.textContent.replace(/\d+/, "{count}"); waitCount.setAttribute("data-template", tpl); }
            waitCount.textContent = tpl.replace("{count}", on);
          }
        })
        .catch(function () { form.submit(); })
        .finally(function () { btn.disabled = false; });
    });
  });

  /* Company shortlist ("korpa"): add or remove a worker in place. */
  document.querySelectorAll("form[data-shortlist]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!window.fetch) return;
      event.preventDefault();
      var btn = form.querySelector("button");
      btn.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form), credentials: "same-origin",
                           headers: { Accept: "application/json", "X-CSRF-Token": csrfField(form) } })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (data) {
          btn.classList.toggle("is-on", data.chosen);
          btn.setAttribute("aria-pressed", data.chosen ? "true" : "false");
          btn.title = data.label;
          var span = btn.querySelector("span");
          if (span) span.textContent = data.label;
          var card = form.closest(".talent-card");
          if (card) card.classList.toggle("is-chosen", data.chosen);
          document.querySelectorAll("[data-shortlist-count]").forEach(function (el) { el.textContent = data.count; });
        })
        .catch(function () { form.submit(); })
        .finally(function () { btn.disabled = false; });
    });
  });

  /* Shortlist page: sorting by match follows the job chosen for the invitation. */
  var sortJob = document.querySelector("select[data-sort-job]");
  if (sortJob) {
    sortJob.addEventListener("change", function () {
      var url = new URL(window.location.href);
      url.searchParams.set("job", sortJob.value);
      window.location.href = url.toString();
    });
  }

  /* "How Workify works": picture story that plays like a short film, read aloud when the phone has a voice. */
  document.querySelectorAll("[data-explainer]").forEach(function (box) {
    var scenes = Array.prototype.slice.call(box.querySelectorAll("[data-scene]"));
    if (!scenes.length) return;
    var controls = box.querySelector("[data-ex-controls]");
    var progress = box.querySelector("[data-ex-progress]");
    var playBtn = box.querySelector("[data-ex-play]");
    var voiceWrap = box.querySelector("[data-ex-voice-wrap]");
    var voiceBox = box.querySelector("[data-ex-voice]");
    var bars = progress ? Array.prototype.slice.call(progress.querySelectorAll("button")) : [];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0, playing = false, timer = null, token = 0;
    box.classList.add("is-player");
    if (controls) controls.hidden = false;
    if (progress) progress.hidden = false;
    var syncVoice = function () { if (voiceWrap) voiceWrap.hidden = !(window.WorkifySpeak && window.WorkifySpeak.ready()); };
    syncVoice();
    document.addEventListener("workify:voices", syncVoice);
    var setLabel = function (key) {
      var span = playBtn.querySelector("span");
      if (span) span.textContent = playBtn.getAttribute(key);
      playBtn.classList.toggle("is-playing", key === "data-label-pause");
    };
    var duration = function (scene) {
      var text = (scene.querySelector("[data-say]") || scene).textContent || "";
      return Math.max(5200, Math.min(14000, text.length * 62));
    };
    var show = function (i) {
      index = (i + scenes.length) % scenes.length;
      scenes.forEach(function (s, n) {
        s.classList.toggle("is-active", n === index);
        s.setAttribute("aria-hidden", n === index ? "false" : "true");
      });
      bars.forEach(function (b, n) {
        b.classList.toggle("is-done", n < index);
        b.classList.toggle("is-active", n === index);
        b.setAttribute("aria-current", n === index ? "step" : "false");
        var fill = b.querySelector(".ex-fill");
        if (fill) { fill.style.animation = "none"; void fill.offsetWidth; fill.style.animation = ""; fill.style.animationDuration = ""; }
      });
    };
    var finished = false;
    var stop = function () {
      playing = false;
      token += 1;
      window.clearTimeout(timer);
      if (window.WorkifySpeak) window.WorkifySpeak.stop();
      box.classList.remove("is-playing");
      setLabel(finished ? "data-label-again" : "data-label-play");
    };
    var advance = function (mine) {
      if (mine !== token || !playing) return;
      if (index >= scenes.length - 1) { finished = true; stop(); return; }
      show(index + 1);
      run();
    };
    var run = function () {
      var mine = ++token;
      var scene = scenes[index];
      var ms = duration(scene);
      var bar = bars[index] && bars[index].querySelector(".ex-fill");
      var useVoice = voiceBox && voiceBox.checked && window.WorkifySpeak && window.WorkifySpeak.ready();
      if (bar) bar.style.animationDuration = (useVoice ? ms * 1.15 : ms) + "ms";
      if (useVoice) {
        var title = scene.querySelector(".ex-title");
        var text = (title ? title.textContent + ". " : "") + (scene.querySelector("[data-say]") || scene).textContent;
        var moved = false;
        var next = function () { if (moved) return; moved = true; window.setTimeout(function () { advance(mine); }, 700); };
        window.WorkifySpeak.say(text, null, next);
        timer = window.setTimeout(next, ms * 2.6);
      } else {
        timer = window.setTimeout(function () { advance(mine); }, ms);
      }
    };
    var start = function () {
      if (finished) { finished = false; show(0); }
      playing = true;
      box.classList.add("is-playing");
      setLabel("data-label-pause");
      run();
    };
    playBtn.addEventListener("click", function () { if (playing) stop(); else start(); });
    var jump = function (i) {
      var was = playing;
      finished = false;
      stop();
      show(i);
      if (was) start();
    };
    var prev = box.querySelector("[data-ex-prev]");
    var nextBtn = box.querySelector("[data-ex-next]");
    if (prev) prev.addEventListener("click", function () { jump(index - (rtl ? -1 : 1)); });
    if (nextBtn) nextBtn.addEventListener("click", function () { jump(index + (rtl ? -1 : 1)); });
    bars.forEach(function (b, n) { b.addEventListener("click", function () { jump(n); }); });
    box.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") jump(index + (rtl ? -1 : 1));
      else if (event.key === "ArrowLeft") jump(index - (rtl ? -1 : 1));
    });
    var swipeX = null;
    box.addEventListener("touchstart", function (e) { swipeX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (swipeX === null) return;
      var dx = e.changedTouches[0].clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) > 50) jump(index + ((dx < 0) !== rtl ? 1 : -1));
    });
    if (voiceBox) voiceBox.addEventListener("change", function () { if (!voiceBox.checked && window.WorkifySpeak) window.WorkifySpeak.stop(); });
    show(0);
    if (reduce) box.classList.add("is-still");
    window.addEventListener("pagehide", stop);
  });

  /* Help bubble (bottom corner): answers from the FAQ, or from Claude when AI is on. */
  var assist = document.querySelector("[data-assistant]");
  if (assist) {
    var openBtn = assist.querySelector("[data-assist-open]");
    var panel = assist.querySelector(".assist-panel");
    var logBox = assist.querySelector("[data-assist-log]");
    var aForm = assist.querySelector("[data-assist-form]");
    var input = assist.querySelector("[data-assist-input]");
    var chips = assist.querySelector("[data-assist-chips]");
    var micBtn = assist.querySelector("[data-assist-mic]");
    var useAi = assist.getAttribute("data-ai") === "1";
    var history = [];
    var faq = null;
    var loadFaq = function () {
      if (faq) return Promise.resolve(faq);
      return fetch(assist.getAttribute("data-faq-url"), { credentials: "same-origin", headers: { Accept: "application/json" } })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (data) { faq = data; return data; });
    };
    var fold = function (text) {
      var plain = String(text || "").toLowerCase();
      try { plain = plain.normalize("NFKD").replace(/[̀-֑ͯ-ׇً-ٰٟऀ-ःऺ-ॏঁ-ঃ়-্]/g, ""); } catch (e) {}
      var words;
      try { words = plain.match(/[\p{L}\p{N}_]+/gu) || []; } catch (e) { words = plain.split(/[\s.,!?;:()"'«»“”„\-\/]+/); }
      return words.filter(function (w) { return w.length > 1; });
    };
    var close = function (a, b) { return a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4)); };
    var matchFaq = function (question, entries) {
      var words = fold(question);
      if (!words.length) return null;
      var best = null, bestScore = 0;
      entries.forEach(function (entry) {
        var strong = fold(entry.q + " " + entry.k), weak = fold(entry.a), score = 0;
        words.forEach(function (w) {
          if (strong.some(function (s) { return close(w, s); })) score += 2;
          else if (weak.some(function (s) { return close(w, s); })) score += 1;
        });
        score /= Math.max(1, Math.sqrt(words.length));
        if (score > bestScore) { best = entry; bestScore = score; }
      });
      return bestScore >= 1.4 ? best : null;
    };
    var scroll = function () { logBox.scrollTop = logBox.scrollHeight; };
    var addMsg = function (who, text, link, linkLabel, note) {
      var box = document.createElement("div");
      box.className = "assist-msg " + who;
      var p = document.createElement("p");
      p.textContent = text;
      box.appendChild(p);
      if (link) {
        var a = document.createElement("a");
        a.href = link;
        a.className = "assist-link";
        a.textContent = linkLabel || link;
        box.appendChild(a);
      }
      if (note) {
        var n = document.createElement("small");
        n.className = "assist-note";
        n.textContent = note;
        box.appendChild(n);
      }
      if (who === "bot" && window.WorkifySpeak && window.WorkifySpeak.ready()) {
        var sb = document.createElement("button");
        sb.type = "button";
        sb.className = "assist-say";
        sb.setAttribute("aria-label", assist.getAttribute("data-label-read"));
        sb.innerHTML = assist.querySelector("[data-assist-volume]").innerHTML;
        sb.addEventListener("click", function () { window.WorkifySpeak.say(text, null); });
        box.appendChild(sb);
      }
      logBox.appendChild(box);
      scroll();
      return box;
    };
    var answerFromFaq = function (question, note) {
      return loadFaq().then(function (data) {
        var hit = matchFaq(question, data.entries || []);
        if (hit) addMsg("bot", hit.a, hit.link, hit.link_label, note);
        else addMsg("bot", data.no_match, data.faq_link, data.faq_label, note);
      }).catch(function () { addMsg("bot", assist.getAttribute("data-error")); });
    };
    var ask = function (question) {
      question = (question || "").trim();
      if (!question) return;
      if (chips) chips.hidden = true;
      addMsg("me", question);
      var wait = addMsg("bot typing", assist.getAttribute("data-label-wait"));
      var done = function () { if (wait.parentNode) wait.parentNode.removeChild(wait); };
      if (!useAi) { answerFromFaq(question).then(done, done); return; }
      var payload = { message: question, history: history.slice(-8) };
      var jobId = parseInt(assist.getAttribute("data-job-id"), 10);
      if (jobId) payload.job_id = jobId;
      fetch(assist.getAttribute("data-ask-url"), {
        method: "POST", credentials: "same-origin", body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-Token": assist.getAttribute("data-csrf") } })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (data) {
          done();
          addMsg("bot", data.answer, data.link, data.link_label, data.note || (data.source === "ai" ? assist.getAttribute("data-ai-note") : null));
          history.push({ role: "user", text: question }, { role: "assistant", text: data.answer });
        })
        .catch(function () { done(); answerFromFaq(question); });
    };
    var setOpen = function (open) {
      panel.hidden = !open;
      assist.classList.toggle("is-open", open);
      openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { window.setTimeout(function () { input.focus(); }, 30); loadFaq().catch(function () {}); }
    };
    openBtn.addEventListener("click", function () { setOpen(panel.hidden); });
    assist.querySelectorAll("[data-assist-close]").forEach(function (b) { b.addEventListener("click", function () { setOpen(false); openBtn.focus(); }); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !panel.hidden) { setOpen(false); openBtn.focus(); } });
    aForm.addEventListener("submit", function (event) { event.preventDefault(); var v = input.value; input.value = ""; ask(v); });
    assist.querySelectorAll("[data-assist-ask]").forEach(function (b) { b.addEventListener("click", function () { ask(b.textContent); }); });
    var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (micBtn && Recognition) {
      micBtn.hidden = false;
      var rec = null;
      micBtn.addEventListener("click", function () {
        if (rec) { rec.stop(); return; }
        rec = new Recognition();
        rec.lang = assist.getAttribute("data-speech-lang") || lang;
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        micBtn.classList.add("is-listening");
        rec.onresult = function (e) { var said = e.results[0][0].transcript; input.value = said; ask(said); input.value = ""; };
        rec.onend = function () { micBtn.classList.remove("is-listening"); rec = null; };
        rec.onerror = function () { micBtn.classList.remove("is-listening"); rec = null; };
        try { rec.start(); } catch (e) { micBtn.classList.remove("is-listening"); rec = null; }
      });
    }
  }

  localizeTimes();
})();
