-- VEGANFARM Phase 7: private rescue case photographs
-- Apply only to a Supabase development branch after the application code is deployed there.
-- Existing case-photos objects remain in place; the bucket is made private and legacy paths
-- continue to be signed only when the associated case is published or the requester is Founder/owner.
-- New uploads use the existing private rescue-case-photos bucket and store a bucket prefix in photo_path.
-- No case, donation, expense, user, payment or Trust records are deleted or rewritten.

begin;

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'case-photos') then
    raise exception 'Required bucket case-photos is missing';
  end if;
  if not exists (select 1 from storage.buckets where id = 'rescue-case-photos') then
    raise exception 'Required private bucket rescue-case-photos is missing';
  end if;
end
$$;

update storage.buckets set public = false where id = 'case-photos';
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png']::text[]
where id = 'rescue-case-photos';

drop policy if exists vf_case_photos_public_read on storage.objects;

drop policy if exists vf_case_photos_anon_published_read on storage.objects;
create policy vf_case_photos_anon_published_read
on storage.objects for select to anon
using (
  bucket_id = 'case-photos'
  and exists (
    select 1 from public.public_rescue_cases rc
    where rc.photo_path = storage.objects.name and rc.publication = 'published'
  )
);

drop policy if exists vf_case_photos_authenticated_read on storage.objects;
create policy vf_case_photos_authenticated_read
on storage.objects for select to authenticated
using (
  bucket_id = 'case-photos'
  and (
    private.is_founder()
    or exists (
      select 1 from public.rescue_cases rc
      where rc.photo_path = storage.objects.name and rc.publication = 'published'
    )
    or (
      private.is_team()
      and exists (
        select 1 from public.rescue_cases rc
        where rc.photo_path = storage.objects.name
          and rc.submitted_by = (select auth.uid())
          and rc.publication in ('draft', 'pending_review')
      )
    )
  )
);

drop policy if exists vf_rescue_case_photos_anon_published_read on storage.objects;
create policy vf_rescue_case_photos_anon_published_read
on storage.objects for select to anon
using (
  bucket_id = 'rescue-case-photos'
  and exists (
    select 1 from public.public_rescue_cases rc
    where rc.photo_path = 'rescue-case-photos/' || storage.objects.name
      and rc.publication = 'published'
  )
);

drop policy if exists vf_rescue_case_photos_authenticated_read on storage.objects;
create policy vf_rescue_case_photos_authenticated_read
on storage.objects for select to authenticated
using (
  bucket_id = 'rescue-case-photos'
  and (
    private.is_founder()
    or exists (
      select 1 from public.rescue_cases rc
      where rc.photo_path = 'rescue-case-photos/' || storage.objects.name
        and rc.publication = 'published'
    )
    or (
      private.is_team()
      and exists (
        select 1 from public.rescue_cases rc
        where rc.photo_path = 'rescue-case-photos/' || storage.objects.name
          and rc.submitted_by = (select auth.uid())
          and rc.publication in ('draft', 'pending_review')
      )
    )
  )
);

drop policy if exists vf_rescue_case_photos_team_insert on storage.objects;
create policy vf_rescue_case_photos_team_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rescue-case-photos'
  and private.is_team()
  and split_part(storage.objects.name, '/', 1) = (select auth.uid())::text
);

drop policy if exists vf_rescue_case_photos_founder_manage on storage.objects;
create policy vf_rescue_case_photos_founder_manage
on storage.objects for all to authenticated
using (bucket_id = 'rescue-case-photos' and private.is_founder())
with check (bucket_id = 'rescue-case-photos' and private.is_founder());

drop policy if exists vf_case_photos_team_insert on storage.objects;

-- Preserve existing public story-photo listing; story-photos remains a separate public bucket.
drop policy if exists vf_story_photos_public_read on storage.objects;
create policy vf_story_photos_public_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'story-photos');

commit;

-- Rollback only together with the matching application rollback:
-- update storage.buckets set public = true where id = 'case-photos';
-- Drop the Phase 7 policies above, then restore the former combined case/story read policy
-- and vf_case_photos_team_insert. Do not restore public access while the new application is live.
