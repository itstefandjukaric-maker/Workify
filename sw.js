const CACHE='workify-public-people-20261022-offline-20261023';
const ASSETS=['static/css/people.css?v=people-20261022','offline.html','en-offline.html','static/css/app.css','static/css/experience.css?v=public-languages-20261017','static/js/app.js','static/js/experience.js','static/js/preview.js?v=github-navigation-20261021','static/css/preview.css?v=github-navigation-20261021'];
const LOCALES=['bs','en','ar','bn','fil','fr','ka','de','hi','ky','ne','ru','sw','tg','ur','uz'];
const SCOPE=new URL(self.registration.scope);

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(path=>c.add(new Request(new URL(path,SCOPE),{cache:'reload'}))))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('workify-public-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

async function offlineResponse(url){
 const requested=url.searchParams.get('lang');
 const locale=LOCALES.includes(requested)?requested:(url.pathname.split('/').pop().startsWith('en-')?'en':'bs');
 const preferred=locale==='bs'?'offline.html':'en-offline.html';
 const alternative=locale==='bs'?'en-offline.html':'offline.html';
 const cache=await caches.open(CACHE);
 const shell=await cache.match(new URL(preferred,SCOPE).href)||await cache.match(new URL(alternative,SCOPE).href);
 if(!shell)return Response.error();
 // Both public shells contain all 16 offline sections. Render the requested
 // locale even if scripts cannot load; app.js may restore the device preference
 // when the URL does not explicitly choose a language. Do not cache navigations.
 let html=await shell.text();
 html=html.replace(/<html\b[^>]*>/,`<html lang="${locale}" dir="${locale==='ar'||locale==='ur'?'rtl':'ltr'}">`)
   .replace(/(<body\b[^>]*\bdata-locale=")[^"]*(")/,`$1${locale}$2`)
   .replace(/<section\b([^>]*\bdata-offline-lang="([^"]+)"[^>]*)>/g,(_,attrs,code)=>
     '<section'+attrs.replace(/\s+hidden(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g,'')+(code===locale?'':' hidden')+'>');
 return new Response(html,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Content-Language':locale,'Cache-Control':'no-store'}});
}

self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==SCOPE.origin||!u.pathname.startsWith(SCOPE.pathname))return;
 const relative=u.pathname.slice(SCOPE.pathname.length);
 if(e.request.mode==='navigate'){
   // Only public HTML pages receive the offline shell, never APIs or documents.
   if(relative!==''&&!/^[^/]+\.html$/.test(relative))return;
   e.respondWith(fetch(e.request).catch(()=>offlineResponse(u)));
 }else if(relative==='static/js/preview.js'||relative.startsWith('static/locales/')){
   e.respondWith(fetch(new Request(e.request,{cache:'no-cache'})).then(r=>{
     if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}
     return r;
   }).catch(async()=>await (await caches.open(CACHE)).match(e.request)||Response.error()));
 }else if(relative.startsWith('static/')&&!/\.(mp4|webm)$/i.test(u.pathname)){
   e.respondWith(caches.open(CACHE).then(async c=>await c.match(e.request)||fetch(e.request).then(r=>{
     if(r.ok){const copy=r.clone();e.waitUntil(c.put(e.request,copy));}
     return r;
   })));
 }
});
