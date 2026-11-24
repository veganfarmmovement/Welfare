# VEGANFARM Platform Audit — 24 November 2026

## Scope and working safety

- Production base: `main` at `386a0d3b229380689973a5e5174567a80209d7ef`.
- Development branch: `development/platform-transformation`.
- The live production branch and database were not changed during this audit.
- The Supabase project was inspected read-only.
- No database records, payment settings, authentication users, storage objects or production policies were modified.

## Existing application

The active GitHub Pages entry point is `index.html` (approximately 455 KB). It is a single-page application with 17 inline script blocks plus external JavaScript modules. The repository also contains two older HTML snapshots, six legacy/feature stylesheets and several feature scripts.

Existing working modules visible in source include:
- Hash-based public navigation and page rendering.
- Public rescue-case listing backed by the `public_rescue_cases` view.
- Founder authentication and dashboard.
- Team shared-code gate backed by the `veganfarm-team-gate` Edge Function.
- Rescue case review and publication statuses.
- Donation submission and Founder verification.
- Expense ledger and audit history.
- Volunteer applications and Founder review.
- Stories and public case-document display.
- Supabase-backed settings and public donation feed.

This is a substantial existing application; replacing it with a template would destroy working behaviour.

## Verified Supabase state

Project status: `ACTIVE_HEALTHY`.

Current record counts (counts only; no donor or rescuer personal details were read):
- Rescue cases: 8 total; 6 published; 5 published cases have a completed/recovered/closed status; 1 published active case.
- Donations: 7 total; 6 verified; 1 reversed.
- Expenses: 0.
- Volunteer applications: 0.
- Published stories: 3.
- Audit log: 396 records.

The live Impact page previously contained three hard-coded case entries and amounts (₹14,000, ₹6,900 and ₹3,000). These were not being derived from the current public case records. The development branch now removes those seeds and calculates case counts from published live records only. It no longer displays the seeded financial totals.

## Security findings requiring follow-up

### 1. Public case-photo bucket exposes non-published case images

- Storage bucket `case-photos` is configured as public.
- It contains 5 objects: 3 associated with published cases, 1 archived case and 1 rejected case.
- The current public read policy allows anonymous reads across the entire `case-photos` bucket.
- The Team Edge Function uploads new submitted case photos to this public bucket before Founder approval.

This means archived/rejected case photos and future pending-case photos may be publicly retrievable if their object paths are discovered. Public-bucket downloads bypass the normal private-object access model. A complete fix requires moving unpublished case images to private storage and updating Founder preview to use authenticated signed URLs, while preserving public image delivery for published cases. This was not changed automatically because it requires coordinated storage and UI migration.

### 2. Public rescue/document views have unnecessary write grants

The views `public_rescue_cases` and `public_case_documents` are security-definer views. Anonymous currently has SELECT, INSERT, UPDATE and DELETE privileges on both. Their definitions are allowlisted read projections; the migration revokes public DML and adds a security-barrier boundary.

A read-only privilege check found that anonymous has no direct SELECT privilege on the underlying `rescue_cases` or `case_documents` tables. Therefore, changing these views to `security_invoker` would break public reads unless carefully scoped column grants and RLS were added. The Phase 6 migration now retains the safe projections as security-definer views, grants SELECT only, and uses `public_rescue_cases` for anonymous case-photo checks. It has **not** been applied to production. The Phase 7 migration makes case-photo buckets private and applies the published/Founder/Team-owner access rules.

The separate `trust_project_fundraising_totals` view belongs to the separate Trust data model and was intentionally not changed.

### 3. Private team-gate tables have RLS disabled

Supabase's security advisor flags:
- `private.veganfarm_team_gate_config`
- `private.veganfarm_team_gate_sessions`
- `private.veganfarm_team_gate_attempts`

RLS is disabled on these three tables. The current privilege inspection found no direct table grants to `anon`, `authenticated` or `service_role`; the tables currently show only owner-level privileges. The Team Edge Function uses narrowly granted SECURITY DEFINER RPCs. Do not enable RLS blindly: first test the RPC ownership, table grants and session flow. Supabase's advisor explicitly warns that enabling RLS without appropriate policies can block the gate.

### 4. Other Supabase advisories

