-- VEGANFARM Supabase setup. Run once in Supabase Dashboard > SQL Editor > New query > Run.
-- Safe to re-run. RLS stays ON for every table.

create extension if not exists pgcrypto;

-- Roles: one row per signed-in person. Passwords live only in Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, display_name text,
  role text not null default 'team' check (role in ('founder','team')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now()
);
create or replace function public.is_founder() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from profiles where id=auth.uid() and role='founder' and status='approved') $$;
create or replace function public.is_team() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from profiles where id=auth.uid() and status='approved') $$;

create table if not exists public.site_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());

create table if not exists public.rescue_cases (
  id uuid primary key default gen_random_uuid(),
  case_code text unique, animal_name text not null, animal_type text, location text, hospital text,
  condition text, treatment text, description text, status text default 'Awaiting treatment',
  target_amount numeric check (target_amount is null or target_amount>=0),
  publication text not null default 'draft' check (publication in ('draft','pending_review','published','unpublished','archived','rejected')),
  photo_path text, submitted_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
ALTER TABLE public.rescue_cases
ADD COLUMN IF NOT EXISTS publication text NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rescue_cases_publication_check'
      AND conrelid = 'public.rescue_cases'::regclass
  ) THEN
    ALTER TABLE public.rescue_cases
    ADD CONSTRAINT rescue_cases_publication_check
    CHECK (publication IN (
      'draft', 'pending_review', 'published',
      'unpublished', 'archived', 'rejected'
    ));
  END IF;
END $$;create table if not exists public.case_updates (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references rescue_cases(id) on delete cascade,
  note text not null, public_visible boolean not null default false, created_by uuid references auth.users(id), created_at timestamptz not null default now());

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null, donor_contact text not null,
  amount numeric not null check (amount>0), category text, target_label text, case_id uuid references rescue_cases(id),
  upi_reference text, screenshot_path text, show_name boolean not null default false,
  status text not null default 'pending' check (status in ('pending','verified','rejected','reversed')),
  verified_by uuid references auth.users(id), verified_at timestamptz, created_at timestamptz not null default now());
create unique index if not exists donations_ref_uq on public.donations (lower(upi_reference)) where upi_reference is not null and upi_reference<>'';

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(), amount numeric not null check (amount>0), description text, case_id uuid references rescue_cases(id),
  receipt_path text, status text not null default 'pending' check (status in ('pending','approved','rejected','reversed')),
  submitted_by uuid references auth.users(id), approved_by uuid references auth.users(id), created_at timestamptz not null default now());

create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(), name text, email text, phone text, payload jsonb not null default '{}',
  status text not null default 'new' check (status in ('new','approved','rejected')), created_at timestamptz not null default now());
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(), name text, email text, phone text, payload jsonb not null default '{}',
  handled boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(), title text not null, location text, body text, photo_path text,
  published boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.audit_log (
  id bigint generated always as identity primary key, actor uuid default auth.uid(), action text not null, record_ref text, detail text, created_at timestamptz not null default now());

create index if not exists donations_status_idx on donations(status);
create index if not exists cases_pub_idx on rescue_cases(publication);
create index if not exists updates_case_idx on case_updates(case_id);

alter table profiles enable row level security;       alter table site_settings enable row level security;
alter table rescue_cases enable row level security;   alter table case_updates enable row level security;
alter table donations enable row level security;      alter table expenses enable row level security;
alter table volunteer_applications enable row level security; alter table contact_messages enable row level security;
alter table stories enable row level security;        alter table audit_log enable row level security;

