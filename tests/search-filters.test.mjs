import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(process.env.WORKIFY_TEST_TOOLS?path.join(process.env.WORKIFY_TEST_TOOLS,'package.json'):import.meta.url);
const {parseHTML}=require('linkedom');
const read=file=>readFileSync(path.join(root,file),'utf8');
const code=read('static/js/preview.js');
const origin='https://itstefandjukaric-maker.github.io';
const keys='q country category housing region visa flight min_pay pay_currency pay_period pay_basis experience language'.split(' ');
const sample={q:'hotel & reception',country:'AE',category:'hospitality',housing:'1',region:'gulf',visa:'1',flight:'1',min_pay:'2400.50',pay_currency:'AED',pay_period:'month',pay_basis:'net',experience:'0',language:'en'};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

async function render(file,{query='',lang='bs'}={}){
  const {window,document}=parseHTML(read(file));document.normalize();
  // Browsers expose a read-only SVGAnimatedString href on SVG anchors.
  // Linkedom's writable string property would otherwise hide startup crashes.
  for(const link of document.querySelectorAll('svg a[href]'))Object.defineProperty(link,'href',{get(){return {baseVal:this.getAttribute('href'),animVal:this.getAttribute('href')};}});
  // Browser controls expose checked even when it was set in HTML.
  for(const input of document.querySelectorAll('input[type=checkbox],input[type=radio]'))input.checked=input.hasAttribute('checked');
  const url=new URL('/Workify/'+file+'?'+query,origin);url.searchParams.set('lang',lang);
  Object.defineProperty(document,'baseURI',{value:url.href});
  const location={href:url.href,pathname:url.pathname,search:url.search,origin,replace:u=>{location.href=u;}};
  const storage=new Map();const localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
  const fetch=async resource=>{const f=new URL(resource,url).pathname.replace('/Workify/','');return {ok:existsSync(path.join(root,f)),json:async()=>JSON.parse(read(f))};};
  class HTMLFormElement{}
  window.HTMLFormElement=HTMLFormElement;window.fetch=fetch;
  vm.runInNewContext(code,{window,document,location,localStorage,URL,URLSearchParams,fetch,navigator:{},HTMLFormElement,MutationObserver:window.MutationObserver,setTimeout:()=>0,clearTimeout(){}});
  await flush();await flush();
  return {window,document,location,form:document.querySelector('form[data-pv-search]')};
}
function setValue(r,name,value){
  const nodes=[...r.form.querySelectorAll('[name="'+name+'"]')];assert.ok(nodes.length,name);
  for(const el of nodes){
    if(el.type==='checkbox'||el.type==='radio')el.checked=el.value===value;
    else if(el.tagName==='SELECT'){const options=[...el.querySelectorAll('option')];for(const option of options)option.selected=false;const chosen=options.find(option=>option.value===value);if(chosen)chosen.selected=true;}
    else el.value=value;
  }
}
function submit(r){
  const e=new r.window.Event('submit',{bubbles:true,cancelable:true});r.form.dispatchEvent(e);assert.equal(e.defaultPrevented,true);return new URL(r.location.href);
}
function assertState(url,state){
  assert.equal(url.origin,origin);assert.ok(url.pathname.startsWith('/Workify/'));assert.ok(existsSync(path.join(root,url.pathname.slice(9))));
  for(const [key,value] of Object.entries(state))assert.equal(url.searchParams.get(key),key==='min_pay'?String(Number(value)):value,key);
}

test('Read-only SVG map anchors do not interrupt real jobs page startup or submission',async()=>{
  for(const file of ['jobs.html','jobs-map.html','en-jobs.html','en-w-jobs-map.html']){
    const lang=file.startsWith('en-')?'de':'bs';
    const r=await render(file,{query:new URLSearchParams(sample).toString(),lang});
    const links=[...r.document.querySelectorAll('svg a[href]')];assert.ok(links.length,file+' contains map anchors');
    for(const link of links){
      assert.equal(Object.getOwnPropertyDescriptor(link,'href').set,undefined);
      const url=new URL(link.getAttribute('href'));assert.equal(url.origin,origin);assert.equal(url.searchParams.get('lang'),lang);
      assert.equal(link.href.baseVal,link.getAttribute('href'));
    }
    links[0].dispatchEvent(new r.window.Event('click',{bubbles:true}));
    const result=submit(r);assertState(result,sample);assert.equal(result.searchParams.get('lang'),lang);
    assert.equal(result.searchParams.get('view'),file.includes('jobs-map')?'map':'list');
  }
});

