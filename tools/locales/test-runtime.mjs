// Run with linkedom available, or WORKIFY_TEST_TOOLS pointing to its npm project.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(process.env.WORKIFY_TEST_TOOLS ? path.join(process.env.WORKIFY_TEST_TOOLS,'package.json') : import.meta.url);
const {parseHTML}=require('linkedom');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=JSON.parse(read('static/locales/site-source.json'));
const code=read('static/js/preview.js');
const pages=JSON.parse(read('tools/locales/pages.json'));
const locales=process.argv.slice(2).length ? process.argv.slice(2) : 'bs en ar bn fil fr ka de hi ky ne ru sw tg ur uz'.split(' ');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function render(file,locale,saved) {
  const {window,document}=parseHTML(read(file));
  // Linkedom splits character entities into adjacent text nodes; browser HTML parsers do not.
  document.normalize();
  const url=new URL('https://itstefandjukaric-maker.github.io/Workify/'+file+(locale?'?lang='+locale:''));
  Object.defineProperty(document,'baseURI',{value:url.href});
  const storage=new Map(saved ? [['workify-site-language',saved]] : []);
  const redirects=[];
  const location={href:url.href,pathname:url.pathname,search:url.search,origin:url.origin,replace:u=>redirects.push(u)};
  const localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
  const fetch=async resource=>{
    const relative=new URL(resource,url).pathname.replace('/Workify/','');
    try { const body=read(relative);return {ok:true,json:async()=>JSON.parse(body)}; }
    catch {return {ok:false};}
  };
  window.fetch=fetch;
  const context=vm.createContext({window,document,location,localStorage,URL,URLSearchParams,fetch,navigator:{},HTMLFormElement:window.HTMLFormElement,MutationObserver:window.MutationObserver,setTimeout,clearTimeout,console});
  vm.runInContext(code,context);
  await flush();await flush();
  return {window,document,redirects,storage};
}
let checks=0;
for(const locale of locales) {
  const catalog=['bs','en'].includes(locale)?null:JSON.parse(read('static/locales/site-'+locale+'.json'));
  for(const enFile of pages) {
    const file=locale==='bs'?enFile.replace(/^en-/,''):enFile;
    const {document,redirects,storage}=await render(file,locale);
    assert.equal(redirects.length,0,file+'/'+locale);
    assert.equal(document.documentElement.lang,locale);
    assert.equal(document.documentElement.dir,['ar','ur'].includes(locale)?'rtl':'ltr');
    assert.equal(storage.get('workify-site-language'),locale);
    if(catalog)assert.equal(document.documentElement.getAttribute('data-workify-language-ready'),locale,file+'/'+locale+' loaded');
    for(const link of document.querySelectorAll('.lang-menu a[lang],.footer-langs a[lang]')) {
      const target=new URL(link.href);
      assert.equal(target.origin,'https://itstefandjukaric-maker.github.io');
      assert.equal(target.searchParams.get('lang'),link.lang);
      assert.equal(target.pathname.split('/').pop().replace(/^en-/,''),enFile.replace(/^en-/,''));
      assert.equal(link.hasAttribute('data-pv-lang'),false);
    }
    for(const link of document.querySelectorAll('a[data-workify-app]'))assert.equal(new URL(link.href).searchParams.get('lang'),locale);
    if(catalog) {
      const original=parseHTML(read(file)).document;
      const oldTitle=original.querySelector('title').textContent.trim();
      const titleId=Object.keys(source).find(key=>source[key]===oldTitle);
      assert.ok(titleId,file+' title extracted');
      assert.equal(document.querySelector('title').textContent.trim(),catalog[titleId]);
      const bot=document.createElement('div');bot.className='assist-msg bot';bot.textContent='This feature is currently unavailable. No data was sent.';
      document.body.appendChild(bot);await flush();
      const messageId=Object.keys(source).find(k=>source[k]=== 'This feature is currently unavailable. No data was sent.');
      assert.equal(bot.textContent,catalog[messageId]);
      const me=document.createElement('div');me.className='assist-msg me';me.textContent='This feature is currently unavailable. No data was sent.';
      document.body.appendChild(me);await flush();assert.equal(me.textContent,'This feature is currently unavailable. No data was sent.');
      const assist=document.querySelector('[data-assistant]');
      if(assist)assert.ok(assist.getAttribute('data-faq-url').includes('faq-'+locale+'.json'));
    }
    checks++;
  }
  console.log(locale+': '+pages.length+' public pages, language links, title, direction and dynamic content passed');
}
for(const [file,explicit,saved,expected] of [['index.html','de',null,'en-index.html?lang=de'],['en-guides.html',null,'bs','guides.html?lang=bs'],['index.html','invalid','fr','en-index.html?lang=fr']]) {
 const {redirects}=await render(file,explicit,saved);assert.ok(redirects[0].endsWith(expected));
}
const fallback=await render('en-index.html','zz');assert.equal(fallback.document.documentElement.lang,'en');
console.log(checks+' page/locale combinations passed; remembered language, explicit choice and invalid-language fallback passed.');