- Three public tables (`VEGANFARM`, `vf_admin_pin`, `vf_admin_state`) have RLS enabled but no policies. Current privilege inspection found no anon/authenticated table grants on them.
- Three views are flagged as security-definer: the two VEGANFARM public projections above and the separate Trust totals view.
- Leaked-password protection is disabled in Supabase Auth. Enable it in the Auth security settings after confirming the intended account policy.
- Performance advisor flags an RLS init-plan issue on `case_documents` and multiple permissive policies. These need query/policy regression testing before consolidation.

## Organisation separation

The active `index.html` contains no Niswarth Seva or Trust fundraising references. The older root-level HTML snapshots `Index` and `VEGANFARM_index_fixed.html` do contain legacy Trust references. They are not loaded by the active website. Preserve them as snapshots until the owner decides whether to archive, redirect or remove them.

The active website's public content must continue to describe VEGANFARM as an independent, currently unregistered welfare movement. Do not merge Trust registrations, receipts, projects or accounts into VEGANFARM.

## Changes implemented on this development branch

1. Added `assets/veganfarm-platform-system.css`, a unified light palette with light text containers, medium-green text, accessible form states, responsive layouts, reduced-motion handling and a floating music-control style.
2. Updated `index.html` to load the new theme last and removed the previous inline-style MutationObserver that changed colours dynamically.
3. Rebuilt `impact-enhancements.js` to remove hard-coded sample cases and financial amounts. It now uses published records from the existing live data layer and displays an honest empty state.
4. Added `supabase-phase6-public-view-hardening.sql` for review; it is not executed.
5. Added this audit record.

## Validation performed

- 20 JavaScript script units compiled successfully with no syntax errors.
- New stylesheet braces are balanced.
- Active HTML references the new theme and cache-busted Impact script.
- The old colour-mutation helper is no longer loaded.
- Impact module contains no seeded case IDs or seeded financial totals.
- The active HTML contains no service-role key or hard-coded shared Team access code.
- No production deployment or live browser end-to-end test was performed from this audit.

## Remaining work before production merge

1. Test the new theme across every public route, Founder dashboard, Team portal and mobile viewport in a real browser.
2. Migrate unpublished case photos to private storage and add signed-image loading for Founder review.
3. Test and then apply the read-only public-view hardening migration.
4. Review private Team-gate RLS/privileges with a development database branch.
5. Enable leaked-password protection in Supabase Auth.
6. Test donations, Founder verification, case approval, team access, document upload, public tracker and audit history end-to-end.
7. Add optional music only after a real licensed audio asset is available; no fake player should be shipped.
8. Validate the UPI QR destination with a real UPI scanner before making payment claims.
9. Review or archive the two older HTML snapshots so users do not open obsolete versions.


## Phase 7 — private rescue photograph implementation staged (24 November 2026)

### Production state — unchanged
- The production Supabase bucket `case-photos` is still public at the time of this update.
- Read-only inspection found 5 objects in `case-photos`: 3 linked to published cases, 1 archived case and 1 rejected case. The existing private `rescue-case-photos` bucket currently has 0 objects.
- No storage object was copied, moved or deleted. No production bucket setting, policy, database record or Edge Function was changed.
- A Supabase development branch has not been created. Supabase quoted US$0.01344 per hour for a branch; creation is waiting for the owner's explicit cost approval.

### Development-branch code now committed
1. `index.html` now routes new case-photo uploads to the existing private `rescue-case-photos` bucket. New stored `photo_path` values carry a `rescue-case-photos/` prefix; legacy unprefixed paths continue to resolve to `case-photos`.
2. Added `assets/veganfarm-private-case-photos.js`. It requests 5-minute signed URLs for case photos, refreshes them after 4 minutes, and wraps the existing public, Founder and Team case loaders. Anonymous signing is intended to work only for published cases; authenticated Founder access and authenticated Team-owner access are defined in the migration.
3. Added `supabase-phase7-private-case-photo-storage.sql`. It makes the legacy `case-photos` bucket private, adds separate anonymous-published and authenticated Founder/Team-owner read policies, restricts new Team uploads to a folder named for the authenticated user, and preserves the separate public story-photo bucket.
4. Added a version-controlled copy of the Team gate Edge Function at `supabase/functions/veganfarm-team-gate/index.ts`. It uploads new shared-code Team submissions to `rescue-case-photos`, stores the prefixed path and checks file signatures for JPEG, PNG, PDF, WebM, MP4 and MOV files.
5. The production Edge Function remains unchanged. The version-controlled copy has not been deployed.

