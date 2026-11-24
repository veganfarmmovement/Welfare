/* VEGANFARM Luxury Cinematic Overhaul — presentation only.
   Keeps core P routes, Supabase state, payment destinations and role checks untouched. */
(function(){
'use strict';
if(typeof P==='undefined'||!document.getElementById('app'))return;
var app=document.getElementById('app');
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var photo=function(id,w){return 'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w='+w+'&q=88'};
var cityPoints=[
 {key:'delhi',names:['delhi','new delhi'],x:53,y:28},{key:'mumbai',names:['mumbai','virar','palghar','thane'],x:37,y:55},
 {key:'pune',names:['pune'],x:42,y:59},{key:'ahmedabad',names:['ahmedabad'],x:32,y:43},
 {key:'jaipur',names:['jaipur'],x:42,y:37},{key:'nagpur',names:['nagpur'],x:54,y:51},
 {key:'hyderabad',names:['hyderabad'],x:55,y:65},{key:'bengaluru',names:['bengaluru','bangalore'],x:50,y:78},
 {key:'chennai',names:['chennai'],x:62,y:79},{key:'kolkata',names:['kolkata'],x:76,y:48},
 {key:'surat',names:['surat'],x:35,y:49},{key:'lucknow',names:['lucknow'],x:61,y:37},
 {key:'indore',names:['indore'],x:45,y:47},{key:'bhopal',names:['bhopal'],x:50,y:44},
 {key:'chandigarh',names:['chandigarh'],x:49,y:20}
];
function publishedCases(){
 try{return Array.isArray(window.cases)?window.cases.filter(function(c){return c&&c.id&&c.name&&!/^(Completed|Recovered|Closed)$/i.test(String(c.status||''))}):[]}catch(e){return []}
}
function cityFor(value){
 var s=String(value||'').toLowerCase();
 for(var i=0;i<cityPoints.length;i++)if(cityPoints[i].names.some(function(n){return s.indexOf(n)>=0}))return cityPoints[i];
 return null;
}
function rescueMap(){
 var rows=publishedCases(),groups={};
 rows.forEach(function(c){var point=cityFor(c.loc);if(point){if(!groups[point.key])groups[point.key]={point:point,cases:[]};groups[point.key].cases.push(c)}});
 var markers=Object.keys(groups).map(function(k){var g=groups[k];return '<button type="button" class="vf-lx-map-marker" style="left:'+g.point.x+'%;top:'+g.point.y+'%" data-vf-city="'+esc(g.point.key)+'" aria-label="'+esc(g.point.key)+' rescue cases" aria-pressed="false" title="'+esc(g.point.key)+' · '+g.cases.length+' active case(s)"></button>'}).join('');
 var list=rows.map(function(c){var city=cityFor(c.loc);return '<article class="vf-lx-map-case" data-vf-case-city="'+esc(city?city.key:'other')+'"><div><h3>'+esc(c.name)+'</h3><p>'+esc(c.loc||'Location not publicly specified')+' · '+esc(c.status||'Published')+'</p></div><a href="#case-'+encodeURIComponent(c.id)+'">View case ↗</a></article>'}).join('');
 return '<section class="vf-lx-section vf-lx-dark" id="rescue-explorer"><div class="vf-lx-shell"><div class="vf-lx-heading vf-lx-reveal"><div><span class="vf-lx-kicker">PUBLIC RESCUE ACTIVITY</span><h2>Where care is <em>needed now.</em></h2></div><p>Explore current, Founder-approved public rescue appeals. Map markers show approximate city-level locations only.</p></div><div class="vf-lx-map-layout"><div class="vf-lx-map-panel vf-lx-reveal"><svg class="vf-lx-map-art" viewBox="0 0 500 560" role="img" aria-label="Stylised outline of India, with approximate city-level case markers"><path class="vf-lx-map-grid" d="M0 140H500M0 280H500M0 420H500M125 0V560M250 0V560M375 0V560"/><path class="vf-lx-map-land" d="M160 38 L205 22 242 34 264 56 292 55 315 79 348 91 360 117 388 127 397 158 424 175 414 207 393 220 383 249 360 260 351 292 327 309 319 339 298 359 290 389 271 411 266 445 247 474 231 518 213 494 202 464 183 439 176 410 155 387 144 355 121 335 107 305 83 281 79 251 96 226 91 196 112 173 111 142 128 122 128 93 148 77Z"/><path class="vf-lx-map-land" d="M355 360 L379 372 390 394 380 412 359 407 349 387Z"/></svg>'+markers+'<span class="vf-lx-map-label">Illustrative geographic outline · city-level locations only</span></div><div class="vf-lx-map-results vf-lx-reveal"><div class="vf-lx-kicker">LIVE PUBLIC APPEALS · '+rows.length+'</div>'+(list||'<div class="vf-lx-empty">There are no active public rescue appeals at the moment. New appeals appear here after Founder review and publication.</div>')+'<p class="vf-lx-map-note">The map is an approximate visual guide, not a navigation tool. Exact addresses, private coordinates and unpublished case details are never shown.</p></div></div></div></section>';
}
function dashboard(){
 var records=[];try{records=Array.isArray(window.APP)?window.APP.filter(function(a){return a&&a.pub==='Published'}):[]}catch(e){}
 var closed=records.filter(function(a){var st=a.live&&a.live.st||a.st;return !!a.completed||/^(Completed|Recovered|Closed)$/i.test(String(st||''))});
 var active=records.length-closed.length;
 var total=null;try{if(typeof PUBLIC_VERIFIED_TOTAL!=='undefined'&&PUBLIC_VERIFIED_TOTAL!==null&&isFinite(Number(PUBLIC_VERIFIED_TOTAL)))total=Number(PUBLIC_VERIFIED_TOTAL)}catch(e){}
 var fmt=function(n){return Number(n).toLocaleString('en-IN')};
 var stats=[
  [fmt(records.length),'PUBLISHED CASE RECORDS'],
  [fmt(active),'ACTIVE PUBLISHED APPEALS'],
  [fmt(closed.length),'COMPLETED / CLOSED CASES'],
  [total===null?'—':'₹'+fmt(total),'PUBLIC VERIFIED CONTRIBUTIONS']
 ];
 return '<section class="vf-lx-section vf-lx-dashboard"><div class="vf-lx-shell"><div class="vf-lx-heading vf-lx-reveal"><div><span class="vf-lx-kicker">ACCOUNTABILITY, IN VIEW</span><h2>Impact, measured <em>with care.</em></h2></div><p>Figures are derived from published records and public verified totals only. Pending submissions and unverified payments are excluded.</p></div><div class="vf-lx-stat-grid vf-lx-reveal">'+stats.map(function(s){return '<div class="vf-lx-stat"><strong>'+s[0]+'</strong><span>'+s[1]+'</span></div>'}).join('')+'</div><div class="vf-lx-dashboard-foot"><span>Updated from published platform records.</span><a class="vf-lx-link" href="#transparency">View transparency details ↗</a></div></div></section>';
}
function homepage(){
 var live=publishedCases();
 var cards=[
  {n:'01',title:'Animal welfare',copy:'Support independent rescuers with verified veterinary treatment and related case costs.',img:'photo-1552053831-71594a27632d',href:'#cases',link:'Explore rescue support'},
  {n:'02',title:'Education',copy:'Contribute to English-speaking learning sessions and educational support at Maratha Aashram.',img:'photo-1503676260728-1c00da094a0b',href:'#education',link:'Explore education'},
  {n:'03',title:'Compassionate living',copy:'Encourage informed choices and practical everyday actions that reduce harm.',img:'photo-1548199973-03cce0bbc87b',href:'#projects',link:'Explore our work'}
 ];
 var focus=cards.map(function(c){return '<a class="vf-lx-focus-card vf-lx-reveal" href="'+c.href+'"><img src="'+photo(c.img,1000)+'" alt="'+esc(c.title)+' — illustrative photograph" loading="lazy" decoding="async"><div class="vf-lx-focus-content"><small>'+c.n+' / '+c.title.toUpperCase()+'</small><h3>'+c.title+'</h3><p>'+c.copy+'</p><b>'+c.link+' ↗</b></div></a>'}).join('');
 var campaigns='';try{campaigns=typeof CAMP==='function'?CAMP(3):'<p>No active public appeals at the moment.</p>'}catch(e){campaigns='<p>Current appeals could not be loaded. Please try again later.</p>'}
 return '<div class="vf-lx-home">'+
 '<section class="vf-lx-hero"><img class="vf-lx-hero-media" src="'+photo('photo-1450778869180-41d0601e046e',2400)+'" alt="Dog outdoors in natural light — illustrative animal-welfare photograph" fetchpriority="high"><div class="vf-lx-hero-frame"></div><div class="vf-lx-hero-inner"><div class="vf-lx-hero-copy"><span class="vf-lx-kicker">INDEPENDENT WELFARE MOVEMENT · INDIA</span><h1>A kinder world is built <em>one action at a time.</em></h1><p>VEGANFARM Movement brings people together to support animal welfare, expand access to education and encourage a more compassionate way of living.</p><div class="vf-lx-actions"><a class="vf-lx-btn vf-lx-btn-primary" href="#cases">Support a rescue <span>↗</span></a><a class="vf-lx-btn vf-lx-btn-ghost" href="#about">Discover the movement <span>↗</span></a></div></div><div class="vf-lx-hero-index"><b>01</b> / CARE · LEARNING · COMPASSION</div></div></section>'+
 '<div class="vf-lx-trustline"><div><span>01</span>Independent movement</div><div><span>02</span>Animal welfare</div><div><span>03</span>Education support</div><div><span>04</span>Transparent reporting</div></div>'+
 '<section class="vf-lx-section"><div class="vf-lx-shell vf-lx-intro"><div class="vf-lx-reveal"><span class="vf-lx-kicker">A MOVEMENT BUILT AROUND ACTION</span><h2>Compassion should be more than <em>a feeling.</em></h2></div><div class="vf-lx-intro-copy vf-lx-reveal"><p>VEGANFARM is an independent, currently unregistered welfare movement working across animal welfare, education and compassionate living.</p><p>We support independent animal rescuers, contribute to English-speaking learning sessions and encourage practical, responsible action.</p><a class="vf-lx-link" href="#about">Read our story ↗</a></div></div></section>'+
 '<section class="vf-lx-section vf-lx-focus"><div class="vf-lx-shell"><div class="vf-lx-heading vf-lx-reveal"><div><span class="vf-lx-kicker">WHERE WE FOCUS</span><h2>Three ways to put care <em>into practice.</em></h2></div><p>Each initiative is grounded in practical support, clear responsibilities and a commitment to report progress honestly.</p></div><div class="vf-lx-focus-grid">'+focus+'</div></div></section>'+
 '<section class="vf-lx-section"><div class="vf-lx-shell vf-lx-donate"><div class="vf-lx-reveal"><span class="vf-lx-kicker">A CLEARER WAY TO HELP</span><h2>Support that starts with <em>clarity.</em></h2><p style="color:var(--vf-lx-muted);max-width:500px">Choose an initiative, review the named payment beneficiary and submit your transaction reference for Founder verification. No account is required to contribute.</p><a class="vf-lx-link" href="#donate">Explore secure donation steps ↗</a></div><div class="vf-lx-donate-panel vf-lx-reveal"><span class="vf-lx-kicker">THE CONTRIBUTION JOURNEY</span><h3>Every step is explained.</h3><ol class="vf-lx-donate-steps"><li>Choose Animal Welfare or Education Support.</li><li>Review the named beneficiary and payment details.</li><li>Complete your payment using the displayed QR code or UPI.</li><li>Submit the transaction reference for verification.</li><li>Verified contributions are reflected in the appropriate records.</li></ol><a class="vf-lx-btn vf-lx-btn-primary" style="margin-top:28px" href="#donate">Continue to donations ↗</a></div></div></section>'+
 rescueMap()+dashboard()+
 '<section class="vf-lx-education"><div class="vf-lx-education-image"><img src="'+photo('photo-1503676260728-1c00da094a0b',1400)+'" alt="Classroom learning — illustrative photograph, not programme evidence" loading="lazy" decoding="async"></div><div class="vf-lx-education-copy"><span class="vf-lx-kicker">LEARNING INITIATIVE · VIRAR</span><h2>Learning creates <em>possibility.</em></h2><p>VEGANFARM supports English-speaking learning sessions at Maratha Aashram, Virar. The classroom photograph is illustrative and is not presented as documentation of programme participants.</p><a class="vf-lx-link" href="#education">Explore the education programme ↗</a></div></section>'+
 '<section class="vf-lx-final-cta"><div class="vf-lx-shell vf-lx-reveal"><span class="vf-lx-kicker">BE PART OF THE WORK</span><h2>Make compassion <em>practical.</em></h2><p>Support an active appeal, volunteer your time or contact the movement with a question.</p><div class="vf-lx-actions"><a class="vf-lx-btn vf-lx-btn-primary" href="#donate">Support the work ↗</a><a class="vf-lx-btn vf-lx-btn-ghost" href="#volunteer">Volunteer with us ↗</a></div></div></section>'+
 '<p class="vf-lx-photo-note vf-lx-shell">Photography is illustrative stock imagery unless explicitly identified otherwise. It is not presented as rescue evidence or documentation of actual programme participants.</p></div>';
}
P.home=homepage;
function decorateRoute(){
 var route=(location.hash||'#home').slice(1);
 app.classList.toggle('vf-lx-private',route==='team'||route==='veganfarm-team'||route.indexOf('admin')===0);
 app.classList.toggle('vf-lx-donate-route',route==='donate');
 if(route==='home'||!route){app.classList.add('vf-lx-home-active')}else{app.classList.remove('vf-lx-home-active')}
}
function reveal(){
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){app.querySelectorAll('.vf-lx-reveal').forEach(function(el){el.classList.add('vf-lx-visible')});return}
 var items=app.querySelectorAll('.vf-lx-reveal:not([data-vf-observed])');
 if(!items.length)return;
 if(!('IntersectionObserver' in window)){items.forEach(function(el){el.classList.add('vf-lx-visible')});return}
 var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('vf-lx-visible');observer.unobserve(entry.target)}})},{threshold:.12,rootMargin:'0px 0px -35px 0px'});
 items.forEach(function(el){el.setAttribute('data-vf-observed','1');observer.observe(el)});
}
document.addEventListener('click',function(e){
 var marker=e.target.closest&&e.target.closest('[data-vf-city]');
 if(marker){var city=marker.getAttribute('data-vf-city');app.querySelectorAll('[data-vf-city]').forEach(function(b){b.setAttribute('aria-pressed',String(b===marker))});app.querySelectorAll('[data-vf-case-city]').forEach(function(row){row.hidden=!(row.getAttribute('data-vf-case-city')===city||row.getAttribute('data-vf-case-city')==='other')})}
});
function afterRender(){decorateRoute();reveal()}
var observer=new MutationObserver(function(){afterRender()});
observer.observe(app,{childList:true,subtree:true});
window.addEventListener('hashchange',function(){setTimeout(afterRender,0)});
document.addEventListener('DOMContentLoaded',afterRender,{once:true});
afterRender();
window.VeganFarmLuxury={version:1,owner:'assets/veganfarm-luxury-cinematic.js',mapMode:'published-city-level-only'};
})();