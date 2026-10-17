const CACHE='workify-public-languages-20261017';
const ASSETS=['offline.html','en-offline.html','static/css/app.css','static/css/experience.css?v=public-languages-20261017','static/js/app.js','static/js/experience.js','static/js/preview.js?v=public-languages-20261017','static/css/preview.css'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(path=>c.add(new Request(new URL(path,self.registration.scope),{cache:'reload'}))))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('workify-public-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('offline.html',self.registration.scope).href)));
 else if((u.pathname.endsWith('/static/js/preview.js')||u.pathname.includes('/static/locales/')))e.respondWith(fetch(new Request(e.request,{cache:'no-cache'})).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;}).catch(()=>caches.match(e.request)));
 else if(u.pathname.includes('/static/')&&!/\.(mp4|webm)$/.test(u.pathname))e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;})));
});
