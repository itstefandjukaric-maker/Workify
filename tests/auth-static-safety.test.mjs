import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(process.env.WORKIFY_TEST_TOOLS ? path.join(process.env.WORKIFY_TEST_TOOLS,'package.json') : import.meta.url);
const {parseHTML}=require('linkedom');
const read=file=>readFileSync(path.join(root,file),'utf8');
const pages=['login','login-phone','forgot','register-worker','register-employer','register-agency'];
const files=['','en-'].flatMap(prefix=>pages.map(page=>prefix+page+'.html'));
const noticeText={
  bs:'Prijava i registracija još nisu omogućene. Ne unosite lične podatke.',
  en:'Login and registration are not enabled yet. Do not enter personal information.'
};
const code=read('static/js/preview.js');

function assertNoPersonalDataEntry(document,file) {
  const form=document.querySelector('main form');assert.ok(form,file+' has its auth form');
  const controls=[...form.querySelectorAll('input,select,textarea,button')];
  assert.ok(controls.length>=3,file+' retains the form controls');
  for(const control of controls){
    // Business role and step navigation are display-only controls.
    if(control.matches('input[type=radio][name=kind],button[type=button]'))continue;
    assert.ok(control.hasAttribute('disabled'),file+': '+(control.name||control.type||control.tagName)+' must be disabled in the source HTML');
  }
  const submit=form.querySelector('button[type=submit],input[type=submit]');
  assert.ok(submit?.hasAttribute('disabled'),file+' cannot submit through an enabled native submit control');
  assert.equal(form.querySelector('[contenteditable=true]'),null,file+' has no alternate editable data entry');
  // Disabled controls are not successful form controls in a native submission.
  const enabledNamed=[...form.querySelectorAll('[name]')].filter(control=>!control.hasAttribute('disabled'));
  assert.ok(enabledNamed.every(control=>control.matches('input[type=radio][name=kind]')),file+' has no enabled personal data payload');
}

test('Auth pages fail closed in the original HTML when all scripts fail or are disabled',()=>{
  for(const file of files){
    const {document}=parseHTML(read(file));
    assertNoPersonalDataEntry(document,file);
    const notices=document.querySelectorAll('main .pv-auth-notice');assert.equal(notices.length,1,file);
    const notice=notices[0];
    assert.equal(notice.textContent,noticeText[file.startsWith('en-')?'en':'bs'],file);
    assert.equal(notice.closest('[hidden],[inert],template,noscript'),null,file+' notice is ordinary visible HTML');
    assert.equal(notice.getAttribute('role'),'status',file);
    const form=document.querySelector('main form');
    assert.equal(form.previousElementSibling,notice,file+' shows notice before collecting any data');
    assert.ok(form.getAttribute('aria-describedby').split(/\s+/).includes(notice.id),file+' associates availability notice with form');
  }
});

test('Static business role selection, account navigation and legal links remain available',()=>{
  for(const prefix of ['', 'en-']){
    for(const role of ['agency','employer']){
      const file=prefix+'register-'+role+'.html', {document}=parseHTML(read(file));
      const choices=[...document.querySelectorAll('main input[name=kind]')];
      assert.deepEqual(choices.map(input=>input.value),['agency','employer'],file);
      for(const input of choices){
        assert.equal(input.hasAttribute('disabled'),false,file);
        assert.equal(input.closest('fieldset[disabled]'),null,file);
        assert.equal(input.hasAttribute('checked'),input.value===role,file);
      }
      for(const legal of ['terms-business','terms','privacy']){
        const link=document.querySelector('main a[href="'+prefix+legal+'.html"]');
        assert.ok(link,file+' preserves '+legal+' link');
        assert.equal(link.closest('[inert]'),null,file);
      }
    }
    const {document}=parseHTML(read(prefix+'login.html'));
    for(const target of ['forgot','login-phone','register-worker','register-agency'])assert.ok(document.querySelector('main a[href="'+prefix+target+'.html"]'),target);
    const picker=parseHTML(read(prefix+'register.html')).document;
    assert.equal(picker.querySelector('main form'),null,'Role selection page does not collect personal data');
  }
});

async function runPreview(file,lang){
  const {window,document}=parseHTML(read(file));document.normalize();
  const url=new URL('https://itstefandjukaric-maker.github.io/Workify/'+file+'?lang='+lang);
  Object.defineProperty(document,'baseURI',{value:url.href});
  const location={href:url.href,pathname:url.pathname,search:url.search,origin:url.origin,replace(){assert.fail('Unexpected redirect');}};
  const fetch=async resource=>{
    const file=new URL(resource,url).pathname.replace('/Workify/','');
    return {ok:existsSync(path.join(root,file)),json:async()=>JSON.parse(read(file))};
  };
  class HTMLFormElement {}
  window.HTMLFormElement=HTMLFormElement;window.fetch=fetch;
  const context=vm.createContext({window,document,location,URL,URLSearchParams,fetch,navigator:{},HTMLFormElement,
    localStorage:{getItem(){return null;},setItem(){}},MutationObserver:window.MutationObserver,setTimeout:()=>0,clearTimeout(){}});
  vm.runInContext(code,context);
  await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
  return document;
}

test('Runtime reuses the static availability notice and keeps native auth controls disabled',async()=>{
  for(const file of files){
    const lang=file.startsWith('en-')?'en':'bs',document=await runPreview(file,lang);
    assertNoPersonalDataEntry(document,file);
    assert.equal(document.querySelectorAll('main .pv-auth-notice').length,1,file);
    assert.equal(document.querySelector('#auth-availability-notice').textContent,noticeText[lang],file);
  }
});

test('Existing localized notices replace the fallback without duplication',async()=>{
  const expected={
    de:'Anmeldung und Registrierung sind noch nicht verfügbar. Bitte keine persönlichen Daten eingeben.',
    ar:'تسجيل الدخول وإنشاء الحساب غير متاحين بعد. لا تدخل معلومات شخصية.',
    ur:'لاگ ان اور رجسٹریشن ابھی دستیاب نہیں ہیں۔ ذاتی معلومات درج نہ کریں۔'
  };
  for(const [lang,text] of Object.entries(expected)){
    const document=await runPreview('en-register-agency.html',lang);
    assert.equal(document.querySelectorAll('main .pv-auth-notice').length,1,lang);
    assert.equal(document.querySelector('#auth-availability-notice').textContent,text,lang);
    assertNoPersonalDataEntry(document,'en-register-agency.html/'+lang);
  }
});
