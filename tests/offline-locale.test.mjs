import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const code=readFileSync(new URL('sw.js',root),'utf8');
const locales=['bs','en','ar','bn','fil','fr','ka','de','hi','ky','ne','ru','sw','tg','ur','uz'];
const origin='https://itstefandjukaric-maker.github.io';
const scope=origin+'/Workify/';
const cacheName='workify-public-people-20261022-offline-20261023';
const urlOf=input=>typeof input==='string'?input:input.url||input.href;

function worker({shells=['offline.html','en-offline.html'],network=()=>Promise.reject(new Error('offline'))}={}){
 const handlers={},stores=new Map(),writes=[],added=[],lookups=[],deleted=[];
 function getStore(name){if(!stores.has(name))stores.set(name,new Map());return stores.get(name);}
 const cache={async match(input){const url=urlOf(input);lookups.push(url);return getStore(cacheName).get(url)?.clone();},async put(input,response){const url=urlOf(input);writes.push(url);getStore(cacheName).set(url,response);},async add(input){added.push(input.url);}};
 const caches={async open(name){assert.equal(name,cacheName);return cache;},async keys(){return [...stores.keys()];},async delete(name){deleted.push(name);return stores.delete(name);}};
 for(const file of shells)getStore(cacheName).set(scope+file,new Response(readFileSync(new URL(file,root),'utf8'),{headers:{'Content-Type':'text/html'}}));
 const context=vm.createContext({URL,Request,Response,Headers,caches,fetch:network,self:{registration:{scope},location:{origin},addEventListener:(event,handler)=>handlers[event]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}}});
 vm.runInContext(code,context);
 return {stores,writes,added,lookups,deleted,async event(type){let pending;handlers[type]({waitUntil:p=>pending=p});await pending;},async request(path,{mode='navigate',method='GET'}={}){
   const request=new Request(new URL(path,scope),{method});Object.defineProperty(request,'mode',{value:mode});let response;const pending=[];
   handlers.fetch({request,respondWith:p=>response=p,waitUntil:p=>pending.push(p)});
   const result=await response;await Promise.all(pending);return result;
 }};
}

function assertLocale(html,locale){
 assert.match(html,new RegExp('<html lang="'+locale+'" dir="'+(['ar','ur'].includes(locale)?'rtl':'ltr')+'">'));
 assert.match(html,new RegExp('<body[^>]*data-locale="'+locale+'"'));
 const sections=[...html.matchAll(/<section\b([^>]*\bdata-offline-lang="([^"]+)"[^>]*)>/g)];
 assert.equal(sections.length,16);
 assert.deepEqual(sections.filter(m=>!/(?:^|\s)hidden(?:\s|=|$)/.test(m[1])).map(m=>m[2]),[locale]);
}

test('Offline navigation renders each explicit locale without depending on scripts or a translation fetch',async()=>{
 const w=worker();
 for(const locale of locales){
   const response=await w.request('en-jobs.html?lang='+locale+'&country=AE');
   assert.equal(response.status,503);assert.equal(response.headers.get('Content-Language'),locale);assert.equal(response.headers.get('Cache-Control'),'no-store');
   assertLocale(await response.text(),locale);
 }
 assert.equal(w.writes.length,0,'Navigations and personalized requests are not cached');
 assert.ok(w.lookups.every(url=>url.startsWith(scope)));
});

test('English pathname and explicit BHS override select correctly; invalid locale cannot enter HTML',async()=>{
 const w=worker();
 for(const [path,expected] of [['en-index.html','en'],['en-jobs.html?lang=bs','bs'],['jobs.html?lang=de','de'],['jobs.html?lang=%22%3E%3Cscript%3E','bs'],['en-index.html?lang=unknown','en'],['','bs']]){
   assertLocale(await (await w.request(path)).text(),expected);
 }
});

test('Missing preferred shell uses the other cached multilingual shell, while missing both fails safely',async()=>{
 const onlyBs=worker({shells:['offline.html']});
 assertLocale(await (await onlyBs.request('en-index.html?lang=ar')).text(),'ar');
 const onlyEn=worker({shells:['en-offline.html']});
 assertLocale(await (await onlyEn.request('index.html?lang=bs')).text(),'bs');
 const none=worker({shells:[]});assert.equal((await none.request('en-jobs.html')).type,'error');
});

test('Online navigation is returned unchanged and never written into the offline cache',async()=>{
 const w=worker({network:async()=>new Response('Current public page',{status:200})});
 assert.equal(await (await w.request('jobs.html?lang=en')).text(),'Current public page');
 assert.deepEqual(w.writes,[]);assert.deepEqual(w.lookups,[]);
});

test('Requests outside the public scope, private APIs, documents, cross-origin and mutations are not intercepted',async()=>{
 const w=worker();
 for(const path of ['https://workify-platform.itstefandjukaric.chatgpt.site/api/documents?id=secret','/OtherProject/index.html','/WorkifyOther/en-index.html','api/documents?id=secret','private/cv.pdf','static/img/logo.png']){
   assert.equal(await w.request(path),undefined,path);
 }
 assert.equal(await w.request('login.html',{method:'POST'}),undefined);
 assert.deepEqual(w.writes,[]);
});

test('Asset misses never receive offline HTML; cached runtime is usable offline',async()=>{
 const w=worker();const js=scope+'static/js/preview.js?v=github-navigation-20261021';
 w.stores.get(cacheName).set(js,new Response('/* cached runtime */',{headers:{'Content-Type':'text/javascript'}}));
 assert.equal(await (await w.request(js,{mode:'cors'})).text(),'/* cached runtime */');
 const missing=await w.request('static/locales/site-fr.json?v=missing',{mode:'cors'});
 assert.equal(missing.type,'error');
 await assert.rejects(()=>w.request('static/img/missing.png',{mode:'cors'}),/offline/);
 assert.equal(await w.request('static/video.mp4',{mode:'cors'}),undefined);
 assert.deepEqual(w.writes,[]);
});

test('Installation is rooted under GitHub Pages subpath; activation removes only old Workify caches',async()=>{
 const w=worker();await w.event('install');
 assert.ok(w.added.includes(scope+'offline.html'));assert.ok(w.added.includes(scope+'en-offline.html'));
 assert.ok(w.added.every(url=>url.startsWith(scope)));
 w.stores.set('workify-public-old',new Map());w.stores.set('other-app-cache',new Map());
 await w.event('activate');assert.deepEqual(w.deleted,['workify-public-old']);assert.ok(w.stores.has('other-app-cache'));
});
