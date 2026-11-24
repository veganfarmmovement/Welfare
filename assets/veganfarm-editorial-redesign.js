/* VEGANFARM new editorial site architecture. Existing data, routes and payment handlers remain the source of truth. */
(function(){
'use strict';
if(typeof P==='undefined'||typeof go!=='function')return;
var originalGo=go;
var navItems=[['home','Home'],['about','Our story'],['cases','Rescue cases'],['projects','Our work'],['impact','Impact'],['stories','Stories'],['volunteer','Volunteer'],['contact','Contact']];
function shell(){
 var menu=document.getElementById('menu');
 if(menu){
   var current=(location.hash||'#home').slice(1);
   menu.innerHTML=navItems.map(function(x){return '<a class="l '+(current===x[0]?'on':'')+'" href="#'+x[0]+'">'+x[1]+'</a>'}).join('')+
   '<details class="more"><summary>More +</summary><div class="mp"><a class="l" href="#education">Education</a><a class="l" href="#transparency">Transparency</a><a class="l" href="#veganfarm-team">Our team</a></div></details>';
 }
 var logo=document.querySelector('nav .logo');
 if(logo){logo.setAttribute('aria-label','VEGANFARM Movement — Home')}
 var footer=document.querySelector('footer .wrap');
 if(footer&&!footer.dataset.rebuilt){
   footer.dataset.rebuilt='1';
   footer.innerHTML='<div class="vf-footer-brand"><span class="vf-eyebrow">Independent welfare movement</span><h2 style="font:500 clamp(2.5rem,5vw,4.8rem) Playfair Display,serif;color:#fff9e8;margin:20px 0">Compassion is a practice.</h2><p>VEGANFARM Movement works across animal welfare, vegan awareness and education. We are an independent, currently unregistered welfare movement.</p><p>Founder &amp; Movement Lead · Harshit Dedhia</p></div><div><b>Explore</b><p><a href="#cases">Animal rescue appeals</a><br><a href="#projects">Our initiatives</a><br><a href="#impact">Our impact</a><br><a href="#volunteer">Volunteer with us</a><br><a href="#transparency">Financial transparency</a></p><b>Get in touch</b><p><a href="mailto:veganfarmmovement@gmail.com">veganfarmmovement@gmail.com</a><br><a href="#contact">Contact VEGANFARM</a></p><p><a href="#policy-privacy">Privacy</a> · <a href="#policy-donation">Donation policy</a> · <a href="#policy-refund">Refund</a> · <a href="#policy-terms">Terms</a></p></div><div class="vf-footer-bottom" style="grid-column:1/-1;border-top:1px solid rgba(255,255,255,.17);padding-top:22px;margin-top:25px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><span>© VEGANFARM Movement · Compassion in action</span><a href="#admin">Founder access</a></div>';
 }
}
function newHome(){
 var active='';
 try{active=CAMP(3)}catch(e){active='<p class="note">Current rescue appeals will appear here when available.</p>'}
 var projects='<div class="vf-work-grid"><a class="vf-work-tile" href="#cases"><span class="vf-work-no">01 / ANIMAL WELFARE</span><span class="vf-work-icon">♡</span><div><h3>Stand beside lives in need.</h3><p>Support independent rescuers with verified veterinary treatment and recovery costs.</p></div><span class="vf-work-arrow">↗</span></a><a class="vf-work-tile" href="#education"><span class="vf-work-no">02 / EDUCATION</span><span class="vf-work-icon">✳</span><div><h3>Open doors through learning.</h3><p>Support English-speaking education and learning opportunities at Maratha Aashram.</p></div><span class="vf-work-arrow">↗</span></a><a class="vf-work-tile" href="#about"><span class="vf-work-no">03 / VEGAN AWARENESS</span><span class="vf-work-icon">❋</span><div><h3>Make compassion a daily choice.</h3><p>Encourage kinder choices through awareness, dialogue and community participation.</p></div><span class="vf-work-arrow">↗</span></a></div>';
 return '<div class="vf-new-home">'+
 '<section class="vf-new-hero"><div class="vf-hero-orb"></div><div class="wrap vf-hero-inner"><div class="vf-hero-copy"><span class="vf-eyebrow">A movement built around compassion</span><h1>Every life deserves <em>kindness.</em></h1><p>We bring people together to support animal welfare, create access to education and make compassionate living part of everyday life.</p><div class="vf-hero-actions"><a class="vf-action primary" href="#cases">Support an animal</a><a class="vf-action secondary" href="#projects">Explore our work</a></div></div></div><div class="wrap vf-hero-foot"><span>VEGANFARM MOVEMENT · INDIA</span><span>Animal welfare / Education / Awareness</span></div></section>'+
 '<section class="vf-section paper"><div class="wrap vf-intro-grid"><div class="vf-intro-visual"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1100&q=85" alt="Dogs together outdoors" loading="lazy"></div><div class="vf-intro-copy"><span class="vf-eyebrow" style="color:#78884e">Who we are</span><h2>Compassion should move beyond words.</h2><p>VEGANFARM Movement is an independent welfare organisation led by Harshit Dedhia. We support animal rescuers with treatment funding, work to expand access to education and encourage informed, compassionate choices.</p><a class="vf-action primary" href="#about">Discover our story</a></div></div></section>'+
 '<section class="vf-section dark"><div class="wrap"><div class="vf-section-heading"><div><span class="vf-eyebrow">Where support is needed</span><h2>Be there when it matters.</h2></div><p>Explore active, Founder-approved animal rescue appeals. Fundraising totals reflect contributions verified and allocated in the VEGANFARM records.</p></div><div class="vf-campaign-grid">'+active+'</div><div style="margin-top:35px"><a class="vf-action secondary" href="#cases">View all rescue cases ↗</a></div><div class="vf-numberline"><div><b>01</b><span>One life at a time</span></div><div><b>Direct</b><span>Rescuer support</span></div><div><b>Verified</b><span>Donation records</span></div></div></div></section>'+
 '<section class="vf-section"><div class="wrap"><div class="vf-section-heading"><div><span class="vf-eyebrow" style="color:#78884e">Our focus</span><h2>Three ways to make a difference.</h2></div><p>Our work is shaped around practical action, long-term learning and everyday compassion.</p></div>'+projects+'</div></section>'+
 '<section class="vf-quote-band"><div class="wrap"><span class="vf-eyebrow" style="color:#78884e">The belief behind the work</span><blockquote>“A kinder world is not built in one moment. It is built through <em>the choices we make,</em> and the lives we choose to stand beside.”</blockquote></div></section>'+
 '<section class="vf-section paper"><div class="wrap"><div class="vf-section-heading"><div><span class="vf-eyebrow" style="color:#78884e">Accountability matters</span><h2>Every contribution deserves clarity.</h2></div><p>Donations are verified before they are counted. Case-level progress and financial policies are available to supporters.</p></div>'+ (typeof IMPACT==='function'?IMPACT():'')+'<div style="margin-top:30px"><a class="vf-action primary" href="#transparency">Explore transparency</a></div></div></section>'+
 '<section class="vf-cta-band"><div class="wrap"><span class="vf-eyebrow" style="color:#5c7040">Be part of the movement</span><h2>Small acts. Real lives. A kinder future.</h2><p>Whether you support an appeal, volunteer your time or help share the message, your participation can move compassion into action.</p><a class="vf-action primary" href="#volunteer">Get involved ↗</a></div></section>'+
 '</div>';
}
P.home=newHome;
function enhanceRoute(){
 var app=document.getElementById('app');if(!app)return;
 var h=(location.hash||'#home').slice(1);
 if(h==='home'||h===''){shell();return}
 if(h.startsWith('admin')||h.startsWith('team')){shell();return}
 shell();
 if(app.querySelector('.vf-route-shell'))return;
 var old=app.innerHTML;
 var tmp=document.createElement('div');tmp.innerHTML=old;
 var heading=tmp.querySelector('.sec.head');
 var title=heading?heading.querySelector('h1,h2'):null;
 var desc=heading?heading.querySelector('p'):null;
 var titleText=title?title.textContent.trim():({cases:'Rescue cases',about:'Our story',projects:'Our work',impact:'Our impact',education:'Education',stories:'Stories',volunteer:'Volunteer with us',contact:'Contact VEGANFARM',transparency:'Transparency'}[h]||h.replace(/-/g,' '));
 var descText=desc?desc.textContent.trim():'Explore the work, updates and ways to participate in the VEGANFARM Movement.';
 app.innerHTML='<div class="vf-route-shell"><section class="vf-route-top"><div class="wrap"><span class="eyebrow">VEGANFARM MOVEMENT / '+h.replace(/-/g,' ').toUpperCase()+'</span><h1>'+titleText.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})+'</h1><p>'+descText.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})+'</p></div></section><div class="vf-route-content"><div class="wrap">'+old+'</div></div></div>';
 }
}
go=function(keep){originalGo(keep);enhanceRoute();reveal()};
function reveal(){
 var nodes=document.querySelectorAll('#app .vf-route-content .card,#app .vf-new-home .vf-intro-grid,#app .vf-new-home .vf-work-tile,#app .vf-new-home .vf-section-heading');
 if(!('IntersectionObserver'in window)){nodes.forEach(function(n){n.classList.add('vf-visible')});return}
 var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vf-visible');io.unobserve(e.target)}})},{threshold:.08});
 nodes.forEach(function(n){n.classList.add('vf-reveal');io.observe(n)});
}
document.addEventListener('DOMContentLoaded',function(){shell();enhanceRoute();reveal()});
shell();
if((location.hash||'#home')==='#home'){document.getElementById('app').innerHTML=newHome();reveal()}
})();
