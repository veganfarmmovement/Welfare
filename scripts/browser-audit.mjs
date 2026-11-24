import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.VF_BASE_URL || 'http://127.0.0.1:4173/';
const widths = [360, 390, 430, 768, 1024, 1440, 1920];
const routes = [
  'home','about','cases','case-archived','projects','education','impact',
  'transparency','donate','volunteer','contact','stories',
  'policy-privacy','policy-donation','policy-refund','policy-terms',
  'policy-financial','policy-volunteer','team','admin',
  'admin-cases','admin-donations','admin-audit'
];
const languages = [
  ['en','ltr'],['hi','ltr'],['mr','ltr'],['gu','ltr'],['sd','rtl'],
  ['ur','rtl'],['fr','ltr'],['es','ltr'],['ko','ltr'],['ar','rtl']
];
const out = path.resolve('artifacts');
fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const report = {base,widths,routes,languages,routeChecks:[],languageChecks:[],menuChecks:[],errors:[],networkFailures:[],screenshots:[]};
let activeRoute='',activeWidth=0;
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message,stack:e.stack,route:activeRoute,width:activeWidth}));
page.on('response',r=>{if(r.status()>=400)report.networkFailures.push({status:r.status(),url:r.url(),route:activeRoute,width:activeWidth});});
page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text()})});