### Validation and limitations
- Static source checks confirm that all 5 generic case-photo upload calls and the Team upload call now target `rescue-case-photos`; no old upload call remains in the active HTML.
- Static source checks confirm the new bucket prefix, signed URL TTL/renewal, role-aware loader wrappers, migration policies and Edge Function signature checks are present.
- The new signed-photo JavaScript asset passed `node --check` under Node v22.16.0.
- No Supabase migration has been applied. The migration and Edge Function must be tested together on a Supabase development branch before deployment.
- Anonymous signed-URL creation, Founder previews, Team ownership, published public images, rejected/archived denial and existing rescue submissions have not yet passed live access tests.
- No browser visual or end-to-end test has been completed. Do not describe the photo privacy issue as fixed until those tests pass.

## Updated production merge blockers
1. Obtain approval for the quoted Supabase test-branch cost (US$0.01344/hour), then create and test against a development branch.
2. Apply the Phase 7 storage migration only on that branch and verify anonymous, Founder and Team access against published, pending, rejected and archived cases.
3. Deploy the version-controlled Team gate function to the test project and test new submissions, file-signature rejection and Founder review.
4. Verify legacy published case images still render through signed URLs and that archived/rejected legacy images cannot be signed by anonymous users.
5. Test the Phase 6 read-only view migration separately; do not combine it with Phase 7 until the public case pages and Founder workflow pass.
6. Complete browser tests, QR scanning, auth, donations, approvals, mobile layout and refresh reliability before production deployment.


## Phase 7 follow-up — workflow review and static CI (24 November 2026)

A further read-only review covered all active rescue-photo flows and the existing private bucket:

- The private `rescue-case-photos` bucket was already private and had 0 objects. Its four existing policies were based on `auth.jwt()->app_metadata.role = 'admin'` (view, upload, update, delete). The Phase 7 migration now explicitly drops all four and replaces them with the application's approved-profile role checks.
- The legacy public `case-photos` bucket has 5 JPEG objects (693,656 bytes): 3 attached to published cases, 1 archived and 1 rejected. The 5 object keys and database paths remain unchanged by the migration; the bucket becomes private.
- Three other published case records have external `photo_url` values and no Storage path. These are external Wikimedia/GitHub assets, not bucket objects; they remain public only through the published public projection.
- The authenticated Founder editor, direct authenticated Team submit/edit handlers, and shared-code Team Edge Function were traced. All six active browser upload call sites now use `rescue-case-photos`. The Team Edge Function development copy also uses that bucket, but the production Edge Function remains unchanged.
- Direct Team uploads are scoped to an `auth.uid()` folder and associated with `submitted_by`. Shared-code Edge Function submissions have `submitted_by=NULL`; they are service-role uploads and therefore only Founder may sign/preview their pending images.
- The signed-photo helper now reads the top-level lexical `APP` binding (not `window.APP`), updates the public `live` snapshot as well as the source record, refreshes 5-minute URLs after 4 minutes, and persists the Founder Remove Photograph action by clearing both photo fields on the case row. Removed objects are retained privately for reviewed cleanup.
- A read-only preflight SQL file and a guarded rollback SQL file were added. The rollback requires new-bucket objects to be copied and verified in the legacy bucket before it rewrites prefixed paths or restores public access.

### New static validation
- Added `scripts/test-rescue-photo-security.mjs` to parse all inline app scripts and assert upload targets, no public case-photo URL generation, signed URL behaviour, Edge Function path consistency, policy requirements and rollback guards.
- Added `.github/workflows/rescue-photo-security-static.yml` to run these checks on PR changes. The first CI run is being checked; its final result will be recorded separately.
- No paid Supabase branch was created. No production storage, policy, Edge Function, object or database row was modified.

### Staging-only test cases still outstanding
Anonymous access, Founder previews across every publication state, Team owner isolation, shared-code Edge Function uploads, URL expiry/refresh, object replacement/removal and rejection/archive denial still require a separate Supabase environment and browser sessions. These are not claimed as passed.


