/* VEGANFARM luxury experience layer — preserves original routes, forms, case data and payment logic. */
(function(){
'use strict';
if(typeof P==='undefined'||typeof go!=='function')return;
var priorGo=go;
function home(){
 var campaigns='';try{campaigns=CAMP(3)}catch(e){campaigns='<div class="card"><p>Active rescue appeals will appear here when they are approved for public display.</p></div>'}
 var impact='';try{impact=typeof IMPACT==='function'?IMPACT():''}catch(e){}
 return '<div class="vf-lux-home">'+
 '<section class="vf-cinema"><div class="vf-cinema-grain"></div><div class="vf-cinema-inner"><div class="vf-cinema-copy"><span class="vf-kicker">A movement built around compassion</span><h1>Make room for <em>kindness.</em></h1><p>Standing beside animals in need, opening doors through education and bringing compassionate choices into everyday life.</p><div class="vf-cinema-actions"><a class="vf-cinema-btn primary" href="#cases">Support an animal <span>↗</span></a><a class="vf-cinema-btn ghost" href="#about">Discover our movement</a></div></div></div><div class="vf-cinema-bottom"><span>VEGANFARM MOVEMENT · INDIA</span><span class="vf-cinema-scroll">Scroll to explore</span></div></section>'+
 '<section class="vf-section"><div class="wrap vf-story-grid"><div class="vf-story-photo"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=88" alt="Dogs standing together outdoors" loading="lazy"><span class="vf-photo-caption">Compassion in action · Every life matters</span></div><div class="vf-story-copy"><span class="vf-kicker">Who we are</span><h2>Care should never stop at good intentions.</h2><p>VEGANFARM Movement is an independent, unofficial welfare organisation led by Harshit Dedhia. We support independent animal rescuers with treatment funding, work to expand access to education and encourage informed, compassionate living.</p><p>Our work is rooted in practical help, accountability and the belief that meaningful change is built one action at a time.</p><a class="vf-text-link" href="#about">The story behind the movement <span>↗</span></a></div></div></section>'+
 '<section class="vf-section vf-dark-section"><div class="wrap"><div class="vf-section-head"><div><span class="vf-kicker">Where support is needed</span><h2>Stand beside a life in need.</h2></div><p>Explore active, Founder-approved rescue appeals. Public fundraising totals are based on contributions verified in the VEGANFARM records.</p></div><div class="vf-campaign-grid">'+campaigns+'</div><div class="vf-metrics"><div class="vf-metric"><strong>One life</strong><span>At a time</span></div><div class="vf-metric"><strong>Direct</strong><span>Rescuer support</span></div><div class="vf-metric"><strong>Accountable</strong><span>Clear case records</span></div></div><div style="margin-top:34px"><a class="vf-cinema-btn ghost" href="#cases">Explore rescue appeals ↗</a></div></div></section>'+
 '<section class="vf-section"><div class="wrap"><div class="vf-section-head"><div><span class="vf-kicker">What we work for</span><h2>Three commitments. One compassionate future.</h2></div><p>We focus on practical support and lasting change across animal welfare, education and vegan awareness.</p></div><div class="vf-work-grid"><a class="vf-work-card" href="#cases"><span class="vf-work-index">01 / ANIMAL WELFARE</span><span class="vf-work-symbol">♡</span><div><h3>Stand beside animals in need.</h3><p>Support independent rescuers with veterinary treatment and recovery costs.</p></div><span class="vf-work-arrow">Explore rescue support <b>↗</b></span></a><a class="vf-work-card" href="#education"><span class="vf-work-index">02 / EDUCATION</span><span class="vf-work-symbol">✳</span><div><h3>Make learning more accessible.</h3><p>Support English-speaking education and learning opportunities at Maratha Aashram.</p></div><span class="vf-work-arrow">Explore education <b>↗</b></span></a><a class="vf-work-card" href="#about"><span class="vf-work-index">03 / VEGAN AWARENESS</span><span class="vf-work-symbol">❋</span><div><h3>Make compassion a daily choice.</h3><p>Encourage informed, kinder choices through awareness and community participation.</p></div><span class="vf-work-arrow">Discover our approach <b>↗</b></span></a></div></div></section>'+
 '<section class="vf-quote-section"><div class="wrap"><span class="vf-kicker">The belief behind the work</span><blockquote>“A kinder world is built through <em>the lives we choose to stand beside.</em>”</blockquote></div></section>'+
 '<section class="vf-section vf-impact-section"><div class="wrap"><div class="vf-section-head"><div><span class="vf-kicker">Accountability matters</span><h2>Every contribution deserves clarity.</h2></div><p>We aim to make support understandable through case updates, verified totals and clear public policies.</p></div>'+impact+'<a class="vf-text-link" href="#transparency">View financial transparency <span>↗</span></a></div></section>'+
 '<section class="vf-join-section"><div class="wrap vf-join-inner"><span class="vf-kicker">Be part of the movement</span><h2>Let compassion become action.</h2><p>Support an appeal, volunteer your time or help share the message. Every thoughtful contribution helps move the work forward.</p><a class="vf-cinema-btn primary" href="#volunteer">Get involved <span>↗</span></a></div></section>'+
 '</div>';
}
P.home=home;
var nav=[['home','Home'],['about','Our story'],['cases','Rescue appeals'],['projects','Our work'],['education','Education'],['impact','Impact'],['stories','Stories'],['volunteer','Volunteer'],['transparency','Transparency'],['contact','Contact'],['team','Our team']];
function updateNav(){
 var menu=document.getElementById('menu');if(!menu)return;
 var current=(location.hash||'#home').slice(1);
 menu.innerHTML=nav.map(function(x){return '<a class="l '+(current===x[0]?'on':'')+'" href="#'+x[0]+'">'+x[1]+'</a>'}).join('');
}
function footer(){
 var f=document.querySelector('footer .wrap');if(!f||f.dataset.vfLuxury==='1')return;
 f.dataset.vfLuxury='1';
 f.innerHTML='<div class="vf-footer-brand"><span class="vf-kicker">Independent welfare movement</span><h2 style="font-size:clamp(2.8rem,5vw,4.8rem);color:#f4efdf;margin:24px 0">Compassion is a practice.</h2><p>VEGANFARM Movement works across animal welfare, vegan awareness and education. It is an independent, unofficial welfare organisation. Niswarth Seva 1008 Charitable Trust is a separate registered organisation.</p><p>Founder &amp; Movement Lead</p></div><div><b>Explore</b><p><a href="#cases">Animal rescue appeals</a><br><a href="#projects">Our initiatives</a><br><a href="#education">Education</a><br><a href="#impact">Our impact</a><br><a href="#volunteer">Volunteer with us</a><br><a href="#transparency">Financial transparency</a></p><b>Contact</b><p><a href="mailto:veganfarmmovement@gmail.com">veganfarmmovement@gmail.com</a><br><a href="#contact">Contact VEGANFARM</a></p><p><a href="#policy-privacy">Privacy</a> · <a href="#policy-donation">Donation</a> · <a href="#policy-refund">Refund</a> · <a href="#policy-terms">Terms</a> · <a href="#policy-financial">Financial policy</a></p></div><div class="vf-footer-bottom" style="grid-column:1/-1;border-top:1px solid rgba(255,255,255,.16);padding-top:22px;margin-top:28px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><span>© VEGANFARM Movement · Compassion in action</span><a href="#admin">Founder access</a></div>';
}
function animate(){
 var els=document.querySelectorAll('#app .vf-story-grid,#app .vf-section-head,#app .vf-work-card,#app .vf-campaign-grid .card');
 if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('vf-visible')});return}
 var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vf-visible');io.unobserve(e.target)}})},{threshold:.08});
 els.forEach(function(e){e.classList.add('vf-reveal');io.observe(e)});
}
function afterRoute(){
 updateNav();footer();
 var app=document.getElementById('app');if(!app)return;
 if((location.hash||'#home')==='#home'||location.hash===''){app.innerHTML=home()}
 animate();
}
go=function(keep){priorGo(keep);afterRoute()};
document.addEventListener('DOMContentLoaded',afterRoute);
updateNav();footer();
if((location.hash||'#home')==='#home'||location.hash===''){var a=document.getElementById('app');if(a)a.innerHTML=home()}
animate();
})();