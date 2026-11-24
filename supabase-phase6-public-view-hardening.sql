-- VEGANFARM Phase 6: public view privilege hardening
-- Review and test against a Supabase development database before production application.
-- This migration changes no table data, payment settings, authentication users or table schemas.
-- The Trust-specific trust_project_fundraising_totals view is intentionally not modified.

begin;

-- These views are deliberately retained as security-definer read projections. Anonymous
-- currently has no SELECT privilege on the underlying rescue_cases/case_documents tables;
-- switching these views to security_invoker would break the public pages. Their definitions
-- expose an allowlisted set of fields and filter to published cases/public documents.
-- Security-barrier prevents caller predicates from being pushed below the view boundary.
alter view public.public_rescue_cases set (security_barrier = true);
alter view public.public_case_documents set (security_barrier = true);

revoke all privileges on table public.public_rescue_cases from public, anon, authenticated;
grant select on table public.public_rescue_cases to anon, authenticated;

revoke all privileges on table public.public_case_documents from public, anon, authenticated;
grant select on table public.public_case_documents to anon, authenticated;


-- Restrict anonymous object listing/signed-URL creation to published case images and
-- preserve story-photo listing. The public_rescue_cases view is used because anon does
-- not have direct SELECT permission on rescue_cases. This is only a listing control while
-- case-photos is public; known object URLs remain fetchable until Phase 7 makes it private.
-- A complete privacy fix must move unpublished photos into private storage and use signed URLs.
drop policy if exists vf_case_photos_public_read on storage.objects;
create policy vf_case_photos_public_read
on storage.objects for select to anon, authenticated
using (
  (
    bucket_id = 'case-photos'
    and exists (
      select 1 from public.public_rescue_cases rc
      where rc.photo_path = storage.objects.name
        and rc.publication = 'published'
    )
  )
  or bucket_id = 'story-photos'
);

commit;

-- Expected result after application:
-- * Anonymous visitors can SELECT only records allowed by the underlying RLS policies.
-- * Anonymous INSERT / UPDATE / DELETE on both views is revoked.
-- * Founder and Team access continues to rely on existing base-table policies.
-- * No Trust-specific tables or views are modified.