### Static CI result
- GitHub Actions workflow `Rescue photo security static checks` completed successfully on the development PR branch.
- The Node static test parsed all 16 non-empty inline JavaScript blocks in active `index.html`, parsed the private-photo asset, and passed assertions for all six photo-upload code occurrences, private-bucket path prefixing, no case-photo `getPublicUrl`, the active shared-code Edge Function call, signed URL TTL/refresh, Founder photo removal, Edge Function bucket/prefix/signature checks, SQL policy requirements and rollback guards.
- `node --check assets/veganfarm-private-case-photos.js` passed.
- `deno check --no-lock supabase/functions/veganfarm-team-gate/index.ts` passed in GitHub Actions.
- These checks are source-level only; they do not execute SQL, call Storage APIs or test role-based access.


## Rescue-photo follow-up — guarded object deletion (24 November 2026)

- Updated the Founder Remove Photograph handler to clear the case row's `photo_path` and `photo_url`, then check whether another case row still references the same stored path.
- When no other case references the object, the handler calls Storage `remove` on the correct private bucket (new prefixed paths or legacy unprefixed paths).
- If the reference check or Storage delete fails, the object is not made public; the UI reports that private cleanup may still be required.
- Added static regression assertions for the Storage removal call, shared-reference protection and failure reporting.
- This does not implement multi-photo case galleries: the existing schema and UI still represent one `photo_path` per case, and the Team Edge Function accepts one photo.
- GitHub Actions run 45355844948 passed after the new mocked lifecycle tests were added.
- No SQL was applied, no production Storage or Supabase setting was changed, and no Edge Function was deployed.


### Automated mock-test result — 24 November 2026
- Added a Node VM harness that executes the signed-photo helper against a mocked Supabase client.
- Passed: initial signed URL creation for the private bucket with a 300-second TTL; updating the public live snapshot; four-minute interval renewal; visibility-triggered renewal; Founder database reference clearing; Storage deletion of an unreferenced object; protection against deleting an object referenced by another case; and graceful reporting when Storage deletion returns an error.
- GitHub Actions run 45355844948: all steps passed — Node regression assertions, Node syntax check for the helper, and Deno type-check for the Team Edge Function.
- Two earlier CI runs failed while the new assertions were being developed (45355379969: an over-escaped assertion pattern; 45355739560: cross-realm deep-equality in the test harness). Both failures were corrected; run 45355844948 passed.
- These tests use a mock client. They do not prove actual Supabase RLS, signed URL access, Storage DELETE permissions, Edge Function runtime behaviour, or browser rendering.
- Multi-photo upload/gallery remains unimplemented; current schema/UI still use one `photo_path` per case.


## Website photography enhancement — 24 November 2026

### Visual implementation
- Replaced the previous unverified homepage hero image with a verified Unsplash shelter-dog photograph, using a light ivory-to-transparent overlay so the hero remains consistent with the bright visual system.
- Added a curated Unsplash image set for shelter dogs, cows, a street-cat shelter, hands-on learning, plant-based produce and community volunteering.
- Added an editorial image gallery to the homepage and relevant images to the three homepage/project cards. The volunteer page now includes a community-volunteering image.
- Rescue case cards continue to use their actual case photographs or the existing placeholder; editorial stock images are not substituted for beneficiary evidence.
- Added responsive `srcset` variants (480/800/1200 px), Unsplash CDN format conversion and quality parameters, lazy loading and asynchronous decoding for content imagery. The hero is preloaded and the mobile hero requests a smaller width.
- Added visible footer photographer credits and a repository source register in `PHOTO_CREDITS.md`.
- Added CSS for responsive photo cards, image hover transitions and reduced-motion preference.

### Image sourcing and rights
- All selected images are individual Unsplash photo pages marked free to use under the Unsplash License.
- The website links to each photographer's source photo page and the Unsplash license.
- Images are explicitly illustrative stock photography, not represented as actual VEGANFARM rescue, student, volunteer or programme photographs.
- No Google Images results or Unsplash+ assets were selected.

### Preserved systems
- Changes are limited to active website presentation, image markup, stylesheet, regression tests and image-credit documentation.
- No Supabase code, database data, authentication, Storage bucket, security policy, donation workflow, QR destination, Edge Function or user data was changed.
- No migration was applied and no production deployment was made.

