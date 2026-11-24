-- VEGANFARM Phase 6: public view privilege hardening
-- Review and test against a Supabase development database before production application.
-- This migration changes no table data, payment settings, authentication users or table schemas.
-- The Trust-specific trust_project_fundraising_totals view is intentionally not modified.

begin;

-- These views are public read projections only. Prevent accidental writes through the
-- PostgREST API and make the underlying table RLS policies apply to the invoking role.
alter view public.public_rescue_cases set (security_invoker = true);
alter view public.public_case_documents set (security_invoker = true);

revoke all privileges on table public.public_rescue_cases from public, anon, authenticated;
grant select on table public.public_rescue_cases to anon, authenticated;

revoke all privileges on table public.public_case_documents from public, anon, authenticated;
grant select on table public.public_case_documents to anon, authenticated;


-- Restrict anonymous object listing to case images attached to published cases and
-- story images attached to published stories. This is an interim listing control only:
-- because case-photos is still a PUBLIC bucket, a known object URL can still be fetched.
-- A complete privacy fix must move unpublished photos into private storage and use signed URLs.
drop policy if exists vf_case_photos_public_read on storage.objects;
create policy vf_case_photos_public_read
on storage.objects for select to anon, authenticated
using (
  (
    bucket_id = 'case-photos'
    and exists (
      select 1 from public.rescue_cases rc
      where rc.id::text = split_part(storage.objects.name, '/', 1)
        and rc.publication = 'published'
    )
  )
  or
  (
    bucket_id = 'story-photos'
    and exists (
      select 1 from public.stories st
      where st.photo_path = storage.objects.name
        and st.published = true
    )
  )
);

commit;

-- Expected result after application:
-- * Anonymous visitors can SELECT only records allowed by the underlying RLS policies.
-- * Anonymous INSERT / UPDATE / DELETE on both views is revoked.
-- * Founder and Team access continues to rely on existing base-table policies.
-- * No Trust-specific tables or views are modified.
