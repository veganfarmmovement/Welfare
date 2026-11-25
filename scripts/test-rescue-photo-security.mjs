import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const html=read("../index.html");
const photoAsset=read("../assets/veganfarm-private-case-photos.js");
const frontendJs=read("../assets/veganfarm-frontend-v2.js");
const frontendCss=read("../assets/veganfarm-frontend-v2.css");
const luxuryJs=read("../assets/veganfarm-luxury-cinematic.js");
const luxuryCss=read("../assets/veganfarm-luxury-cinematic.css");
const browserAudit=read("./browser-audit.mjs");
const edge=read("../supabase/functions/veganfarm-team-gate/index.ts");
const migration=read("../supabase-phase7-private-case-photo-storage.sql");
const rollback=read("../supabase-phase7-private-case-photo-storage-rollback.sql");

let inlineCount=0;
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const attrs=match[1]||"";
 if(/\bsrc\s*=/.test(attrs)||/\btype\s*=\s*["']application\/(?:ld\+json|json)["']/.test(attrs))continue;
 const source=match[2]||"";if(!source.trim())continue;
 new vm.Script(source,{filename:"index.html:inline-script-"+(++inlineCount)});
}
assert.ok(inlineCount>=15,"Existing core application modules must remain present and parse");
new vm.Script(frontendJs,{filename:"veganfarm-frontend-v2.js"});
new vm.Script(luxuryJs,{filename:"veganfarm-luxury-cinematic.js"});
new vm.Script(photoAsset,{filename:"veganfarm-private-case-photos.js"});

assert.match(html,/<html lang="en" dir="ltr">/,"The site must be English and left-to-right");
assert.match(html,/assets\/veganfarm-frontend-v2\.css/,"The new frontend design system must load");
assert.match(html,/assets\/veganfarm-frontend-v2\.js/,"The new frontend renderer must load");
assert.ok(html.includes("assets/veganfarm-luxury-cinematic.css"),"The luxury stylesheet must load");
assert.ok(html.includes("assets/veganfarm-luxury-cinematic.js"),"The luxury presentation script must load");
assert.match(luxuryJs,/P\.home=homepage/,"The cinematic layer must own the final homepage");
assert.ok(luxuryJs.includes("city-level locations only"),"The rescue explorer must disclose approximate city-level locations");
assert.match(luxuryCss,/prefers-reduced-motion:reduce/,"The luxury layer must respect reduced-motion preferences");
assert.doesNotMatch(html,/veganfarm-unified\.css|veganfarm-simple-colour-system\.css|modern-upgrade\.js|veganfarm-editorial-redesign\.js|veganfarm-forest-luxury\.js/,"Legacy presentation layers must not be active");
assert.doesNotMatch(html,/vf-language|veganfarm-languages/,"Language selectors and translation scripts must not be active");
assert.doesNotMatch(html,/veganfarm-piano\.js/,"The old music player must not be part of the public website template");
assert.match(frontendCss,/\.vf2-menu a\[href="#admin"\]/,"Private administration links must not clutter the public navigation");
assert.equal((html.match(/rel="stylesheet"/g)||[]).length,2,"The frontend foundation and luxury override stylesheet should control the application");
assert.match(frontendJs,/P\.home=home/,"V2 must own the homepage renderer");
assert.match(frontendJs,/P\.projects=function/,"V2 must provide a dedicated Projects template");
assert.match(frontendJs,/P\.education=function/,"V2 must provide a dedicated Education template");
assert.match(frontendJs,/P\.impact=function/,"V2 must provide a dedicated Impact template");
assert.match(frontendJs,/No sample statistics or unverified estimates are displayed/,"Impact presentation must not publish seeded sample figures");
assert.match(frontendJs,/P\[route\]=function/,"V2 must wrap existing route content in its new page templates");
assert.match(frontendJs,/function buildHeader\(/,"V2 must own the public navigation presentation");
assert.match(frontendJs,/function buildFooter\(/,"V2 must own the footer presentation");
assert.match(frontendJs,/vf2-private/,"Team and Founder routes must receive the V2 private workspace presentation");
assert.match(frontendJs,/Compassion is not just a belief\./,"Homepage must use the requested headline");
assert.match(frontendJs,/VEGANFARM Movement brings people together to support animal welfare, expand access to education and encourage a more compassionate world\./,"Homepage must use the requested supporting copy");
assert.match(frontendJs,/Support a Rescue/,"Homepage must include the rescue action");
assert.match(frontendJs,/Explore Our Work/,"Homepage must include the work exploration action");
assert.match(frontendJs,/photo-1548199973-03cce0bbc87b/,"Homepage must use cinematic animal photography");
assert.match(frontendJs,/ILLUSTRATIVE PHOTOGRAPH/,"Stock photography must be identified as illustrative");
assert.match(frontendJs,/case-detail/,"Individual rescue cases must receive a dedicated page layout");
assert.match(frontendJs,/Photography credits/,"The new footer must retain photo credits");
assert.match(frontendCss,/--vf2-ivory:#FFFDF5/,"The design system must use the requested ivory");
assert.match(frontendCss,/--vf2-ink:#1D2C21/,"The design system must use the requested dark text");
assert.match(frontendCss,/--vf2-forest:#173D2B/,"The design system must use forest green");
assert.match(frontendCss,/--vf2-leaf:#286B36/,"The design system must use leaf green");
assert.match(frontendCss,/--vf2-gold:#C7A66A/,"The design system must use champagne");
assert.match(frontendCss,/Newsreader/,"Editorial headings must use Newsreader");
assert.match(frontendCss,/DM Sans/,"Body text must use DM Sans");
assert.match(frontendCss,/@media\(max-width:860px\)/,"The navigation must have a tablet/mobile layout");
assert.match(frontendCss,/@media\(max-width:560px\)/,"The design must have a dedicated small-screen layout");
assert.match(frontendCss,/prefers-reduced-motion:reduce/,"Motion must respect reduced-motion preferences");
assert.match(frontendCss,/vf-team-access-card/,"The Team access card must be styled in the new system");
assert.match(frontendCss,/#app\.vf2-founder/,"The Founder workspace must have a dedicated V2 treatment");
assert.match(browserAudit,/routeChecks/,"Browser audit must test rendered routes");
assert.match(browserAudit,/englishOnlyCheck/,"Browser audit must verify English-only behaviour");
assert.match(browserAudit,/team-access-desktop\.png/,"Browser audit must capture the Team access screen");

assert.match(html,/window\.VF_QR=QR/,"Donation presentation must reuse the existing UPI QR data");
assert.match(html,/function donSubmit\(e\)/,"The existing donation verification handler must remain connected");
assert.match(html,/function fsub\(e,k/,"The existing Supabase-backed form submission handler must remain connected");
assert.match(html,/vfTeamUnlock\(event\)/,"The existing server-verified Team unlock handler must remain connected");
assert.ok(html.includes("function feedingForm()"),"A dedicated Feeding form must be present");
assert.ok(html.includes("function treatmentForm()"),"A dedicated Treatment form must be present");
assert.ok(html.includes("caseSection('Feeding requirements'"),"The Feeding form must have its own feeding requirements section");
assert.ok(html.includes("caseSection('Veterinary and treatment details'"),"The Treatment form must have its own veterinary details section");
assert.ok(html.includes('name="fdaily"'),"The Feeding form must collect daily feeding cost");
assert.ok(html.includes('name="food_type"'),"The Feeding form must collect food type");
assert.ok(html.includes('name="frequency"'),"The Feeding form must collect feeding frequency");
assert.ok(html.includes('name="hosp"'),"The Treatment form must collect hospital details");
assert.ok(html.includes('name="cond"'),"The Treatment form must collect medical condition");
assert.ok(html.includes('name="treat"'),"The Treatment form must collect treatment details");
assert.ok(html.includes('name="amt"'),"The Treatment form must collect estimated treatment cost");
assert.ok(html.includes('name="case_video"'),"The Treatment form must support a case video");
assert.ok(html.includes("window.tNew=async function(event,forcedKind)"),"Team case submissions must use the secure server handler");
assert.ok(html.includes("client.functions.invoke('veganfarm-team-gate',{body:fd})"),"Feeding and Treatment submissions must be sent to the Team Edge Function");

assert.match(html,/client\.functions\.invoke\(\x27veganfarm-team-gate\x27/,"The active shared-code Team portal must use the existing Edge Function");
assert.match(html,/assets\/veganfarm-private-case-photos\.js/,"The private signed-photo loader must remain included");
assert.ok(html.includes("if(window.vfRole!=='team')return;")&&html.indexOf("public_case_documents",html.indexOf("if(window.vfRole!=='team')return;"))>-1,"Anonymous visitors must not query restricted case attachments");
assert.ok(html.includes("window.vfAfterLogin=function(){if(window.vfRole!=='team')return Promise.resolve();"),"Only authenticated Team sessions may load Team case attachments");
assert.ok(html.includes("function enrichLoadedCases(){\n    if(window.vfRole!=='founder'&&window.vfRole!=='team')return Promise.resolve();"),"Anonymous visitors must not enrich private rescue-case records");

const appUploads=[...html.matchAll(/(?:up|upload)\(['"](?:case-photos|rescue-case-photos)['"]/g)].map(m=>m[0]);
assert.equal(appUploads.length,6,"Expected six explicit case-photo upload call sites");
assert.ok(appUploads.every(call=>call.includes("rescue-case-photos")),"Every active app case-photo upload must use the private bucket");
assert.doesNotMatch(html,/(?:up|upload)\(['"]case-photos['"]/,"No active app upload may target legacy case-photos");
assert.doesNotMatch(html,/storage\.from\(['"](?:case-photos|rescue-case-photos)['"]\)\.getPublicUrl/,"Rescue photos must not use permanent public URLs");
assert.match(html,/Only JPG or PNG rescue photographs are allowed/,"Browser photo helper must match the private bucket MIME allowlist");
assert.match(html,/bucket==='rescue-case-photos'\?'rescue-case-photos\/'\+uploadPath/,"App must store a bucket-prefixed private object path");
assert.match(html,/saveUpload\(userId\+'\/'\+path\)/,"Direct Team uploads must use the authenticated user's folder");

assert.match(photoAsset,/typeof APP!=='undefined'/,"Signed-photo loader must read the lexical APP binding");
assert.match(photoAsset,/createSignedUrl\(source\.path,SIGNED_URL_TTL\)/,"Signed-photo loader must use signed URLs");
assert.match(photoAsset,/SIGNED_URL_TTL=300/,"Signed URLs must expire after five minutes");
assert.match(photoAsset,/RENEW_AFTER_MS=240000/,"Signed URLs must refresh before expiry");
assert.match(photoAsset,/visibilitychange/,"Signed URLs must refresh when the page becomes visible");
assert.match(photoAsset,/item\.live\.photo=item\.photo/,"Public live snapshot must receive the signed URL");
assert.match(photoAsset,/window\.syncCases\(\)/,"Public case cards must be rebuilt after signing");
assert.match(photoAsset,/update\(\{photo_path:null,photo_url:null\}\)/,"Founder photo removal must persist to the database");
assert.match(photoAsset,/client\.storage\.from\(source\.bucket\)\.remove\(\[source\.path\]\)/,"Founder photo removal must delete unreferenced private Storage objects");
assert.match(photoAsset,/eq\('photo_path',storedPath\)\.neq\('id',item\.dbId\)/,"Founder deletion must check for other case references");
assert.match(photoAsset,/storage-delete-failed/,"Storage deletion failures must be surfaced for manual cleanup");

assert.match(edge,/from\("rescue-case-photos"\)\.upload/,"Team Edge Function must upload to the private bucket");
assert.match(edge,/photo_path: \`rescue-case-photos\/\$\{photoPath\}\`/,"Team Edge Function must persist the bucket prefix");
assert.doesNotMatch(edge,/from\("case-photos"\)/,"Team Edge Function must not use legacy case-photos");
assert.match(edge,/validFileSignature\(file\)/,"Team Edge Function must validate file signatures");

assert.match(migration,/update storage\.buckets[\s\S]*?set public=false[\s\S]*?case-photos/,"Migration must make legacy case bucket private");
assert.match(migration,/drop policy if exists "Admins can view rescue photos"/,"Migration must remove legacy admin policy");
assert.match(migration,/create policy vf_case_photos_anon_published_read[\s\S]*?to anon[\s\S]*?publication='published'/,"Legacy anonymous signing must require published cases");
assert.match(migration,/create policy vf_rescue_case_photos_anon_published_read[\s\S]*?to anon[\s\S]*?publication='published'/,"New-bucket anonymous signing must require published cases");
assert.match(migration,/private\.is_founder\(\)/,"Founder access must use the approved Founder helper");
assert.match(migration,/private\.is_team\(\)/,"Team access must use the approved Team helper");
assert.match(migration,/split_part\(storage\.objects\.name,'\/',1\)=\(select auth\.uid\(\)\)::text/,"Team insert path must match auth.uid");
assert.doesNotMatch(migration,/update public\.rescue_cases/i,"Forward migration must not rewrite rescue records or photo paths");
assert.match(rollback,/raise exception 'Rollback stopped: rescue-case-photos still contains objects\./,"Rollback must stop while new-bucket objects remain");
assert.match(rollback,/update public\.rescue_cases[\s\S]*?photo_path=substring/,"Rollback must restore legacy path prefixes after copy verification");
assert.match(rollback,/set public=true where id='case-photos'/,"Rollback must restore the legacy bucket setting");

async function exercisePhotoHelper({otherReferences = false, deleteError = null} = {}) {
  const signedCalls = [];
  const removed = [];
  const updates = [];
  const notices = [];
  let intervalCallback = null;
  let visibilityCallback = null;
  const client = {
    storage: {
      from(bucket) {
        return {
          createSignedUrl(path, ttl) {
            signedCalls.push({ bucket, path, ttl });
            return Promise.resolve({ data: { signedUrl: "https://signed.example/" + signedCalls.length }, error: null });
          },
          remove(paths) {
            removed.push({ bucket, paths });
            return Promise.resolve({ data: null, error: deleteError });
          },
        };
      },
    },
    from(table) {
      assert.equal(table, "rescue_cases");
      return {
        update(patch) {
          updates.push(patch);
          return {
            eq() {
              return { select() { return { single: async () => ({ data: { id: "db-1" }, error: null }) }; } };
            },
          };
        },
        select() {
          return {
            eq() {
              return {
                neq() {
                  return {
                    limit: async () => ({ data: otherReferences ? [{ id: "db-other" }] : [], error: null }),
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  const record = {
    id: "VF-1",
    dbId: "db-1",
    photoPath: "rescue-case-photos/db-1/animal.jpg",
    ppath: "rescue-case-photos/db-1/animal.jpg",
    live: {},
  };
  const window = {
    vfSupabase: client,
    vfRole: "founder",
    addEventListener() {},
    setTimeout() {},
    setInterval(callback) { intervalCallback = callback; },
    syncCases() {},
    go() {},
    vfReload: async () => {},
  };
  const document = {
    visibilityState: "visible",
    addEventListener(event, callback) {
      if (event === "visibilitychange") visibilityCallback = callback;
    },
  };
  vm.runInNewContext(photoAsset, {
    window, document, APP: [record], Date, Promise,
    console: { warn() {}, info() {}, error() {} },
    toast(message) { notices.push(message); },
  });
  await window.vfSignPrivateCasePhotos();
  assert.equal(signedCalls.length, 1, "Initial load must sign a private photo");
  assert.deepEqual(signedCalls[0], { bucket: "rescue-case-photos", path: "db-1/animal.jpg", ttl: 300 });
  assert.equal(record.live.photo, "https://signed.example/1", "Public live snapshot must receive the signed URL");

  record.photoSignedAt = Date.now() - 241000;
  intervalCallback();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(signedCalls.length, 2, "Refresh interval must renew a URL before its five-minute expiry");
  record.photoSignedAt = Date.now() - 241000;
  visibilityCallback();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(signedCalls.length, 3, "Returning to a visible tab must renew an ageing URL");

  await window.rmPhoto("VF-1");
  assert.equal(updates[0].photo_path, null);
  assert.equal(updates[0].photo_url, null);
  if (otherReferences) {
    assert.equal(removed.length, 0, "A shared object must not be deleted");
    assert.ok(notices.some((message) => message.includes("another case still references it")));
  } else if (deleteError) {
    assert.equal(removed.length, 1, "Storage deletion must be attempted after the row is cleared");
    assert.ok(notices.some((message) => message.includes("private storage object may need Founder cleanup")));
  } else {
    assert.equal(removed.length, 1);
    assert.equal(removed[0].bucket, "rescue-case-photos");
    assert.equal(removed[0].paths[0], "db-1/animal.jpg");
    assert.ok(notices.some((message) => message.includes("private storage object deleted")));
  }
}

await exercisePhotoHelper();
await exercisePhotoHelper({ otherReferences: true });
await exercisePhotoHelper({ deleteError: { message: "simulated Storage failure" } });

console.log("Rescue-photo static checks passed.");
console.log("Inline scripts parsed:", inlineCount);
console.log("Case-photo upload call sites:", appUploads.length);