drop policy if exists p_prof_self on profiles;  create policy p_prof_self on profiles for select using (id=auth.uid() or is_founder());
drop policy if exists p_prof_f on profiles;     create policy p_prof_f on profiles for all using (is_founder()) with check (is_founder());
drop policy if exists p_set_r on site_settings; create policy p_set_r on site_settings for select using (true);
drop policy if exists p_set_w on site_settings; create policy p_set_w on site_settings for all using (is_founder()) with check (is_founder());
drop policy if exists p_case_r on rescue_cases; create policy p_case_r on rescue_cases for select using (publication='published' or is_founder() or submitted_by=auth.uid());
drop policy if exists p_case_i on rescue_cases; create policy p_case_i on rescue_cases for insert to authenticated with check (is_team() and submitted_by=auth.uid() and publication in ('draft','pending_review'));
drop policy if exists p_case_u on rescue_cases; create policy p_case_u on rescue_cases for update to authenticated using (is_founder() or (submitted_by=auth.uid() and publication in ('draft','pending_review'))) with check (is_founder() or (submitted_by=auth.uid() and publication in ('draft','pending_review')));
drop policy if exists p_case_d on rescue_cases; create policy p_case_d on rescue_cases for delete using (is_founder());
drop policy if exists p_cu_r on case_updates;   create policy p_cu_r on case_updates for select using (public_visible or is_founder());
drop policy if exists p_cu_w on case_updates;   create policy p_cu_w on case_updates for all using (is_founder()) with check (is_founder());
drop policy if exists p_don_i on donations;     create policy p_don_i on donations for insert to anon, authenticated with check (status='pending' and verified_by is null and verified_at is null);
drop policy if exists p_don_f on donations;     create policy p_don_f on donations for all using (is_founder()) with check (is_founder());
drop policy if exists p_exp_f on expenses;      create policy p_exp_f on expenses for all using (is_founder()) with check (is_founder());
drop policy if exists p_exp_t on expenses;      create policy p_exp_t on expenses for insert to authenticated with check (is_team() and submitted_by=auth.uid() and status='pending');
drop policy if exists p_vol_i on volunteer_applications; create policy p_vol_i on volunteer_applications for insert to anon, authenticated with check (status='new');
drop policy if exists p_vol_f on volunteer_applications; create policy p_vol_f on volunteer_applications for all using (is_founder()) with check (is_founder());
drop policy if exists p_msg_i on contact_messages; create policy p_msg_i on contact_messages for insert to anon, authenticated with check (handled=false);
drop policy if exists p_msg_f on contact_messages; create policy p_msg_f on contact_messages for all using (is_founder()) with check (is_founder());
drop policy if exists p_st_r on stories;        create policy p_st_r on stories for select using (published or is_founder());
drop policy if exists p_st_w on stories;        create policy p_st_w on stories for all using (is_founder()) with check (is_founder());
drop policy if exists p_aud_f on audit_log;     create policy p_aud_f on audit_log for select using (is_founder());
drop policy if exists p_aud_i on audit_log;     create policy p_aud_i on audit_log for insert to authenticated with check (is_team());

-- Public feed: verified donations only, no contact details, name only if donor agreed.
create or replace view public.public_donation_feed as
  select case when show_name then donor_name else 'Anonymous' end as donor, amount, category, case_id, created_at
  from donations where status='verified';
create or replace view public.public_donation_totals as
  select coalesce(sum(amount),0) as verified_total, count(*) as verified_count from donations where status='verified';
grant select on public.public_donation_feed, public.public_donation_totals to anon, authenticated;

-- Storage buckets
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
 ('donation-screenshots','donation-screenshots',false,5242880,array['image/jpeg','image/png','application/pdf']),
 ('expense-receipts','expense-receipts',false,5242880,array['image/jpeg','image/png','application/pdf']),
 ('case-photos','case-photos',true,5242880,array['image/jpeg','image/png']),
 ('story-photos','story-photos',true,5242880,array['image/jpeg','image/png'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists s_don_ins on storage.objects; create policy s_don_ins on storage.objects for insert to anon, authenticated with check (bucket_id='donation-screenshots');
drop policy if exists s_priv_f on storage.objects;  create policy s_priv_f on storage.objects for select using (bucket_id in ('donation-screenshots','expense-receipts') and is_founder());
drop policy if exists s_pub_r on storage.objects;   create policy s_pub_r on storage.objects for select using (bucket_id in ('case-photos','story-photos'));
drop policy if exists s_team_w on storage.objects;  create policy s_team_w on storage.objects for insert to authenticated with check (bucket_id in ('case-photos','expense-receipts') and is_team());
drop policy if exists s_f_w on storage.objects;     create policy s_f_w on storage.objects for all using (is_founder()) with check (is_founder());

-- AFTER you create your own Founder login in Authentication > Users, run this once with your email:
-- insert into profiles (id,email,display_name,role,status) select id,email,'Harshit Dedhia','founder','approved' from auth.users where email='YOUR_EMAIL_HERE';