test('All 13 filters serialize independently, with no unchecked or unknown fields',async()=>{
  const r=await render('jobs.html');for(const [key,value] of Object.entries(sample))setValue(r,key,value);
  for(const name of ['password','email','redirect']){const el=r.document.createElement('input');el.name=name;el.value='private@example.invalid';r.form.appendChild(el);}
  const url=submit(r);assertState(url,sample);assert.equal(url.pathname,'/Workify/jobs.html');assert.equal(url.searchParams.get('lang'),'bs');
  for(const name of ['password','email','redirect'])assert.equal(url.searchParams.has(name),false);
  setValue(r,'housing','');setValue(r,'visa','');setValue(r,'flight','');
  const unchecked=submit(r);for(const name of ['housing','visa','flight'])assert.equal(unchecked.searchParams.has(name),false,name);
});

test('A URL reload restores all filters without confusing 0 experience, currencies, salary periods or bases',async()=>{
  const state={...sample,min_pay:'37.25',pay_currency:'CHF',pay_period:'hour',pay_basis:'gross'};
  const r=await render('jobs.html',{query:new URLSearchParams(state).toString()});assertState(submit(r),state);
  for(const key of ['housing','visa','flight'])assert.equal(r.form.querySelector('[name="'+key+'"]').checked,true);
});

test('Changing language preserves current unsent filters and drops unrelated query data',async()=>{
  const r=await render('jobs.html',{query:'country=PL&email=private%40example.invalid'});
  for(const [key,value] of Object.entries(sample))setValue(r,key,value);
  r.form.querySelector('[name=q]').dispatchEvent(new r.window.Event('input',{bubbles:true}));
  const link=r.document.querySelector('.lang-menu a[lang="de"]');assert.ok(link);
  const url=new URL(link.getAttribute('href'));assertState(url,sample);assert.equal(url.pathname,'/Workify/en-jobs.html');assert.equal(url.searchParams.get('lang'),'de');assert.equal(url.searchParams.has('email'),false);
  const restored=await render('en-jobs.html',{query:url.searchParams.toString(),lang:'de'});assertState(submit(restored),sample);
});

test('Map submissions and map/list switches retain state and the chosen view',async()=>{
  const r=await render('jobs-map.html',{query:new URLSearchParams(sample).toString()});
  const map=submit(r);assertState(map,sample);assert.equal(map.pathname,'/Workify/jobs-map.html');assert.equal(map.searchParams.get('view'),'map');
  const listLink=[...r.document.querySelectorAll('.view-toggle a')].find(a=>new URL(a.getAttribute('href')).pathname.endsWith('/jobs.html'));
  const list=new URL(listLink.getAttribute('href'));assertState(list,sample);assert.equal(list.searchParams.get('view'),'list');
  const loaded=await render('jobs.html',{query:list.searchParams.toString()});
  const mapLink=[...loaded.document.querySelectorAll('.view-toggle a')].find(a=>new URL(a.getAttribute('href')).pathname.endsWith('/jobs-map.html'));
  assertState(new URL(mapLink.getAttribute('href')),sample);assert.equal(new URL(mapLink.getAttribute('href')).searchParams.get('view'),'map');
});

test('Worker search stays in the worker list/map family and preserves RTL locale',async()=>{
  const r=await render('en-w-jobs-map.html',{query:new URLSearchParams(sample).toString(),lang:'ar'});
  const url=submit(r);assertState(url,sample);assert.equal(url.pathname,'/Workify/en-w-jobs-map.html');assert.equal(url.searchParams.get('lang'),'ar');assert.equal(url.searchParams.get('view'),'map');
  const list=[...r.document.querySelectorAll('.view-toggle a')].find(a=>new URL(a.getAttribute('href')).pathname.endsWith('/en-w-jobs.html'));
  assert.ok(list);assertState(new URL(list.getAttribute('href')),sample);
});

