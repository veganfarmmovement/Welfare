import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGIN = "https://veganfarmmovement.github.io";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Vary": "Origin",
};

const db = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function text(form: FormData, key: string, max = 4000) {
  const value = form.get(key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function validFile(value: FormDataEntryValue | null, maxBytes: number, allowed: string[]) {
  if (!(value instanceof File) || value.size <= 0 || value.size > maxBytes) return null;
  if (!allowed.includes(value.type)) return null;
  return value;
}

function extension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "application/pdf") return "pdf";
  if (type === "video/mp4") return "mp4";
  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";
  return "";
}

async function validFileSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (file.type === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (file.type === "image/png") return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (file.type === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (file.type === "video/webm") return starts(0x1a, 0x45, 0xdf, 0xa3);
  if (file.type === "video/mp4" || file.type === "video/quicktime") return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
  return false;
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return req.headers.get("cf-connecting-ip")?.trim()
    || req.headers.get("x-real-ip")?.trim()
    || forwarded
    || "unknown";
}

async function removeUploaded(paths: { bucket: string; path: string }[]) {
  for (const item of paths) {
    try { await db!.storage.from(item.bucket).remove([item.path]); } catch (_error) { /* best effort cleanup */ }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const origin = req.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed." }, 403);
  if (!db) return json({ error: "Team submission service is not configured." }, 500);

  const contentType = req.headers.get("content-type") || "";

  // Stage 1: verify the shared code on the server and issue a random, time-limited session.
  if (contentType.includes("application/json")) {
    let payload: Record<string, unknown>;
    try { payload = await req.json(); } catch (_error) { return json({ error: "Invalid request." }, 400); }
    if (payload.action === "my_submissions" && typeof payload.token === "string") {
      const tokenValue = payload.token.trim();
      if (!/^[0-9a-f]{64}$/.test(tokenValue)) return json({ error: "Team access has expired. Enter the code again." }, 401);
      const { data: validSession, error: validError } = await db.rpc("vf_team_gate_session_valid", { p_token_hash: await sha256(tokenValue) });
      if (validError || validSession !== true) return json({ error: "Team access has expired. Enter the code again." }, 401);
      const { data: submissions, error: submissionsError } = await db.from("rescue_cases")
        .select("id,case_code,animal_name,animal_type,location,kind,status,publication,review_note,created_at,updated_at")
        .contains("extra", { submitted_via: "VEGANFARM Team" })
        .order("created_at", { ascending: false });
      if (submissionsError) return json({ error: "Could not load Team submissions." }, 500);
      return json({ ok: true, submissions: submissions || [] });
    }
    if (payload.action !== "verify" || typeof payload.code !== "string") {
      return json({ error: "Invalid request." }, 400);
    }
    const code = payload.code.trim();
    if (!code || code.length > 100) return json({ error: "Enter the correct Team access code." }, 401);

    const token = randomToken();
    const tokenHash = await sha256(token);
    const ipHash = await sha256(getClientIp(req));
    const { data, error } = await db.rpc("vf_team_gate_verify", {
      p_code: code,
      p_token_hash: tokenHash,
      p_ip_hash: ipHash,
    });
    if (error) {
      console.error("Team gate verification database error:", error.message);
      return json({ error: "Could not verify the access code. Try again later." }, 500);
    }
    if (data !== true) return json({ error: "Incorrect code, or too many attempts. Check the code and try again later." }, 401);

    return json({ ok: true, token, expires_in: 28800 });
  }

  // Stage 2: validate the server-issued session before accepting any case data.
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "Unsupported request format." }, 415);
  }

  let form: FormData;
  try { form = await req.formData(); } catch (_error) { return json({ error: "Could not read the submission." }, 400); }

  const token = text(form, "token", 200);
  if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "Team access has expired. Enter the code again." }, 401);
  const tokenHash = await sha256(token);
  const { data: sessionValid, error: sessionError } = await db.rpc("vf_team_gate_session_valid", {
    p_token_hash: tokenHash,
  });
  if (sessionError || sessionValid !== true) {
    return json({ error: "Team access has expired. Enter the code again." }, 401);
  }

  const kind = text(form, "kind", 20);
  if (kind !== "Feeding" && kind !== "Treatment") return json({ error: "Choose Feeding or Treatment." }, 400);

  const animalName = text(form, "n", 120);
  const animalType = text(form, "animal_type", 80);
  const location = text(form, "loc", 240);
  const description = text(form, "desc", 4000);
  const finderName = text(form, "vname", 120);
  const finderPhone = text(form, "vphone", 40);
  if (!animalName || !animalType || !location || !description || finderName.length < 2 || finderPhone.replace(/\D/g, "").length < 10) {
    return json({ error: "Complete all required animal, location and contact details." }, 400);
  }

  const photo = validFile(form.get("photo"), 5 * 1024 * 1024, ["image/jpeg", "image/png"]);
  if (!photo) return json({ error: "Upload a JPG or PNG animal photograph up to 5 MB." }, 400);

  const fdaily = Number(text(form, "fdaily", 30));
  const animalCount = Number(text(form, "fn", 20));
  const treatmentEstimate = Number(text(form, "amt", 30));
  const hospital = text(form, "hosp", 240);
  const condition = text(form, "cond", 500);
  const treatment = text(form, "treat", 3000);
  const foodType = text(form, "food_type", 240);
  const frequency = text(form, "frequency", 100);

  if (kind === "Feeding" && (!Number.isFinite(fdaily) || fdaily <= 0 || !Number.isInteger(animalCount) || animalCount <= 0 || !foodType || !frequency)) {
    return json({ error: "Complete the number of animals, food, feeding frequency and daily cost." }, 400);
  }
  if (kind === "Treatment" && (!hospital || !condition || !treatment || !Number.isFinite(treatmentEstimate) || treatmentEstimate <= 0)) {
    return json({ error: "Complete the hospital, condition, treatment and estimated cost." }, 400);
  }

  const report = kind === "Treatment" && form.has("rep")
    ? validFile(form.get("rep"), 10 * 1024 * 1024, ["image/jpeg", "image/png", "application/pdf"])
    : null;
  const bill = kind === "Treatment" && form.has("bill")
    ? validFile(form.get("bill"), 10 * 1024 * 1024, ["image/jpeg", "image/png", "application/pdf"])
    : null;
  if (kind === "Treatment" && form.get("rep") instanceof File && (form.get("rep") as File).size > 0 && !report) {
    return json({ error: "Medical report must be JPG, PNG or PDF and no larger than 10 MB." }, 400);
  }
  if (kind === "Treatment" && form.get("bill") instanceof File && (form.get("bill") as File).size > 0 && !bill) {
    return json({ error: "Veterinary bill must be JPG, PNG or PDF and no larger than 10 MB." }, 400);
  }
  const video = kind === "Treatment" && form.has("case_video")
    ? validFile(form.get("case_video"), 50 * 1024 * 1024, ["video/mp4", "video/webm", "video/quicktime"])
    : null;
  if (kind === "Treatment" && form.get("case_video") instanceof File && (form.get("case_video") as File).size > 0 && !video) {
    return json({ error: "Case video must be MP4, WebM or MOV and no larger than 50 MB." }, 400);
  }

  // Optional supporting evidence is accepted for both Feeding and Treatment submissions.
  const attachmentEntries = form.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (attachmentEntries.length > 8) return json({ error: "Upload a maximum of 8 supporting files." }, 400);
  const attachments: File[] = [];
  for (const entry of attachmentEntries) {
    const accepted = validFile(entry, 10 * 1024 * 1024, ["image/jpeg", "image/png", "application/pdf", "video/mp4", "video/webm", "video/quicktime"]);
    if (!accepted) return json({ error: "Supporting files must be JPG, PNG, PDF, MP4, WebM or MOV and no larger than 10 MB each." }, 400);
    attachments.push(accepted);
  }

  for (const file of [photo, report, bill, video, ...attachments]) {
    if (file && !(await validFileSignature(file))) return json({ error: "One of the uploaded files does not match its declared file type." }, 400);
  }

  const caseId = crypto.randomUUID();
  const uploaded: { bucket: string; path: string }[] = [];
  let caseCreated = false;

  try {
    const photoPath = `${caseId}/animal-${crypto.randomUUID()}.${extension(photo.type)}`;
    const photoUpload = await db.storage.from("case-photos").upload(photoPath, photo, {
      contentType: photo.type,
      upsert: false,
    });
    if (photoUpload.error) throw new Error("Animal photograph upload failed: " + photoUpload.error.message);
    uploaded.push({ bucket: "case-photos", path: photoPath });

    const extra = {
      case_type: kind,
      est: kind === "Feeding" ? fdaily * 30 : treatmentEstimate,
      fdaily: kind === "Feeding" ? fdaily : 0,
      fn: kind === "Feeding" ? animalCount : 0,
      food_type: kind === "Feeding" ? foodType : "",
      frequency: kind === "Feeding" ? frequency : "",
      feeding_notes: kind === "Feeding" ? description : "",
      submitted_via: "VEGANFARM Team",
    };

    const row = {
      id: caseId,
      animal_name: animalName,
      animal_type: animalType,
      location,
      hospital: kind === "Treatment" ? hospital : null,
      medical_condition: kind === "Treatment" ? condition : null,
      condition: kind === "Treatment" ? condition : null,
      treatment_required: kind === "Treatment" ? treatment : null,
      treatment: kind === "Treatment" ? treatment : null,
      description,
      kind,
      status: kind === "Feeding" ? "Feeding ongoing" : "Awaiting treatment",
      treatment_status: kind === "Feeding" ? "Feeding ongoing" : "Awaiting treatment",
      publication: "pending_review",
      publication_status: "Pending",
      target_amount: null,
      fundraising_target: null,
      photo_path: photoPath,
      submitted_by: null,
      urgent: false,
      is_urgent: false,
      extra,
    };

    const insertCase = await db.from("rescue_cases").insert(row).select("id,case_code").single();
    if (insertCase.error || !insertCase.data) throw new Error(insertCase.error?.message || "Case record was not created.");
    caseCreated = true;

    const contact = await db.from("case_private").insert({
      case_id: caseId,
      finder_name: finderName,
      finder_phone: finderPhone,
    });
    if (contact.error) throw new Error("Private contact detail could not be saved: " + contact.error.message);

    const documents = [];
    for (const [doc, documentType] of [[report, "medical_report"], [bill, "veterinary_bill"], [video, "treatment_video"]] as const) {
      if (!doc) continue;
      const path = `${caseId}/${documentType}-${crypto.randomUUID()}.${extension(doc.type)}`;
      const upload = await db.storage.from("case-documents").upload(path, doc, {
        contentType: doc.type,
        upsert: false,
      });
      if (upload.error) throw new Error("Case document upload failed: " + upload.error.message);
      uploaded.push({ bucket: "case-documents", path });
      documents.push({
        case_id: caseId,
        document_type: documentType,
        file_path: path,
        is_public: false,
        created_by: null,
      });
    }

    for (const doc of attachments) {
      const path = `${caseId}/supporting-${crypto.randomUUID()}.${extension(doc.type)}`;
      const upload = await db.storage.from("case-documents").upload(path, doc, {
        contentType: doc.type,
        upsert: false,
      });
      if (upload.error) throw new Error("Supporting evidence upload failed: " + upload.error.message);
      uploaded.push({ bucket: "case-documents", path });
      documents.push({
        case_id: caseId,
        document_type: "supporting_attachment",
        file_path: path,
        is_public: false,
        created_by: null,
      });
    }

    if (documents.length) {
      const docInsert = await db.from("case_documents").insert(documents);
      if (docInsert.error) throw new Error("Case document details could not be saved: " + docInsert.error.message);
    }

    return json({
      ok: true,
      case_id: caseId,
      case_code: insertCase.data.case_code,
      kind,
      status: "pending_review",
      message: "Case submitted to the Founder for review.",
    });
  } catch (error) {
    console.error("VEGANFARM Team case submission failed:", error);
    if (caseCreated) {
      // Never erase a successfully created case because an optional attachment failed.
      // Preserve the case and its uploaded animal photo; report the attachment issue clearly.
      return json({
        ok: true,
        case_id: caseId,
        case_code: (await db.from("rescue_cases").select("case_code").eq("id", caseId).maybeSingle()).data?.case_code || "saved",
        kind,
        status: "pending_review",
        warning: "The case was saved, but an optional attachment could not be saved: " + (error instanceof Error ? error.message : "attachment error"),
        message: "Case saved to Founder review. Please contact the Founder to add the missing attachment.",
      });
    }
    await removeUploaded(uploaded);
    return json({ error: error instanceof Error ? error.message : "Case submission failed. Please try again." }, 500);
  }
});
