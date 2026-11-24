/* VEGANFARM accessible light-theme audit helper: no data/backend access. */
(function(){
 'use strict';
 function apply(){
   document.documentElement.setAttribute('data-vf-theme','light');
   var app=document.getElementById('app');
   if(!app||app.dataset.vfLightObserver==='1')return;
   app.dataset.vfLightObserver='1';
   var observer=new MutationObserver(function(){
     app.querySelectorAll('[style]').forEach(function(el){
       var bg=(el.style.backgroundColor||'').toLowerCase();
       if(bg && (bg.indexOf('rgb(0')===0 || /#0[0-9a-f]{5,6}|#1[0-9a-f]{5,6}|#2[0-9a-f]{5,6}/i.test(bg))){
         el.style.setProperty('background-color','#fffdf2','important');
       }
       var color=(el.style.color||'').toLowerCase();
       if(color && (/^white$|#fff(?:fff)?\b|rgb\(255,\s*255,\s*255\)/i.test(color))){
         el.style.setProperty('color','#285c31','important');
       }
     });
   });
   observer.observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
 window.addEventListener('hashchange',apply);
})();