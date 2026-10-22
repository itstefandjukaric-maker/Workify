/* Workify: public GitHub Pages navigation; no external sign-in is required. */
(function () {
  'use strict';
  var supported = ['bs','en','ar','bn','fil','fr','ka','de','hi','ky','ne','ru','sw','tg','ur','uz'];
  var params = new URLSearchParams(location.search);
  var pageLanguage = (document.documentElement.lang || 'bs').split('-')[0];
  var savedLanguage;
  try { savedLanguage=localStorage.getItem('workify-site-language'); } catch (_) {}
  var language = supported.indexOf(params.get('lang')) !== -1 ? params.get('lang') : (supported.indexOf(savedLanguage)!==-1?savedLanguage:pageLanguage);
  if (supported.indexOf(language) === -1) language = 'bs';
  var bs = language === 'bs';
  var publicPages = ["404.html","a-account.html","a-app-1-cv.html","a-app-1.html","a-app-19-cv.html","a-app-19.html","a-app-4-cv.html","a-app-4.html","a-app-5-cv.html","a-app-5.html","a-app-6-cv.html","a-app-6.html","a-app-7-cv.html","a-app-7.html","a-app-8-cv.html","a-app-8.html","a-billing.html","a-candidates-board.html","a-candidates.html","a-dashboard.html","a-inbox.html","a-interview-1.html","a-interview-19.html","a-interview-4.html","a-interview-5.html","a-interview-6.html","a-interview-7.html","a-interview-8.html","a-invoice-1.html","a-invoice-2.html","a-job-1-media.html","a-job-1-poster.html","a-job-1.html","a-job-2-media.html","a-job-2-poster.html","a-job-2.html","a-job-23-media.html","a-job-23.html","a-job-3-media.html","a-job-3-poster.html","a-job-3.html","a-job-4-media.html","a-job-4-poster.html","a-job-4.html","a-job-5-media.html","a-job-5-poster.html","a-job-5.html","a-job-new.html","a-jobs-import.html","a-jobs.html","a-notifications.html","a-profile.html","a-reports.html","a-shortlist.html","a-talent.html","a-team.html","agency-1.html","agency-2.html","agency-3.html","agency-4.html","agency-5.html","agency-6.html","agency-7.html","agency-8.html","capture-apply-1.html","capture-mobile.html","dest-ae.html","dest-bh.html","dest-de.html","dest-es.html","dest-hr.html","dest-kw.html","dest-me.html","dest-nl.html","dest-om.html","dest-pl.html","dest-qa.html","dest-rs.html","dest-sa.html","destinations.html","e-account.html","e-app-10-cv.html","e-app-10.html","e-app-21-cv.html","e-app-21.html","e-app-9-cv.html","e-app-9.html","e-billing.html","e-candidates-board.html","e-candidates.html","e-dashboard.html","e-inbox.html","e-interview-10.html","e-interview-21.html","e-interview-9.html","e-job-6-media.html","e-job-6-poster.html","e-job-6.html","e-job-7-media.html","e-job-7-poster.html","e-job-7.html","e-job-8-media.html","e-job-8-poster.html","e-job-8.html","e-job-new.html","e-jobs-import.html","e-jobs.html","e-notifications.html","e-profile.html","e-reports.html","e-shortlist.html","e-talent.html","e-team.html","employers.html","faq.html","for-agencies.html","for-employers.html","for-workers.html","forgot.html","guide-before-you-fly.html","guide-contract-checklist.html","guide-fake-job-offers.html","guide-rights-in-the-gulf.html","guide-working-in-europe.html","guides.html","how-it-works.html","imprint.html","index.html","job-1.html","job-10.html","job-11.html","job-12.html","job-13.html","job-14.html","job-15.html","job-16.html","job-17.html","job-18.html","job-19.html","job-2.html","job-20.html","job-21.html","job-22.html","job-3.html","job-4.html","job-5.html","job-6.html","job-7.html","job-8.html","job-9.html","jobs-map-ae.html","jobs-map-almeria.html","jobs-map-balkans.html","jobs-map-budva.html","jobs-map-dammam.html","jobs-map-de.html","jobs-map-es.html","jobs-map-gulf.html","jobs-map-hr.html","jobs-map-kragujevac.html","jobs-map-kuwait-city.html","jobs-map-kw.html","jobs-map-muscat.html","jobs-map-om.html","jobs-map-pl.html","jobs-map-riyadh.html","jobs-map-sa.html","jobs-map-z-balkans.html","jobs-map-z-eu.html","jobs-map-z-gulf.html","jobs-map.html","jobs-p2.html","jobs.html","login-phone.html","login.html","offline.html","pricing.html","privacy.html","prize.html","register-agency.html","register-employer.html","register-worker.html","register.html","stories.html","terms-business.html","terms.html","w-account.html","w-alerts.html","w-app-1.html","w-app-2.html","w-app-3.html","w-applications.html","w-apply-16.html","w-cv.html","w-documents.html","w-extras.html","w-home.html","w-how-it-works.html","w-inbox.html","w-interview-1.html","w-interview-2.html","w-interview-prep.html","w-jobs-map-ae.html","w-jobs-map-almeria.html","w-jobs-map-balkans.html","w-jobs-map-budva.html","w-jobs-map-dammam.html","w-jobs-map-de.html","w-jobs-map-es.html","w-jobs-map-gulf.html","w-jobs-map-hr.html","w-jobs-map-kragujevac.html","w-jobs-map-kuwait-city.html","w-jobs-map-kw.html","w-jobs-map-muscat.html","w-jobs-map-om.html","w-jobs-map-pl.html","w-jobs-map-riyadh.html","w-jobs-map-sa.html","w-jobs-map-z-balkans.html","w-jobs-map-z-eu.html","w-jobs-map-z-gulf.html","w-jobs-map.html","w-jobs-p2.html","w-jobs.html","w-notifications.html","w-prize.html","w-profile.html","w-saved.html","w-waitlist.html","waitlist.html"];
  function pageUrl(url,locale) {
    var next=new URL(url,document.baseURI);
    if(next.origin!==location.origin)return null;
    var base=next.pathname.split('/').pop().replace(/^en-/,'')||'index.html';
    if(publicPages.indexOf(base)===-1)return null;
    next.pathname=next.pathname.slice(0,next.pathname.lastIndexOf('/')+1)+(locale==='bs'||['404.html','capture-apply-1.html','capture-mobile.html'].indexOf(base)!==-1?'':'en-')+base;
    next.searchParams.set('lang',locale);
    if(/^register-(agency|employer)\.html$/.test(base)){
      var chosen=Array.from(document.querySelectorAll('input[name=kind]')).find(function(input){return input.checked;});
      if(chosen&&new URL(url,document.baseURI).pathname===location.pathname)next.searchParams.set('kind',chosen.value);
    }
    return next.href;
  }
  var kind=params.get('kind');
  if(kind==='agency'||kind==='employer')document.querySelectorAll('input[name=kind]').forEach(function(input){input.checked=input.value===kind;});
  var canonical=pageUrl(location.href,language);
  if(canonical&&new URL(canonical).pathname!==location.pathname&&!(location.pathname.endsWith('/')&&language==='bs')){location.replace(canonical);return;}
  try { localStorage.setItem('workify-site-language',language); } catch (_) {}
  document.documentElement.lang=language;document.documentElement.dir=(language==='ar'||language==='ur')?'rtl':'ltr';
  document.body.setAttribute('data-locale',language);
  document.querySelectorAll('[data-speech-lang]').forEach(function(el){el.setAttribute('data-speech-lang',language);});
  if(language!=='bs'&&language!=='en')document.querySelectorAll('[data-assistant]').forEach(function(el){el.setAttribute('data-faq-url','static/locales/faq-'+language+'.json?v=public-languages-20261017');});
  document.querySelectorAll('.lang-code').forEach(function(el){el.textContent=language==='bs'?'BHS':language.toUpperCase();});
  function targetFor(link) {
    var raw = link.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return null;
    var url;
    try { url = new URL(raw, document.baseURI); } catch (_) { return null; }
    if (url.origin !== location.origin) return null;
    if (link.closest('.lang-menu,.footer-langs') && supported.indexOf(link.getAttribute('lang'))!==-1) {
      var chosen=link.getAttribute('lang');
      link.removeAttribute('data-pv-lang');
      link.setAttribute('data-workify-language',chosen);
      if(chosen===language)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
      return pageUrl(location.href,chosen);
    }
    return pageUrl(url.href,language);
  }
  function connect(link) {
    var target = targetFor(link);
    if (!target) return;
    link.href = target;
    link.removeAttribute('data-pv-lang');
    link.removeAttribute('data-pv-off');
    link.removeAttribute('data-back');
    link.setAttribute('data-workify-local', '');
  }
  document.querySelectorAll('a[href]').forEach(connect);
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    connect(link);
    if (link.hasAttribute('data-workify-language')) {
      try { localStorage.setItem('workify-site-language',link.getAttribute('data-workify-language')); } catch (_) {}
      event.stopImmediatePropagation();
    } else if (link.hasAttribute('data-workify-local')) event.stopImmediatePropagation();
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
  function search(form) {
    var url=new URL(pageUrl('jobs.html',language)),source=new FormData(form);
    ['q','country','category','housing','region'].forEach(function(key){var value=source.get(key);if(typeof value==='string'&&value)url.searchParams.set(key,value.slice(0,200));});
    location.href=url.href;
  }
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
    else unavailable();
  }, true);
  if (window.HTMLFormElement) HTMLFormElement.prototype.submit=function(){if(this.hasAttribute('data-pv-search'))search(this);else unavailable();};
  // Unimplemented public forms must never POST personal data to GitHub Pages.
  if (window.fetch) {
    var realFetch=window.fetch;
    window.fetch=function(resource,init){var url=typeof resource==='string'?resource:(resource&&resource.url)||'';
      if(url.charAt(0)==='/'||(init&&init.method&&init.method.toUpperCase()!=='GET'))return Promise.reject(new Error('This public preview does not send form data'));
      return realFetch.apply(this,arguments);
    };
  }
  document.addEventListener('click',function(event){var link=event.target.closest&&event.target.closest('a[data-pv-off]');if(link){event.preventDefault();event.stopImmediatePropagation();unavailable();}},true);
  // Keep direct login, registration and dashboard bookmarks on GitHub Pages.
  // A role is a visual form choice, never an authenticated permission.
  document.addEventListener('change',function(event){
    if(event.target.matches&&event.target.matches('input[name=kind]'))document.querySelectorAll('.lang-menu a[lang],.footer-langs a[lang]').forEach(connect);
  });
  if(/^(?:en-)?(?:login(?:-phone)?|forgot|register-(?:worker|employer|agency))\.html$/.test(location.pathname.split('/').pop())){
    var notices={"bs":"Prijava i registracija još nisu omogućene. Ne unosite lične podatke.","en":"Login and registration are not enabled yet. Do not enter personal information.","ar":"تسجيل الدخول وإنشاء الحساب غير متاحين بعد. لا تدخل معلومات شخصية.","bn":"লগইন ও নিবন্ধন এখনও চালু হয়নি। ব্যক্তিগত তথ্য লিখবেন না।","fil":"Hindi pa available ang pag-login at pagpaparehistro. Huwag maglagay ng personal na impormasyon.","fr":"La connexion et l’inscription ne sont pas encore disponibles. Ne saisissez pas de données personnelles.","ka":"შესვლა და რეგისტრაცია ჯერ არ არის ხელმისაწვდომი. არ შეიყვანოთ პირადი ინფორმაცია.","de":"Anmeldung und Registrierung sind noch nicht verfügbar. Bitte keine persönlichen Daten eingeben.","hi":"लॉगिन और पंजीकरण अभी उपलब्ध नहीं हैं। व्यक्तिगत जानकारी दर्ज न करें।","ky":"Кирүү жана катталуу азырынча жеткиликтүү эмес. Жеке маалыматтарды киргизбеңиз.","ne":"लगइन र दर्ता अझै उपलब्ध छैनन्। व्यक्तिगत जानकारी प्रविष्ट नगर्नुहोस्।","ru":"Вход и регистрация пока недоступны. Не вводите личные данные.","sw":"Kuingia na kujisajili bado hakupatikani. Usiingize taarifa binafsi.","tg":"Воридшавӣ ва бақайдгирӣ ҳоло дастрас нестанд. Маълумоти шахсиро ворид накунед.","ur":"لاگ ان اور رجسٹریشن ابھی دستیاب نہیں ہیں۔ ذاتی معلومات درج نہ کریں۔","uz":"Kirish va roʻyxatdan oʻtish hali yoqilmagan. Shaxsiy maʼlumotlarni kiritmang."};
    var form=document.querySelector('main form');
    if(form){var notice=document.createElement('p');notice.className='pv-auth-notice';notice.setAttribute('role','status');notice.textContent=notices[language];form.before(notice);}
  }
})();
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load',function(){navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{updateViaCache:'none'}).catch(function(){});});
}
