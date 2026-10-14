/* Progressive enhancements; no personal documents or authenticated pages are cached. */
(function () {
  'use strict';
  var store = {get:function(k){try{return localStorage.getItem(k);}catch(_){return null;}},set:function(k,v){localStorage.setItem(k,v);}};
  function themeButtons(){document.querySelectorAll('[data-theme-choice]').forEach(function(b){b.setAttribute('aria-pressed',String((document.documentElement.dataset.theme||'auto')===b.dataset.themeChoice));});}
  themeButtons();
  document.querySelectorAll('[data-theme-choice]').forEach(function(b){b.addEventListener('click',function(){var mode=b.dataset.themeChoice;if(mode==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=mode;try{store.set('workify-theme',mode);}catch(_){}themeButtons();});});
  var key='workify-public-offline-v1';
  function readJobs(){try{var list=JSON.parse(store.get(key)||'[]');return Array.isArray(list)?list.filter(function(j){return j&&typeof j.title==='string'&&typeof j.url==='string';}).slice(0,20):[];}catch(_){return [];}}
  document.querySelectorAll('[data-offline-save]').forEach(function(b){b.addEventListener('click',function(){
    var url=new URL(location.href);url.hash='';url.search='';
    var item={id:b.dataset.id,title:b.dataset.title,company:b.dataset.company,place:b.dataset.place,pay:b.dataset.pay,description:(b.dataset.description||'').slice(0,24000),url:url.href,saved:new Date().toISOString()};
    var list=readJobs().filter(function(j){return j.url!==item.url;});list.unshift(item);
    try{store.set(key,JSON.stringify(list.slice(0,20)));b.textContent=b.dataset.saved;b.setAttribute('aria-live','polite');}catch(_){b.textContent=b.dataset.error;}
  });});
  function renderLibrary(){document.querySelectorAll('[data-offline-library]').forEach(function(box){box.replaceChildren();var list=readJobs();if(!list.length){var empty=document.createElement('p');empty.textContent=box.dataset.empty;box.appendChild(empty);return;}
    list.forEach(function(j){var article=document.createElement('article');
      function text(tag,value){var el=document.createElement(tag);el.textContent=value||'';article.appendChild(el);return el;}
      text('h2',j.title);text('p',[j.company,j.place,j.pay].filter(Boolean).join(' · '));
      text('small',box.dataset.snapshot+' '+new Date(j.saved).toLocaleString());text('p',j.description);
      var open=text('a',box.dataset.open);try{var link=new URL(j.url);if(link.origin===location.origin&&/^https?:$/.test(link.protocol))open.href=link.href;}catch(_){}
      var remove=text('button',box.dataset.remove);remove.type='button';remove.className='btn btn-ghost';remove.addEventListener('click',function(){try{store.set(key,JSON.stringify(readJobs().filter(function(x){return x.url!==j.url;})));renderLibrary();}catch(_){}});box.appendChild(article);
    });});}
  renderLibrary();
  var panel=document.querySelector('[data-dictation]');
  if(panel){var API=window.SpeechRecognition||window.webkitSpeechRecognition,start=panel.querySelector('[data-dictate-start]'),stop=panel.querySelector('[data-dictate-stop]'),status=panel.querySelector('[data-dictate-status]'),language=panel.querySelector('select'),field=document.getElementById('chat-body'),recognition=null;
    if(!API){start.disabled=true;status.textContent=panel.dataset.failure;}
    start.addEventListener('click',function(){if(!API||!field)return;recognition=new API();recognition.lang=language.value;recognition.continuous=false;recognition.interimResults=false;
      recognition.onstart=function(){start.disabled=true;stop.disabled=false;start.setAttribute('aria-pressed','true');};
      recognition.onresult=function(e){var parts=[];for(var i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)parts.push(e.results[i][0].transcript);field.value=(field.value+' '+parts.join(' ')).trim().slice(0,4000);field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();};
      recognition.onerror=function(){status.textContent=panel.dataset.failure;};
      recognition.onend=function(){start.disabled=false;stop.disabled=true;start.setAttribute('aria-pressed','false');};
      status.textContent='';try{recognition.start();}catch(_){status.textContent=panel.dataset.failure;}
    });
    stop.addEventListener('click',function(){if(recognition)recognition.stop();});
    document.addEventListener('visibilitychange',function(){if(document.hidden&&recognition)recognition.stop();});
    window.addEventListener('pagehide',function(){if(recognition)recognition.abort();});
  }
})();
