# VEGANFARM rescue-photo security: implementation and test plan

## Scope and production safety

All work is on \`development/platform-transformation\` and PR #6. No production storage bucket, object, database row, storage policy, or Edge Function has been changed. No Supabase test branch was created and no additional recurring cost was incurred.

Read-only production inspection found:

- \`case-photos\`: public bucket, 5 JPEG objects (693,656 bytes total).
- \`rescue-case-photos\`: private bucket, currently 0 objects.
- The 5 legacy objects belong to 3 published cases, 1 archived case and 1 rejected case.
- Three published records have external \`photo_url\` values and no \`photo_path\`; these are not Storage objects.
- Existing object keys and DB paths can remain unchanged; no physical move is required for the legacy objects.
- The private bucket had four \`app_metadata.admin\` policies (view/upload/update/delete). These must be removed in staging because the application uses approved profiles, not this app_metadata role.
- Application role helpers \`private.is_founder()\` and \`private.is_team()\` require approved profiles with the matching role.
- Storage table grants include SELECT/INSERT/UPDATE/DELETE for anon and authenticated. Effective object access is constrained by bucket privacy and object RLS. Do not revoke global storage grants because other buckets use them.

## Workflows traced

### Founder-created and Founder-edited cases
- Founder case editor uses \`up('rescue-case-photos', file)\`.
- The helper requires a valid Supabase session, uploads under \`<auth.uid()>/<timestamp-random>.<ext>\`, and stores \`rescue-case-photos/<object-key>\` in \`rescue_cases.photo_path\`.
- Founder replacement uploads are allowed by \`private.is_founder()\`; Founder preview uses a short-lived signed URL.
- If no replacement file is selected, the existing path remains unchanged.

### Individual-auth Team code path (retained but superseded)
- The HTML still contains the older individual-auth Team submit/edit implementation. The later shared-code Team portal overrides its Team page and submit handler, so this is not the active visitor flow.
- Its upload helper was also redirected to the private bucket. If this legacy path is re-enabled, objects are stored under the authenticated Team member's UID folder, rows store \`submitted_by = auth.uid()\`, and the policies allow only that approved Team member to sign their own draft/pending-review image.
- Team insert policy requires the first object-path segment to equal the caller's UID and \`private.is_team()\` to be true.

### Active shared-code Team portal and Edge Function
- The active Team page uses a server-verified shared code and calls \`client.functions.invoke('veganfarm-team-gate')\`. It does not create an individual Supabase user session.
- Production Edge Function still uploads to public \`case-photos\`; it has not been modified.
- Development copy uploads to private \`rescue-case-photos\` using the service-role client, under \`<case-uuid>/animal-<uuid>.<ext>\`.
- It stores \`rescue-case-photos/<object-key>\` in the database.
- It records \`submitted_by = NULL\`. The shared-code portal does not establish an individual Supabase identity; therefore only Founder can sign/preview these pending images.
- File-signature checks cover JPEG, PNG, PDF, WebM, MP4 and MOV. Case documents remain in the separate private \`case-documents\` bucket.
- The production Edge Function is not deployed or changed.

### Review, approval and public display
- Founder review loads all cases. Founder can sign previews across draft, pending, rejected, archived and published states.
- Public case loader reads \`public_rescue_cases\`; its definition filters to \`publication = 'published'\`.
- Anonymous Storage SELECT policies require an exact path match in that published projection. Pending, draft, rejected and archived paths cannot be signed anonymously.
- Public cards render from the \`APP\` lexical binding and its separate \`live\` snapshot. The helper reads the lexical binding, updates both \`item.photo\` and \`item.live.photo\`, rebuilds public cards and rerenders.
- Signed URLs expire after 5 minutes and refresh after 4 minutes while the page is visible. A visibility-change listener triggers a refresh immediately when a visitor returns to the page.
- Three existing published rows use external Wikimedia/GitHub URLs. They are not Storage objects and remain in the published projection.

## Storage migration design

The forward migration does not copy, rename or delete objects.

1. Make \`case-photos\` private. Preserve all five current object keys and DB paths.
2. Keep \`rescue-case-photos\` private; configure JPEG/PNG and 5 MB.
3. Drop broad public read and legacy Team insert policies on \`case-photos\`.
4. Drop all four old \`app_metadata.admin\` policies on \`rescue-case-photos\`.
5. Create separate anonymous SELECT policies for both buckets, gated by matching \`public.public_rescue_cases\` rows with \`publication='published'\`.
6. Create authenticated SELECT policies for Founder, published cases, and approved Team members viewing their own draft/pending-review cases.
7. Restrict Team inserts in the new bucket to UID-prefixed paths. Founder can manage the new bucket through a Founder-only policy. Existing Founder management of the legacy bucket remains.
8. Restore a separate public read policy for \`story-photos\`.

The old permanent \`/object/public/\` URLs will stop working once the legacy bucket is private. The object keys and database paths remain stable; the page generates short-lived signed URLs. This is necessary to prevent direct access to rejected/pending images.

## Files

- \`index.html\`: six case-photo upload code occurrences (including the superseded individual-auth path) use the private bucket; helper prefixes stored paths and scopes direct Team uploads to the user's UID.
- \`assets/veganfarm-private-case-photos.js\`: 5-minute signed URLs, 4-minute refresh, lexical APP access, live-snapshot update and loader wrapping.
- \`supabase/functions/veganfarm-team-gate/index.ts\`: staged Edge Function source for private uploads and file-signature validation.
- \`supabase-phase7-private-case-photo-storage.sql\`: staging-only forward migration.
- \`supabase-phase7-private-case-photo-storage-rollback.sql\`: guarded rollback requiring object-copy verification.
- \`supabase-phase7-private-case-photo-preflight.sql\`: read-only inventory and policy diagnostics.
- \`scripts/test-rescue-photo-security.mjs\`: static source assertions.
- \`.github/workflows/rescue-photo-security-static.yml\`: PR static checks.

## Static checks vs environment-dependent checks

Static checks cannot prove Postgres RLS or Storage API behaviour. No staging branch was created because the owner declined the quoted recurring branch cost.

### Automated/static checks
- Parse every inline JavaScript block in active \`index.html\`.
- Parse the signed-photo asset with Node and type-check the Team Edge Function with Deno.
- Verify all six app upload call sites target \`rescue-case-photos\`.
- Verify no rescue-photo path uses \`getPublicUrl\`.
- Verify Edge Function private bucket and stored prefix.
- Verify SQL includes private bucket configuration, removal of legacy admin policies, published-only anonymous rules, Founder/Team rules and rollback guards.

### Requires a separate Supabase environment
Test with anonymous, approved Founder, approved Team A, approved Team B, suspended/rejected Team, and no session. Seed cases in draft, pending_review, published, rejected and archived states with images in both buckets.

Verify:
- anonymous signed URL succeeds only for published paths;
- anonymous direct public object URLs fail for both private buckets;
- Founder can sign all review states;
- Team A can sign only its own pending/draft images;
- Team B and suspended Team cannot sign Team A's image;
- shared-code Edge submission is visible to Founder but not anonymous or Team while pending;
- after publication, anonymous signing succeeds;
- after rejection/archive/unpublish, a new anonymous signing request fails;
- legacy published object keys continue to work without moving objects;
- Founder replacement, Team upload/edit, review, approval, rejection and refresh work;
- signed URLs expire and refresh before expiry;
- private case documents, donation screenshots and story media remain unaffected.

### Rollback

1. Stop case submissions in staging.
2. Copy every object from \`rescue-case-photos\` to \`case-photos\` through the Storage API, preserving the object key after stripping the DB prefix.
3. Verify each copied object and matching case row.
4. Delete copied originals from \`rescue-case-photos\` only after verification.
5. Revert app and Team Edge Function to the legacy workflow.
6. Run rollback SQL. It aborts if new-bucket objects remain or if a prefixed DB path has no matching legacy object. It then restores old paths, public access and the original admin policies.

Do not run rollback SQL against production. It intentionally restores public access.
