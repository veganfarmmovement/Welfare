import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ORIGIN = "https://veganfarmmovement.github.io";
const headers = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Vary": "Origin",
};
const db = URL && KEY ? createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const reply = (data: Record<string, unknown>, status=200) => new Response(JSON.stringify(data), {
  status, headers: { ...headers, "Content-Type":"application/json", "Cache-Control":"no-store" }
});
const sha = async (v:string) => {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
};
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,"0")).join("");
const ip = (r:Request) => r.headers.get("cf-connecting-ip") || r.headers.get("x-real-ip") || r.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
const safe = (v:unknown,max=4000) => typeof v==="string" ? v.trim().slice(0,max) : "";
async function audit(module:string,action:string,id:string,detail:string) {
  await db!.from("audit_log").insert({actor:null,actor_role:"founder",module,action,record_id:id,record_ref:id,detail});
}
async function valid(tokenValue:string) {
  if(!/^[0-9a-f]{64}$/.test(tokenValue)) return false;
  const {data,error}=await db!.rpc("vf_founder_gate_session_valid",{p_token_hash:await sha(tokenValue)});
  return !error && data===true;
}
async function signed(bucket:string,path:string) {
  if(!path) return null;
  const {data,error}=await db!.storage.from(bucket).createSignedUrl(path,900);
  return error ? null : data?.signedUrl || null;
}
async function load() {
  const names = [
    ["cases",db!.from("rescue_cases").select("*").order("created_at",{ascending:false})],
    ["case_private",db!.from("case_private").select("*")],
    ["documents",db!.from("case_documents").select("*").order("created_at",{ascending:false})],
    ["donations",db!.from("donations").select("*").order("created_at",{ascending:false})],
    ["expenses",db!.from("expenses").select("*").order("created_at",{ascending:false})],
    ["volunteers",db!.from("volunteer_applications").select("*").order("created_at",{ascending:false})],
    ["messages",db!.from("contact_messages").select("*").order("created_at",{ascending:false})],
    ["stories",db!.from("stories").select("*").order("created_at",{ascending:false})],
    ["settings",db!.from("site_settings").select("*").order("key")],
    ["audit",db!.from("audit_log").select("*").order("created_at",{ascending:false}).limit(250)],
    ["profiles",db!.from("profiles").select("id,email,display_name,role,status,created_at").order("created_at",{ascending:false})],
  ] as const;
  const result:Record<string,unknown>={};
  const loaded=await Promise.all(names.map(async ([name,query])=>{
    const {data,error}=await query;
    if(error) throw new Error("Could not load "+name+": "+error.message);
    return [name,data||[]] as const;
  }));
  for(const [name,rows] of loaded) result[name]=rows;
  const docs=result.documents as Record<string,unknown>[];
  const donations=result.donations as Record<string,unknown>[];
  const expenses=result.expenses as Record<string,unknown>[];
  const cases=result.cases as Record<string,unknown>[];
  await Promise.all([
    Promise.all(docs.map(async d=>{d.signed_url=await signed("case-documents",String(d.file_path||""));})),
    Promise.all(donations.map(async d=>{d.screenshot_signed_url=await signed("donation-screenshots",String(d.screenshot_path||""));})),
    Promise.all(expenses.map(async e=>{e.receipt_signed_url=await signed("expense-receipts",String(e.receipt_path||""));})),
    Promise.all(cases.map(async c=>{
      const p=String(c.photo_path||"");
      if(p.startsWith("rescue-case-photos/")) c.photo_url=await signed("rescue-case-photos",p.slice("rescue-case-photos/".length));
      else if(p.startsWith("case-photos/")) c.photo_url=await signed("case-photos",p.slice("case-photos/".length));
      else if(p) c.photo_url=await signed("rescue-case-photos",p);
    }))
  ]);
  return result;
}
Deno.serve(async (req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers});
  if(req.method!=="POST") return reply({error:"Method not allowed."},405);
  const origin=req.headers.get("origin");
  if(origin && origin!==ORIGIN) return reply({error:"Origin not allowed."},403);
  if(!db) return reply({error:"Founder service is not configured."},500);
  let body:Record<string,unknown>;
  try { body=await req.json(); } catch { return reply({error:"Invalid request."},400); }
  const action=safe(body.action,50);
  if(action==="verify") {
    const pin=safe(body.pin,100);
    if(!pin) return reply({error:"Enter the Founder access code."},401);
    const session=token(), tokenHash=await sha(session), ipHash=await sha(ip(req));
    const {data,error}=await db.rpc("vf_founder_gate_verify",{p_pin:pin,p_token_hash:tokenHash,p_ip_hash:ipHash});
    if(error) { console.error("Founder gate error",error.message); return reply({error:"Founder access could not be verified."},500); }
    if(data!==true) return reply({error:"Incorrect Founder code or temporary lockout."},401);
    return reply({ok:true,token:session,expires_in:28800});
  }
  if(action==="verify_auth") {
    const authorization=req.headers.get("authorization")||"";
    const jwt=authorization.replace(/^Bearer\s+/i,"");
    if(!jwt || jwt===authorization) return reply({error:"Sign in with your Founder account first."},401);
    const {data:userData,error:userError}=await db.auth.getUser(jwt);
    const user=userData?.user;
    if(userError || !user) return reply({error:"Your Founder sign-in has expired. Sign in again."},401);
    const session=token(), tokenHash=await sha(session), ipHash=await sha(ip(req));
    const {data,error}=await db.rpc("vf_founder_gate_auth_verify",{p_user_id:user.id,p_token_hash:tokenHash,p_ip_hash:ipHash});
    if(error) { console.error("Founder account gate error",error.message); return reply({error:"Founder account could not be verified."},500); }
    if(data!==true) return reply({error:"This signed-in account does not have approved Founder access."},403);
    return reply({ok:true,token:session,expires_in:28800});
  }
  const session=safe(body.token,200);
  if(!await valid(session)) return reply({error:"Founder session expired. Sign in again."},401);
  if(action==="load") {
    try { return reply({ok:true,data:await load()}); }
    catch(e) { console.error("Founder dashboard load failed",e); return reply({error:e instanceof Error?e.message:"Dashboard data could not be loaded."},500); }
  }
  if(action==="logout") {
    const {error}=await db.rpc("vf_founder_gate_revoke",{p_token_hash:await sha(session)});
    if(error)return reply({error:"Could not revoke the Founder session."},500);
    return reply({ok:true});
  }
  if(action==="case_review") {
    const id=safe(body.id,80), publication=safe(body.publication,30);
    if(!id || !["published","rejected","unpublished","archived","pending_review"].includes(publication)) return reply({error:"Invalid case review request."},400);
    const patch:Record<string,unknown>={publication,publication_status:publication==="published"?"Published":publication==="rejected"?"Rejected":publication==="archived"?"Archived":publication==="unpublished"?"Unpublished":"Pending",updated_at:new Date().toISOString()};
    if(body.target_amount!==undefined) {
      const n=Number(body.target_amount);
      if(!Number.isFinite(n)||n<0) return reply({error:"Enter a valid fundraising target."},400);
      patch.target_amount=n; patch.fundraising_target=n;
    }
    if(body.status!==undefined) {
      const nextStatus=safe(body.status,100);
      patch.status=nextStatus; patch.treatment_status=nextStatus;
      const isComplete=/^(completed|recovered|closed)$/i.test(nextStatus);
      const {data:current,error:currentError}=await db.from("rescue_cases").select("extra,photo_path,photo_url").eq("id",id).maybeSingle();
      if(currentError||!current) return reply({error:"Case not found."},404);
      const extra=(current.extra&&typeof current.extra==="object")?{...current.extra}:{};
      if(isComplete) {
        const completedAmount=Number(body.completed_amount);
        if(!Number.isFinite(completedAmount)||completedAmount<=0) return reply({error:"Enter the completed support amount before closing this case."},400);
        extra.completed=true; extra.completed_amount=completedAmount; extra.completed_at=new Date().toISOString();
        // Copy the submitted animal photograph into the public case-photos bucket only
        // when the Founder completes the appeal. Medical documents remain private.
        const storedPath=safe(current.photo_path,500);
        if(storedPath && !current.photo_url) {
          const sourcePath=storedPath.startsWith("rescue-case-photos/")?storedPath.slice("rescue-case-photos/".length):storedPath;
          const {data:photoBlob,error:photoReadError}=await db.storage.from("rescue-case-photos").download(sourcePath);
          if(!photoReadError && photoBlob) {
            const ext=(sourcePath.split(".").pop()||"jpg").toLowerCase();
            const contentType=ext==="png"?"image/png":"image/jpeg";
            const publicPath="completed/"+id+"."+ext;
            const {error:photoWriteError}=await db.storage.from("case-photos").upload(publicPath,photoBlob,{contentType,upsert:true});
            if(!photoWriteError) patch.photo_url=URL+"/storage/v1/object/public/case-photos/"+publicPath;
            else console.error("Completed case photo copy failed",photoWriteError.message);
          } else console.error("Completed case photo read failed",photoReadError?.message);
        }
      } else {
        delete extra.completed; delete extra.completed_amount; delete extra.completed_at;
      }
      patch.extra=extra;
    }
    if(body.review_note!==undefined) patch.review_note=safe(body.review_note,2000);
    if(body.urgent!==undefined) { patch.urgent=body.urgent===true; patch.is_urgent=body.urgent===true; }
    const {data,error}=await db.from("rescue_cases").update(patch).eq("id",id).select("id,case_code,publication,status,extra").maybeSingle();
    if(error||!data) return reply({error:error?.message||"Case not found."},400);
    await audit("Rescue Appeals","Case "+publication,id,"Founder changed publication to "+publication);
    return reply({ok:true,case:data});
  }
  if(action==="donation_review") {
    const id=safe(body.id,80), status=safe(body.status,20);
    if(!id||!["verified","rejected","reversed","pending"].includes(status)) return reply({error:"Invalid donation review."},400);
    const {data:old,error:readError}=await db.from("donations").select("*").eq("id",id).maybeSingle();
    if(readError||!old) return reply({error:"Donation not found."},404);
    const {data,error}=await db.from("donations").update({status,verified_by:null,verified_at:status==="verified"?new Date().toISOString():null}).eq("id",id).select("*").single();
    if(error) return reply({error:error.message},400);
    if(status==="verified") {
      const {error:feedError}=await db.from("public_donation_feed").upsert({
        donation_id:id, donor:old.show_name?old.donor_name:"Anonymous", amount:old.amount,
        category:old.category||"Animal Welfare", case_id:old.case_id||null,
        created_at:old.created_at, target_label:old.target_label||null
      },{onConflict:"donation_id"});
      if(feedError) return reply({error:"Donation status saved, but public feed update failed: "+feedError.message},500);
    } else {
      await db.from("public_donation_feed").delete().eq("donation_id",id);
    }
    await audit("Donations","Donation "+status,id,"Founder reviewed payment as "+status);
    return reply({ok:true,donation:data});
  }
  if(action==="expense_review") {
    const id=safe(body.id,80),status=safe(body.status,20);
    if(!id||!["pending","approved","rejected","paid"].includes(status)) return reply({error:"Invalid expense review."},400);
    const patch:Record<string,unknown>={status,approved_by:null};
    if(body.description!==undefined) patch.description=safe(body.description,1000);
    if(body.amount!==undefined) { const n=Number(body.amount); if(!Number.isFinite(n)||n<=0)return reply({error:"Enter a valid expense amount."},400); patch.amount=n; }
    const {data,error}=await db.from("expenses").update(patch).eq("id",id).select("*").maybeSingle();
    if(error||!data)return reply({error:error?.message||"Expense not found."},400);
    await audit("Expenses","Expense "+status,id,"Founder updated expense status to "+status);
    return reply({ok:true,expense:data});
  }
  if(action==="case_update") {
    const id=safe(body.case_id,80),note=safe(body.note,2000);
    if(!id||!note)return reply({error:"Enter a case update."},400);
    const {error}=await db.from("case_updates").insert({case_id:id,note,public_visible:body.public_visible===true,created_by:null});
    if(error)return reply({error:error.message},400);
    await audit("Rescue Appeals","Case update added",id,"Founder added a case update");
    return reply({ok:true});
  }
  if(action==="message_handled") {
    const id=safe(body.id,80);
    const {error}=await db.from("contact_messages").update({handled:body.handled===true}).eq("id",id);
    if(error)return reply({error:error.message},400);
    await audit("Messages","Message status updated",id,"Founder updated contact message status");
    return reply({ok:true});
  }
  if(action==="volunteer_review") {
    const id=safe(body.id,80),status=safe(body.status,20);
    if(!id||!["new","reviewed","approved","rejected"].includes(status))return reply({error:"Invalid volunteer review."},400);
    const {error}=await db.from("volunteer_applications").update({status,reviewed_at:new Date().toISOString(),reviewed_by:null}).eq("id",id);
    if(error)return reply({error:error.message},400);
    await audit("Volunteers","Volunteer "+status,id,"Founder reviewed volunteer application");
    return reply({ok:true});
  }
  if(action==="story_update") {
    const id=safe(body.id,80);
    const patch:Record<string,unknown>={};
    if(body.published!==undefined)patch.published=body.published===true;
    if(body.title!==undefined)patch.title=safe(body.title,180);
    if(body.body!==undefined)patch.body=safe(body.body,5000);
    if(body.location!==undefined)patch.location=safe(body.location,180);
    const {error}=await db.from("stories").update(patch).eq("id",id);
    if(error)return reply({error:error.message},400);
    await audit("Stories","Story updated",id,"Founder updated a story");
    return reply({ok:true});
  }
  if(action==="setting_update") {
    const key=safe(body.key,100);
    if(!key||body.value===undefined)return reply({error:"Invalid setting."},400);
    const {error}=await db.from("site_settings").upsert({key,value:body.value,updated_at:new Date().toISOString()},{onConflict:"key"});
    if(error)return reply({error:error.message},400);
    await audit("Website","Setting updated",key,"Founder updated website setting");
    return reply({ok:true});
  }
  if(action==="profile_update") {
    const id=safe(body.id,80),status=safe(body.status,20),role=safe(body.role,20);
    if(!id||!["pending","approved","rejected","suspended"].includes(status)||!["founder","team"].includes(role))return reply({error:"Invalid team account update."},400);
    const {error}=await db.from("profiles").update({status,role}).eq("id",id);
    if(error)return reply({error:error.message},400);
    await audit("Team","Team profile updated",id,"Founder updated Team account status and role");
    return reply({ok:true});
  }
  if(action==="change_founder_code") {
    const newPin=safe(body.new_pin,100);
    if(newPin.length<8)return reply({error:"Use at least 8 characters for the Founder code."},400);
    const {data,error}=await db.rpc("vf_founder_pin_change",{p_new_pin:newPin});
    if(error||data!==true)return reply({error:error?.message||"Founder code could not be changed."},400);
    await audit("Security","Founder access code changed","founder","Founder rotated the server-side access code");
    return reply({ok:true});
  }
  return reply({error:"Unknown action."},400);
});