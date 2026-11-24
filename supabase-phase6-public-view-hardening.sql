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

commit;

-- Expected result after application:
-- * Anonymous visitors can SELECT only records allowed by the underlying RLS policies.
-- * Anonymous INSERT / UPDATE / DELETE on both views is revoked.
-- * Founder and Team access continues to rely on existing base-table policies.
-- * No Trust-specific tables or views are modified.