test('Invalid or duplicate filters are omitted rather than interpreted as true or converted',async()=>{
  const query='country=PL&country=AE&category=bogus&region=moon&housing=false&visa=0&flight=yes&min_pay=-2&pay_currency=BTC&pay_period=year&pay_basis=unknown&experience=1.5&language=invalid';
  const r=await render('jobs.html',{query});const url=submit(r);
  for(const key of keys.filter(k=>k!=='q'))assert.equal(url.searchParams.has(key),false,key);
  for(const value of ['Infinity','1e6','10000000.01','2.345']){setValue(r,'min_pay',value);assert.equal(submit(r).searchParams.has('min_pay'),false,value);}
  setValue(r,'experience','51');assert.equal(submit(r).searchParams.has('experience'),false);
});

test('Unchecked, disabled and duplicate form controls never become filters',async()=>{
  const r=await render('jobs.html');setValue(r,'visa','1');r.form.querySelector('[name=visa]').disabled=true;
  setValue(r,'country','AE');const copy=r.document.createElement('input');copy.name='country';copy.value='PL';r.form.appendChild(copy);
  const url=submit(r);assert.equal(url.searchParams.has('visa'),false);assert.equal(url.searchParams.has('country'),false);
  for(const key of ['housing','flight'])assert.equal(url.searchParams.has(key),false);
});

test('Homepage radio choices preserve only the selected country and category',async()=>{
  const r=await render('index.html');setValue(r,'country','PL');setValue(r,'category','logistics');setValue(r,'q','warehouse');
  assertState(submit(r),{country:'PL',category:'logistics',q:'warehouse'});
  const link=r.document.querySelector('.lang-menu a[lang="en"]');link.dispatchEvent(new r.window.Event('click',{bubbles:true}));
  assertState(new URL(link.getAttribute('href')),{country:'PL',category:'logistics',q:'warehouse'});
});

test('Every language transition keeps all filters through public and worker map/list round trips',async()=>{
  const locales=['en','ar','bn','fil','fr','ka','de','hi','ky','ne','ru','sw','tg','ur','uz','bs'];
  for(const family of ['', 'w-']){
    let r=await render(family+'jobs-map.html',{query:new URLSearchParams(sample).toString()});
    for(const lang of locales){
      const link=r.document.querySelector('.lang-menu a[lang="'+lang+'"]');assert.ok(link,lang);
      const url=new URL(link.getAttribute('href'));assertState(url,sample);
      assert.equal(url.searchParams.get('lang'),lang);assert.equal(url.searchParams.get('view'),'map');
      assert.equal(url.pathname,'/Workify/'+(lang==='bs'?'':'en-')+family+'jobs-map.html');
      r=await render(url.pathname.slice('/Workify/'.length),{query:url.searchParams.toString(),lang});
      assert.equal(r.document.documentElement.dir,['ar','ur'].includes(lang)?'rtl':'ltr');
      const list=[...r.document.querySelectorAll('.view-toggle a')].map(a=>new URL(a.getAttribute('href'))).find(u=>u.pathname.endsWith('/'+(lang==='bs'?'':'en-')+family+'jobs.html'));
      assert.ok(list,lang+' list route');assertState(list,sample);assert.equal(list.searchParams.get('view'),'list');
      const listPage=await render(list.pathname.slice('/Workify/'.length),{query:list.searchParams.toString(),lang});
      assertState(submit(listPage),sample);
      const map=[...listPage.document.querySelectorAll('.view-toggle a')].map(a=>new URL(a.getAttribute('href'))).find(u=>u.pathname.endsWith('/'+(lang==='bs'?'':'en-')+family+'jobs-map.html'));
      assert.ok(map,lang+' map route');assertState(map,sample);assert.equal(map.searchParams.get('view'),'map');
      r=await render(map.pathname.slice('/Workify/'.length),{query:map.searchParams.toString(),lang});
      assertState(submit(r),sample);
    }
  }
});
