-- VEGANFARM Phase 7 rollback
-- STAGING ONLY. Run only after deploying the matching legacy app + Team Edge Function.
-- This intentionally restores the old public case-photo behaviour and is NOT a secure steady state.
--
-- Before this script:
-- 1. Stop case-photo submissions.
-- 2. Copy every object from rescue-case-photos to case-photos using the Supabase Storage API,
--    preserving the object key after removing the 'rescue-case-photos/' DB prefix.
-- 3. Verify every prefixed rescue_cases.photo_path has a matching case-photos object.
-- 4. Delete the copied objects from rescue-case-photos only after the copy is verified.
-- 5. Then run this script. It aborts if objects or unmatched prefixed paths remain.

begin;

do $$
begin
  if exists (select 1 from storage.objects where bucket_id='rescue-case-photos') then
    raise exception 'Rollback stopped: rescue-case-photos still contains objects. Copy and verify them in case-photos first.';
  end if;
  if exists (
    select 1 from public.rescue_cases rc
    where rc.photo_path like 'rescue-case-photos/%'
      and not exists (
        select 1 from storage.objects o
        where o.bucket_id='case-photos'
          and o.name=substring(rc.photo_path from length('rescue-case-photos/')+1)
      )
  ) then
    raise exception 'Rollback stopped: one or more prefixed photo paths have no matching object in case-photos.';
  end if;
end
$$;

update public.rescue_cases
set photo_path=substring(photo_path from length('rescue-case-photos/')+1)
where photo_path like 'rescue-case-photos/%';

drop policy if exists vf_case_photos_anon_published_read on storage.objects;
drop policy if exists vf_case_photos_authenticated_read on storage.objects;
drop policy if exists vf_rescue_case_photos_anon_published_read on storage.objects;
drop policy if exists vf_rescue_case_photos_authenticated_read on storage.objects;
drop policy if exists vf_rescue_case_photos_team_insert on storage.objects;
drop policy if exists vf_rescue_case_photos_founder_manage on storage.objects;
drop policy if exists vf_story_photos_public_read on storage.objects;

update storage.buckets set public=true where id='case-photos';

create policy vf_case_photos_public_read
on storage.objects for select to anon, authenticated
using (bucket_id=any(array['case-photos','story-photos']::text[]));

create policy vf_case_photos_team_insert
on storage.objects for insert to authenticated
with check (bucket_id='case-photos' and private.is_team());

create policy "Admins can view rescue photos"
on storage.objects for select to authenticated
using (bucket_id='rescue-case-photos' and (auth.jwt()->'app_metadata'->>'role')='admin');

create policy "Admins can upload rescue photos 1t7h9c4_0"
on storage.objects for insert to authenticated
with check (bucket_id='rescue-case-photos' and (select auth.jwt()->'app_metadata'->>'role')='admin');

create policy "Admins can update rescue photos"
on storage.objects for update to authenticated
using (bucket_id='rescue-case-photos' and (auth.jwt()->'app_metadata'->>'role')='admin')
with check (bucket_id='rescue-case-photos' and (auth.jwt()->'app_metadata'->>'role')='admin');

create policy "Admins can delete rescue photos"
on storage.objects for delete to authenticated
using (bucket_id='rescue-case-photos' and (auth.jwt()->'app_metadata'->>'role')='admin');

update storage.buckets
set file_size_limit=null, allowed_mime_types=null
where id='rescue-case-photos';

commit;
