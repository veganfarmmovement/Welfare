/* VEGANFARM reliability + homepage visual layer. Does not replace app logic or database flows. */
(function(){
  'use strict';
  var APP_ID='app';
  function byId(id){return document.getElementById(id)}
  function addHomeVisuals(){
    var app=byId(APP_ID),hero=app&&app.querySelector('.hero');
    if(!hero||byId('vf-modern-visuals'))return;
    var section=document.createElement('section');
    section.id='vf-modern-visuals';
    section.setAttribute('aria-label','VEGANFARM initiatives');
    section.innerHTML=
      '<div class="wrap">'+
        '<div class="vf-visual-heading"><h2>Compassion in action</h2><p>Three connected areas of community-led work.</p></div>'+
        '<div class="vf-visual-grid">'+
          '<a class="vf-visual-card" href="#cases"><img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=82" alt="Dog outdoors" loading="lazy" decoding="async"><div class="vf-visual-copy"><span>Animal welfare</span><h3>Care for every life</h3></div></a>'+
          '<a class="vf-visual-card" href="#education"><img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=82" alt="Notebook and writing materials" loading="lazy" decoding="async"><div class="vf-visual-copy"><span>Education</span><h3>Learning creates opportunity</h3></div></a>'+
          '<a class="vf-visual-card" href="#projects"><img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=82" alt="Fresh plant-based meal" loading="lazy" decoding="async"><div class="vf-visual-copy"><span>Vegan awareness</span><h3>Choose compassion daily</h3></div></a>'+
        '</div>'+
      '</div>';
    hero.insertAdjacentElement('afterend',section);
  }
  function checkApp(){
    var app=byId(APP_ID);
    if(!app)return;
    if(app.innerHTML.trim())return;
    app.innerHTML='<section class="vf-load-fallback" role="status"><h2>VEGANFARM is taking longer than expected</h2><p>The page could not finish starting. Check your connection and try again. Your saved records have not been changed.</p><button class="btn" type="button" id="vf-retry-load">Try again</button></section>';
    var b=byId('vf-retry-load');
    if(b)b.addEventListener('click',function(){location.reload()});
  }
  function reportError(event){
    try{
      console.error('[VEGANFARM] Application error:',event&&event.message||event);
      var app=byId(APP_ID);
      if(app&&!app.innerHTML.trim())checkApp();
    }catch(_){}
  }
  window.addEventListener('error',reportError);
  window.addEventListener('unhandledrejection',function(event){
    console.error('[VEGANFARM] Unhandled async error:',event&&event.reason||event);
  });
  function enhance(){
    addHomeVisuals();
    var app=byId(APP_ID);
    if(app&&app.dataset.vfObserver!=='1'&&window.MutationObserver){
      app.dataset.vfObserver='1';
      new MutationObserver(function(){addHomeVisuals()}).observe(app,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});
  else enhance();
  window.addEventListener('hashchange',function(){setTimeout(enhance,0)});
  window.addEventListener('pageshow',function(){setTimeout(enhance,0)});
  window.setTimeout(function(){checkApp();enhance()},9000);
})();
