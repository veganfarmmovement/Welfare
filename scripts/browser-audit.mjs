import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base=process.env.VF_BASE_URL||'http://127.0.0.1:4173/';
const widths=[360,390,430,768,1024,1440,1920];
const routes=['home','about','cases','case-archived','projects','education','impact','transparency','donate','volunteer','contact','stories','policy-privacy','policy-donation','policy-refund','policy-terms','policy-financial','policy-volunteer','team','admin','admin-cases','admin-donations','admin-audit'];
const out=path.resolve('artifacts');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const report={base,widths,routes,routeChecks:[],errors:[],networkFailures:[],screenshots:[],englishOnlyCheck:null,menuChecks:[]};
let activeRoute='',activeWidth=0;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message,route:activeRoute,width:activeWidth}));
page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text(),route:activeRoute,width:activeWidth})});
page.on('response',r=>{if(r.status()>=400)report.networkFailures.push({status:r.status(),url:r.url(),route:activeRoute,width:activeWidth})});
const save=async(name,fullPage=true)=>{const file=path.join(out,'screenshots',name);await page.screenshot({path:file,fullPage,animations:'disabled'});report.screenshots.push(name)};
try{
 for(const width of widths){
  activeWidth=width;await page.setViewportSize({width,height:1000});
  for(const route of routes){
   activeRoute=route;const item={route,width,loaded:false,layout:false,overflow:false,images:{total:0,loaded:0,failed:0}};
   try{
    await page.goto(base+'#'+route,{waitUntil:'domcontentloaded',timeout:45000});
    await page.locator('#app').waitFor({state:'attached',timeout:15000});
    await page.waitForTimeout(180);
    item.loaded=await page.locator('#app').evaluate(e=>e.innerText.trim().length>0);
    item.layout=route==='home'?await page.locator('#app .vf2-home-hero').count()>0:
      (route==='team'?await page.locator('#vf-team-code').count()>0:
       route.startsWith('admin')?await page.locator('#app').innerText().then(t=>t.trim().length>0):
       await page.locator('#app .vf2-page-hero').count()>0);
    item.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    item.images=await page.locator('#app img').evaluateAll(imgs=>({total:imgs.length,loaded:imgs.filter(i=>i.complete&&i.naturalWidth>0).length,failed:imgs.filter(i=>i.complete&&i.naturalWidth===0).length}));
    if(!item.loaded)report.errors.push({type:'blank-route',route,width});
    if(!item.layout)report.errors.push({type:'missing-v2-layout',route,width});
    if(item.overflow)report.errors.push({type:'horizontal-overflow',route,width,scrollWidth:await page.evaluate(()=>document.documentElement.scrollWidth)});
    if(item.images.failed)report.errors.push({type:'broken-images',route,width,failed:item.images.failed});
    if(['volunteer','contact','donate'].includes(route)){
     item.form=await page.locator('#app form').first().evaluate(el=>({handler:el.getAttribute('onsubmit'),fields:Array.from(el.querySelectorAll('input,select,textarea')).map(x=>x.name).filter(Boolean)})).catch(()=>null);
     if(!item.form)report.errors.push({type:'form-missing',route,width});
     if(route==='volunteer'&&!String(item.form.handler||'').includes("fsub(event,'vol')"))report.errors.push({type:'volunteer-handler-missing',width});
     if(route==='contact'&&!String(item.form.handler||'').includes("fsub(event,'msg')"))report.errors.push({type:'contact-handler-missing',width});
     if(route==='donate'&&(!String(item.form.handler||'').includes('donSubmit(event)')||await page.locator('#app .vf-donate-qr').count()===0))report.errors.push({type:'donation-form-or-qr-missing',width});
    }
    if(width===1440)await save(route+'.png',true);
   }catch(e){item.error=e.message;report.errors.push({type:'route-exception',route,width,message:e.message})}
   report.routeChecks.push(item);
  }
 }
 activeRoute='english-only';activeWidth=390;await page.setViewportSize({width:390,height:844});await page.goto(base+'#home',{waitUntil:'domcontentloaded'});
 report.englishOnlyCheck=await page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,languageControls:document.querySelectorAll('#vf-language,.vf-language-control,[aria-label*="Choose language"],[data-language-selector]').length,translationScripts:Array.from(document.scripts).filter(s=>(s.src||'').includes('veganfarm-languages')).length,nonEnglishOptions:Array.from(document.querySelectorAll('select option')).filter(o=>/^(hi|mr|gu|ur|ar|fr|es|ko|sd)$/i.test(o.value)).length}));
 if(report.englishOnlyCheck.lang!=='en'||report.englishOnlyCheck.dir!=='ltr'||report.englishOnlyCheck.languageControls||report.englishOnlyCheck.translationScripts||report.englishOnlyCheck.nonEnglishOptions)report.errors.push({type:'english-only-check-failed',actual:report.englishOnlyCheck});
 await page.locator('#mb').click();const menuOpen=await page.locator('#menu').evaluate(e=>e.classList.contains('open'));report.menuChecks.push({width:390,opens:menuOpen});if(!menuOpen)report.errors.push({type:'mobile-menu-failed'});
 await save('home-mobile-390.png',true);
 await page.goto(base+'#donate',{waitUntil:'domcontentloaded'});await save('donate-mobile-390.png',true);
 await page.goto(base+'#team',{waitUntil:'domcontentloaded'});await page.locator('#vf-team-code').waitFor({state:'visible',timeout:15000});
 report.team=await page.evaluate(()=>{const c=document.querySelector('.vf-team-access-card'),w=document.querySelector('.vf-team-access-wrap'),b=document.querySelector('.vf-team-access-submit'),i=document.querySelector('#vf-team-code');const s=e=>e?{bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color,outline:getComputedStyle(e).outlineWidth}:null;return {heading:document.querySelector('#app h1')?.textContent||'',card:s(c),wrapper:s(w),button:s(b),input:s(i),buttonContrast:(()=>{if(!b)return 0;const rgb=x=>(x.match(/[\d.]+/g)||[]).slice(0,3).map(Number);const lum=x=>rgb(x).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const a=lum(getComputedStyle(b).color),z=lum(getComputedStyle(b).backgroundColor);return (Math.max(a,z)+.05)/(Math.min(a,z)+.05)})()}}});
 if(!report.team.heading.includes('Team Member')||!report.team.card||report.team.card.bg!=='rgb(255, 255, 255)'||report.team.buttonContrast<4.5)report.errors.push({type:'team-access-visual-failed',actual:report.team});
 await page.locator('#vf-team-code').focus();const focus=await page.locator('#vf-team-code').evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth)>=3);if(!focus)report.errors.push({type:'team-focus-style-missing'});
 await save('team-access-mobile.png',true);await page.setViewportSize({width:1440,height:1000});await save('team-access-desktop.png',true);
 await page.goto(base+'#admin',{waitUntil:'domcontentloaded'});await page.waitForTimeout(200);report.founderGate={dashboardVisible:await page.locator('#app .adm').count()>0,bodyText:(await page.locator('#app').innerText()).slice(0,700)};if(report.founderGate.dashboardVisible)report.errors.push({type:'unauthenticated-founder-dashboard-visible'});
 // Capture a production baseline screenshot for visual comparison; it is never used as the test target.
 try{await page.goto('https://veganfarmmovement.github.io/Welfare/',{waitUntil:'domcontentloaded',timeout:20000});await page.waitForTimeout(500);await save('before-production-homepage.png',false)}catch(e){report.baselineScreenshotUnavailable=e.message}
 fs.writeFileSync(path.join(out,'browser-audit.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({routeChecks:report.routeChecks.length,errors:report.errors,networkFailures:report.networkFailures.length,screenshots:report.screenshots.length,englishOnlyCheck:report.englishOnlyCheck,menuChecks:report.menuChecks,team:report.team,founderGate:report.founderGate},null,2));
}finally{await browser.close()}
if(report.errors.length||report.networkFailures.length)process.exitCode=1;
