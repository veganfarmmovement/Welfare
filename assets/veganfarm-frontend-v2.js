/* VEGANFARM Frontend V2 — one presentation owner, existing data/auth/payment layer retained. */
(function(){
'use strict';
if(typeof P==='undefined'||typeof go!=='function')return;
var coreGo=go, app=document.getElementById('app');
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var routeMeta={
 about:{eyebrow:'THE MOVEMENT',title:'Care should be visible in what we do.',copy:'An independent welfare movement working across animal welfare, education and compassionate living.',image:'photo-1450778869180-41d0601e046e'},
 cases:{eyebrow:'ANIMAL WELFARE',title:'Every life deserves a chance.',copy:'Explore current, Founder-approved rescue appeals and the verified support each case needs.',image:'photo-1552053831-71594a27632d'},
 projects:{eyebrow:'OUR WORK',title:'Practical action. Meaningful change.',copy:'A closer look at the animal-welfare and education initiatives supported by the movement.',image:'photo-1450778869180-41d0601e046e'},
 education:{eyebrow:'LEARNING INITIATIVE',title:'Learning opens new possibilities.',copy:'Supporting English-speaking learning sessions at Maratha Aashram, Virar.',image:'photo-1524178232363-1fb2b075b655'},
 impact:{eyebrow:'OUR IMPACT',title:'Progress, reported with care.',copy:'Published activity and verified rescue progress, without overstating outcomes.',image:'photo-1529390079861-591de354faf5'},
 transparency:{eyebrow:'ACCOUNTABILITY',title:'Trust is built through clarity.',copy:'Understand how contributions are checked, allocated and reflected in published appeal progress.',image:'photo-1497366754035-f200968a6e72'},
 donate:{eyebrow:'SUPPORT THE WORK',title:'Turn compassion into action.',copy:'Review the named beneficiary, payment details and current initiative before contributing.',image:'photo-1450778869180-41d0601e046e'},
 volunteer:{eyebrow:'JOIN THE MOVEMENT',title:'Bring your time. Bring your skills.',copy:'Tell us how you would like to contribute to animal welfare and education.',image:'photo-1559027615-cd4628902d4a'},
 contact:{eyebrow:'GET IN TOUCH',title:'Let’s make the next step clear.',copy:'Contact VEGANFARM Movement about appeals, volunteering, education or donation verification.',image:'photo-1521737711867-e3b97375f902'},
 stories:{eyebrow:'FIELD NOTES',title:'Stories of care and community.',copy:'Updates about work and activity shared by VEGANFARM Movement.',image:'photo-1529390079861-591de354faf5'},
 'policy-privacy':{eyebrow:'GOVERNANCE',title:'Privacy policy',copy:'How information submitted through this website is handled.',image:'photo-1497366754035-f200968a6e72'},
 'policy-donation':{eyebrow:'GOVERNANCE',title:'Donation policy',copy:'Important information about contributions and verification.',image:'photo-1497366754035-f200968a6e72'},
 'policy-refund':{eyebrow:'GOVERNANCE',title:'Refund policy',copy:'Information about payment enquiries and refund requests.',image:'photo-1497366754035-f200968a6e72'},
 'policy-terms':{eyebrow:'GOVERNANCE',title:'Terms of use',copy:'Conditions for using this website.',image:'photo-1497366754035-f200968a6e72'},
 'policy-financial':{eyebrow:'GOVERNANCE',title:'Financial information',copy:'How payment verification and case-level reporting work.',image:'photo-1497366754035-f200968a6e72'},
 'policy-volunteer':{eyebrow:'GOVERNANCE',title:'Volunteer information',copy:'Guidance for people interested in contributing their time.',image:'photo-1497366754035-f200968a6e72'}
};
function photo(id,w){return 'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w='+w+'&q=85'}
function hero(meta,route){return '<header class="vf2-page-hero vf2-hero-'+esc(route)+'"><img class="vf2-hero-image" src="'+photo(meta.image,1800)+'" alt="" fetchpriority="high"><div class="vf2-hero-shade"></div><div class="vf2-hero-copy"><span class="vf2-eyebrow">'+esc(meta.eyebrow)+'</span><h1>'+esc(meta.title)+'</h1><p>'+esc(meta.copy)+'</p><span class="vf2-hero-foot">VEGANFARM MOVEMENT <i>·</i> INDIA</span></div></header>'}
function home(){
 var campaigns='';try{campaigns=typeof CAMP==='function'?CAMP(3):'<p class="vf2-muted">Current appeals will appear here when published.</p>'}catch(e){campaigns='<p class="vf2-muted">Current appeals could not be loaded. Please check again later.</p>'}
 var impact=impactSummary();
 var cards=[
 ['01','Animal welfare','Support independent rescuers with verified veterinary treatment and related case costs.','photo-1552053831-71594a27632d','#cases','Explore rescue support'],
 ['02','Education','Support English-speaking learning sessions and opportunities at Maratha Aashram.','photo-1524178232363-1fb2b075b655','#education','Explore education'],
 ['03','Compassionate living','Encourage informed choices and practical everyday compassion.','photo-1450778869180-41d0601e046e','#projects','Explore our work']
 ];
 var focus=cards.map(function(c){return '<a class="vf2-focus-card" href="'+c[4]+'"><div class="vf2-focus-image"><img loading="lazy" decoding="async" src="'+photo(c[3],900)+'" alt="'+c[1]+' — illustrative photograph"><span>'+c[0]+'</span></div><div class="vf2-focus-copy"><small>'+c[1].toUpperCase()+'</small><h3>'+c[1]+'</h3><p>'+c[2]+'</p><b>'+c[5]+' <i>↗</i></b></div></a>'}).join('');
 return '<div class="vf2-home">'+
 '<section class="vf2-home-hero"><img class="vf2-home-image" src="'+photo('photo-1548199973-03cce0bbc87b',2200)+'" alt="Dogs outdoors together — illustrative animal photograph" fetchpriority="high"><div class="vf2-home-overlay"></div><div class="vf2-home-inner"><span class="vf2-eyebrow">INDEPENDENT WELFARE MOVEMENT · INDIA</span><h1>Compassion is not just a belief.<br><em>It is an action.</em></h1><p>VEGANFARM Movement brings people together to support animal welfare, expand access to education and encourage a more compassionate world.</p><div class="vf2-actions"><a class="vf2-button vf2-button-gold" href="#cases">Support a Rescue <span>↗</span></a><a class="vf2-button vf2-button-outline" href="#projects">Explore Our Work <span>↘</span></a></div><div class="vf2-hero-caption"><span>CARE · LEARNING · COMPASSION</span><span>SCROLL TO EXPLORE ↓</span></div></div></section>'+
 '<section class="vf2-intro-section vf2-shell"><div class="vf2-intro-heading"><span class="vf2-eyebrow">A MOVEMENT BUILT AROUND ACTION</span><h2>Compassion begins<br>with <em>what we do.</em></h2></div><div class="vf2-intro-copy"><p>VEGANFARM is an independent, currently unregistered welfare movement focused on animal welfare, education and compassionate living.</p><p>We support independent animal rescuers, contribute to English-speaking learning sessions and encourage informed, practical action.</p><a class="vf2-text-link" href="#about">Discover the movement ↗</a></div></section>'+
 '<section class="vf2-focus-section"><div class="vf2-shell"><div class="vf2-section-heading"><div><span class="vf2-eyebrow">WHERE WE FOCUS</span><h2>Three ways to put care <em>into practice.</em></h2></div><p>Each initiative is grounded in a simple idea: meaningful change begins with practical support.</p></div><div class="vf2-focus-grid">'+focus+'</div></div></section>'+
 '<section class="vf2-rescue-band"><div class="vf2-shell"><div class="vf2-section-heading vf2-heading-light"><div><span class="vf2-eyebrow">CURRENT RESCUE APPEALS</span><h2>Help when it <em>matters most.</em></h2></div><p>Only published, Founder-approved appeals are displayed. Contributions are reflected after verification.</p></div><div class="vf2-live-content">'+campaigns+'</div><div class="vf2-band-foot"><span>VERIFIED CONTRIBUTIONS ONLY</span><a href="#cases">View rescue appeals ↗</a></div></div></section>'+
 '<section class="vf2-about-split vf2-shell"><div class="vf2-about-photo"><img src="'+photo('photo-1450778869180-41d0601e046e',1200)+'" alt="Person with a dog outdoors — illustrative animal-welfare photograph" loading="lazy"><span>ILLUSTRATIVE PHOTOGRAPH</span></div><div class="vf2-about-text"><span class="vf2-eyebrow">WHO WE ARE</span><h2>Small acts of care.<br><em>Real responsibility.</em></h2><p>Founded by Harshit Dedhia, VEGANFARM Movement works to support animal welfare, expand access to education and encourage a more compassionate world.</p><p>The movement is currently unregistered. It is not a shelter and does not claim ownership of animals cared for by independent rescuers.</p><a class="vf2-text-link" href="#about">Read about the movement ↗</a></div></section>'+
 '<section class="vf2-project-teaser"><div class="vf2-shell vf2-project-teaser-inner"><div><span class="vf2-eyebrow">EDUCATION & COMMUNITY</span><h2>Learning creates <em>possibility.</em></h2><p>Support English-speaking learning sessions at Maratha Aashram, Virar. Programme information is presented separately from animal-rescue appeals.</p><a class="vf2-button vf2-button-dark" href="#education">Explore the education programme ↗</a></div><div class="vf2-project-teaser-image"><img src="'+photo('photo-1524178232363-1fb2b075b655',1200)+'" alt="People learning in a classroom — illustrative photograph, not programme evidence" loading="lazy"><span>ILLUSTRATIVE CLASSROOM IMAGE</span></div></div></section>'+
 '<section class="vf2-impact-section"><div class="vf2-shell"><div class="vf2-section-heading"><div><span class="vf2-eyebrow">ACCOUNTABILITY IN PRACTICE</span><h2>Every contribution<br><em>deserves clarity.</em></h2></div><p>Case-level fundraising progress reflects only payments verified and allocated by the Founder. Private donor details and internal ledger records are not published.</p></div><div class="vf2-impact-content">'+impact+'</div><a class="vf2-text-link" href="#transparency">Read our transparency approach ↗</a></div></section>'+
 '<section class="vf2-cta-band"><div class="vf2-shell vf2-cta-inner"><div><span class="vf2-eyebrow">BE PART OF THE WORK</span><h2>Make compassion <em>practical.</em></h2><p>Support an initiative, volunteer your time or contact the movement with a question.</p></div><div class="vf2-actions"><a class="vf2-button vf2-button-gold" href="#donate">Support the work ↗</a><a class="vf2-button vf2-button-outline" href="#volunteer">Volunteer with us ↗</a></div></div></section>'+
 '<p class="vf2-illustrative-note vf2-shell">Photography on this website is illustrative stock imagery unless explicitly identified otherwise. It is not presented as rescue evidence or documentation of actual programme participants.</p></div>';
}
function impactSummary(){
 var records=[];try{records=typeof APP!=='undefined'&&Array.isArray(APP)?APP.filter(function(x){return x.pub==='Published'}):[]}catch(e){}
 var done=records.filter(function(x){return x.completed||/^(Completed|Recovered|Closed)$/i.test(String(x.st||''))});
 var active=records.filter(function(x){return !x.completed&&!/^(Completed|Recovered|Closed)$/i.test(String(x.st||''))});
 var total=done.reduce(function(n,x){var a=0;try{a=typeof alloc==='function'?alloc(x.id):0}catch(e){}return n+Number(x.completedAmount||a||0)},0);
 if(!records.length)return '<div class="vf2-impact-empty"><span class="vf2-eyebrow">VERIFIED RECORDS ONLY</span><h3>Impact figures are published after review.</h3><p>No sample statistics or unverified estimates are displayed. Published case activity and verified support will appear here when approved records are available.</p></div>';
 return '<div class="vf2-live-stats"><div><strong>'+done.length+'</strong><span>COMPLETED TREATMENT CASES</span></div><div><strong>'+active.length+'</strong><span>ACTIVE PUBLISHED APPEALS</span></div><div><strong>'+ (total?'₹'+total.toLocaleString('en-IN'):'—')+'</strong><span>COMPLETED SUPPORT RECORDED</span></div></div><p class="vf2-muted">Figures are based on published records only. Pending submissions and unverified payments are excluded.</p>';
}
P.about=function(){
 return '<div class="vf2-about-page"><section class="vf2-about-lead"><div class="vf2-about-photo"><img src="'+photo('photo-1450778869180-41d0601e046e',1200)+'" alt="A person spending time with a dog — illustrative animal-welfare photograph" loading="lazy" decoding="async"><span>ILLUSTRATIVE ANIMAL-WELFARE PHOTOGRAPH</span></div><div class="vf2-about-lead-copy"><span class="vf2-eyebrow">WHO WE ARE</span><h2>Care should be visible in <em>what we do.</em></h2><p>VEGANFARM Movement is an independent, currently unregistered welfare movement focused on animal welfare, education and compassionate living.</p><p>Founded and led by Harshit Dedhia, the movement supports independent animal rescuers, contributes to English-speaking learning sessions and encourages practical, compassionate action.</p><p class="vf2-about-status">INDEPENDENT · CURRENTLY UNREGISTERED · INDIA</p></div></section><section class="vf2-about-principles"><div><span class="vf2-eyebrow">OUR APPROACH</span><h2>Practical support.<br><em>Clear responsibility.</em></h2></div><div class="vf2-principle-grid"><article><span>01</span><h3>Animal welfare</h3><p>Support independent rescuers with verified veterinary treatment and related case costs. VEGANFARM is not a shelter and does not claim ownership of animals cared for by independent rescuers.</p></article><article><span>02</span><h3>Education</h3><p>Contribute to English-speaking learning sessions at Maratha Aashram, Virar, including teacher support and periodic programme follow-up.</p></article><article><span>03</span><h3>Compassionate living</h3><p>Encourage informed choices and everyday actions that reduce harm and support a more compassionate community.</p></article></div></section><p class="vf2-about-legal">VEGANFARM Movement is currently unregistered. It is not a registered NGO, trust or Section 8 company. Payment beneficiaries are identified on the Donate page.</p></div>';
};
P.projects=function(){
 var list=typeof PROJ!=='undefined'?PROJ:[['Animal Medical Assistance','Animal Welfare','General animal welfare fund','Funding veterinary treatment for injured and sick animals.'],['Aashram Education Support','Human Welfare','Aashram Education Support','English-speaking learning support at Maratha Aashram, Virar.'],['Animal Rescuer Support & Networking','Animal Welfare','General animal welfare fund','Connecting and supporting independent animal rescuers.']];
 var cards=list.map(function(p,i){var education=/education|aashram|human welfare/i.test(p[0]+' '+p[1]);var image=education?'photo-1524178232363-1fb2b075b655':i===0?'photo-1552053831-71594a27632d':'photo-1450778869180-41d0601e046e';var alt=education?'Classroom learning — illustrative photograph, not programme evidence':'A person with a dog — illustrative animal-welfare photograph';return '<article class="vf2-project-card"><div class="vf2-project-image"><img src="'+photo(image,1000)+'" alt="'+alt+'" loading="lazy" decoding="async"><span>ILLUSTRATIVE IMAGE</span></div><div class="vf2-project-copy"><small>'+esc(p[1])+'</small><h2>'+esc(p[0])+'</h2><p>'+esc(p[3])+'</p><a href="#donate" class="vf2-text-link" onclick="dcat=\''+esc(p[1])+'\';dtg=\''+esc(p[2])+'\'">Support this initiative ↗</a></div></article>'}).join('');
 return '<div class="vf2-projects-page"><div class="vf2-projects-intro"><span class="vf2-eyebrow">PROJECT DIRECTORY</span><h2>Work that moves <em>care forward.</em></h2><p>Explore the initiatives currently represented by VEGANFARM Movement. Programme and rescue photography is illustrative unless explicitly identified as original documentation.</p></div><div class="vf2-projects-grid">'+cards+'</div><section class="vf2-projects-cta"><div><span class="vf2-eyebrow">BE PART OF THE WORK</span><h3>Small acts can create meaningful change.</h3><p>Support an active appeal or contribute to an education initiative.</p></div><a class="vf2-button vf2-button-dark" href="#donate">Support VEGANFARM ↗</a></section></div>';
};
P.education=function(){
 return '<div class="vf2-education-page"><section class="vf2-education-lead"><div class="vf2-education-image"><img src="'+photo('photo-1524178232363-1fb2b075b655',1400)+'" alt="People learning in a classroom — illustrative photograph, not Maratha Aashram students" loading="lazy" decoding="async"><span>ILLUSTRATIVE CLASSROOM IMAGE · NOT PROGRAMME EVIDENCE</span></div><div class="vf2-education-copy"><span class="vf2-eyebrow">MARATHA AASHRAM · VIRAR</span><h2>Learning today.<br><em>More possibilities tomorrow.</em></h2><p>VEGANFARM Movement supports English-speaking learning sessions at Maratha Aashram, Virar. The initiative includes a dedicated teacher, monthly salary support and periodic programme follow-up.</p><p>The classroom image is illustrative and is not a photograph of Maratha Aashram students.</p><a class="vf2-button vf2-button-dark" href="#donate" onclick="dcat=\'Human Welfare\';dtg=\'Aashram Education Support\'">Support education ↗</a></div></section><section class="vf2-education-facts"><div><strong>English</strong><span>CORE LEARNING FOCUS</span></div><div><strong>Monthly</strong><span>TEACHER SUPPORT</span></div><div><strong>Ongoing</strong><span>PROGRAMME FOLLOW-UP</span></div></section><p class="vf2-about-legal">Programme details are shared as available. No student outcomes, attendance figures or classroom photographs are invented.</p></div>';
};
P.impact=function(){
 return '<div class="vf2-impact-page"><section class="vf2-impact-lead"><span class="vf2-eyebrow">PUBLISHED ACTIVITY</span><h2>Progress, reported <em>with care.</em></h2><p>Only published case records and verified support are reflected. Pending submissions, sample records and unverified estimates are excluded.</p></section>'+impactSummary()+'<section class="vf2-impact-note"><h3>What the figures mean</h3><p>Completed cases are counted only when the published record is marked completed, recovered or closed. Active appeals appear only after Founder approval. Payments are counted after verification and allocation.</p><a class="vf2-text-link" href="#transparency">Read the transparency approach ↗</a></section></div>';
};
P.home=home;
var routeKeys=Object.keys(routeMeta);
routeKeys.forEach(function(route){
 var original=P[route];
 if(typeof original!=='function')return;
 P[route]=function(){
  var content=original.apply(this,arguments);
  var meta=routeMeta[route];
  return '<div class="vf2-page vf2-page-'+route+'">'+hero(meta,route)+'<div class="vf2-page-content vf2-shell">'+content+'</div></div>';
 };
});
function buildHeader(){
 var nav=document.querySelector('body > nav');if(!nav)return;
 nav.className='vf2-nav';
 var wrap=nav.querySelector('.wrap');if(!wrap)return;
 var logo=wrap.querySelector('.logo');
 if(logo){logo.className='vf2-brand';logo.setAttribute('aria-label','VEGANFARM Movement home');logo.innerHTML=logo.innerHTML.replace(/<small>Movement<\/small>/,'<span class="vf2-brand-caption">INDEPENDENT WELFARE MOVEMENT</span>')}
 var menu=wrap.querySelector('#menu');if(menu)menu.className='vf2-menu';
 var mb=wrap.querySelector('#mb');if(mb){mb.className='vf2-menu-toggle';mb.setAttribute('aria-label','Toggle navigation');mb.textContent='Menu'}
 var cta=wrap.querySelector('a.btn');if(cta){cta.className='vf2-nav-cta';cta.textContent='Support a Rescue'}
 wrap.classList.add('vf2-nav-inner');
}
function buildFooter(){
 var f=document.querySelector('body > footer .wrap');if(!f||f.dataset.vf2==='1')return;
 var credits=document.querySelector('footer .vf-photo-credits');var creditsMarkup=credits?credits.innerHTML:'<summary>Photography credits</summary><p>Editorial photographs are illustrative.</p>';
 f.dataset.vf2='1';f.className='vf2-footer-grid';
 f.innerHTML='<div class="vf2-footer-main"><span class="vf2-eyebrow">VEGANFARM MOVEMENT</span><h2>Compassion is a practice.</h2><p>An independent, currently unregistered welfare movement supporting animal welfare, education and compassionate living.</p><p>Founder &amp; Movement Lead · Harshit Dedhia</p></div><div class="vf2-footer-links"><div><b>Explore</b><a href="#about">About</a><a href="#cases">Rescue appeals</a><a href="#projects">Projects</a><a href="#education">Education</a><a href="#impact">Impact</a><a href="#volunteer">Volunteer</a></div><div><b>Information</b><a href="#transparency">Transparency</a><a href="#contact">Contact</a><a href="#policy-privacy">Privacy</a><a href="#policy-donation">Donation policy</a><a href="#policy-refund">Refund policy</a><a href="#policy-terms">Terms</a><a href="#admin">Founder access</a></div></div><div class="vf2-footer-contact"><a href="mailto:veganfarmmovement@gmail.com">veganfarmmovement@gmail.com</a><p id="fcon"></p><p id="socf"></p><details class="vf-photo-credits">'+creditsMarkup+'</details></div><div class="vf2-footer-bottom"><span>© VEGANFARM Movement · India</span><span>Animal welfare · Education · Compassionate living</span></div>';
}
function decoratePrivate(){
 var route=(location.hash||'#home').slice(1);
 if(!app)return;
 app.classList.toggle('vf2-private',route==='team'||route==='veganfarm-team'||route.indexOf('admin')===0);
 document.body.classList.toggle('vf2-private-route',route==='team'||route==='veganfarm-team'||route.indexOf('admin')===0);
 app.classList.toggle('vf2-team',route==='team'||route==='veganfarm-team');
 app.classList.toggle('vf2-founder',route.indexOf('admin')===0);
 if(route==='team'||route==='veganfarm-team'){
  var gate=app.querySelector('.vf-team-access-card');if(gate)gate.setAttribute('aria-label','VEGANFARM Team access');
 }
}
function afterRoute(){
 buildHeader();buildFooter();decoratePrivate();
 var route=(location.hash||'#home').slice(1);
 if(route.indexOf('case-')===0&&!app.querySelector('.vf2-page-hero')){
  var meta={eyebrow:'ANIMAL WELFARE · CASE DETAIL',title:'Rescue case details',copy:'Review the published case information and verified support details.',image:'photo-1552053831-71594a27632d'};
  var content=app.innerHTML;app.innerHTML='<div class="vf2-page vf2-page-case-detail">'+hero(meta,'case-detail')+'<div class="vf2-page-content vf2-shell">'+content+'</div></div>';
 }

 if(app){
  app.classList.remove('vf2-enter');void app.offsetWidth;app.classList.add('vf2-enter');
  app.querySelectorAll('img').forEach(function(img){img.loading=img.loading||'lazy';img.decoding='async'});
 }
}
window.go=function(keep){coreGo(keep);afterRoute()};
window.addEventListener('hashchange',function(){setTimeout(afterRoute,0)});
document.addEventListener('DOMContentLoaded',afterRoute,{once:true});
coreGo(true);afterRoute();
window.VeganFarmPresentation={version:2,owner:'assets/veganfarm-frontend-v2.js'};
})();