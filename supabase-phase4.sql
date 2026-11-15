-- VEGANFARM Supabase hardening and Team access lifecycle
-- Applied to project isijlklxfdqhrlpjxadj.
-- This SQL documents the production changes. The grants and policies intentionally
-- expose only the public website operations; Founder and approved Team access remain RLS controlled.

begin;

alter table public.team_access_requests
  drop constraint if exists team_access_requests_status_check;
alter table public.team_access_requests
  add constraint team_access_requests_status_check
  check (status = any (array['pending','approved','rejected','suspended']::text[]));

create or replace function private.is_founder()
returns boolean language sql stable security definer set search_path to ''
as $function$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'founder' and status = 'approved'
  );
$function$;

create or replace function private.is_team()
returns boolean language sql stable security definer set search_path to ''
as $function$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'team' and status = 'approved'
  );
$function$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare
  founder_email boolean;
  req_status text;
  requested_name text;
  member_name text;
begin
  founder_email := lower(coalesce(new.email, '')) in ('hdedhia22@gmail.com','veganfarmmovement@gmail.com');
  if founder_email then
    member_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, ''), '@', 1));
    req_status := 'approved';
  else
    select name, status into requested_name, req_status
      from public.team_access_requests
      where email_normalized = lower(btrim(new.email))
      limit 1;
    member_name := coalesce(
      nullif(btrim(requested_name), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    );
    if req_status is null then
      insert into public.team_access_requests(name, email, status)
      values (member_name, new.email, 'pending')
      on conflict (email_normalized) do nothing;
      select name, status into requested_name, req_status
        from public.team_access_requests
        where email_normalized = lower(btrim(new.email))
        limit 1;
      member_name := coalesce(nullif(btrim(requested_name), ''), member_name);
    end if;
  end if;

  insert into public.profiles(id, email, display_name, role, status)
  values (
    new.id, new.email, member_name,
    case when founder_email then 'founder' else 'team' end,
    case
      when founder_email then 'approved'
      when req_status = 'approved' then 'approved'
      when req_status = 'rejected' then 'rejected'
      when req_status = 'suspended' then 'suspended'
      else 'pending'
    end
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      role = excluded.role,
      status = excluded.status;
  return new;
end;
$function$;

drop policy if exists p_prof_self on public.profiles;
create policy p_prof_self on public.profiles for select to authenticated
using ((id = (select auth.uid())) or (select private.is_founder()));

drop policy if exists p_case_r on public.rescue_cases;
create policy p_case_r on public.rescue_cases for select to anon, authenticated
using (publication = 'published' or (select private.is_founder()) or submitted_by = (select auth.uid()));

drop policy if exists p_case_u on public.rescue_cases;
create policy p_case_u on public.rescue_cases for update to authenticated
using (
  (select private.is_founder())
  or (submitted_by = (select auth.uid()) and publication = any (array['draft','pending_review']::text[]))
)
with check (
  (select private.is_founder())
  or (submitted_by = (select auth.uid()) and publication = any (array['draft','pending_review']::text[]))
);

drop policy if exists cp_i on public.case_private;
create policy cp_i on public.case_private for insert to authenticated
with check (
  (select private.is_team())
  and exists (
    select 1 from public.rescue_cases rc
    where rc.id = case_private.case_id and rc.submitted_by = (select auth.uid())
  )
);

drop policy if exists case_documents_read on public.case_documents;
create policy case_documents_read on public.case_documents for select to anon, authenticated
using (
  is_public
  or (select private.is_founder())
  or exists (
    select 1 from public.rescue_cases rc
    where rc.id = case_documents.case_id and rc.submitted_by = (select auth.uid())
  )
);

drop policy if exists case_documents_insert on public.case_documents;
create policy case_documents_insert on public.case_documents for insert to authenticated
with check (
  (
    (select private.is_founder())
    or exists (
      select 1 from public.rescue_cases rc
      where rc.id = case_documents.case_id
        and rc.submitted_by = (select auth.uid())
        and rc.publication = any (array['draft','pending_review']::text[])
    )
  )
  and created_by = (select auth.uid())
);

-- The base donations table is never publicly readable.
drop policy if exists p_don_public_r on public.donations;
revoke all privileges on table public.donations from anon, public;
grant insert on table public.donations to anon;

-- A separate public-only table prevents donor contacts and screenshots from entering the public API.
drop view if exists public.public_donation_feed;
create table public.public_donation_feed (
  donation_id uuid primary key references public.donations(id) on delete cascade,
  donor text not null,
  amount numeric not null,
  category text not null,
  case_id uuid,
  created_at timestamptz not null,
  target_label text
);
alter table public.public_donation_feed enable row level security;
create policy public_donation_feed_read
on public.public_donation_feed for select to anon, authenticated
using (true);
revoke all privileges on table public.public_donation_feed from anon, authenticated, public;
grant select on table public.public_donation_feed to anon, authenticated;
create index public_donation_feed_created_at_idx on public.public_donation_feed(created_at);

create or replace function private.sync_public_donation_feed()
returns trigger language plpgsql security definer set search_path to ''
as $function$
begin
  if TG_OP = 'DELETE' then
    delete from public.public_donation_feed where donation_id = old.id;
    return old;
  end if;

  if new.status = 'verified' then
    insert into public.public_donation_feed(
      donation_id, donor, amount, category, case_id, created_at, target_label
    )
    values (
      new.id,
      case when new.show_name then new.donor_name else 'Anonymous'::text end,
      new.amount,
      new.category,
      new.case_id,
      new.created_at,
      new.target_label
    )
    on conflict (donation_id) do update
    set donor = excluded.donor,
        amount = excluded.amount,
        category = excluded.category,
        case_id = excluded.case_id,
        created_at = excluded.created_at,
        target_label = excluded.target_label;
  else
    delete from public.public_donation_feed where donation_id = new.id;
  end if;
  return new;
end;
$function$;
revoke all on function private.sync_public_donation_feed() from public, anon, authenticated;

drop trigger if exists donations_sync_public_feed on public.donations;
create trigger donations_sync_public_feed
after insert or update or delete on public.donations
for each row execute function private.sync_public_donation_feed();

insert into public.public_donation_feed(
  donation_id, donor, amount, category, case_id, created_at, target_label
)
select
  id,
  case when show_name then donor_name else 'Anonymous'::text end,
  amount,
  category,
  case_id,
  created_at,
  target_label
from public.donations
where status = 'verified'
on conflict (donation_id) do update
set donor = excluded.donor,
    amount = excluded.amount,
    category = excluded.category,
    case_id = excluded.case_id,
    created_at = excluded.created_at,
    target_label = excluded.target_label;

-- Public Team access requests are insert-only; Founder reads and decisions remain RLS protected.
revoke all privileges on table public.team_access_requests from anon, public;
grant insert on table public.team_access_requests to anon;

-- Restrict anonymous access to only the public page operations that the live site uses.
revoke all privileges on table public.profiles from anon, public;
revoke all privileges on table public.audit_log from anon, public;
revoke all privileges on table public.case_private from anon, public;
revoke all privileges on table public.expenses from anon, public;
revoke all privileges on table public.ledger_adjustments from anon, public;
revoke all privileges on table public.vf_app_state from anon, public;
revoke all privileges on table public.vf_admin_pin from anon, public;
revoke all privileges on table public.vf_admin_state from anon, public;
revoke all privileges on table public."VEGANFARM" from anon, public;

revoke all privileges on table public.rescue_cases from anon, public;
grant select on table public.rescue_cases to anon;
revoke all privileges on table public.site_settings from anon, public;
grant select on table public.site_settings to anon;
revoke all privileges on table public.stories from anon, public;
grant select on table public.stories to anon;
revoke all privileges on table public.case_updates from anon, public;
grant select on table public.case_updates to anon;
revoke all privileges on table public.case_documents from anon, public;
grant select on table public.case_documents to anon;
revoke all privileges on table public.public_financial_totals from anon, public;
grant select on table public.public_financial_totals to anon;
revoke all privileges on table public.contact_messages from anon, public;
grant insert on table public.contact_messages to anon;
revoke all privileges on table public.volunteer_applications from anon, public;
grant insert on table public.volunteer_applications to anon;

-- A legacy bucket named "Welfare private" was public but empty; make it private.
update storage.buckets b set public = false
where b.id = 'Welfare private'
  and not exists (select 1 from storage.objects o where o.bucket_id = b.id);

-- Index foreign keys reported without indexes by the Supabase advisor.
create index if not exists case_documents_case_id_idx on public.case_documents(case_id);
create index if not exists case_documents_created_by_idx on public.case_documents(created_by);
create index if not exists case_updates_case_id_idx on public.case_updates(case_id);
create index if not exists case_updates_created_by_idx on public.case_updates(created_by);
create index if not exists donations_case_id_idx on public.donations(case_id);
create index if not exists donations_verified_by_idx on public.donations(verified_by);
create index if not exists expenses_approved_by_idx on public.expenses(approved_by);
create index if not exists expenses_case_id_idx on public.expenses(case_id);
create index if not exists expenses_submitted_by_idx on public.expenses(submitted_by);
create index if not exists ledger_adjustments_created_by_idx on public.ledger_adjustments(created_by);
create index if not exists rescue_cases_submitted_by_idx on public.rescue_cases(submitted_by);
create index if not exists team_access_requests_reviewed_by_idx on public.team_access_requests(reviewed_by);
create index if not exists vf_app_state_updated_by_idx on public.vf_app_state(updated_by);
create index if not exists volunteer_applications_reviewed_by_idx on public.volunteer_applications(reviewed_by);

commit;
