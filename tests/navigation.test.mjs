import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(process.env.WORKIFY_TEST_TOOLS ? path.join(process.env.WORKIFY_TEST_TOOLS,'package.json') : import.meta.url);
const {parseHTML}=require('linkedom');
const read=file=>readFileSync(path.join(root,file),'utf8');
const code=process.env.WORKIFY_PREVIEW_SCRIPT ? readFileSync(process.env.WORKIFY_PREVIEW_SCRIPT,'utf8') : read('static/js/preview.js');
const origin='https://itstefandjukaric-maker.github.io';
const locales='bs en ar bn fil fr ka de hi ky ne ru sw tg ur uz'.split(' ');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

async function render(file,{lang='bs',saved,kind,storageBlocked=false}={}) {
  const {window,document}=parseHTML(read(file)); document.normalize();
  const url=new URL('/Workify/'+file,origin);
  if(lang)url.searchParams.set('lang',lang);
  if(kind)url.searchParams.set('kind',kind);
  Object.defineProperty(document,'baseURI',{value:url.href});
  const redirects=[],requests=[],storage=new Map(saved?[['workify-site-language',saved]]:[]);
  const location={href:url.href,pathname:url.pathname,search:url.search,origin,replace:u=>redirects.push(u)};
  const localStorage={getItem:k=>{if(storageBlocked)throw Error('blocked');return storage.get(k);},setItem:(k,v)=>{if(storageBlocked)throw Error('blocked');storage.set(k,v);}};
  const fetch=async resource=>{requests.push(resource);const file=new URL(resource,url).pathname.replace('/Workify/','');return {ok:existsSync(path.join(root,file)),json:async()=>JSON.parse(read(file))};};
  // Linkedom has no native form constructor. Model the transport API, not routing.
  class HTMLFormElement {}
  class FormData {constructor(form){this.form=form;}get(key){return this.form.querySelector('[name="'+key+'"]')?.value??null;}}
  window.HTMLFormElement=HTMLFormElement;window.fetch=fetch;
  const context=vm.createContext({window,document,location,localStorage,URL,URLSearchParams,fetch,navigator:{},HTMLFormElement,FormData,MutationObserver:window.MutationObserver,setTimeout:()=>0,clearTimeout(){}});
  vm.runInContext(code,context);await flush();await flush();
  return {window,document,location,redirects,requests,storage,HTMLFormElement};
}
function assertLocal(href,lang){const u=new URL(href);assert.equal(u.origin,origin);assert.ok(u.pathname.startsWith('/Workify/'));assert.ok(existsSync(path.join(root,u.pathname.slice('/Workify/'.length))),u.href);assert.equal(u.searchParams.get('lang'),lang);return u;}

test('Login, phone login, recovery, registration and each role remain on GitHub in all 16 locales',async()=>{
  for(const lang of locales)for(const base of ['login.html','login-phone.html','forgot.html','register.html','register-worker.html','register-employer.html','register-agency.html','w-home.html','w-profile.html','e-dashboard.html','a-dashboard.html']){
    const file=(lang==='bs'?'':'en-')+base;
    const {document,redirects}=await render(file,{lang});
    assert.deepEqual(redirects,[],file+'/'+lang);
    assert.equal(document.documentElement.lang,lang);
    assert.equal(document.documentElement.dir,['ar','ur'].includes(lang)?'rtl':'ltr');
    const links=[...document.querySelectorAll('a[data-workify-local]')];assert.ok(links.length>5);
    for(const link of links){const chosen=link.getAttribute('data-workify-language')||lang;assertLocal(link.href,chosen);}
    if(/^(login|forgot|register-)/.test(base))assert.ok(document.querySelector('.pv-auth-notice')?.textContent.length>20);
  }
});

test('Role-specific calls to action keep the correct page and selected language',async()=>{
  for(const lang of locales)for(const role of ['workers','employers','agencies']){
    const target={workers:'worker',employers:'employer',agencies:'agency'}[role];
    const prefix=lang==='bs'?'':'en-';const {document}=await render(prefix+'for-'+role+'.html',{lang});
    const link=document.querySelector('main a[href*="register-'+target+'.html"]');assert.ok(link,role);
    assert.equal(assertLocal(link.href,lang).pathname,'/Workify/'+prefix+'register-'+target+'.html');
    const signIns=document.querySelectorAll('header a.btn-ghost, main a.btn-outline');
    assert.equal(signIns.length,2,role+' has header and hero login links');
    for(const signIn of signIns)assert.equal(assertLocal(signIn.href,lang).pathname,'/Workify/'+prefix+'login.html',role+' login must open the login screen');
  }
  const {document}=await render('register.html');
  assert.ok(document.querySelector('main a[href*="register-worker.html"]'));
  assert.ok(document.querySelector('main a[href*="register-agency.html"]'));
});

