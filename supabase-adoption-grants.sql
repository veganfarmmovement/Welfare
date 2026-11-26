-- VEGANFARM public Adoption and Fund Grant applications
-- Private intake tables and private file buckets. Public access is through the
-- veganfarm-public-applications Edge Function only; never grant direct table access.

begin;

create table if not exists public.adoption_cases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique default ('VF-AD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  applicant_name text not null,
  applicant_email text,
  applicant_phone text not null,
  applicant_relationship text not null,
  applicant_city text not null,
  animal_name text not null,
  animal_type text not null,
  breed text,
  age_text text,
  gender text,
  animal_location text not null,
  health_status text,
  vaccination_status text,
  sterilisation_status text,
  adoption_reason text not null,
  home_requirements text,
  special_requirements text,
  urgent boolean not null default false,
  adoption_fee text,
  description text,
  photo_paths text[] not null default '{}',
  document_paths text[] not null default '{}',
  publication text not null default 'pending_review'
    check (publication in ('pending_review','under_verification','published','rejected','unpublished','adopted','closed')),
  admin_note text,
  applicant_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists adoption_cases_publication_created_idx
  on public.adoption_cases(publication, created_at desc);

create table if not exists public.fund_grant_applications (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('VF-FG-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id uuid not null references auth.users(id) on delete cascade,
  applicant_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  state text not null,
  applicant_type text not null,
  assistance_type text not null,
  purpose text not null,
  amount_requested numeric(12,2) not null check (amount_requested > 0),
  amount_arranged numeric(12,2) not null default 0 check (amount_arranged >= 0),
  amount_pending numeric(12,2) not null check (amount_pending >= 0),
  urgency text not null,
  needed_by text,
  beneficiary_details text not null,
  beneficiary_count text,
  other_support text,
  status text not null default 'pending_review'
    check (status in ('pending_review','under_review','more_info_required','approved','rejected','assistance_provided','closed')),
  admin_note text,
  applicant_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fund_grant_user_created_idx
  on public.fund_grant_applications(user_id, created_at desc);
create index if not exists fund_grant_reference_idx
  on public.fund_grant_applications(reference_code);

create table if not exists public.fund_grant_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.fund_grant_applications(id) on delete cascade,
  document_type text not null,
  file_path text not null,
  original_name text,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists fund_grant_documents_application_idx
  on public.fund_grant_documents(application_id);

create table if not exists public.public_intake_rate_limits (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists public_intake_rate_limits_lookup_idx
  on public.public_intake_rate_limits(ip_hash, action, created_at desc);

alter table public.adoption_cases enable row level security;
alter table public.fund_grant_applications enable row level security;
alter table public.fund_grant_documents enable row level security;
alter table public.public_intake_rate_limits enable row level security;

revoke all on public.adoption_cases from public, anon, authenticated;
revoke all on public.fund_grant_applications from public, anon, authenticated;
revoke all on public.fund_grant_documents from public, anon, authenticated;
revoke all on public.public_intake_rate_limits from public, anon, authenticated;
grant all on public.adoption_cases to service_role;
grant all on public.fund_grant_applications to service_role;
grant all on public.fund_grant_documents to service_role;
grant all on public.public_intake_rate_limits to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
 ('adoption-case-files','adoption-case-files',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm','video/quicktime']::text[]),
 ('fund-grant-files','fund-grant-files',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']::text[])
on conflict (id) do update
set public=false,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

commit;
