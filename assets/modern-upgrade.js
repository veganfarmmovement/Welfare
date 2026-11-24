/* VEGANFARM premium experience layer — progressive enhancement only. */
(function(){
 'use strict';
 var APP_ID='app';
 function byId(id){return document.getElementById(id)}
 function addHomeVisuals(){
  var app=byId(APP_ID);
  if(!app)return;
  addMotionElements(app);
 }
 function addMotionElements(app){
  if(!byId('vf-scroll-progress')){var progress=document.createElement('div');progress.id='vf-scroll-progress';progress.setAttribute('aria-hidden','true');document.body.appendChild(progress);}
  if(!byId('vf-floating-donate')){
   var floating=document.createElement('a');floating.id='vf-floating-donate';floating.href='#donate';
   floating.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg> Support an initiative';
   document.body.appendChild(floating);
  }
  setupScroll();
  setupReveal(app);
  setupButtons(app);
  setupTilt(app);
  setupMagnetic(app);
  setupHeroParallax(app);
 }
 var scrollBound=false;
 function setupScroll(){
  if(scrollBound)return;scrollBound=true;
  var nav=document.querySelector('nav'),progress=byId('vf-scroll-progress');
  function update(){
   var max=document.documentElement.scrollHeight-window.innerHeight;
   if(progress)progress.style.width=(max>0?Math.min(100,window.scrollY/max*100):0)+'%';
   if(nav)nav.classList.toggle('vf-scrolled',window.scrollY>12);
  }
  window.addEventListener('scroll',update,{passive:true});update();
 }
 function setupReveal(root){
  if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var nodes=root.querySelectorAll('.sec,.card,.stats,.kpi');
  nodes.forEach(function(node,i){
   if(node.classList.contains('vf-reveal'))return;
   node.classList.add('vf-reveal');
   if(node.matches('.vf-visual-card,.card'))node.setAttribute('data-vf-delay',String(i%4));
  });
  if(!window.__vfRevealObserver){
   window.__vfRevealObserver=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('vf-visible');window.__vfRevealObserver.unobserve(entry.target);}});
   },{threshold:.12,rootMargin:'0px 0px -35px 0px'});
  }
  nodes.forEach(function(node){if(!node.classList.contains('vf-visible'))window.__vfRevealObserver.observe(node);});
 }
 function setupButtons(root){
  if(root.dataset.vfButtons==='1')return;root.dataset.vfButtons='1';
  root.addEventListener('click',function(e){
   var b=e.target.closest('.btn');if(!b||b.disabled)return;
   var rect=b.getBoundingClientRect(),size=Math.max(rect.width,rect.height),r=document.createElement('span');
   r.className='vf-ripple';r.style.width=r.style.height=size+'px';
   r.style.left=(e.clientX-rect.left-size/2)+'px';r.style.top=(e.clientY-rect.top-size/2)+'px';
   b.appendChild(r);setTimeout(function(){r.remove()},650);
  });
 }
 function setupTilt(root){
  if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  root.querySelectorAll('.card,.kpi').forEach(function(card){
   if(card.dataset.vfTilt==='1')return;card.dataset.vfTilt='1';
   card.addEventListener('pointermove',function(e){
    var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    card.style.transform='perspective(900px) rotateX('+(-y*3)+'deg) rotateY('+(x*3)+'deg) translateY(-3px)';
   });
   card.addEventListener('pointerleave',function(){card.style.transform='';});
  });
 }

 function setupMagnetic(root){
  if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  root.querySelectorAll('.btn,#vf-floating-donate').forEach(function(button){
   if(button.dataset.vfMagnetic==='1')return;button.dataset.vfMagnetic='1';button.classList.add('vf-magnetic');
   button.addEventListener('pointermove',function(e){
    var r=button.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    button.style.setProperty('--vf-mx',(dx*.10).toFixed(1)+'px');
    button.style.setProperty('--vf-my',(dy*.10).toFixed(1)+'px');
   });
   button.addEventListener('pointerleave',function(){button.style.setProperty('--vf-mx','0px');button.style.setProperty('--vf-my','0px');});
  });
 }
 function setupHeroParallax(root){
  var hero=root.querySelector('.hero');
  if(!hero||hero.dataset.vfParallax==='1'||!window.matchMedia('(hover:hover) and (pointer:fine)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  hero.dataset.vfParallax='1';
  hero.addEventListener('pointermove',function(e){
   var r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
   hero.style.setProperty('--vf-pointer-x',(x*1.8).toFixed(2)+'%');
   hero.style.setProperty('--vf-pointer-y',(y*1.8).toFixed(2)+'%');
   hero.style.backgroundPosition='center 48%,calc(50% + '+(x*16).toFixed(1)+'px) calc(48% + '+(y*12).toFixed(1)+'px)';
  });
  hero.addEventListener('pointerleave',function(){hero.style.backgroundPosition='';});
 }

 function checkApp(){
  var app=byId(APP_ID);if(!app||app.innerHTML.trim())return;
  app.innerHTML='<section class="vf-load-fallback" role="status"><h2>VEGANFARM is taking longer than expected</h2><p>The page could not finish starting. Check your connection and try again. Your saved records have not been changed.</p><button class="btn" type="button" id="vf-retry-load">Try again</button></section>';
  var b=byId('vf-retry-load');if(b)b.addEventListener('click',function(){location.reload();});
 }
 function enhance(){var app=byId(APP_ID);if(!app)return;addHomeVisuals();if(app.dataset.vfObserver!=='1'&&window.MutationObserver){app.dataset.vfObserver='1';new MutationObserver(function(){addHomeVisuals();}).observe(app,{childList:true,subtree:true});}}
 window.addEventListener('error',function(e){console.error('[VEGANFARM] Application error:',e&&e.message||e);});
 window.addEventListener('unhandledrejection',function(e){console.error('[VEGANFARM] Unhandled async error:',e&&e.reason||e);});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
 window.addEventListener('hashchange',function(){setTimeout(enhance,0);});
 window.addEventListener('pageshow',function(){setTimeout(enhance,0);});
 window.setTimeout(function(){checkApp();enhance();},9000);
})();
