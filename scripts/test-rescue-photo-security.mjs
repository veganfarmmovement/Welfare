import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");
const photoAsset = read("../assets/veganfarm-private-case-photos.js");
const edge = read("../supabase/functions/veganfarm-team-gate/index.ts");
const migration = read("../supabase-phase7-private-case-photo-storage.sql");
const rollback = read("../supabase-phase7-private-case-photo-storage-rollback.sql");

let inlineCount = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = match[1] || "";
  if (/\bsrc\s*=/.test(attrs)) continue;
  if (/\btype\s*=\s*["']application\/(?:ld\+json|json)["']/.test(attrs)) continue;
  const source = match[2] || "";
  if (!source.trim()) continue;
  new vm.Script(source, { filename: "index.html:inline-script-" + (++inlineCount) });
}
assert.ok(inlineCount >= 15, "Expected to parse the app's inline JavaScript modules");
new vm.Script(photoAsset, { filename: "veganfarm-private-case-photos.js" });

const appUploads = [...html.matchAll(/(?:up|upload)\(['"](?:case-photos|rescue-case-photos)['"]/g)].map((m) => m[0]);
assert.equal(appUploads.length, 6, "Expected six explicit case-photo upload call sites");
assert.ok(appUploads.every((call) => call.includes("rescue-case-photos")), "Every active app case-photo upload must use the private bucket");
assert.doesNotMatch(html, /(?:up|upload)\(['"]case-photos['"]/, "No active app upload may target legacy case-photos");
assert.doesNotMatch(html, /storage\.from\(['"](?:case-photos|rescue-case-photos)['"]\)\.getPublicUrl/, "Rescue photos must not use permanent public URLs");
assert.match(html, /assets\/veganfarm-private-case-photos\.js/, "Private signed-photo loader must be included");
assert.match(html, /client\.functions\.invoke\(\x27veganfarm-team-gate\x27/, "Active shared-code Team portal must use the Edge Function");
assert.match(html, /Only JPG or PNG rescue photographs are allowed/, "Browser photo helper must match the private bucket MIME allowlist");

assert.match(html, /bucket==='rescue-case-photos'\?'rescue-case-photos\/'\+uploadPath/, "App must store a bucket-prefixed private object path");
assert.match(html, /saveUpload\(userId\+'\/'\+path\)/, "Direct Team uploads must use the authenticated user's folder");

assert.match(photoAsset, /typeof APP!=='undefined'/, "Signed-photo loader must read the lexical APP binding");
assert.match(photoAsset, /createSignedUrl\(source\.path,SIGNED_URL_TTL\)/, "Signed-photo loader must use signed URLs");
assert.match(photoAsset, /SIGNED_URL_TTL=300/, "Signed URLs must expire after five minutes");
assert.match(photoAsset, /RENEW_AFTER_MS=240000/, "Signed URLs must refresh before expiry");
assert.match(photoAsset, /visibilitychange/, "Signed URLs must refresh immediately when the page becomes visible");
assert.match(photoAsset, /item\.live\.photo=item\.photo/, "Public live snapshot must receive the signed URL");
assert.match(photoAsset, /window\.syncCases\(\)/, "Public case cards must be rebuilt after signing");
assert.match(photoAsset, /update\(\{photo_path:null,photo_url:null\}\)/, "Founder photo removal must persist to the database");
assert.match(photoAsset, /typeof toast===\x27function\x27/, "Founder photo removal must use the app\x27s lexical toast binding");

assert.match(edge, /from\("rescue-case-photos"\)\.upload/, "Team Edge Function must upload to the private bucket");
assert.match(edge, /photo_path: \`rescue-case-photos\/\$\{photoPath\}\`/, "Team Edge Function must persist the bucket prefix");
assert.doesNotMatch(edge, /from\("case-photos"\)/, "Team Edge Function must not use legacy case-photos");
assert.match(edge, /validFileSignature\(file\)/, "Team Edge Function must validate file signatures");

assert.match(migration, /update storage\.buckets[\s\S]*?set public=false[\s\S]*?case-photos/, "Migration must make legacy case bucket private");
assert.match(migration, /drop policy if exists "Admins can view rescue photos"/, "Migration must remove legacy admin policy");
assert.match(migration, /create policy vf_case_photos_anon_published_read[\s\S]*?to anon[\s\S]*?publication='published'/, "Legacy anonymous signing must require published cases");
assert.match(migration, /create policy vf_rescue_case_photos_anon_published_read[\s\S]*?to anon[\s\S]*?publication='published'/, "New-bucket anonymous signing must require published cases");
assert.match(migration, /private\.is_founder\(\)/, "Founder access must use the approved Founder helper");
assert.match(migration, /private\.is_team\(\)/, "Team access must use the approved Team helper");
assert.match(migration, /split_part\(storage\.objects\.name,'\/',1\)=\(select auth\.uid\(\)\)::text/, "Team insert path must match auth.uid");
assert.doesNotMatch(migration, /update public\.rescue_cases/i, "Forward migration must not rewrite rescue records or photo paths");

assert.match(rollback, /raise exception 'Rollback stopped: rescue-case-photos still contains objects\./, "Rollback must stop while new-bucket objects remain");
assert.match(rollback, /update public\.rescue_cases[\s\S]*?photo_path=substring/, "Rollback must restore legacy path prefixes after copy verification");
assert.match(rollback, /set public=true where id='case-photos'/, "Rollback must restore the legacy bucket setting");

console.log("Rescue-photo static checks passed.");
console.log("Inline scripts parsed:", inlineCount);
console.log("Case-photo upload call sites:", appUploads.length);