try {
  for (const width of widths) {
    activeWidth=width;
    await page.setViewportSize({width,height:1000});
    for (const route of routes) {
      activeRoute=route;
      const url = base + '#' + route;
      let item = {route,width,url,loaded:false,routeShell:false,overflow:false,images:{total:0,loaded:0,failed:0}};
      try {
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
        await page.locator('#app').waitFor({state:'attached',timeout:15000});
        await page.waitForTimeout(300);
        item.loaded = await page.locator('#app').evaluate(el=>el.innerText.trim().length>0);
        item.routeShell = route==='home' ? true : await page.locator('#app .vf-route-masthead').count()>0;
        item.overflow = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
        item.images = await page.locator('#app img').evaluateAll(imgs=>({total:imgs.length,loaded:imgs.filter(i=>i.complete&&i.naturalWidth>0).length,failed:imgs.filter(i=>i.complete&&i.naturalWidth===0).length}));
        if(!item.loaded) report.errors.push({type:'blank-route',route,width});
        if(!item.routeShell) report.errors.push({type:'missing-route-layout',route,width});
        if(item.overflow) report.errors.push({type:'horizontal-overflow',route,width,scrollWidth:await page.evaluate(()=>document.documentElement.scrollWidth),elements:await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).map(el=>({el,r:el.getBoundingClientRect()})).filter(x=>x.r.width>0&&x.r.right>window.innerWidth+1).slice(0,12).map(x=>({tag:x.el.tagName,id:x.el.id,className:String(x.el.className||'').slice(0,120),right:Math.round(x.r.right),width:Math.round(x.r.width),position:getComputedStyle(x.el).position}))) });
        if(item.images.failed>0) report.errors.push({type:'broken-images',route,width,failed:item.images.failed});
        if(route==='volunteer'||route==='contact'||route==='donate'){
          item.form=await page.locator('#app form').first().evaluate(el=>({onsubmit:el.getAttribute('onsubmit'),fields:Array.from(el.querySelectorAll('input,select,textarea')).map(x=>x.name).filter(Boolean),qr:!!document.querySelector('#app .vf-donate-qr')}));
          if(route==='volunteer'&&!String(item.form.onsubmit||'').includes("fsub(event,'vol')"))report.errors.push({type:'volunteer-form-handler-missing',route,width});
          if(route==='contact'&&!String(item.form.onsubmit||'').includes("fsub(event,'msg')"))report.errors.push({type:'contact-form-handler-missing',route,width});
          if(route==='donate'&&(!String(item.form.onsubmit||'').includes('donSubmit(event)')||!item.form.qr))report.errors.push({type:'donation-form-or-qr-missing',route,width});
        }
        if(route==='home'){
          await page.locator('#app .vf-motion-hero').waitFor({state:'visible',timeout:15000});
          await page.waitForFunction(()=>{const el=document.querySelector('#app .vf-motion-backdrop');return !!el&&getComputedStyle(el).backgroundImage.includes('images.unsplash.com')},undefined,{timeout:15000}).catch(()=>{});
          item.heroImage=await page.locator('#app .vf-motion-backdrop').evaluate(el=>getComputedStyle(el).backgroundImage);
          item.heroDiagnostic=await page.locator('#app .vf-motion-backdrop').evaluate(el=>({className:el.className,rect:(()=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})(),display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility,backgroundImage:getComputedStyle(el).backgroundImage,inlineStyle:el.getAttribute('style')}));
          if((!item.heroImage||item.heroImage==='none')&&width===360){
            await page.reload({waitUntil:'domcontentloaded',timeout:45000});
            await page.locator('#app .vf-motion-hero').waitFor({state:'visible',timeout:15000});
            await page.waitForFunction(()=>{const el=document.querySelector('#app .vf-motion-backdrop');return !!el&&getComputedStyle(el).backgroundImage.includes('images.unsplash.com')},undefined,{timeout:15000}).catch(()=>{});
            item.heroImage=await page.locator('#app .vf-motion-backdrop').evaluate(el=>getComputedStyle(el).backgroundImage);
            item.heroDiagnostic=await page.locator('#app .vf-motion-backdrop').evaluate(el=>({className:el.className,rect:(()=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})(),display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility,backgroundImage:getComputedStyle(el).backgroundImage,inlineStyle:el.getAttribute('style')}));
          }
          if(width===360)await page.screenshot({path:path.join(out,'screenshots','mobile-home-360.png'),fullPage:true,animations:'disabled'});
          if(!item.heroImage||item.heroImage==='none')report.errors.push({type:'hero-image-missing',width});
        }
        if(width===1440){
          item.navigationLinks=await page.locator('#menu a.l').count();
          if(item.navigationLinks<5)report.errors.push({type:'navigation-links-missing',route,count:item.navigationLinks});
          if(route==='donate'){
            item.qrImages=await page.locator('#app img').evaluateAll(imgs=>imgs.filter(i=>/QR|UPI/i.test(i.alt||'')||/^data:image/.test(i.src)).length);
            if(item.qrImages<1)report.errors.push({type:'donation-qr-not-found'});
          }
        }
        if(width===1440){
          const file=path.join(out,'screenshots',route+'.png');
          await page.screenshot({path:file,fullPage:true,animations:'disabled'});
          report.screenshots.push(file);
        }
      } catch(e) {
        item.error = e.message;
        report.errors.push({type:'route-exception',route,width,message:e.message});
      }
      report.routeChecks.push(item);
    }
  }

  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'#home',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#vf-language').waitFor({state:'visible',timeout:15000});
  for (const [code,dir] of languages) {
    activeRoute='language:'+code;activeWidth=390;
    await page.locator('#vf-language').selectOption(code);
    await page.waitForTimeout(80);
    const actual = await page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,notice:!!document.querySelector('[data-vf-translation-notice]')}));
    const expectedLang = code==='sd'?'sd-Arab':code;
    const ok = actual.lang===expectedLang && actual.dir===dir && (code==='en'?!actual.notice:actual.notice);
    report.languageChecks.push({code,dir,actual,ok});
    if(!ok) report.errors.push({type:'language-switch',code,expected:{lang:expectedLang,dir,notice:code!=='en'},actual});
    if(['sd','ur','ar'].includes(code)){
      const file=path.join(out,'screenshots','rtl-'+code+'.png');
      await page.screenshot({path:file,fullPage:true,animations:'disabled'});
      report.screenshots.push(file);
    }
  }
  await page.locator('#vf-language').selectOption('en');
  for(const route of ['home','donate']){
    activeRoute='mobile-screenshot:'+route;activeWidth=390;
    await page.goto(base+'#'+route,{waitUntil:'domcontentloaded',timeout:45000});
    await page.locator('#app').waitFor({state:'attached',timeout:15000});
    await page.waitForTimeout(500);
    const file=path.join(out,'screenshots','mobile-'+route+'-390.png');
    await page.screenshot({path:file,fullPage:true,animations:'disabled'});
    report.screenshots.push(file);
  }
  await page.goto(base+'#home',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#vf-language').waitFor({state:'visible',timeout:15000});
  const menuButton=page.locator('#mb');
  if(await menuButton.isVisible()){
    await menuButton.click();
    const open=await page.locator('#menu').evaluate(el=>el.classList.contains('open'));
    report.menuChecks.push({width:390,opens:open});
    if(!open)report.errors.push({type:'mobile-menu-not-opening'});
  } else {
    report.menuChecks.push({width:390,opens:false,notVisible:true});
    report.errors.push({type:'mobile-menu-button-not-visible'});
  }

  // Confirm the unauthenticated Founder route does not render privileged dashboard content.
  await page.goto(base+'#admin',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(250);
  const founderGate={route:'#admin',dashboardVisible:await page.locator('#app .adm').count()>0,bodyText:(await page.locator('#app').innerText()).slice(0,1200)};
  report.founderGate=founderGate;
  if(founderGate.dashboardVisible)report.errors.push({type:'founder-dashboard-visible-without-authentication'});

  fs.writeFileSync(path.join(out,'browser-audit.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({routeChecks:report.routeChecks.length,languageChecks:report.languageChecks,menuChecks:report.menuChecks,errorCount:report.errors.length,networkFailureCount:report.networkFailures.length,screenshots:report.screenshots.length,errors:report.errors,networkFailures:report.networkFailures},null,2));
} finally {
  await browser.close();
}
if(report.errors.length)process.exitCode=1;
