import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(process.env.WORKIFY_TEST_TOOLS ? path.join(process.env.WORKIFY_TEST_TOOLS,'package.json') : import.meta.url);
const {parseHTML}=require('linkedom');
const code=readFileSync(process.env.WORKIFY_APP_SCRIPT || path.join(root,'static/js/app.js'),'utf8');

function render(dir='ltr',options={}) {
  const {window,document}=parseHTML(options.html || `<!doctype html><html lang="en" dir="${dir}"><body data-locale="en">
    <details class="menu" id="language"><summary>Language</summary><a href="#en">English</a></details>
    <details class="menu" id="theme"><summary>Theme</summary><button>Dark</button></details>
    <button id="outside">Outside control</button>
    <div data-console class="sidebar-open"><button data-sidebar-toggle aria-expanded="true">Sidebar</button></div>
    <div class="carousel"><div data-carousel></div><button data-carousel-prev>Previous</button><button data-carousel-next>Next</button><div class="jc-dots"><i></i><i></i><i></i></div></div>
  </body></html>`);
  let active=document.body,reduce=false;
  const focusCalls=[];
  // Linkedom has no browser focus/layout engine. Model those APIs while running
  // the complete production script and dispatching actual DOM events.
  Object.defineProperty(document,'activeElement',{get:()=>active});
  for(const el of document.querySelectorAll('a,button,summary')) el.focus=()=>{active=el;focusCalls.push(el);};
  const track=document.querySelector('[data-carousel]'),scrollCalls=[];
  if(track) {
    Object.defineProperty(track,'clientWidth',{value:100});
    Object.defineProperty(track,'scrollWidth',{value:300});
    track.scrollLeft=0;
    track.scrollBy=options=>{
      scrollCalls.push({left:options.left,behavior:options.behavior});
      track.scrollLeft+=options.left;
      track.dispatchEvent(new window.Event('scroll'));
    };
  }
  window.location={href:'https://itstefandjukaric-maker.github.io/Workify/offline.html'+(options.query||''),reload(){}};
  const storage=new Map(Object.entries(options.saved||{}));
  window.localStorage={
    getItem:key=>{if(options.blockedStorage)throw new Error('storage blocked');return storage.get(key);},
    setItem:(key,value)=>{if(options.blockedStorage)throw new Error('storage blocked');storage.set(key,value);}
  };
  window.matchMedia=query=>({matches:query==='(prefers-reduced-motion: reduce)'&&reduce});
  window.requestAnimationFrame=callback=>callback();
  const navigator={userAgent:'Workify DOM test',standalone:false};
  const context=vm.createContext({window,document,navigator,Intl,URL,CustomEvent:window.CustomEvent});
  vm.runInContext(code,context);
  const click=el=>el.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
  const key=(el,value)=>{const e=new window.Event('keydown',{bubbles:true,cancelable:true});e.key=value;el.dispatchEvent(e);};
  return {document,window,track,scrollCalls,focusCalls,click,key,setReducedMotion:value=>{reduce=value;}};
}

test('Escape returns focus to the active menu trigger in LTR and RTL, closing the sidebar as before',()=>{
  for(const dir of ['ltr','rtl']) for(const id of ['language','theme']) {
    const r=render(dir),menu=r.document.getElementById(id),trigger=menu.querySelector('summary');
    const item=menu.querySelector('a,button');
    for(const d of r.document.querySelectorAll('details.menu')) d.setAttribute('open','');
    item.focus();
    r.key(item,'Escape');
    assert.equal(r.document.querySelectorAll('details.menu[open]').length,0);
    assert.ok(r.document.activeElement===trigger,'Escape restores focus to the active menu summary');
    assert.ok(r.focusCalls.at(-1)===trigger,'The summary receives an explicit focus call');
    assert.equal(r.document.querySelector('[data-console]').classList.contains('sidebar-open'),false);
    assert.equal(r.document.querySelector('[data-sidebar-toggle]').getAttribute('aria-expanded'),'false');
  }
});

test('Outside clicks and Escape outside a menu close it without stealing focus',()=>{
  const r=render(),menu=r.document.getElementById('language'),outside=r.document.getElementById('outside');
  outside.focus();
  for(const close of [()=>r.click(outside),()=>r.key(outside,'Escape')]) {
    menu.setAttribute('open','');const before=r.focusCalls.length;
    close();
    assert.equal(menu.hasAttribute('open'),false);
    assert.ok(r.document.activeElement===outside,'The outside control keeps focus');
    assert.equal(r.focusCalls.length,before);
  }
});

