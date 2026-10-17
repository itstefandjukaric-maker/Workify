/* Workify: connect the public website to the authenticated application. */
(function () {
  'use strict';
  var app = 'https://workify-platform.itstefandjukaric.chatgpt.site/';
  var supported = ['bs','en','ar','bn','fil','fr','ka','de','hi','ky','ne','ru','sw','tg','ur','uz'];
  var params = new URLSearchParams(location.search);
  var pageLanguage = (document.documentElement.lang || 'bs').split('-')[0];
  var language = supported.indexOf(params.get('lang')) !== -1 ? params.get('lang') : pageLanguage;
  if (supported.indexOf(language) === -1) language = 'bs';
  var bs = pageLanguage === 'bs';
  function sectionFor(path) {
    var name = path.split('/').pop().replace(/^en-/, '');
    if (/^(login(?:-phone)?|forgot)\.html$/.test(name)) return 'jobs';
    if (/^register-worker\.html$/.test(name)) return 'profile';
    if (/^register-(employer|agency)\.html$/.test(name)) return 'company';
    if (/^(jobs(?:-[\w-]+)?|job-\d+)\.html$/.test(name)) return 'jobs';
    if (/^w-/.test(name)) {
      if (/^w-(profile|account|cv|documents|waitlist)\.html$/.test(name)) return 'profile';
      if (/^w-saved\.html$/.test(name)) return 'saved';
      if (/^w-(applications|app-\d+|interview-\d+)\.html$/.test(name)) return 'applications';
      if (/^w-inbox\.html$/.test(name)) return 'messages';
      if (/^w-(notifications|alerts)\.html$/.test(name)) return 'notifications';
      if (/^w-(how-it-works|interview-prep|extras|prize)\.html$/.test(name)) return 'help';
      return 'jobs';
    }
    if (/^[ae]-/.test(name)) {
      if (/-(inbox)\.html$/.test(name)) return 'messages';
      if (/-notifications\.html$/.test(name)) return 'notifications';
      return 'company';
    }
    return null;
  }
  function appUrl(section, source, lang) {
    var url = new URL(app);
    url.searchParams.set('section', section || 'jobs');
    url.searchParams.set('lang', supported.indexOf(lang) !== -1 ? lang : language);
    if (section === 'jobs' && source) {
      ['q','country','category','housing','region'].forEach(function (key) {
        var value = source.get(key);
        if (typeof value === 'string' && value) url.searchParams.set(key, value.slice(0,200));
      });
    }
    return url.href;
  }
  function targetFor(link) {
    var raw = link.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return null;
    var url;
    try { url = new URL(raw, document.baseURI); } catch (_) { return null; }
    if (url.origin !== location.origin) return null;
    var section = sectionFor(url.pathname);
    if (link.hasAttribute('data-pv-lang')) return appUrl(section || 'jobs', url.searchParams, link.getAttribute('lang'));
    return section ? appUrl(section, url.searchParams, link.getAttribute('lang') || language) : null;
  }
  function connect(link) {
    var target = targetFor(link);
    if (!target) return;
    link.href = target;
    link.removeAttribute('data-pv-lang');
    link.removeAttribute('data-pv-off');
    link.removeAttribute('data-back');
    link.setAttribute('data-workify-app', '');
  }
  document.querySelectorAll('a[href]').forEach(connect);
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    connect(link);
    if (link.hasAttribute('data-workify-app')) event.stopImmediatePropagation();
  }, true);
  function search(form) { location.href = appUrl('jobs', new URLSearchParams(new FormData(form)), language); }
  var toastEl, timer;
  function unavailable() {
    if (!toastEl) { toastEl=document.createElement('div');toastEl.className='pv-toast';toastEl.setAttribute('role','status');document.body.appendChild(toastEl); }
    toastEl.textContent=bs?'Ova funkcija trenutno nije dostupna. Podaci nisu poslani.':'This feature is currently unavailable. No data was sent.';
    toastEl.hidden=false;clearTimeout(timer);timer=setTimeout(function(){toastEl.hidden=true;},3800);
  }
  document.addEventListener('submit', function (event) {
    var form = event.target;
    // The on-page help assistant is local and keeps its existing interaction.
    if (form.closest && form.closest('[data-assistant]')) return;
    event.preventDefault();event.stopImmediatePropagation();
    if (form.hasAttribute('data-pv-search')) search(form);
    else { var section=sectionFor(location.pathname); if(section)location.href=appUrl(section,null,language);else unavailable(); }
  }, true);
  if (window.HTMLFormElement) HTMLFormElement.prototype.submit=function(){if(this.hasAttribute('data-pv-search'))search(this);else unavailable();};
  // Unimplemented public forms must never POST personal data to GitHub Pages.
  if (window.fetch) {
    var realFetch=window.fetch;
    window.fetch=function(resource,init){var url=typeof resource==='string'?resource:(resource&&resource.url)||'';
      if(url.charAt(0)==='/'||(init&&init.method&&init.method.toUpperCase()!=='GET'))return Promise.reject(new Error('Use the Workify application'));
      return realFetch.apply(this,arguments);
    };
  }
  document.addEventListener('click',function(event){var link=event.target.closest&&event.target.closest('a[data-pv-off]');if(link){event.preventDefault();event.stopImmediatePropagation();unavailable();}},true);
  // Existing bookmarks open the matching live screen; static example IDs are never reused.
  var current=sectionFor(location.pathname);
  if(current)location.replace(appUrl(current,params,language));
})();
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load',function(){navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{updateViaCache:'none'}).catch(function(){});});
}
