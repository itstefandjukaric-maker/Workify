/* Workify: connect the public website to the authenticated application. */
(function () {
  'use strict';
  var app = 'https://workify-platform.itstefandjukaric.chatgpt.site/';
  var supported = ['bs','en','ar','bn','fil','fr','ka','de','hi','ky','ne','ru','sw','tg','ur','uz'];
  var params = new URLSearchParams(location.search);
  var pageLanguage = (document.documentElement.lang || 'bs').split('-')[0];
  var savedLanguage;
  try { savedLanguage=localStorage.getItem('workify-site-language'); } catch (_) {}
  var language = supported.indexOf(params.get('lang')) !== -1 ? params.get('lang') : (supported.indexOf(savedLanguage)!==-1?savedLanguage:pageLanguage);
  if (supported.indexOf(language) === -1) language = 'bs';
  var bs = language === 'bs';
  var publicPages = ["index.html","agency-1.html","agency-2.html","agency-3.html","agency-4.html","agency-5.html","agency-6.html","agency-7.html","agency-8.html","dest-ae.html","dest-bh.html","dest-de.html","dest-es.html","dest-hr.html","dest-kw.html","dest-me.html","dest-nl.html","dest-om.html","dest-pl.html","dest-qa.html","dest-rs.html","dest-sa.html","destinations.html","employers.html","faq.html","for-agencies.html","for-employers.html","for-workers.html","guide-before-you-fly.html","guide-contract-checklist.html","guide-fake-job-offers.html","guide-rights-in-the-gulf.html","guide-working-in-europe.html","guides.html","how-it-works.html","imprint.html","offline.html","pricing.html","privacy.html","prize.html","register.html","stories.html","terms-business.html","terms.html","waitlist.html"];
  function pageUrl(url,locale) {
    var next=new URL(url,document.baseURI),base=next.pathname.split('/').pop().replace(/^en-/,'')||'index.html';
    if(publicPages.indexOf(base)===-1)return null;
    next.pathname=next.pathname.slice(0,next.pathname.lastIndexOf('/')+1)+(locale==='bs'?'':'en-')+base;
    next.searchParams.set('lang',locale);return next.href;
  }
  var canonical=pageUrl(location.href,language);
  if(canonical&&new URL(canonical).pathname!==location.pathname&&!(location.pathname.endsWith('/')&&language==='bs')){location.replace(canonical);return;}
  try { localStorage.setItem('workify-site-language',language); } catch (_) {}
  document.documentElement.lang=language;document.documentElement.dir=(language==='ar'||language==='ur')?'rtl':'ltr';
  document.body.setAttribute('data-locale',language);
  document.querySelectorAll('[data-speech-lang]').forEach(function(el){el.setAttribute('data-speech-lang',language);});
  if(language!=='bs'&&language!=='en')document.querySelectorAll('[data-assistant]').forEach(function(el){el.setAttribute('data-faq-url','static/locales/faq-'+language+'.json?v=public-languages-20261017');});
  document.querySelectorAll('.lang-code').forEach(function(el){el.textContent=language==='bs'?'BHS':language.toUpperCase();});
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
    if (link.closest('.lang-menu,.footer-langs') && supported.indexOf(link.getAttribute('lang'))!==-1) {
      var chosen=link.getAttribute('lang');
      link.removeAttribute('data-pv-lang');
      link.setAttribute('data-workify-language',chosen);
      if(chosen===language)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
      return pageUrl(location.href,chosen)||appUrl(section||'jobs',url.searchParams,chosen);
    }
    return section ? appUrl(section, url.searchParams, language) : pageUrl(url.href,language);
  }
  function connect(link) {
    var target = targetFor(link);
    if (!target) return;
    link.href = target;
    link.removeAttribute('data-pv-lang');
    link.removeAttribute('data-pv-off');
    link.removeAttribute('data-back');
    if(new URL(target).origin===new URL(app).origin)link.setAttribute('data-workify-app', '');
  }
  document.querySelectorAll('a[href]').forEach(connect);
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    connect(link);
    if (link.hasAttribute('data-workify-language')) {
      try { localStorage.setItem('workify-site-language',link.getAttribute('data-workify-language')); } catch (_) {}
      event.stopImmediatePropagation();
    } else if (link.hasAttribute('data-workify-app')) event.stopImmediatePropagation();
  }, true);
  // Translate only site-authored content; form values and user messages are untouched.
  var dictionary=Object.create(null),templates=[],translationObserver;
  function normalized(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function translated(value){
    var key=normalized(value),out=dictionary[key];
    if(out!==undefined)return String(value).replace(/\S[\s\S]*\S|\S/,function(){return out;});
    for(var i=0;i<templates.length;i++){
      var hit=key.match(templates[i].pattern);if(!hit)continue;
      var result=templates[i].value;templates[i].slots.forEach(function(slot,n){result=result.split('{'+slot+'}').join(hit[n+1]);});return result;
    }
    return value;
  }
  var textAttributes=['placeholder','title','alt','aria-label','data-label-read','data-label-wait','data-error','data-empty','data-snapshot','data-open','data-remove','data-saved','data-failure'];
  var excluded='script,style,svg,.lang-menu,.footer-langs,.assist-msg.me,[contenteditable],textarea';
  function translateJson(value){
    if(typeof value==='string')return translated(value);
    if(Array.isArray(value))return value.map(translateJson);
    if(value&&typeof value==='object'){var out={};Object.keys(value).forEach(function(k){out[k]=['id','agency','link','faq_link'].indexOf(k)!==-1?value[k]:translateJson(value[k]);});return out;}
    return value;
  }
  function translateNode(node){
    if(node.nodeType===3){if(node.parentElement&&!node.parentElement.closest(excluded)){var text=translated(node.nodeValue);if(text!==node.nodeValue)node.nodeValue=text;}return;}
    if(node.nodeType!==1||node.closest(excluded))return;
    textAttributes.forEach(function(name){if(node.hasAttribute(name)){var value=node.getAttribute(name),next=translated(value);if(value!==next)node.setAttribute(name,next);}});
    if(node.tagName==='META'&&(node.name==='description'||['og:title','og:description'].indexOf(node.getAttribute('property'))!==-1))node.setAttribute('content',translated(node.getAttribute('content')));
    ['data-compare','data-compare-ui'].forEach(function(name){if(node.hasAttribute(name)){try{node.setAttribute(name,JSON.stringify(translateJson(JSON.parse(node.getAttribute(name)))));}catch(_){}}});
    if(node.tagName==='A')connect(node);
    Array.from(node.childNodes).forEach(translateNode);
  }
  function languageNotice(message){
    var notice=document.getElementById('workify-language-notice');
    if(!notice){notice=document.createElement('div');notice.id='workify-language-notice';notice.className='pv-toast';notice.setAttribute('role','status');document.body.appendChild(notice);}
    notice.textContent=message;notice.hidden=false;return notice;
  }
  function loadLanguage(){
    if(language==='bs'||language==='en')return;
    var nativeNames={"bs":"BHS","en":"English","ar":"العربية","ur":"اردو","bn":"বাংলা","fil":"Filipino","fr":"Français","ka":"ქართული","de":"Deutsch","hi":"हिन्दी","ky":"Кыргызча","ne":"नेपाली","ru":"Русский","sw":"Kiswahili","tg":"Тоҷикӣ","uz":"Oʻzbekcha"},retryLabels={"bs":"Pokušaj ponovo","en":"Try again","ar":"حاول مرة أخرى","ur":"دوبارہ کوشش کریں","bn":"আবার চেষ্টা করুন","fil":"Subukan muli","fr":"Réessayer","ka":"ხელახლა ცდა","de":"Erneut versuchen","hi":"दोबारा कोशिश करें","ky":"Кайра аракет кылуу","ne":"फेरि प्रयास गर्नुहोस्","ru":"Попробовать ещё раз","sw":"Jaribu tena","tg":"Кӯшиши дубора","uz":"Qayta urinish"};
    var notice=languageNotice(nativeNames[language]+'…');
    var catalogPromise=Promise.all(['source',language].map(function(code){return fetch('static/locales/site-'+code+'.json?v=public-languages-20261017').then(function(r){if(!r.ok)throw new Error('Language unavailable');return r.json();});}));
    catalogPromise.then(function(values){
      var source=values[0],catalog=values[1];
      Object.keys(source).forEach(function(key){if(typeof catalog[key]!=='string'||!catalog[key].trim())throw new Error('Incomplete language');dictionary[normalized(source[key])]=catalog[key];});
      Object.keys(dictionary).forEach(function(key){
        var slots=[],parts=key.split(/(\{\w+\})/),pattern=parts.map(function(part){if(/^\{\w+\}$/.test(part)){slots.push(part.slice(1,-1));return '(.+?)';}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');
        if(slots.length)templates.push({pattern:new RegExp('^'+pattern+'$'),slots:slots,value:dictionary[key]});
      });
      document.querySelectorAll('[data-assistant]').forEach(function(el){el.setAttribute('data-faq-url','static/locales/faq-'+language+'.json?v=public-languages-20261017');});
      translateNode(document.documentElement);
      notice.hidden=true;document.documentElement.setAttribute('data-workify-language-ready',language);
      translationObserver=new MutationObserver(function(records){
        translationObserver.disconnect();
        records.forEach(function(record){if(record.type==='characterData')translateNode(record.target);else record.addedNodes.forEach(translateNode);});
        translationObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
      });
      translationObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
    }).catch(function(){
      notice.textContent=nativeNames[language]+' · '+retryLabels[language]+' ';
      var retry=document.createElement('button');retry.type='button';retry.textContent='↻';retry.setAttribute('aria-label',retryLabels[language]);retry.onclick=function(){notice.remove();loadLanguage();};notice.appendChild(retry);
    });
  }
  loadLanguage();
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