test('Clicking inside a menu keeps it open and unrelated keys leave focus unchanged',()=>{
  const r=render(),menu=r.document.getElementById('language'),other=r.document.getElementById('theme');
  menu.setAttribute('open','');other.setAttribute('open','');
  const item=menu.querySelector('a');item.focus();const before=r.focusCalls.length;
  r.click(item);
  assert.equal(menu.hasAttribute('open'),true);
  assert.equal(other.hasAttribute('open'),false);
  r.key(item,'Enter');
  assert.equal(menu.hasAttribute('open'),true);
  assert.ok(r.document.activeElement===item,'The menu item keeps focus');
  assert.equal(r.focusCalls.length,before);
});

test('Carousel follows changes to reduced-motion preference and preserves RTL direction and indicators',()=>{
  for(const dir of ['ltr','rtl']) {
    const r=render(dir),prev=r.document.querySelector('[data-carousel-prev]'),next=r.document.querySelector('[data-carousel-next]');
    const dots=[...r.document.querySelectorAll('.jc-dots i')];
    const direction=dir==='rtl'?-1:1;
    assert.equal(prev.disabled,true);assert.equal(next.disabled,false);
    assert.equal(dots[0].classList.contains('is-on'),true);
    r.click(next);
    assert.deepEqual(r.scrollCalls.at(-1),{left:90*direction,behavior:'smooth'});
    assert.equal(prev.disabled,false);assert.equal(dots[1].classList.contains('is-on'),true);
    r.setReducedMotion(true);r.click(prev);
    assert.deepEqual(r.scrollCalls.at(-1),{left:-90*direction,behavior:'auto'});
    assert.equal(prev.disabled,true);assert.equal(dots[0].classList.contains('is-on'),true);
    r.setReducedMotion(false);r.click(next);
    assert.equal(r.scrollCalls.at(-1).behavior,'smooth');
  }
});

test('Both offline pages honor all explicit language selections and set matching direction',()=>{
  for(const file of ['offline.html','en-offline.html']) for(const lang of ['bs','en','ar','bn','fil','fr','ka','de','hi','ky','ne','ru','sw','tg','ur','uz']) {
    const r=render('ltr',{html:readFileSync(path.join(root,file),'utf8'),query:'?lang='+lang,saved:{'workify-site-language':'de','workify-locale':'bs'}});
    const visible=[...r.document.querySelectorAll('[data-offline-lang]')].filter(el=>!el.hidden);
    assert.equal(visible.length,1,file+'/'+lang);
    assert.equal(visible[0].getAttribute('data-offline-lang'),lang);
    assert.equal(r.document.documentElement.lang,lang);
    assert.equal(r.document.body.getAttribute('data-locale'),lang);
    assert.equal(r.document.documentElement.dir,['ar','ur'].includes(lang)?'rtl':'ltr');
  }
});

test('Offline language fallback uses current storage, then valid legacy storage, then page language safely',()=>{
  const html=readFileSync(path.join(root,'en-offline.html'),'utf8');
  for(const [options,expected] of [
    [{saved:{'workify-site-language':'ur','workify-locale':'bs'}},'ur'],
    [{query:'?lang=invalid',saved:{'workify-site-language':'ar','workify-locale':'de'}},'ar'],
    [{query:'?lang=invalid',saved:{'workify-site-language':'invalid','workify-locale':'fr'}},'fr'],
    [{query:'?lang=%22%5D%2Cbody',saved:{'workify-site-language':'invalid','workify-locale':'"]'}},'en'],
    [{blockedStorage:true},'en'],
    [{query:'?lang=ar',blockedStorage:true},'ar']
  ]) {
    const r=render('ltr',{html,...options});
    const visible=[...r.document.querySelectorAll('[data-offline-lang]')].filter(el=>!el.hidden);
    assert.equal(visible.length,1);
    assert.equal(visible[0].getAttribute('data-offline-lang'),expected);
    assert.equal(r.document.documentElement.lang,expected);
    assert.equal(r.document.documentElement.dir,['ar','ur'].includes(expected)?'rtl':'ltr');
  }
});

