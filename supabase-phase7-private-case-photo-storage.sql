-- VEGANFARM Phase 7: coordinated private rescue-photo storage
-- STAGING ONLY. Do not apply to production until the full app + Edge Function are tested.
--
-- Existing case-photo object keys and rescue_cases.photo_path values are preserved.
-- Legacy objects remain in case-photos; the bucket becomes private.
-- New browser and Team Edge Function uploads use rescue-case-photos.
-- Public signed URLs can be minted only for cases whose publication='published'.
-- Founder can preview all case photos; approved Team users can preview only their own
-- draft/pending_review direct-upload cases. Team Gate Edge Function uses service role
-- and its pending submissions have submitted_by=NULL, so only Founder can preview them.
--
-- No object is copied, moved or deleted by this migration.

begin;

do $$
begin
  if not exists (select 1 from storage.buckets where id='case-photos') then
    raise exception 'Required bucket case-photos is missing';
  end if;
  if not exists (select 1 from storage.buckets where id='rescue-case-photos') then
    raise exception 'Required bucket rescue-case-photos is missing';
  end if;
end
$$;

-- Make both rescue-photo buckets private. The original object keys are retained.
update storage.buckets
set public=false
where id in ('case-photos','rescue-case-photos');

update storage.buckets
set file_size_limit=5242880,
    allowed_mime_types=array['image/jpeg','image/png']::text[]
where id='rescue-case-photos';

-- Remove broad legacy read and Team insert permissions on the old public bucket.
drop policy if exists vf_case_photos_public_read on storage.objects;
drop policy if exists vf_case_photos_team_insert on storage.objects;

-- Remove the old app_metadata-admin policies from the existing private bucket.
-- They are broader than the actual Founder/approved-Team profile roles used by this app.
drop policy if exists "Admins can delete rescue photos" on storage.objects;
drop policy if exists "Admins can update rescue photos" on storage.objects;
drop policy if exists "Admins can upload rescue photos 1t7h9c4_0" on storage.objects;
drop policy if exists "Admins can view rescue photos" on storage.objects;

-- Cleanly replace policies if this migration is re-run on a disposable staging project.
drop policy if exists vf_case_photos_anon_published_read on storage.objects;
drop policy if exists vf_case_photos_authenticated_read on storage.objects;
drop policy if exists vf_rescue_case_photos_anon_published_read on storage.objects;
drop policy if exists vf_rescue_case_photos_authenticated_read on storage.objects;
drop policy if exists vf_rescue_case_photos_team_insert on storage.objects;
drop policy if exists vf_rescue_case_photos_founder_manage on storage.objects;

-- Legacy case-photos: keep existing object keys. Anonymous signed-URL creation is allowed
-- only where the published projection exposes the same path.
create policy vf_case_photos_anon_published_read
on storage.objects for select to anon
using (
  bucket_id='case-photos'
  and exists (
    select 1 from public.public_rescue_cases rc
    where rc.photo_path=storage.objects.name
      and rc.publication='published'
  )
);

create policy vf_case_photos_authenticated_read
on storage.objects for select to authenticated
using (
  bucket_id='case-photos'
  and (
    private.is_founder()
    or exists (
      select 1 from public.public_rescue_cases rc
      where rc.photo_path=storage.objects.name
        and rc.publication='published'
    )
    or (
      private.is_team()
      and exists (
        select 1 from public.rescue_cases rc
        where rc.photo_path=storage.objects.name
          and rc.submitted_by=(select auth.uid())
          and rc.publication in ('draft','pending_review')
      )
    )
  )
);

-- New private bucket: only published images can be signed by anonymous visitors.
create policy vf_rescue_case_photos_anon_published_read
on storage.objects for select to anon
using (
  bucket_id='rescue-case-photos'
  and exists (
    select 1 from public.public_rescue_cases rc
    where rc.photo_path='rescue-case-photos/' || storage.objects.name
      and rc.publication='published'
  )
);

create policy vf_rescue_case_photos_authenticated_read
on storage.objects for select to authenticated
using (
  bucket_id='rescue-case-photos'
  and (
    private.is_founder()
    or exists (
      select 1 from public.public_rescue_cases rc
      where rc.photo_path='rescue-case-photos/' || storage.objects.name
        and rc.publication='published'
    )
    or (
      private.is_team()
      and exists (
        select 1 from public.rescue_cases rc
        where rc.photo_path='rescue-case-photos/' || storage.objects.name
          and rc.submitted_by=(select auth.uid())
          and rc.publication in ('draft','pending_review')
      )
    )
  )
);

-- Approved Team members upload to a first-level folder named after their auth.uid().
-- The browser app stores the prefixed object path in rescue_cases.photo_path.
create policy vf_rescue_case_photos_team_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='rescue-case-photos'
  and private.is_team()
  and split_part(storage.objects.name,'/',1)=(select auth.uid())::text
);

-- Founder can upload replacements and manage rescue photos in either private bucket.
-- Existing vf_case_photos_founder_manage on case-photos is intentionally retained.
create policy vf_rescue_case_photos_founder_manage
on storage.objects for all to authenticated
using (
  bucket_id='rescue-case-photos'
  and private.is_founder()
)
with check (
  bucket_id='rescue-case-photos'
  and private.is_founder()
);

-- story-photos is a separate public content bucket; restore its own explicit read policy
-- after removing the former combined case/story public-read policy.
drop policy if exists vf_story_photos_public_read on storage.objects;
create policy vf_story_photos_public_read
on storage.objects for select to anon, authenticated
using (bucket_id='story-photos');

commit;

-- IMPORTANT:
-- * Do not set case-photos public again while the private-photo app build is active.
-- * Do not deploy the Team Edge Function before this migration and bucket config are
--   present in staging. Its service-role uploads bypass storage RLS, but require the bucket.
-- * Existing published paths are not rewritten. The app generates short-lived signed URLs.
-- * Existing permanent /object/public/ URLs will stop working after the bucket is private.
--   This is required to make rejected/pending images non-public; the page now generates
--   temporary signed URLs for approved published records instead.