test('Business role choice survives switching language without granting permissions',async()=>{
  for(const kind of ['agency','employer']){
    const {window,document}=await render('register-agency.html',{kind});
    for(const input of document.querySelectorAll('input[name=kind]'))assert.equal(input.checked,input.value===kind);
    for(const link of document.querySelectorAll('.lang-menu a[lang]'))assert.equal(new URL(link.href).searchParams.get('kind'),kind);
    const other=kind==='agency'?'employer':'agency';
    for(const input of document.querySelectorAll('input[name=kind]'))input.checked=input.value===other;
    document.querySelector('input[value="'+other+'"]').dispatchEvent(new window.Event('change',{bubbles:true}));
    for(const link of document.querySelectorAll('.lang-menu a[lang]'))assert.equal(new URL(link.href).searchParams.get('kind'),other);
  }
});

test('Explicit language overrides stored language; blocked storage and invalid languages are safe',async()=>{
  const explicit=await render('en-login.html',{lang:'de',saved:'ar'});assert.equal(explicit.document.documentElement.lang,'de');
  const remembered=await render('register-worker.html',{lang:null,saved:'fr'});assertLocal(remembered.redirects[0],'fr');
  const blocked=await render('en-login-phone.html',{lang:'ur',storageBlocked:true});assert.equal(blocked.document.documentElement.lang,'ur');assert.deepEqual(blocked.redirects,[]);
  const fallback=await render('en-login.html',{lang:'invalid'});assert.equal(fallback.document.documentElement.lang,'en');
});

test('Auth form submissions never navigate, send personal data, or fabricate success',async()=>{
  for(const file of ['login.html','login-phone.html','forgot.html','register-worker.html','register-employer.html','register-agency.html']){
    const r=await render(file);const form=r.document.querySelector('main form');assert.ok(form);
    const event=new r.window.Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(event);
    assert.equal(event.defaultPrevented,true,file);assert.equal(r.location.href,origin+'/Workify/'+file+'?lang=bs');
    assert.deepEqual(r.requests,[]);assert.deepEqual(r.redirects,[]);
    assert.ok(r.document.querySelector('.pv-toast').textContent.includes('Podaci nisu poslani'));
    r.HTMLFormElement.prototype.submit.call(form);assert.deepEqual(r.requests,[]);
    await assert.rejects(r.window.fetch('/login',{method:'POST',body:'password=do-not-send'}));
    assert.deepEqual(r.requests,[]);
    assert.deepEqual([...r.storage.keys()],['workify-site-language']);
  }
});

test('Search remains local and transfers only allowlisted filters',async()=>{
  const r=await render('index.html');const form=r.document.querySelector('[data-pv-search]');assert.ok(form);
  for(const [name,value] of Object.entries({q:'hotel & reception',country:'AE',password:'do-not-send',email:'private@example.invalid'})){
    let input=form.querySelector('[name="'+name+'"]');if(!input){input=r.document.createElement('input');input.name=name;form.appendChild(input);}input.value=value;
  }
  form.dispatchEvent(new r.window.Event('submit',{bubbles:true,cancelable:true}));
  const url=assertLocal(r.location.href,'bs');assert.equal(url.pathname,'/Workify/jobs.html');assert.equal(url.searchParams.get('q'),'hotel & reception');
  assert.equal(url.searchParams.has('email'),false);assert.equal(url.searchParams.has('password'),false);assert.deepEqual(r.requests,[]);
});

test('External and fragment links are unchanged; dynamically added local links stay local',async()=>{
  const r=await render('index.html');
  for(const href of ['https://example.org/info','#main','mailto:info@example.org']){
    const a=r.document.createElement('a');a.href=href;r.document.body.appendChild(a);a.dispatchEvent(new r.window.Event('click',{bubbles:true}));assert.equal(a.getAttribute('href'),href);
  }
  const a=r.document.createElement('a');a.href='register-worker.html';r.document.body.appendChild(a);a.dispatchEvent(new r.window.Event('click',{bubbles:true}));assertLocal(a.href,'bs');
});

test('Every HTML page references the refreshed runtime and CSS, with no private app URL',()=>{
  for(const file of readdirSync(root).filter(x=>x.endsWith('.html'))){const html=read(file);assert.ok(!/chatgpt\.site|signin-with-chatgpt/.test(html),file);if(html.includes('static/js/preview.js'))assert.ok(html.includes('static/js/preview.js?v=github-navigation-20261021'),file);}
  assert.ok(!/chatgpt\.site|signin-with-chatgpt|appUrl\(/.test(code));
  assert.ok(read('sw.js').includes('workify-public-people-20261022'));
});
