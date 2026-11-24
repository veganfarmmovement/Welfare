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

The views `public_rescue_cases` and `public_case_documents` are security-definer views. Anonymous role currently has SELECT, INSERT, UPDATE and DELETE privileges on both. Their definitions are read projections and should be read-only.

A proposed migration is included as `supabase-phase6-public-view-hardening.sql`. It switches those two VEGANFARM views to `security_invoker`, grants SELECT only, and narrows object listing to published case/story photos. It has **not** been applied to production and must first be tested against the existing public and Founder workflows. The storage policy only limits listing: because `case-photos` remains a public bucket, a known object URL can still be fetched. Private storage migration is still required for full confidentiality.

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
