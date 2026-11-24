-- VEGANFARM Phase 7 rollback
-- Run only in the same staging project and only after reverting the matching app + Edge Function.
-- This deliberately restores the old public case-photo behaviour and is NOT a secure steady state.

begin;

drop policy if exists vf_case_photos_anon_published_read on storage.objects;
drop policy if exists vf_case_photos_authenticated_read on storage.objects;
drop policy if exists vf_rescue_case_photos_anon_published_read on storage.objects;
drop policy if exists vf_rescue_case_photos_authenticated_read on storage.objects;
drop policy if exists vf_rescue_case_photos_team_insert on storage.objects;
drop policy if exists vf_rescue_case_photos_founder_manage on storage.objects;
drop policy if exists vf_story_photos_public_read on storage.objects;

-- Restore original public case bucket access (old direct public URLs work again).
update storage.buckets set public=true where id='case-photos';

-- Restore the prior combined public case/story listing policy.
create policy vf_case_photos_public_read
on storage.objects for select to anon, authenticated
using (bucket_id=any(array['case-photos','story-photos']::text[]));

-- Restore the prior Team insert policy on the legacy bucket.
create policy vf_case_photos_team_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='case-photos'
  and private.is_team()
);

-- Restore the original app_metadata admin policies on the pre-existing private bucket.
create policy "Admins can view rescue photos"
on storage.objects for select to authenticated
using (
  bucket_id='rescue-case-photos'
  and (auth.jwt()->'app_metadata'->>'role')='admin'
);

create policy "Admins can upload rescue photos 1t7h9c4_0"
on storage.objects for insert to authenticated
with check (
  bucket_id='rescue-case-photos'
  and (select auth.jwt()->'app_metadata'->>'role')='admin'
);

create policy "Admins can update rescue photos"
on storage.objects for update to authenticated
using (
  bucket_id='rescue-case-photos'
  and (auth.jwt()->'app_metadata'->>'role')='admin'
)
with check (
  bucket_id='rescue-case-photos'
  and (auth.jwt()->'app_metadata'->>'role')='admin'
);

create policy "Admins can delete rescue photos"
on storage.objects for delete to authenticated
using (
  bucket_id='rescue-case-photos'
  and (auth.jwt()->'app_metadata'->>'role')='admin'
);

commit;
