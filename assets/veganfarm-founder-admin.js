/* VEGANFARM Founder Console — server-verified access, live Supabase records only. */
(function(){
'use strict';
var sb=window.vfSupabase,app=document.getElementById('app');
if(!app||!sb)return;
var KEY='vf_founder_session_v1',data=null,active='admin',busy=false;
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var money=function(v){return '₹'+(Number(v)||0).toLocaleString('en-IN',{maximumFractionDigits:2})};
var getToken=function(){try{return sessionStorage.getItem(KEY)||''}catch(e){return ''}};
var setToken=function(v){try{if(v)sessionStorage.setItem(KEY,v);else sessionStorage.removeItem(KEY)}catch(e){}};
var errorText=async function(e){try{var r=e&&e.context;if(r&&r.clone){var j=await r.clone().json();if(j&&j.error)return j.error}}catch(x){}return e&&e.message||'Request failed. Try again.'};
async function api(action,extra){
 var body=Object.assign({action:action,token:getToken()},extra||{});
 var r=await sb.functions.invoke('veganfarm-founder-admin',{body:body});
 if(r.error)throw new Error(await errorText(r.error));
 if(!r.data||r.data.ok!==true)throw new Error(r.data&&r.data.error||'Founder request failed.');
 return r.data;
}
function login(){
 app.innerHTML='<section class="vf-admin-login"><div class="vf-admin-login-card"><div class="vf-admin-mark">VF</div><span class="vf-admin-kicker">PRIVATE FOUNDER WORKSPACE</span><h1>Founder administration</h1><p>Enter the Founder access code to securely open the VEGANFARM control centre.</p><form id="vf-admin-login-form"><label for="vf-admin-pin">Founder access code</label><input id="vf-admin-pin" name="pin" type="password" autocomplete="current-password" required maxlength="100" placeholder="Enter your private code"><p id="vf-admin-login-error" role="alert"></p><button class="vf-admin-primary" type="submit">Unlock administration</button></form><small>Protected server-side verification · temporary session · private records</small></div></section>';
 document.getElementById('vf-admin-login-form').addEventListener('submit',async function(e){
  e.preventDefault();if(busy)return;busy=true;var btn=this.querySelector('button'),err=document.getElementById('vf-admin-login-error'),pin=this.elements.pin.value;
  btn.disabled=true;btn.textContent='Verifying securely…';err.textContent='';
  try{var r=await sb.functions.invoke('veganfarm-founder-admin',{body:{action:'verify',pin:pin}});if(r.error)throw new Error(await errorText(r.error));if(!r.data||!r.data.ok||!r.data.token)throw new Error(r.data&&r.data.error||'Access denied.');setToken(r.data.token);this.reset();await refresh();}
  catch(x){err.textContent=await errorText(x);btn.disabled=false;btn.textContent='Unlock administration';}
  finally{busy=false;}
 });
}
var nav=[['admin','Overview'],['admin-cases','Rescue appeals'],['admin-donations','Donations'],['admin-expenses','Expenses'],['admin-volunteers','Volunteers'],['admin-messages','Messages'],['admin-stories','Stories & updates'],['admin-team','Team accounts'],['admin-settings','Website settings'],['admin-audit','Audit history']];
function shell(route,content){
 app.innerHTML='<div class="vf-admin-shell"><aside class="vf-admin-sidebar"><a class="vf-admin-brand" href="#admin"><span>VF</span><div><b>VEGANFARM</b><small>FOUNDER WORKSPACE</small></div></a><nav>'+nav.map(function(n){return '<a href="#'+n[0]+'" class="'+(route===n[0]?'active':'')+'">'+esc(n[1])+'</a>'}).join('')+'</nav><button class="vf-admin-logout" id="vf-admin-logout">Lock dashboard</button></aside><main class="vf-admin-main"><header class="vf-admin-top"><div><span>VEGANFARM · PRIVATE ADMINISTRATION</span><h1>'+esc(nav.find(function(n){return n[0]===route})?.[1]||'Overview')+'</h1></div><button class="vf-admin-refresh" id="vf-admin-refresh">Refresh data</button></header>'+content+'</main></div>';
 document.getElementById('vf-admin-logout').onclick=logout;
 document.getElementById('vf-admin-refresh').onclick=refresh;
 app.querySelectorAll('[data-vf-action]').forEach(function(el){el.addEventListener('click',handleAction)});
 app.querySelectorAll('form[data-vf-form]').forEach(function(el){el.addEventListener('submit',handleForm)});
}
function stat(label,value,sub){return '<article class="vf-admin-stat"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(sub||'Live database record')+'</span></article>'}
function overview(){
 var d=data||{},cases=d.cases||[],dons=d.donations||[],expenses=d.expenses||[];
 var pendingCases=cases.filter(x=>['pending_review','draft'].includes(x.publication)).length;
 var pendingDon=dons.filter(x=>x.status==='pending').length;
 var pendingExp=expenses.filter(x=>x.status==='pending').length;
 var verified=dons.filter(x=>x.status==='verified').reduce((a,x)=>a+Number(x.amount||0),0);
 return '<section class="vf-admin-stats">'+stat('Total case records',cases.length,'All submitted and published cases')+stat('Awaiting case review',pendingCases,'Not visible publicly')+stat('Payments awaiting review',pendingDon,'Not counted as verified')+stat('Verified contributions',money(verified),'Manual verification only')+stat('Expenses awaiting review',pendingExp,'Pending approval')+stat('Volunteer applications',(d.volunteers||[]).length,'Applications received')+'</section><section class="vf-admin-panel"><div class="vf-admin-panel-head"><div><small>FOUNDER ACTION CENTRE</small><h2>Items requiring your review</h2></div></div><div class="vf-admin-quick">'+[['admin-cases',pendingCases,'Review rescue cases'],['admin-donations',pendingDon,'Verify donations'],['admin-expenses',pendingExp,'Approve expenses'],['admin-volunteers',(d.volunteers||[]).filter(x=>x.status==='new').length,'Review volunteers']].map(x=>'<a href="#'+x[0]+'"><strong>'+x[1]+'</strong><span>'+x[2]+' →</span></a>').join('')+'</div></section><p class="vf-admin-privacy-note">This workspace shows live database records. Unpublished cases, private contact information, bills and medical documents are available only here. A case becomes public only after you approve it.</p>';
}
function docsFor(id){return (data.documents||[]).filter(x=>x.case_id===id)}
function caseCards(){
 var rows=data.cases||[];
 if(!rows.length)return '<p class="vf-admin-empty">No case submissions found.</p>';
 return '<div class="vf-admin-record-list">'+rows.map(function(c){
  var p=(data.case_private||[]).find(x=>x.case_id===c.id)||{},docs=docsFor(c.id);
  var docHtml=docs.map(x=>'<a target="_blank" rel="noopener" href="'+esc(x.signed_url||'#')+'">'+esc(x.document_type||'Supporting file')+' ↗</a>').join('');
  var photo=c.photo_url?'<a target="_blank" rel="noopener" href="'+esc(c.photo_url)+'"><img class="vf-admin-case-photo" src="'+esc(c.photo_url)+'" alt="Case evidence"></a>':'';
  return '<article class="vf-admin-record"><div class="vf-admin-record-head"><div><small>'+esc(c.case_code||c.id)+' · '+esc(c.kind||'Treatment')+'</small><h3>'+esc(c.animal_name||'Unnamed animal')+' <span>'+esc(c.animal_type||'')+'</span></h3><p>'+esc(c.location||'Location not provided')+' · '+esc(c.created_at||'')+'</p></div><span class="vf-admin-status '+esc(c.publication||'pending')+'">'+esc(c.publication||'pending_review')+'</span></div><div class="vf-admin-case-body">'+photo+'<div><p>'+esc(c.description||'No description')+'</p><p><b>Hospital / condition:</b> '+esc(c.hospital||'—')+' · '+esc(c.medical_condition||c.condition||'—')+'</p><p><b>Treatment / food:</b> '+esc(c.treatment_required||c.treatment||c.extra?.food_type||'—')+'</p><p><b>Submitted by:</b> '+esc(p.finder_name||'—')+' · '+esc(p.finder_phone||'—')+'</p><p><b>Estimate:</b> '+money(c.target_amount||c.fundraising_target||c.extra?.est||0)+'</p><div class="vf-admin-docs">'+(docHtml||'<span>No supporting documents uploaded</span>')+'</div></div></div><div class="vf-admin-case-controls"><label>Fundraising target (₹)<input type="number" min="0" step="0.01" id="target-'+esc(c.id)+'" value="'+esc(c.target_amount||c.fundraising_target||'')+'"></label><label>Case status<input id="status-'+esc(c.id)+'" value="'+esc(c.status||'Awaiting treatment')+'"></label><label>Founder review note<input id="note-'+esc(c.id)+'" value="'+esc(c.review_note||'')+'" placeholder="Optional note for Team"></label><div class="vf-admin-actions"><button data-vf-action="case-publish" data-id="'+esc(c.id)+'">Approve & publish</button><button class="secondary" data-vf-action="case-save" data-id="'+esc(c.id)+'">Save review</button><button class="danger" data-vf-action="case-reject" data-id="'+esc(c.id)+'">Reject</button><button class="secondary" data-vf-action="case-unpublish" data-id="'+esc(c.id)+'">Unpublish</button></div></div></article>';
 }).join('')+'</div>';
}
function donations(){
 var rows=data.donations||[];
 return '<div class="vf-admin-record-list">'+(rows.length?rows.map(function(x){
  return '<article class="vf-admin-record"><div class="vf-admin-record-head"><div><small>'+esc(x.created_at||'')+'</small><h3>'+esc(x.donor_name||'Donor')+' · '+money(x.amount)+'</h3><p>'+esc(x.category||'General')+' · '+esc(x.target_label||'No target label')+'</p></div><span class="vf-admin-status '+esc(x.status)+'">'+esc(x.status)+'</span></div><div class="vf-admin-record-meta"><span>Contact: '+esc(x.donor_contact||'—')+'</span><span>UPI reference: '+esc(x.upi_reference||'—')+'</span><span>Case ID: '+esc(x.case_id||'General')+'</span></div>'+(x.screenshot_signed_url?'<p><a target="_blank" rel="noopener" href="'+esc(x.screenshot_signed_url)+'">Open payment proof ↗</a></p>':'<p class="vf-admin-muted">No payment screenshot attached.</p>')+'<div class="vf-admin-actions"><button data-vf-action="donation-verify" data-id="'+esc(x.id)+'">Verify payment</button><button class="danger" data-vf-action="donation-reject" data-id="'+esc(x.id)+'">Reject</button><button class="secondary" data-vf-action="donation-pending" data-id="'+esc(x.id)+'">Return to pending</button></div><p class="vf-admin-muted">Verification records the payment as checked; it does not initiate a bank transfer or deduct money.</p></article>';
 }).join(''):'<p class="vf-admin-empty">No donation records found.</p>')+'</div>';
}
function expenses(){
 var rows=data.expenses||[];
 return '<div class="vf-admin-record-list">'+(rows.length?rows.map(function(x){return '<article class="vf-admin-record"><div class="vf-admin-record-head"><div><small>'+esc(x.expense_date||x.created_at||'')+' · '+esc(x.category||'Expense')+'</small><h3>'+money(x.amount)+'</h3><p>'+esc(x.description||'No description')+' · '+esc(x.project||'General')+'</p></div><span class="vf-admin-status '+esc(x.status)+'">'+esc(x.status)+'</span></div>'+(x.receipt_signed_url?'<a href="'+esc(x.receipt_signed_url)+'" target="_blank" rel="noopener">View receipt ↗</a>':'<p class="vf-admin-muted">No receipt attached.</p>')+'<div class="vf-admin-actions"><button data-vf-action="expense-approve" data-id="'+esc(x.id)+'">Approve</button><button class="danger" data-vf-action="expense-reject" data-id="'+esc(x.id)+'">Reject</button></div></article>'}).join(''):'<p class="vf-admin-empty">No expense records found.</p>')+'</div>';
}
function genericTable(title,rows,cols,buttons){
 if(!rows||!rows.length)return '<p class="vf-admin-empty">No '+title.toLowerCase()+' found.</p>';
 return '<div class="vf-admin-table-wrap"><table class="vf-admin-table"><thead><tr>'+cols.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+cols.map(function(k){var v=r[k.toLowerCase().replace(/ /g,'_')];if(v&&typeof v==='object')v=JSON.stringify(v);return '<td>'+esc(v||'—')+'</td>'}).join('')+'<td>'+(buttons?buttons(r):'')+'</td></tr>'}).join('')+'</tbody></table></div>';
}
function content(route){
 if(route==='admin')return overview();
 if(route==='admin-cases')return caseCards();
 if(route==='admin-donations')return donations();
 if(route==='admin-expenses')return expenses();
 if(route==='admin-volunteers')return genericTable('Volunteers',data.volunteers||[],['Name','Email','Phone','Status','Created at'],r=>'<button data-vf-action="volunteer-review" data-id="'+esc(r.id)+'" data-status="reviewed">Mark reviewed</button> <button class="danger" data-vf-action="volunteer-reject" data-id="'+esc(r.id)+'" data-status="rejected">Reject</button>');
 if(route==='admin-messages')return genericTable('Messages',data.messages||[],['Name','Email','Phone','Handled','Created at'],r=>'<button data-vf-action="message-toggle" data-id="'+esc(r.id)+'" data-handled="'+String(!r.handled)+'">'+(r.handled?'Reopen':'Mark handled')+'</button>');
 if(route==='admin-stories')return genericTable('Stories',data.stories||[],['Title','Location','Published','Created at'],r=>'<button data-vf-action="story-toggle" data-id="'+esc(r.id)+'" data-published="'+String(!r.published)+'">'+(r.published?'Unpublish':'Publish')+'</button>');
 if(route==='admin-team')return genericTable('Team accounts',data.profiles||[],['Display name','Email','Role','Status','Created at'],r=>'<select id="role-'+esc(r.id)+'"><option value="team" '+(r.role==='team'?'selected':'')+'>Team</option><option value="founder" '+(r.role==='founder'?'selected':'')+'>Founder</option></select> <select id="status-'+esc(r.id)+'"><option>pending</option><option '+(r.status==='approved'?'selected':'')+'>approved</option><option '+(r.status==='rejected'?'selected':'')+'>rejected</option><option '+(r.status==='suspended'?'selected':'')+'>suspended</option></select> <button data-vf-action="profile-save" data-id="'+esc(r.id)+'">Save</button>');
 if(route==='admin-settings')return '<div class="vf-admin-record-list">'+(data.settings||[]).map(x=>'<form class="vf-admin-record" data-vf-form="setting"><h3>'+esc(x.key)+'</h3><input type="hidden" name="key" value="'+esc(x.key)+'"><textarea name="value" rows="4">'+esc(JSON.stringify(x.value))+'</textarea><button type="submit">Save setting</button></form>').join('')+'</div>';
 if(route==='admin-audit')return genericTable('Audit history',data.audit||[],['Created at','Actor role','Module','Action','Record id','Detail']);
 return overview();
}
async function refresh(){
 if(busy)return;busy=true;
 try{if(!getToken()){login();return;}var r=await api('load');data=r.data;var route=(location.hash||'#admin').slice(1);if(!nav.some(x=>x[0]===route))route='admin';shell(route,content(route));}
 catch(e){if(/session expired/i.test(e.message)){setToken('');login();}else{app.innerHTML='<section class="vf-admin-login"><div class="vf-admin-login-card"><h2>Dashboard could not load</h2><p>'+esc(e.message)+'</p><button class="vf-admin-primary" id="vf-admin-retry">Try again</button></div></section>';document.getElementById('vf-admin-retry').onclick=refresh;}}
 finally{busy=false;}
}
async function logout(){setToken('');data=null;login();}
async function handleAction(e){
 var b=e.currentTarget,id=b.dataset.id,action=b.dataset.vfAction;
 try{
  b.disabled=true;
  if(action.startsWith('case-')){
   var publication=action==='case-publish'?'published':action==='case-reject'?'rejected':action==='case-unpublish'?'unpublished':'pending_review';
   await api('case_review',{id:id,publication:publication,target_amount:document.getElementById('target-'+id)?.value||0,status:document.getElementById('status-'+id)?.value||'Awaiting treatment',review_note:document.getElementById('note-'+id)?.value||''});
  }else if(action.startsWith('donation-')){
   var status=action==='donation-verify'?'verified':action==='donation-reject'?'rejected':'pending';
   if(status==='verified'&&!confirm('Mark this payment as verified after checking the UPI/bank credit?'))return;
   await api('donation_review',{id:id,status:status});
  }else if(action.startsWith('expense-')){
   await api('expense_review',{id:id,status:action==='expense-approve'?'approved':'rejected'});
  }else if(action==='volunteer-review'||action==='volunteer-reject'){
   await api('volunteer_review',{id:id,status:action==='volunteer-review'?'reviewed':'rejected'});
  }else if(action==='message-toggle'){
   await api('message_handled',{id:id,handled:b.dataset.handled==='true'});
  }else if(action==='story-toggle'){
   await api('story_update',{id:id,published:b.dataset.published==='true'});
  }else if(action==='profile-save'){
   await api('profile_update',{id:id,role:document.getElementById('role-'+id).value,status:document.getElementById('status-'+id).value.toLowerCase()});
  }
  await refresh();
 }catch(x){alert(await errorText(x));b.disabled=false;}
}
async function handleForm(e){
 e.preventDefault();var f=e.currentTarget;
 try{var fd=new FormData(f),raw=fd.get('value'),value;try{value=JSON.parse(raw)}catch(x){value=raw}await api('setting_update',{key:fd.get('key'),value:value});await refresh();}
 catch(x){alert(await errorText(x));}
}
function route(){
 var h=(location.hash||'#home').slice(1);
 if(h.startsWith('admin')){document.body.classList.add('vf-admin-active');if(getToken())refresh();else login();return true;}
 document.body.classList.remove('vf-admin-active');return false;
}
var originalGo=window.go;
if(typeof originalGo==='function'){
 window.go=function(keep){if(route()){if(!keep)window.scrollTo(0,0);return;}return originalGo(keep);};
}
window.addEventListener('hashchange',function(){route();});
if((location.hash||'#home').slice(1).startsWith('admin'))route();
window.VeganFarmFounderConsole={version:1,refresh:refresh,logout:logout};
})();