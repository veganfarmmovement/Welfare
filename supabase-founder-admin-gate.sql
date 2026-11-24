-- VEGANFARM Founder access sessions.
-- Applied to Supabase project isijlklxfdqhrlpjxadj on 2026-11-24.
-- Access-code hashes remain in public.vf_admin_pin; never store raw access codes here.

create table if not exists private.vf_founder_gate_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists vf_founder_gate_sessions_expiry_idx
  on private.vf_founder_gate_sessions(expires_at);

create table if not exists private.vf_founder_gate_attempts (
  id bigserial primary key,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  succeeded boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index if not exists vf_founder_gate_attempts_ip_time_idx
  on private.vf_founder_gate_attempts(ip_hash, attempted_at desc);

create or replace function public.vf_founder_gate_verify(p_pin text, p_token_hash text, p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  failures integer;
  matched boolean := false;
begin
  if p_pin is null or length(p_pin) > 100
     or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
     or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_ip_hash));
  delete from private.vf_founder_gate_attempts
    where attempted_at < now() - interval '24 hours';
  delete from private.vf_founder_gate_sessions where expires_at < now();
  select count(*)::integer into failures
    from private.vf_founder_gate_attempts
    where ip_hash = p_ip_hash
      and succeeded = false
      and attempted_at > now() - interval '15 minutes';
  if failures >= 5 then return false; end if;
  matched := public.vf_check_founder_pin(p_pin);
  insert into private.vf_founder_gate_attempts(ip_hash, succeeded)
    values (p_ip_hash, matched);
  if matched then
    insert into private.vf_founder_gate_sessions(token_hash, ip_hash, expires_at)
      values (p_token_hash, p_ip_hash, now() + interval '8 hours')
      on conflict (token_hash) do update
        set ip_hash = excluded.ip_hash, created_at = now(), expires_at = excluded.expires_at;
  end if;
  return matched;
end;
$function$;

create or replace function public.vf_founder_gate_session_valid(p_token_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from private.vf_founder_gate_sessions
    where token_hash = p_token_hash and expires_at > now()
  );
$function$;

create or replace function public.vf_founder_gate_revoke(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  delete from private.vf_founder_gate_sessions where token_hash = p_token_hash;
  return true;
end;
$function$;

revoke all on function public.vf_founder_gate_verify(text,text,text) from public, anon, authenticated;
revoke all on function public.vf_founder_gate_session_valid(text) from public, anon, authenticated;
revoke all on function public.vf_founder_gate_revoke(text) from public, anon, authenticated;
grant execute on function public.vf_founder_gate_verify(text,text,text) to service_role;
grant execute on function public.vf_founder_gate_session_valid(text) to service_role;
grant execute on function public.vf_founder_gate_revoke(text) to service_role;
