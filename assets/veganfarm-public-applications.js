/* VEGANFARM Adoption + Fund Grant public workflows */
(function(){
'use strict';
var sb=window.vfSupabase, endpoint='veganfarm-public-applications';
var adoptionCache=[],waDigits='919823762859',grantEmail='',grantOtpSent=false;
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var css=`
.vf-app-wrap{max-width:1120px;margin:0 auto;padding:30px 20px 70px}
.vf-app-eyebrow{color:#477b3d;font-size:11px;letter-spacing:.16em;font-weight:800;text-transform:uppercase}
.vf-app-title{font-size:clamp(30px,5vw,48px);line-height:1.08;color:#193b25;margin:10px 0}
.vf-app-lead{max-width:720px;color:#66736a;line-height:1.7}
.vf-app-panel[hidden],.vf-app-panel form[hidden]{display:none!important}
.vf-app-panel{background:#fff;border:1px solid #e7e9df;border-radius:22px;padding:clamp(18px,3vw,30px);box-shadow:0 16px 44px rgba(31,55,35,.07);margin:22px 0}
.vf-app-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px}
.vf-app-field{display:flex;flex-direction:column;gap:7px;margin:0 0 15px;color:#263b2d;font-size:13px;font-weight:700}
.vf-app-field input,.vf-app-field select,.vf-app-field textarea{width:100%;box-sizing:border-box;border:1px solid #d9dfd4;border-radius:11px;padding:12px 13px;font:inherit;font-weight:400;color:#1d2d22;background:#fff;min-height:45px}
.vf-app-field textarea{min-height:100px;resize:vertical}
.vf-app-field input:focus,.vf-app-field select:focus,.vf-app-field textarea:focus{outline:3px solid rgba(168,207,56,.22);border-color:#78a34b}
.vf-app-btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:13px 22px;background:#286b36;color:#fff;font-weight:800;text-decoration:none;cursor:pointer;min-height:46px}
.vf-app-btn.secondary{background:#f1f5e9;color:#285b31;border:1px solid #dce8d1}
.vf-app-btn:disabled{opacity:.55;cursor:wait}
.vf-app-status{padding:12px 14px;border-radius:12px;background:#f4f7ef;color:#355b37;margin:12px 0;line-height:1.5}
.vf-app-status.error{background:#fff2ef;color:#9b3325}
.vf-app-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:22px}
.vf-app-card{border:1px solid #e4e8df;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 12px 32px rgba(31,55,35,.06)}
.vf-app-card img{width:100%;height:220px;object-fit:cover;background:#f1f2eb;display:block}
.vf-app-card-body{padding:18px}
.vf-app-card h3{font-size:21px;color:#1d3e27;margin:4px 0 8px}
.vf-app-meta{font-size:13px;color:#718075;line-height:1.6}
.vf-app-card p{font-size:14px;line-height:1.6;color:#536358}
.vf-app-section-title{font-size:25px;color:#1d3e27;margin:34px 0 8px}
.vf-app-note{font-size:12px;color:#718075;line-height:1.6}
.vf-app-honey{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.vf-app-cta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin:28px 0}
.vf-app-cta{display:block;padding:24px;border-radius:20px;background:linear-gradient(135deg,#f7faef,#fff);border:1px solid #e2ead7;text-decoration:none;color:#21462b;box-shadow:0 12px 32px rgba(31,55,35,.06)}
.vf-app-cta strong{display:block;font-size:21px;margin:6px 0}
@media(max-width:600px){.vf-app-wrap{padding:22px 14px 52px}.vf-app-card img{height:190px}}
`;
if(!document.getElementById('vf-public-app-style')){var st=document.createElement('style');st.id='vf-public-app-style';st.textContent=css;document.head.appendChild(st);}
function invoke(action,body){return sb.functions.invoke(endpoint,{body:Object.assign({action:action},body||{})}).then(function(r){if(r.error)throw r.error;if(!r.data||r.data.ok!==true)throw new Error(r.data&&r.data.error||'The request could not be completed.');return r.data;});}
async function loadWa(){try{var r=await sb.from('site_settings').select('value').eq('key','wa').maybeSingle();var raw=String(r.data&&r.data.value||'').replace(/\D/g,'');if(raw.length>=10)waDigits=raw.length===10?'91'+raw:raw;}catch(e){}}
function field(label,name,type,required,placeholder){return '<label class="vf-app-field">'+esc(label)+(required?' *':'')+'<input name="'+esc(name)+'" type="'+(type||'text')+'" '+(required?'required':'')+' '+(placeholder?'placeholder="'+esc(placeholder)+'"':'')+'></label>';}
function selectField(label,name,opts,required){return '<label class="vf-app-field">'+esc(label)+(required?' *':'')+'<select name="'+esc(name)+'" '+(required?'required':'')+'><option value="">Select</option>'+opts.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>';}).join('')+'</select></label>';}
function area(label,name,required,rows){return '<label class="vf-app-field">'+esc(label)+(required?' *':'')+'<textarea name="'+esc(name)+'" rows="'+(rows||3)+'" '+(required?'required':'')+'></textarea></label>';}
function adoptionPage(){
setTimeout(loadAdoptions,80);
setTimeout(bindAdoption,80);
return '<section class="vf-app-wrap"><div class="vf2-page-hero"><span class="vf-app-eyebrow">VEGANFARM · ADOPTION NETWORK</span><h1 class="vf-app-title">Help an animal find a home.</h1><p class="vf-app-lead">Submit an animal for adoption. Every listing is reviewed by VEGANFARM before it becomes visible to the public.</p></div>'+
'<div class="vf-app-panel"><h2 class="vf-app-section-title" style="margin-top:0">Add an Adoption Case</h2><p class="vf-app-note">No OTP is required. Your contact number is collected for verification and will remain private. Upload at least one clear animal photograph.</p>'+
'<form id="vf-adoption-form" enctype="multipart/form-data"><div class="vf-app-grid">'+field('Your full name','applicant_name','text',true)+field('Mobile number','applicant_phone','tel',true,'Include country code if outside India')+field('Email address','applicant_email','email',false)+selectField('Your relationship with the animal','applicant_relationship',['Owner','Independent rescuer','Feeder','Volunteer','Authorised representative','Other'],true)+field('Your city','applicant_city','text',true)+field('Animal name','animal_name','text',true)+selectField('Animal type','animal_type',['Dog','Cat','Other'],true)+field('Breed (if known)','breed','text',false)+field('Approximate age','age_text','text',false)+selectField('Gender','gender',['Male','Female','Unknown'],false)+field('Animal location (area/city)','animal_location','text',true)+selectField('Vaccination status','vaccination_status',['Fully vaccinated','Partially vaccinated','Not vaccinated','Unknown'],false)+selectField('Sterilisation status','sterilisation_status',['Sterilised','Not sterilised','Unknown'],false)+selectField('Is adoption urgent?','urgent',['No','Yes'],true)+selectField('Adoption fee','adoption_fee',['No fee','Fee applies','Discuss with VEGANFARM'],false)+'</div>'+
area('Health condition / medical information','health_status',false)+area('Why does this animal need adoption?','adoption_reason',true)+area('Suitable home / adopter requirements','home_requirements',false)+area('Special care or other requirements','special_requirements',false)+area('Additional description','description',false)+
'<label class="vf-app-field">Animal photographs * <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required></label><label class="vf-app-field">Supporting documents (optional) <input type="file" name="documents" accept="image/jpeg,image/png,image/webp,application/pdf" multiple></label>'+
'<label class="vf-app-field" style="font-weight:500"><span><input type="checkbox" name="consent" required> I confirm that I have permission to submit these details and photographs, and agree that VEGANFARM may publish selected adoption information after approval.</span></label><label class="vf-app-honey">Website <input name="website" tabindex="-1" autocomplete="off"></label><p id="vf-adoption-status" class="vf-app-status" role="status" aria-live="polite" hidden></p><button class="vf-app-btn" type="submit">Submit adoption case for review</button></form></div>'+
'<h2 class="vf-app-section-title">Approved animals looking for homes</h2><p class="vf-app-lead">Only cases approved by VEGANFARM appear here. Use the WhatsApp button on an individual case to enquire about that specific animal.</p><div id="vf-adoption-list" class="vf-app-cards"><p class="vf-app-note">Loading approved adoption cases…</p></div></section>';
}
async function loadAdoptions(){
var target=document.getElementById('vf-adoption-list');if(!target)return;
try{var r=await invoke('list_adoptions');adoptionCache=r.cases||[];target.innerHTML=adoptionCache.length?adoptionCache.map(function(c){
var msg='Hello VEGANFARM Movement, I am interested in adopting '+(c.animal_name||'this animal')+'. Case ID: '+c.case_code+'. Please connect me with the concerned person and guide me through the adoption process.';
var link='https://wa.me/'+waDigits+'?text='+encodeURIComponent(msg);
return '<article class="vf-app-card">'+(c.photos&&c.photos[0]?'<img src="'+esc(c.photos[0])+'" alt="'+esc(c.animal_name)+' available for adoption">':'<div style="height:220px;background:#f2f4ed"></div>')+'<div class="vf-app-card-body"><div class="vf-app-meta">'+esc(c.case_code)+' · '+esc(c.animal_type||'Animal')+' · '+esc(c.animal_location||'')+'</div><h3>'+esc(c.animal_name)+'</h3><div class="vf-app-meta">'+[c.breed,c.age_text,c.gender].filter(Boolean).map(esc).join(' · ')+'</div><p>'+esc(c.adoption_reason||c.description||'This animal is looking for a responsible home.')+'</p>'+(c.health_status?'<p><b>Health:</b> '+esc(c.health_status)+'</p>':'')+'<p class="vf-app-meta">Vaccination: '+esc(c.vaccination_status||'Not specified')+' · Sterilisation: '+esc(c.sterilisation_status||'Not specified')+'</p><a class="vf-app-btn" target="_blank" rel="noopener noreferrer" href="'+esc(link)+'">I WANT TO ADOPT</a></div></article>';
}).join(''):'<p class="vf-app-status">There are no approved adoption cases available at the moment.</p>';
}catch(e){target.innerHTML='<p class="vf-app-status error">Approved adoption cases could not be loaded. Please refresh the page.</p>';}}
function bindAdoption(){
var form=document.getElementById('vf-adoption-form');if(!form||form.dataset.bound)return;form.dataset.bound='1';
form.addEventListener('submit',async function(e){e.preventDefault();var status=document.getElementById('vf-adoption-status'),button=form.querySelector('button[type=submit]');status.hidden=false;status.className='vf-app-status';status.textContent='Submitting your adoption case securely…';button.disabled=true;
try{var fd=new FormData(form);fd.set('urgent',fd.get('urgent')==='Yes'?'true':'false');if(!fd.get('consent'))throw new Error('Please confirm permission and consent before submitting.');var p=fd.getAll('photos').filter(function(x){return x instanceof File&&x.size>0;});if(!p.length||p.length>5)throw new Error('Upload between 1 and 5 animal photographs.');var docs=fd.getAll('documents').filter(function(x){return x instanceof File&&x.size>0;});if(docs.length>5)throw new Error('Upload no more than 5 supporting documents.');var result=await sb.functions.invoke(endpoint,{body:(function(){fd.set('action','submit_adoption');return fd;})()});if(result.error)throw result.error;if(!result.data||!result.data.ok)throw new Error(result.data&&result.data.error||'Submission failed.');form.reset();status.textContent='Submitted successfully. Your reference is '+result.data.case_code+'. The case will remain private until VEGANFARM reviews and approves it.';}
catch(err){status.className='vf-app-status error';status.textContent=err.message||'Could not submit. Please try again.';}
finally{button.disabled=false;}
});
}
function grantPage(){
setTimeout(bindGrant,80);
return '<section class="vf-app-wrap"><div class="vf2-page-hero"><span class="vf-app-eyebrow">VEGANFARM · ASSISTANCE REVIEW</span><h1 class="vf-app-title">Apply for a Fund Grant.</h1><p class="vf-app-lead">Submit a request for financial assistance. Every application is reviewed individually. Applying does not guarantee that funding will be provided.</p></div>'+
'<div class="vf-app-panel" id="vf-grant-otp-panel"><h2 class="vf-app-section-title" style="margin-top:0">Step 1 · Verify your email</h2><p class="vf-app-note">Enter your email address. VEGANFARM will send a six-digit code. Enter the code on this page; do not click any sign-in link in the email.</p><form id="vf-grant-email-form">'+field('Email address','email','email',true)+'<p id="vf-grant-email-status" class="vf-app-status" role="status" aria-live="polite" hidden></p><button class="vf-app-btn" type="submit">Send email OTP</button></form><form id="vf-grant-verify-form" hidden><label class="vf-app-field">Six-digit email verification code *<input name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" minlength="6" placeholder="000000" required></label><p class="vf-app-note">Enter the latest six-digit code sent to <b id="vf-grant-otp-destination"></b>.</p><button class="vf-app-btn" type="submit">Verify email</button> <button class="vf-app-btn secondary" id="vf-grant-resend" type="button">Resend code</button> <button class="vf-app-btn secondary" id="vf-grant-change-email" type="button">Change email</button></form></div>'+
'<div class="vf-app-panel" id="vf-grant-continue-panel" hidden><h2 class="vf-app-section-title" style="margin-top:0">Email verified successfully</h2><p class="vf-app-lead">Your email address has been verified. Continue to the Fund Grant application form to provide your details and supporting documents.</p><button class="vf-app-btn" id="vf-grant-continue" type="button">Continue to Fund Grant Application</button></div>'+
'<div class="vf-app-panel" id="vf-grant-form-panel" hidden><h2 class="vf-app-section-title" style="margin-top:0">Step 2 · Grant application</h2><p id="vf-grant-verified-email" class="vf-app-status"></p><form id="vf-grant-form" enctype="multipart/form-data"><div class="vf-app-grid">'+field('Applicant full name','applicant_name','text',true)+field('Mobile number','phone','tel',true)+field('City','city','text',true)+field('State','state','text',true)+selectField('Applicant type','applicant_type',['Individual','Independent animal rescuer','Welfare organisation','Registered NGO / Trust','Other'],true)+selectField('Type of assistance','assistance_type',['Animal medical treatment','Animal rescue','Education','Medical assistance','Food / ration assistance','Disability support','Other'],true)+field('Total amount requested (₹)','amount_requested','number',true)+field('Amount already arranged (₹)','amount_arranged','number',true)+field('Remaining amount required (₹)','amount_pending','number',true)+selectField('Urgency','urgency',['Emergency (within 24 hours)','Urgent (within 3 days)','Within 1 week','Not urgent'],true)+field('When is payment required?','needed_by','text',false,'e.g. 30 November 2026')+'</div>'+area('Explain the purpose and why assistance is needed','purpose',true)+area('Who will benefit? Describe the person, family, organisation or animals and their situation.','beneficiary_details',true)+field('Number of beneficiaries / animals','beneficiary_count','text',false)+area('Is anyone else supporting this request?','other_support',false)+
'<label class="vf-app-field">Supporting documents (bills, quotations, reports, photos, financial proof, registration documents if applicable) <input type="file" name="documents" accept="image/jpeg,image/png,image/webp,application/pdf" multiple></label><p class="vf-app-note">Upload only documents relevant to this request. All files remain private and are visible only to authorised VEGANFARM reviewers.</p><label class="vf-app-field" style="font-weight:500"><span><input type="checkbox" name="consent" required> I confirm that the information and documents are genuine and authorise VEGANFARM to verify them. I understand that submission does not guarantee a grant.</span></label><label class="vf-app-honey">Website <input name="website" tabindex="-1" autocomplete="off"></label><p id="vf-grant-submit-status" class="vf-app-status" role="status" aria-live="polite" hidden></p><button class="vf-app-btn" type="submit">Submit Fund Grant application</button></form></div>'+
'<div class="vf-app-panel"><h2 class="vf-app-section-title" style="margin-top:0">Track an application</h2><p class="vf-app-note">Verify the same email address used for the application, then enter your reference number.</p><form id="vf-grant-track-form">'+field('Application reference number','reference_code','text',true,'VF-FG-XXXXXXXX')+'<p id="vf-grant-track-status" class="vf-app-status" role="status" aria-live="polite" hidden></p><button class="vf-app-btn secondary" type="submit">Check application status</button></form></div></section>';
}
function bindGrant(){
var emailForm=document.getElementById('vf-grant-email-form'),verifyForm=document.getElementById('vf-grant-verify-form'),grantForm=document.getElementById('vf-grant-form'),trackForm=document.getElementById('vf-grant-track-form');
if(!emailForm||emailForm.dataset.bound)return;emailForm.dataset.bound='1';
var otpInput=verifyForm&&verifyForm.elements.otp;
if(otpInput){otpInput.addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,6);});otpInput.addEventListener('paste',function(){var el=this;setTimeout(function(){el.value=el.value.replace(/\D/g,'').slice(0,6);},0);});}
async function requestGrantOtp(){
 var status=document.getElementById('vf-grant-email-status'),sendButton=emailForm.querySelector('button[type=submit]');
 grantEmail=emailForm.elements.email.value.trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(grantEmail))throw new Error('Enter a valid email address.');
 sendButton.disabled=true;status.hidden=false;status.className='vf-app-status';status.textContent='Requesting a new verification code…';
 try{
  var result=await sb.auth.signInWithOtp({email:grantEmail,options:{shouldCreateUser:true}});
  if(result.error)throw result.error;
  grantOtpSent=true;verifyForm.hidden=false;document.getElementById('vf-grant-otp-destination').textContent=grantEmail;verifyForm.elements.otp.value='';verifyForm.elements.otp.focus();
  status.textContent='Verification email requested for '+grantEmail+'. Enter the latest six-digit code from the email. Check Spam and Promotions if it is not in your inbox.';
 }catch(error){status.className='vf-app-status error';status.textContent=error.message||'Could not request a verification email.';throw error;}
 finally{sendButton.disabled=false;}
}
emailForm.addEventListener('submit',async function(e){e.preventDefault();try{await requestGrantOtp();}catch(error){}});
document.getElementById('vf-grant-resend').addEventListener('click',async function(){var button=this;button.disabled=true;try{await requestGrantOtp();}catch(error){}finally{button.disabled=false;}});
document.getElementById('vf-grant-change-email').addEventListener('click',function(){grantOtpSent=false;verifyForm.hidden=true;emailForm.querySelector('input[name=email]').focus();var status=document.getElementById('vf-grant-email-status');status.hidden=true;status.className='vf-app-status';});
var grantOtpPanel=document.getElementById('vf-grant-otp-panel'),grantContinuePanel=document.getElementById('vf-grant-continue-panel'),grantFormPanel=document.getElementById('vf-grant-form-panel'),grantContinueButton=document.getElementById('vf-grant-continue');
function openGrantForm(){grantContinuePanel.hidden=true;grantFormPanel.hidden=false;grantFormPanel.scrollIntoView({behavior:'smooth',block:'start'});}
grantContinueButton.addEventListener('click',openGrantForm,{once:true});
/* Always require a fresh OTP request and code entry when opening Fund Grant. Existing browser sessions do not skip this step. */
verifyForm.addEventListener('submit',async function(e){
 e.preventDefault();
 var button=verifyForm.querySelector('button[type=submit]'),otp=verifyForm.elements.otp.value.replace(/\s/g,''),status=document.getElementById('vf-grant-email-status');
 if(!grantOtpSent){status.hidden=false;status.className='vf-app-status error';status.textContent='Request a verification code first.';return;}
 if(!/^[0-9]{6}$/.test(otp)){status.hidden=false;status.className='vf-app-status error';status.textContent='Enter the six-digit code from the latest email.';verifyForm.elements.otp.focus();return;}
 button.disabled=true;status.hidden=false;status.className='vf-app-status';status.textContent='Verifying your email…';
 try{
  var result=await sb.auth.verifyOtp({email:grantEmail,token:otp,type:'email'});
  if(result.error)throw result.error;
  var session=result.data&&result.data.session,user=result.data&&result.data.user;
  if(!session||!user||!user.email_confirmed_at)throw new Error('The code was accepted without a confirmed email session. Request a new code and try again.');
  var current=await sb.auth.getUser();
  if(current.error||!current.data.user||current.data.user.id!==user.id||!current.data.user.email_confirmed_at)throw new Error('Email session could not be confirmed. Please request a new code.');
  grantOtpSent=false;verifyForm.elements.otp.value='';grantOtpPanel.hidden=true;grantContinuePanel.hidden=false;
  document.getElementById('vf-grant-verified-email').textContent='Email verified: '+grantEmail+'. Continue to complete your Fund Grant application.';
 }catch(error){
  status.hidden=false;status.className='vf-app-status error';var message=String(error&&error.message||'Verification failed.');
  if(/invalid|expired|otp|token/i.test(message))message='That code is incorrect or expired. Use the latest six-digit code or request a new one.';
  status.textContent=message;
 }finally{button.disabled=false;}
});
grantForm.addEventListener('submit',async function(e){e.preventDefault();var status=document.getElementById('vf-grant-submit-status'),button=grantForm.querySelector('button');status.hidden=false;status.className='vf-app-status';status.textContent='Submitting your private application…';button.disabled=true;
try{var session=(await sb.auth.getSession()).data.session;if(!session||!session.user||!session.user.email_confirmed_at)throw new Error('Your verified email session has expired. Please verify your email again.');var fd=new FormData(grantForm);if(!fd.get('consent'))throw new Error('Please accept the declaration before submitting.');var req=Number(fd.get('amount_requested')),arr=Number(fd.get('amount_arranged')),pending=Number(fd.get('amount_pending'));if(!Number.isFinite(req)||!Number.isFinite(arr)||!Number.isFinite(pending)||Math.abs(req-arr-pending)>1)throw new Error('Requested amount must equal amount already arranged plus remaining amount required.');var files=fd.getAll('documents').filter(function(x){return x instanceof File&&x.size>0;});if(files.length>8)throw new Error('Upload a maximum of 8 documents.');var r=await sb.functions.invoke(endpoint,{body:(function(){fd.set('action','submit_grant');return fd;})()});if(r.error)throw r.error;if(!r.data||!r.data.ok)throw new Error(r.data&&r.data.error||'Application failed.');status.textContent='Application received. Your reference number is '+r.data.reference_code+'. Keep it safe to track your application.';grantForm.reset();var ref=trackForm.elements.reference_code;ref.value=r.data.reference_code;}
catch(err){status.className='vf-app-status error';status.textContent=err.message||'Could not submit your application.';}finally{button.disabled=false;}});
trackForm.addEventListener('submit',async function(e){e.preventDefault();var status=document.getElementById('vf-grant-track-status'),button=trackForm.querySelector('button');status.hidden=false;status.textContent='Checking your application…';button.disabled=true;
try{var session=(await sb.auth.getSession()).data.session;if(!session||!session.user.email_confirmed_at)throw new Error('Verify the email address used for your application first.');var r=await invoke('track_grant',{reference_code:trackForm.elements.reference_code.value.trim()});status.innerHTML='<b>Status:</b> '+esc(String(r.application.status).replace(/_/g,' '))+'<br><b>Last updated:</b> '+esc(new Date(r.application.updated_at).toLocaleString())+(r.application.applicant_message?'<br><b>VEGANFARM update:</b> '+esc(r.application.applicant_message):'');}
catch(err){status.className='vf-app-status error';status.textContent=err.message||'Could not find this application.';}finally{button.disabled=false;}});
}
var originalHome=P.home;P.home=function(){return originalHome()+'<section class="vf-app-wrap"><span class="vf-app-eyebrow">TAKE THE NEXT STEP</span><h2 class="vf-app-title" style="font-size:34px">Choose an application</h2><div class="vf-app-cta-grid"><a class="vf-app-btn" href="#adoption">ADD AN ADOPTION CASE</a><a class="vf-app-btn secondary" href="#fund-grant">APPLY FOR A FUND GRANT</a></div></section>';};
P.adoption=adoptionPage;P['fund-grant']=grantPage;
function injectNav(){var menu=document.getElementById('menu');if(!menu)return;[['adoption','Adoption'],['fund-grant','Fund Grant']].forEach(function(x){if(!menu.querySelector('a[href="#'+x[0]+'"]')){var a=document.createElement('a');a.className='l '+(location.hash==='#'+x[0]?'on':'');a.href='#'+x[0];a.textContent=x[1];menu.appendChild(a);}});}
var oldGo=window.go;if(typeof oldGo==='function'){window.go=function(keep){var r=oldGo(keep);injectNav();return r;};}
window.addEventListener('hashchange',function(){setTimeout(function(){injectNav();if(location.hash==='#adoption'){loadWa();loadAdoptions();bindAdoption();}if(location.hash==='#fund-grant')bindGrant();},120);});
injectNav();loadWa();if(!location.hash||location.hash==='#home'||location.hash==='#adoption'||location.hash==='#fund-grant'){if(typeof window.go==='function')window.go(true);}if(location.hash==='#adoption'){loadAdoptions();bindAdoption();}if(location.hash==='#fund-grant')bindGrant();
})();