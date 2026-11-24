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