### Validation still required
- GitHub Actions must pass the updated visual/source regression assertions.
- Real browser image loading, image CDN response, mobile cropping, desktop layout, accessibility and page performance remain to be verified in browser testing.
- The Unsplash CDN URLs are remote dependencies; verify they return successfully from the deployed GitHub Pages origin before production merge.


### Photography regression CI result
- GitHub Actions run 45361059135 completed successfully.
- Passed: parse of all active inline JavaScript, existing rescue-photo security assertions, new curated-photo source assertions, responsive `srcset` and lazy-loading assertions, footer attribution/license assertions, hero image and mobile-size assertions, reduced-motion and CSS brace checks, private-photo helper syntax, and Deno Team Edge Function type-check.
- This is static/source validation. It does not verify the Unsplash CDN from a real browser, mobile cropping, visual quality at deployed breakpoints, accessibility with assistive technology, or page-load performance metrics.



## Final design reset and verification — 24 November 2026

### Implemented on `development/platform-transformation`
- Kept exactly four selectable locales: English (`en`), Hindi (`hi`), Marathi (`mr`) and Gujarati (`gu`). English remains the default; unsupported saved locale values fall back to English.
- The shared language dictionary has 18 common navigation/interface strings per language. Full page copy, forms, dynamic records, Team portal and Founder dashboard are not fully translated. The language module discloses partial translation status and the need for native-speaker review.
- Reworked the active shared-code Team gate into one clear route masthead and one opaque ivory access card. The outer route wrapper is transparent; the access-code field is labelled; keyboard focus is visible; the unlock action has verified high-contrast rendered text.
- Preserved the existing `vfTeamUnlock(event)` handler and server-side `veganfarm-team-gate` verification. No access code, session-token behaviour, role rule or approval rule was changed.
- Isolated private Team and Founder routes from the public donation enquiry/QR section, floating donation widget and optional piano player. The global donation and music features remain available on public routes.
- Corrected hidden-state rendering so elements with the native `hidden` attribute are actually hidden.
- Reworked the homepage hero with a cinematic forest overlay, readable ivory foreground text, champagne-gold primary action and glass secondary action while retaining the existing animal photograph.
- Added stable element IDs and browser assertions for Team card visibility, rendered text contrast, route widget isolation, mobile overlap, hero typography and CTA contrast.
- Updated the final theme stylesheet cache key.

### Latest validation evidence
- **Static security workflow — run 45392853465: PASSED.** Rescue-photo security assertions, signed-photo asset syntax, four-locale configuration and Deno type-check of the Team Edge Function all completed successfully.
- **Chromium browser regression — run 45392853253: PASSED.** 161 route/viewport checks across seven viewport widths; four language persistence/direction checks passed; mobile navigation opened; 30 screenshots captured; zero browser audit errors and zero failed network responses.
- Team access visual checks passed: one page heading, visible label, white card, transparent outer wrapper, white input, keyboard focus, button text contrast ratio 11.86:1, no floating CTA overlap, and no public enquiry/music/floating donation widgets on the private route.
- Homepage hero checks passed for rendered heading/body text fill and primary/secondary CTA contrast. Desktop (1440px) and mobile (390px) screenshots were captured.
- The browser run is Chromium-based. Firefox, Safari, physical-device testing, assistive-technology testing and deployed GitHub Pages performance testing have not been performed.

### Explicitly not verified / blocked
- Authenticated Team submission workflows and authenticated Founder dashboard workflows were not exercised. A safe staging Supabase project and authorised staging accounts are required.
- Live Supabase RLS/Storage isolation, production persistence and end-to-end donation receipt verification remain NOT TESTED. No live payment was initiated.
- Full Hindi, Marathi and Gujarati translation across every page, form and dynamic record remains INCOMPLETE and requires translation work plus native-speaker review.

### Production protection
- No production database reset, deletion or mutation was performed.
- No Supabase migration, RLS policy, Storage policy, authentication setting or Edge Function deployment was performed in this continuation.
- No payment link, QR destination or beneficiary payment detail was changed.
- No production deployment or merge was performed. PR #6 remains open and in draft.
