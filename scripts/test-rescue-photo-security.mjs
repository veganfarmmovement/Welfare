import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");
const photoAsset = read("../assets/veganfarm-private-case-photos.js");
const visualCss = read("../assets/veganfarm-platform-system.css");
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
for (const photoId of ["photo-1643786261573-9838e66d89dc","photo-1710871329594-b962eb958bc9","photo-1762951002221-76fe0ce6b419","photo-1633442495686-e8b67cffab53","photo-1557844352-761f2565b576"]) {
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
assert.match(visualCss, /photo-1643786261573-9838e66d89dc[^}]*w=900/, "Mobile hero must use a smaller image variant");
assert.match(visualCss, /vf-photo-story-grid/, "Responsive gallery styles must exist");
assert.match(visualCss, /prefers-reduced-motion:reduce/, "Image hover animation must respect reduced-motion settings");
assert.doesNotMatch(visualCss, /photo-1776876031680-a2b42d79248f/, "The previous unverified hero image must be removed");
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
