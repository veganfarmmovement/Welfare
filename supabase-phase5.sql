-- VEGANFARM Phase 5: shared Team access code gate
-- Production code is stored as a salted bcrypt hash in the private schema.
-- Do not place the plaintext Team code or a reusable code hash in this repository.
-- The production config row is seeded separately in Supabase.

begin;

create table if not exists private.veganfarm_team_gate_config (
  id boolean primary key default true check (id),
  code_hash text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
revoke all on table private.veganfarm_team_gate_config from public, anon, authenticated, service_role;

create table if not exists private.veganfarm_team_gate_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
revoke all on table private.veganfarm_team_gate_sessions from public, anon, authenticated, service_role;

create table if not exists private.veganfarm_team_gate_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  succeeded boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index if not exists veganfarm_team_gate_attempts_ip_time_idx
  on private.veganfarm_team_gate_attempts(ip_hash, attempted_at desc);
revoke all on table private.veganfarm_team_gate_attempts from public, anon, authenticated, service_role;

create or replace function public.vf_team_gate_verify(p_code text,p_token_hash text,p_ip_hash text)
returns boolean language plpgsql security definer set search_path to ''
as $function$
declare saved_hash text; is_enabled boolean; failed_attempts integer; matched boolean := false;
begin
  if p_code is null or length(p_code)>100
     or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
     or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then return false; end if;

  select code_hash,enabled into saved_hash,is_enabled
  from private.veganfarm_team_gate_config where id=true for update;
  if saved_hash is null or not coalesce(is_enabled,false) then return false; end if;

  delete from private.veganfarm_team_gate_attempts where attempted_at<now()-interval '24 hours';
  delete from private.veganfarm_team_gate_sessions where expires_at<now();

  select count(*)::integer into failed_attempts
  from private.veganfarm_team_gate_attempts
  where ip_hash=p_ip_hash and succeeded=false
    and attempted_at>now()-interval '15 minutes';
  if failed_attempts>=8 then return false; end if;

  matched := extensions.crypt(p_code,saved_hash)=saved_hash;
  insert into private.veganfarm_team_gate_attempts(ip_hash,succeeded) values(p_ip_hash,matched);
  if matched then
    insert into private.veganfarm_team_gate_sessions(token_hash,ip_hash,expires_at)
    values(p_token_hash,p_ip_hash,now()+interval '8 hours')
    on conflict(token_hash) do update
    set ip_hash=excluded.ip_hash,created_at=now(),expires_at=excluded.expires_at;
  end if;
  return matched;
end;
$function$;

create or replace function public.vf_team_gate_session_valid(p_token_hash text)
returns boolean language sql stable security definer set search_path to ''
as $function$
  select exists(select 1 from private.veganfarm_team_gate_sessions
    where token_hash=p_token_hash and expires_at>now());
$function$;

revoke all on function public.vf_team_gate_verify(text,text,text) from public,anon,authenticated;
revoke all on function public.vf_team_gate_session_valid(text) from public,anon,authenticated;
grant execute on function public.vf_team_gate_verify(text,text,text) to service_role;
grant execute on function public.vf_team_gate_session_valid(text) to service_role;

commit;