async function renderSearch(file,lang,query='') {
  const page=parseHTML(readFileSync(path.join(root,file),'utf8')).document;
  // Use the real search controls without unrelated card/map layout APIs.
  const formMarkup=page.querySelector('form[data-pv-search]').outerHTML;
  const {window,document}=parseHTML(`<!doctype html><html lang="en"><body data-locale="en">${formMarkup}</body></html>`);
  document.normalize();
  const form=document.querySelector('form');
  for(const input of form.querySelectorAll('input[type=checkbox],input[type=radio]')) input.checked=input.hasAttribute('checked');
  const url=new URL('https://itstefandjukaric-maker.github.io/Workify/'+file+'?'+query);
  url.searchParams.set('lang',lang);
  Object.defineProperty(document,'baseURI',{value:url.href});
  const location={href:url.href,pathname:url.pathname,search:url.search,origin:url.origin,replace(value){this.href=value;}};
  const storage=new Map(),localStorage={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
  const fetch=async resource=>({ok:true,json:async()=>JSON.parse(readFileSync(path.join(root,new URL(resource,url).pathname.replace('/Workify/','')),'utf8'))});
  class HTMLFormElement {}
  const calls={native:0,requested:0,events:[]};
  // Linkedom lacks these browser APIs. Model native submit's event bypass, and
  // requestSubmit's cancelable event. Only app.js can invoke them in these tests.
  form.submit=()=>{calls.native++;};
  form.requestSubmit=()=>{
    calls.requested++;
    const event=new window.Event('submit',{bubbles:true,cancelable:true});
    form.dispatchEvent(event);calls.events.push(event);
    if(!event.defaultPrevented)form.submit();
  };
  Object.assign(window,{location,localStorage,fetch,HTMLFormElement,matchMedia:()=>({matches:false}),requestAnimationFrame:callback=>callback()});
  const context=vm.createContext({window,document,location,localStorage,fetch,HTMLFormElement,URL,URLSearchParams,Intl,navigator:{userAgent:'Workify DOM test'},MutationObserver:window.MutationObserver,setTimeout:()=>0,clearTimeout(){}});
  const scripts=[...page.querySelectorAll('script[src]')].map(el=>el.getAttribute('src').split('?')[0]).filter(src=>['static/js/preview.js','static/js/app.js'].includes(src));
  assert.deepEqual(scripts,['static/js/preview.js','static/js/app.js'],'Execute both scripts in page order');
  for(const src of scripts)vm.runInContext(src.endsWith('/app.js')?code:readFileSync(path.join(root,src),'utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  return {window,document,form,location,calls};
}

function changeSearch(r,name,value) {
  const control=r.form.querySelector('[name="'+name+'"]');
  assert.ok(control,name);
  if(control.type==='checkbox')control.checked=value==='1';
  else if(control.tagName==='SELECT'){
    const options=[...control.querySelectorAll('option')];
    for(const option of options)option.selected=false;
    const chosen=options.find(option=>option.value===value);assert.ok(chosen,value);chosen.selected=true;
  } else control.value=value;
  control.dispatchEvent(new r.window.Event('change',{bubbles:true}));
}

test('Real search control changes pass through both scripts and retain all filters, language and map/list route',async()=>{
  const state={q:'Kuhar & hotel',country:'AE',category:'hospitality',housing:'1',region:'eu',visa:'1',flight:'1',min_pay:'2400.5',pay_currency:'CHF',pay_period:'hour',pay_basis:'gross',experience:'0',language:'de'};
  for(const [file,lang,view] of [['jobs.html','bs','list'],['en-jobs-map.html','de','map'],['en-w-jobs-map.html','ar','map'],['en-w-jobs.html','en','list']]) {
    let r=await renderSearch(file,lang,new URLSearchParams(state).toString());
    const expected={...state,country:'DE',lang,view};
    for(const [key,value] of [['country','DE'],['visa',''],['flight',''],['visa','1']]) {
      changeSearch(r,key,value);
      if(value)expected[key]=value;else delete expected[key];
      assert.equal(r.calls.requested,1,file+'/'+key+' emits one submit request');
      assert.equal(r.calls.native,0,'Native submit must never bypass the preview handler');
      assert.equal(r.calls.events.length,1);
      assert.equal(r.calls.events[0].defaultPrevented,true,'Preview handled the request');
      const next=new URL(r.location.href);
      assert.equal(next.pathname,'/Workify/'+file);
      assert.deepEqual(Object.fromEntries(next.searchParams),expected,file+'/'+key);
      // Each selection navigates: the next action uses restored controls after reload.
      r=await renderSearch(file,lang,next.searchParams.toString());
      assert.equal(r.document.documentElement.dir,lang==='ar'?'rtl':'ltr');
    }
  }
});

test('Advanced filters and search text keep their explicit-submit behavior with both scripts loaded',async()=>{
  const r=await renderSearch('en-jobs-map.html','de');
  const before=r.location.href;
  changeSearch(r,'pay_currency','CHF');
  changeSearch(r,'language','de');
  changeSearch(r,'q','Kuhar');
  assert.equal(r.calls.requested,0);
  assert.equal(r.calls.native,0);
  assert.equal(r.location.href,before);
});
