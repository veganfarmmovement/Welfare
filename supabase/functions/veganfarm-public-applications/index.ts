import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ORIGIN = "https://veganfarmmovement.github.io";
const db = URL && KEY ? createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const headers = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Vary": "Origin",
};
const reply = (data: Record<string, unknown>, status=200) => new Response(JSON.stringify(data), {
  status, headers: { ...headers, "Content-Type":"application/json", "Cache-Control":"no-store" }
});
const safe = (v: unknown, max=4000) => typeof v === "string" ? v.trim().slice(0,max) : "";
const sha = async (v: string) => {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
};
const ext = (type: string) => ({
  "image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf",
  "video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"
} as Record<string,string>)[type] || "bin";
function validFile(file: File, max: number, types: string[]) {
  return file.size > 0 && file.size <= max && types.includes(file.type);
}
async function signatureOk(file: File) {
  const b = new Uint8Array(await file.slice(0,16).arrayBuffer());
  const t = file.type;
  if (t==="image/jpeg") return b[0]===0xff && b[1]===0xd8 && b[2]===0xff;
  if (t==="image/png") return b[0]===0x89 && b[1]===0x50 && b[2]===0x4e && b[3]===0x47;
  if (t==="image/webp") return String.fromCharCode(...b.slice(0,4))==="RIFF" && String.fromCharCode(...b.slice(8,12))==="WEBP";
  if (t==="application/pdf") return String.fromCharCode(...b.slice(0,5))==="%PDF-";
  if (t==="video/mp4" || t==="video/quicktime") return String.fromCharCode(...b.slice(4,8))==="ftyp";
  if (t==="video/webm") return b[0]===0x1a && b[1]===0x45 && b[2]===0xdf && b[3]===0xa3;
  return false;
}
async function signed(bucket: string, path: string, seconds=3600) {
  const {data,error}=await db!.storage.from(bucket).createSignedUrl(path,seconds);
  return error ? null : data?.signedUrl || null;
}
function ip(req: Request) {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
async function rateLimit(req: Request, action: string, max=5) {
  const digest=await sha(ip(req)+"|"+KEY);
  const {error:insertError}=await db!.from("public_intake_rate_limits").insert({ip_hash:digest,action});
  if(insertError) throw new Error("Submission protection is temporarily unavailable.");
  const since=new Date(Date.now()-60*60*1000).toISOString();
  const {count,error}=await db!.from("public_intake_rate_limits").select("id",{count:"exact",head:true})
    .eq("ip_hash",digest).eq("action",action).gte("created_at",since);
  if(error) throw new Error("Submission protection is temporarily unavailable.");
  if((count||0)>max) throw new Error("Too many attempts. Please try again later.");
}
async function verifiedUser(req: Request) {
  const authorization=req.headers.get("authorization")||"";
  const jwt=authorization.replace(/^Bearer\s+/i,"");
  if(!jwt) return null;
  const {data,error}=await db!.auth.getUser(jwt);
  if(error || !data.user || !data.user.email || !data.user.email_confirmed_at) return null;
  return data.user;
}
async function founderValid(tokenValue: string) {
  if(!/^[0-9a-f]{64}$/.test(tokenValue)) return false;
  const {data,error}=await db!.rpc("vf_founder_gate_session_valid",{p_token_hash:await sha(tokenValue)});
  return !error && data===true;
}
async function uploadFiles(bucket: string, id: string, files: File[], max: number, types: string[]) {
  const paths: string[]=[];
  try {
    for(const file of files) {
      if(!validFile(file,max,types)) throw new Error("One or more files are too large or use an unsupported format.");
      if(!(await signatureOk(file))) throw new Error("A file does not match its declared file type.");
      const path=id+"/"+crypto.randomUUID()+"."+ext(file.type);
      const {error}=await db!.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
      if(error) throw new Error("A supporting file could not be uploaded.");
      paths.push(path);
    }
    return paths;
  } catch(error) {
    await cleanFiles(bucket,paths);
    throw error;
  }
}
async function cleanFiles(bucket: string, paths: string[]) {
  if(paths.length) await db!.storage.from(bucket).remove(paths);
}
async function handle(req: Request) {
  if(req.method==="OPTIONS") return new Response("ok",{headers});
  if(req.method!=="POST") return reply({error:"Method not allowed."},405);
  if(!db) return reply({error:"The application service is not configured."},503);
  let body: Record<string,unknown>={};
  let requestForm: FormData|null=null;
  const contentType=req.headers.get("content-type")||"";
  if(contentType.includes("application/json")) {
    try { body=await req.json(); } catch { return reply({error:"Invalid request."},400); }
  } else if(contentType.includes("multipart/form-data")) {
    try { requestForm=await req.clone().formData(); body.action=requestForm.get("action"); }
    catch { return reply({error:"Invalid form submission."},400); }
  }
  const action=safe(body.action,60);
  try {
    if(action==="list_adoptions") {
      const {data,error}=await db.from("adoption_cases")
        .select("id,case_code,animal_name,animal_type,breed,age_text,gender,animal_location,health_status,vaccination_status,sterilisation_status,adoption_reason,home_requirements,special_requirements,urgent,adoption_fee,description,photo_paths,published_at")
        .eq("publication","published").order("published_at",{ascending:false}).limit(60);
      if(error) throw error;
      const rows=[];
      for(const row of data||[]) {
        const photos=[];
        for(const path of (row.photo_paths||[]).slice(0,5)) {
          const url=await signed("adoption-case-files",path,3600);
          if(url) photos.push(url);
        }
        rows.push({...row,photos,photo_paths:undefined});
      }
      return reply({ok:true,cases:rows});
    }

    if(action==="submit_adoption") {
      const form=requestForm || await req.formData();
      if(safe(form.get("website"),200)) return reply({ok:true,message:"Submission received."});
      if(form.get("consent")!=="on") return reply({error:"Confirm that you have permission to submit these details and photographs."},400);
      await rateLimit(req,"adoption",5);
      const fields={
        applicant_name:safe(form.get("applicant_name"),120),
        applicant_email:safe(form.get("applicant_email"),180).toLowerCase(),
        applicant_phone:safe(form.get("applicant_phone"),32),
        applicant_relationship:safe(form.get("applicant_relationship"),80),
        applicant_city:safe(form.get("applicant_city"),120),
        animal_name:safe(form.get("animal_name"),100),
        animal_type:safe(form.get("animal_type"),40),
        breed:safe(form.get("breed"),100),
        age_text:safe(form.get("age_text"),80),
        gender:safe(form.get("gender"),40),
        animal_location:safe(form.get("animal_location"),160),
        health_status:safe(form.get("health_status"),1000),
        vaccination_status:safe(form.get("vaccination_status"),100),
        sterilisation_status:safe(form.get("sterilisation_status"),100),
        adoption_reason:safe(form.get("adoption_reason"),3000),
        home_requirements:safe(form.get("home_requirements"),1500),
        special_requirements:safe(form.get("special_requirements"),1500),
        urgent:form.get("urgent")==="true",
        adoption_fee:safe(form.get("adoption_fee"),80),
        description:safe(form.get("description"),3000)
      };
      if(!fields.applicant_name||!fields.applicant_phone||!fields.applicant_relationship||!fields.applicant_city||
         !fields.animal_name||!fields.animal_type||!fields.animal_location||!fields.adoption_reason)
        return reply({error:"Complete all required applicant, animal and adoption details."},400);
      if(!/^[+0-9() .-]{8,32}$/.test(fields.applicant_phone)) return reply({error:"Enter a valid contact number."},400);
      const photos=form.getAll("photos").filter((x):x is File=>x instanceof File && x.size>0);
      const docs=form.getAll("documents").filter((x):x is File=>x instanceof File && x.size>0);
      if(photos.length<1||photos.length>5) return reply({error:"Upload between 1 and 5 animal photographs."},400);
      if(docs.length>5) return reply({error:"Upload no more than 5 supporting documents."},400);
      const id=crypto.randomUUID(); let photoPaths:string[]=[];let docPaths:string[]=[];
      try {
        photoPaths=await uploadFiles("adoption-case-files",id,photos,8*1024*1024,["image/jpeg","image/png","image/webp"]);
        docPaths=await uploadFiles("adoption-case-files",id,docs,10*1024*1024,["image/jpeg","image/png","image/webp","application/pdf"]);
        const {data,error}=await db.from("adoption_cases").insert({...fields,id,photo_paths:photoPaths,document_paths:docPaths,publication:"pending_review"})
          .select("id,case_code").single();
        if(error||!data) throw new Error("The adoption application could not be saved.");
        return reply({ok:true,case_code:data.case_code,message:"Your adoption case has been sent to VEGANFARM for verification."});
      } catch(error) {
        await cleanFiles("adoption-case-files",[...photoPaths,...docPaths]);
        throw error;
      }
    }

    if(action==="submit_grant") {
      const user=await verifiedUser(req);
      if(!user) return reply({error:"Verify your email with the OTP before submitting a Fund Grant application."},401);
      const form=requestForm || await req.formData();
      if(safe(form.get("website"),200)) return reply({ok:true,message:"Application received."});
      if(form.get("consent")!=="on") return reply({error:"Accept the grant application declaration before submitting."},400);
      await rateLimit(req,"grant",3);
      const fields={
        applicant_name:safe(form.get("applicant_name"),120),
        email:(user.email||"").toLowerCase(),
        phone:safe(form.get("phone"),32),
        city:safe(form.get("city"),120),
        state:safe(form.get("state"),120),
        applicant_type:safe(form.get("applicant_type"),80),
        assistance_type:safe(form.get("assistance_type"),100),
        purpose:safe(form.get("purpose"),5000),
        amount_requested:Number(form.get("amount_requested")),
        amount_arranged:Number(form.get("amount_arranged")||0),
        amount_pending:Number(form.get("amount_pending")),
        urgency:safe(form.get("urgency"),60),
        needed_by:safe(form.get("needed_by"),120),
        beneficiary_details:safe(form.get("beneficiary_details"),3000),
        beneficiary_count:safe(form.get("beneficiary_count"),100),
        other_support:safe(form.get("other_support"),1500)
      };
      if(!fields.applicant_name||!fields.phone||!fields.city||!fields.state||!fields.applicant_type||!fields.assistance_type||
         !fields.purpose||!Number.isFinite(fields.amount_requested)||fields.amount_requested<=0||
         !Number.isFinite(fields.amount_arranged)||fields.amount_arranged<0||!Number.isFinite(fields.amount_pending)||fields.amount_pending<0||
         !fields.urgency||!fields.beneficiary_details)
        return reply({error:"Complete all required grant application fields with valid amounts."},400);
      if(fields.amount_arranged>fields.amount_requested || fields.amount_pending>fields.amount_requested ||
         Math.abs(fields.amount_requested-fields.amount_arranged-fields.amount_pending)>1)
        return reply({error:"Requested amount must equal the amount already arranged plus the remaining amount needed."},400);
      const docs=form.getAll("documents").filter((x):x is File=>x instanceof File && x.size>0);
      if(docs.length>8) return reply({error:"Upload a maximum of 8 supporting documents."},400);
      const id=crypto.randomUUID();let paths:string[]=[];let createdApplicationId:string|null=null;
      try {
        paths=await uploadFiles("fund-grant-files",id,docs,10*1024*1024,["image/jpeg","image/png","image/webp","application/pdf"]);
        const {data,error}=await db.from("fund_grant_applications").insert({...fields,user_id:user.id})
          .select("id,reference_code").single();
        if(error||!data) throw new Error("Your grant application could not be saved.");
        createdApplicationId=data.id;
        if(paths.length) {
          const documentRows=paths.map((path,i)=>({application_id:data.id,file_path:path,document_type:safe(form.getAll("document_types")[i],100)||"supporting_document",original_name:docs[i]?.name||null,mime_type:docs[i]?.type||"application/octet-stream",size_bytes:docs[i]?.size||0}));
          const {error:docError}=await db.from("fund_grant_documents").insert(documentRows);
          if(docError) throw new Error("Application saved, but document records could not be saved.");
        }
        return reply({ok:true,reference_code:data.reference_code,status:"pending_review",message:"Your application has been received."});
      } catch(error) {
        await cleanFiles("fund-grant-files",paths);
        if(createdApplicationId) await db.from("fund_grant_applications").delete().eq("id",createdApplicationId);
        throw error;
      }
    }

    if(action==="track_grant") {
      const user=await verifiedUser(req);
      if(!user) return reply({error:"Verify your email before tracking your application."},401);
      const reference=safe(body.reference_code,40).toUpperCase();
      if(!/^VF-FG-[A-F0-9]{8}$/.test(reference)) return reply({error:"Enter a valid application reference number."},400);
      const {data,error}=await db.from("fund_grant_applications")
        .select("reference_code,status,applicant_message,created_at,updated_at")
        .eq("reference_code",reference).eq("user_id",user.id).maybeSingle();
      if(error) throw error;
      if(!data) return reply({error:"No application was found for this verified email and reference number."},404);
      return reply({ok:true,application:data});
    }

    if(action==="admin_load") {
      if(!await founderValid(safe(body.token,200))) return reply({error:"Founder session expired. Sign in again."},401);
      const [adoptions,grants,docs]=await Promise.all([
        db.from("adoption_cases").select("*").order("created_at",{ascending:false}).limit(250),
        db.from("fund_grant_applications").select("*").order("created_at",{ascending:false}).limit(250),
        db.from("fund_grant_documents").select("*").order("created_at",{ascending:false}).limit(1000)
      ]);
      if(adoptions.error||grants.error||docs.error) throw new Error("Could not load Adoption and Fund Grant applications.");
      const adoptionRows=[];
      for(const row of adoptions.data||[]) {
        const photos=[]; for(const path of (row.photo_paths||[]).slice(0,5)){const url=await signed("adoption-case-files",path,900);if(url)photos.push(url);}
        const documents=[];for(const path of (row.document_paths||[]).slice(0,5)){const url=await signed("adoption-case-files",path,900);if(url)documents.push(url);}
        adoptionRows.push({...row,photo_urls:photos,document_urls:documents,photo_paths:undefined,document_paths:undefined});
      }
      const grantRows=[];
      for(const row of grants.data||[]) {
        const rowDocs=(docs.data||[]).filter(d=>d.application_id===row.id);
        const documents=[];for(const d of rowDocs){const url=await signed("fund-grant-files",d.file_path,900);documents.push({...d,signed_url:url,file_path:undefined});}
        grantRows.push({...row,documents});
      }
      return reply({ok:true,adoptions:adoptionRows,grants:grantRows});
    }

    if(action==="adoption_review"||action==="grant_review") {
      if(!await founderValid(safe(body.token,200))) return reply({error:"Founder session expired. Sign in again."},401);
      if(action==="adoption_review") {
        const id=safe(body.id,80),publication=safe(body.publication,30);
        if(!/^[0-9a-f-]{36}$/i.test(id)||!["under_verification","published","rejected","unpublished","adopted","closed"].includes(publication))
          return reply({error:"Invalid adoption review request."},400);
        const patch:Record<string,unknown>={publication,admin_note:safe(body.admin_note,3000),applicant_message:safe(body.applicant_message,1000),updated_at:new Date().toISOString()};
        patch.published_at=publication==="published"?new Date().toISOString():null;
        const {error}=await db.from("adoption_cases").update(patch).eq("id",id);
        if(error) throw new Error("Could not update the adoption case.");
        await db.from("audit_log").insert({actor:null,actor_role:"founder",module:"adoption",action:publication,record_id:id,record_ref:id,detail:"Adoption case review updated."});
        return reply({ok:true});
      }
      const id=safe(body.id,80),status=safe(body.status,40);
      if(!/^[0-9a-f-]{36}$/i.test(id)||!["under_review","more_info_required","approved","rejected","assistance_provided","closed"].includes(status))
        return reply({error:"Invalid grant review request."},400);
      const patch={status,admin_note:safe(body.admin_note,3000),applicant_message:safe(body.applicant_message,1000),updated_at:new Date().toISOString()};
      const {error}=await db.from("fund_grant_applications").update(patch).eq("id",id);
      if(error) throw new Error("Could not update the Fund Grant application.");
      await db.from("audit_log").insert({actor:null,actor_role:"founder",module:"fund_grant",action:status,record_id:id,record_ref:id,detail:"Fund Grant review updated."});
      return reply({ok:true});
    }
    return reply({error:"Unknown application action."},400);
  } catch(error) {
    console.error("VEGANFARM application service error:",error);
    return reply({error:error instanceof Error?error.message:"The request could not be completed."},500);
  }
}
Deno.serve(handle);
