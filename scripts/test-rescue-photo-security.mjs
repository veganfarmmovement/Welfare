import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");
const photoAsset = read("../assets/veganfarm-private-case-photos.js");
const visualCss = read("../assets/veganfarm-unified.css");
const simpleCss = read("../assets/veganfarm-simple-colour-system.css");
const platformCss = read("../assets/veganfarm-platform-system.css");
const unifiedCss = read("../assets/veganfarm-unified.css");
const localeJs = read("../assets/veganfarm-languages.js");
const modernJs = read("../assets/modern-upgrade.js");
const editorialJs = read("../assets/veganfarm-editorial-redesign.js");
const forestJs = read("../assets/veganfarm-forest-luxury.js");
const browserAudit = read("./browser-audit.mjs");
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
assert.match(html, /const VF_PHOTOS=/, "Homepage must define a curated editorial photo set");
for (const photoId of ["photo-1643786261573-9838e66d89dc","photo-1710871329594-b962eb958bc9","photo-1762951002221-76fe0ce6b419","photo-1633442495686-e8b67cffab53","photo-1758599668125-e154250f24bd"]) {
  assert.ok(html.includes(photoId), "Expected curated Unsplash photo asset: " + photoId);
}
assert.match(html, /srcset=/, "Editorial photos must offer responsive image sources");
assert.match(html, /loading="lazy"/, "Editorial photos must lazy-load");
assert.match(html, /decoding="async"/, "Editorial photos must decode asynchronously");
assert.match(html, /vf-photo-story-grid/, "Homepage must include the editorial animal and vegan image gallery");
assert.match(html, /vfProjectPhoto\(p\[0\]\)/, "Project cards must select a relevant photograph");
assert.match(html, /Photography credits/, "Website footer must expose photographer credits");
assert.match(html, /unsplash.com\/license/, "Website must link the image license");
assert.match(visualCss, /photo-1643786261573-9838e66d89dc/, "Hero must use the curated rescue-dog photograph");
assert.doesNotMatch(visualCss, /photo-1509062522246-3755977927d7/, "Education imagery must not use the classroom apple photograph");
assert.match(visualCss, /vf-motion-card\.vf-learn\{background-image:url\('https:\/\/images\.unsplash\.com\/photo-1524178232363-1fb2b075b655/,"Education card must use classroom learning imagery");
assert.match(visualCss, /vf-choice-human:before\{background-image:linear-gradient/,"Programme card must use non-food education imagery");
assert.match(html, /vf-team-access-card/,"Team access gate must use a dedicated light-theme card");
assert.match(simpleCss, /#app \.vf-team-access-card[\s\S]*?background:#fff!important/,"Team access card must keep credentials readable");
assert.match(visualCss, /#app\.vf-page-team \.sec\{background:#fffdf5!important;color:#1d2c21!important/,"Team route must preserve readable contrast across legacy shells");
assert.match(forestJs, /photo-1524178232363-1fb2b075b655/, "Education card must use the selected illustrative classroom photograph");
assert.doesNotMatch(forestJs, /photo-1503676260728-1c00da094a0b/, "Remove the apple classroom photograph from the presentation layer");
assert.match(visualCss, /photo-1643786261573-9838e66d89dc[^"]*w=900/, "Mobile hero must use a smaller image variant");
assert.match(visualCss, /vf-photo-story-grid/, "Responsive gallery styles must exist");
assert.match(visualCss, /prefers-reduced-motion:reduce/, "Image hover animation must respect reduced-motion settings");
assert.doesNotMatch(visualCss, /#app section:has\(#vf-team-code\)/, "Obsolete dark Team access overrides must be removed from the unified stylesheet");
assert.match(html, /veganfarm-unified\.css/, "The consolidated stylesheet must load");
assert.ok(html.includes('<link rel="stylesheet" href="assets/veganfarm-unified.css?v=20261124-11">'), "Unified stylesheet link must be a complete valid HTML tag");
assert.match(html, /<link rel="stylesheet" href="assets\/veganfarm-simple-colour-system\.css\?v=\d{8}-\d+"\s*>/, "Simple theme stylesheet link must be a complete valid HTML tag");
assert.match(html, /veganfarm-simple-colour-system\.css\?v=\d{8}-\d+/, "The simple two-colour override must load");
assert.match(simpleCss, /body \.vf-team-access-card\{[\s\S]*?background-color:#fff!important/, "Team access card must remain opaque outside legacy app wrappers");
assert.ok(html.indexOf("veganfarm-unified.css") < html.indexOf("veganfarm-simple-colour-system.css"), "The simple colour system must load after the full design bundle");
assert.doesNotMatch(html, /(?:modern-upgrade|premium-2026|signature-overhaul|veganfarm-complete-rebuild|veganfarm-editorial-redesign|veganfarm-forest-luxury|veganfarm-platform-system)\\.css/, "Legacy stylesheets must not load independently");
assert.match(simpleCss, /--vf-simple-bg:#fffdf5/, "The page background must use the single ivory token");
assert.match(simpleCss, /--vf-simple-text:#1d2c21/, "All text must use the single dark text token");
assert.match(simpleCss, /--vf-forest:#173d2b/, "Primary actions must use the restrained forest accent");
assert.match(simpleCss, /--vf-leaf:#286b36/, "Progress indicators must use the leaf accent");
assert.match(simpleCss, /--vf-gold:#c7a66a/, "Decorative details must use the champagne accent");
assert.ok(simpleCss.includes("background:var(--vf-forest)!important"), "Primary buttons must use the forest accent");
assert.ok(simpleCss.includes("background:var(--vf-leaf)!important"), "Progress fills must use the leaf accent");
assert.match(simpleCss, /background-color:transparent!important/, "Nested text and card surfaces must not introduce separate colour blocks");
assert.match(simpleCss, /#app \.hero \*/, "Hero copy must follow the same dark text colour");
assert.match(simpleCss, /photo-1643786261573-9838e66d89dc/, "The animal hero photograph must remain visible");
assert.match(html, /id="vf-language"/, "Language selector must be present");
assert.equal((html.match(/<option value="(?:en|hi|mr|gu)">/g)||[]).length, 4, "Exactly four supported language options must be present");
assert.doesNotMatch(html, /option value="(?:sd|ur|fr|es|ko|ar)"/, "Unsupported languages must not appear in the selector");
assert.deepEqual([...localeJs.matchAll(/code:'([a-z]+)'/g)].map(m=>m[1]), ['en','hi','mr','gu'], "Locale configuration must contain exactly English, Hindi, Marathi and Gujarati");
assert.ok(localeJs.includes("'Home':['होम','मुख्यपृष्ठ','હોમ'"), "Shared Home navigation labels must be provided for all three requested Indian languages");
assert.match(localeJs, /sourceStrings:sharedStringCount/, "Language report must count the shared translation dictionary");
assert.match(localeJs, /fullInterface:\{status:'NOT COMPLETE'/, "Language report must not imply full-site translation is complete");
assert.match(html, /class=\\?"sec vf-team-access\\?"/, "Team sign-in must use its dedicated accessible light-theme layout");
assert.match(html, /id=\\?"vf-team-code\\?"/, "Team sign-in must expose the shared-code field");
assert.match(html, /for=\\?"vf-team-code\\?"/, "Team sign-in must expose a visible label for the access-code field");
assert.match(simpleCss, /#app \.vf-team-access-card[\s\S]*?background:#fff!important/, "Team sign-in card must use a high-contrast white surface");
assert.match(simpleCss, /#app \.vf-team-access-form input::placeholder\{color:#68766a!important/, "Team sign-in placeholders must remain readable");
assert.match(simpleCss, /#app \.vf-team-access-form input:focus-visible/, "Team sign-in fields must have visible keyboard focus");
assert.match(html, /Secure sign-in/, "The active shared-code gate must have a clear card heading");
assert.match(html, /onsubmit="vfTeamUnlock\(event\)"/, "The existing server-verified Team unlock handler must remain connected");
assert.match(forestJs, /t:'Team Member Access'/, "The private Team route must have one clear access masthead");
assert.match(simpleCss, /html body #app\.vf-page-team \.vf-route-body \.vf-team-access-card\{[\s\S]*?background-color:#fff!important/, "The active Team route must force an opaque white card at route-level specificity");
assert.match(simpleCss, /vf-team-access-submit\{[\s\S]*?background-color:#173d2b!important;[\s\S]*?color:#fffdf5!important/, "The Team unlock button must have explicit high-contrast colours");
assert.match(simpleCss, /#wa\[hidden\]\{display:none!important\}/, "Hidden donation enquiry content must respect the native hidden attribute");
assert.match(simpleCss, /#app\.vf-page-team ~ #vf-floating-donate/, "Floating donation controls must be isolated from the private Team portal");
assert.match(simpleCss, /#app\.vf-page-team ~ #vf-piano-player/, "Optional music controls must be isolated from the private Team portal");
assert.match(simpleCss, /vf-motion-hero \.vf-motion-backdrop[\s\S]*?rgba\(5,22,15/, "Homepage hero must use a cinematic forest scrim");
assert.match(simpleCss, /vf-motion-hero \.vf-hero-copy h1/, "Homepage hero headings must use the final high-contrast type treatment");
assert.match(browserAudit, /team-login-card-not-light/, "Browser audit must assert the rendered Team card background");
assert.match(browserAudit, /team-private-route-public-widget-visible/, "Browser audit must check private-route widget isolation");
assert.match(browserAudit, /home-hero-desktop-1440\.png/, "Browser audit must capture a desktop hero screenshot");
assert.match(forestJs, /Compassion is not just a belief\./, "Homepage hero must use the approved central message");
assert.match(forestJs, /VEGANFARM Movement brings people together to support animal welfare, expand access to education and encourage a more compassionate world\./, "Homepage hero must use the approved supporting description");
assert.match(forestJs, /INDEPENDENT WELFARE MOVEMENT · INDIA/, "Homepage must show the required identity descriptor");
assert.doesNotMatch(forestJs, /menu\.innerHTML\s*=/, "Presentation owner must not rebuild a second navigation system");
assert.match(forestJs, /function decorateRoute\(/, "Presentation owner must decorate dedicated route layouts");
assert.match(forestJs, /vf-route-masthead/, "Dedicated route masthead must be generated");
assert.doesNotMatch(forestJs, /app\.innerHTML=home\(\)/, "Route transition must not render the homepage a second time");
assert.match(localeJs, /Translation status: This language is only partially translated/, "Non-English fallback must be disclosed to visitors");
assert.match(localeJs, /data-vf-translation-notice/, "Translation coverage notice must be visible in non-English modes");
assert.match(localeJs, /native-speaker review is required/, "Locale coverage must disclose the human review requirement");
assert.match(visualCss, /Dedicated route layouts/, "Dedicated route and dashboard layout styles must exist");
assert.match(simpleCss, /Preserve the cinematic animal-photo hero/, "Cinematic animal hero contrast must be retained");
assert.match(forestJs, /P\.home=home/, "Forest presentation must own the homepage renderer");
assert.match(forestJs, /P\.projects=function/, "Forest presentation must own the Projects page renderer");
assert.match(forestJs, /P\.education=function/, "Forest presentation must own the Education page renderer");
assert.match(forestJs, /function updateNav\(/, "Forest presentation must own navigation rendering");
assert.match(forestJs, /function footer\(/, "Forest presentation must own footer rendering");
assert.match(forestJs, /P\.volunteer=function\(\)[\s\S]*?fsub\(event,\\'vol\\'\)/, "Volunteer form must submit through the existing Supabase-backed handler");
assert.match(forestJs, /P\.contact=function\(\)[\s\S]*?fsub\(event,\\'msg\\'\)/, "Contact form must submit through the existing Supabase-backed handler");
assert.match(forestJs, /P\.donate=function\(\)[\s\S]*?donSubmit\(event\)/, "Donation form must submit through the existing pending-verification handler");
assert.ok(html.includes("window.VF_QR=QR"), "Donation presentation must reuse the existing UPI QR data");
assert.match(forestJs, /id="fcon"><\/p><p id="socf"><\/p>/, "Presentation footer must preserve core notification and social-link mount points");
assert.ok(html.includes("if(window.vfRole!=='team')return;") && html.indexOf("public_case_documents", html.indexOf("if(window.vfRole!=='team')return;")) > -1, "Anonymous visitors must not query restricted public case attachments");
assert.match(forestJs, /vf-public-data-warning/, "Public data permission failures must be disclosed without exposing private case data");
assert.match(forestJs, /enquiries\.hidden=\(location\.hash\|\|'#home'\)==='#donate'/,"Hide the website QR strip on Donate to avoid confusion with the payment QR");
assert.match(forestJs, /route===\'home\'\|\|route===\'cases\'\|\|route\.indexOf\(\'case-\'\)===0/, "Public data notice must be limited to public rescue routes");
assert.ok(html.includes("window.vfAfterLogin=function(){\n  if(window.vfRole!=='team')return Promise.resolve(baseAfterLogin&&baseAfterLogin());"), "Only authenticated Team sessions may load Team case attachments");
assert.ok(html.includes("function enrichLoadedCases(){\n    if(window.vfRole!=='founder'&&window.vfRole!=='team')return Promise.resolve();"), "Anonymous visitors must not enrich cases from the private rescue_cases table");
assert.match(visualCss, /#vf-piano-volume\{flex:1 1 110px;width:auto;min-width:0;max-width:100%/, "Optional piano controls must not create mobile horizontal overflow");
assert.match(forestJs, /go=function\(keep\)/, "Forest presentation must wrap the core route function once");
assert.doesNotMatch(editorialJs, /P\.home\s*=|go\s*=|navItems|innerHTML/, "Retired editorial renderer must not mutate pages, navigation or routes");
assert.match(editorialJs, /Retired presentation renderer/, "Retired renderer must document its replacement");
assert.match(modernJs, /function addMotionElements\(app\)/, "Modern upgrade must remain an interaction enhancement");
assert.doesNotMatch(modernJs, /vf-modern-visuals|vf-donation-feature|Plant-based meal|Fresh plant-based meal/i, "Modern upgrade must not inject a competing homepage content renderer");
assert.doesNotMatch(modernJs+forestJs, /photo-1512621776951-a57141f2eefd|photo-1540420773420-3366772f4999|plant-based meal/i, "Presentation scripts must not use food photography");
assert.match(localeJs, /code:'hi',label:'हिन्दी',dir:'ltr'/, "Hindi must use left-to-right text direction");
assert.match(localeJs, /code:'mr',label:'मराठी',dir:'ltr'/, "Marathi must use left-to-right text direction");
assert.match(localeJs, /code:'gu',label:'ગુજરાતી',dir:'ltr'/, "Gujarati must use left-to-right text direction");
assert.doesNotMatch(html, /photo-1557844352-761f2565b576|Plant-based food|Plant-based living/, "Food photography must not appear on the site");
assert.equal(unifiedCss.split("{").length, unifiedCss.split("}").length, "Consolidated stylesheet braces must be balanced");
assert.equal((visualCss.match(/\{/g)||[]).length,(visualCss.match(/\}/g)||[]).length,"Visual stylesheet braces must be balanced");
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

assert.match(photoAsset, /client\.storage\.from\(source\.bucket\)\.remove\(\[source\.path\]\)/, "Founder photo removal must delete the unreferenced private Storage object");
assert.match(photoAsset, /eq\('photo_path',storedPath\)\.neq\('id',item\.dbId\)/, "Founder deletion must check for other case references before deleting an object");
assert.match(photoAsset, /storage-delete-failed/, "Storage deletion failures must be surfaced for manual cleanup");


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
