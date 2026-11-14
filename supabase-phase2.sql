-- VEGANFARM phase 2. Run AFTER supabase-setup.sql, in SQL Editor. Safe to re-run.

-- 1. Auto-create a pending team profile whenever someone signs up in Supabase Auth.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,display_name,role,status)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)),'team','pending')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 2. Audit log: richer columns, written ONLY by triggers, immutable for everyone.
alter table audit_log add column if not exists actor_email text, add column if not exists actor_role text,
  add column if not exists module text, add column if not exists record_id text,
  add column if not exists old_values jsonb, add column if not exists new_values jsonb;
drop policy if exists p_aud_i on audit_log;
revoke insert, update, delete, truncate on audit_log from anon, authenticated;

create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $$
declare o jsonb; n jsonb; r text; e text; d text;
begin
  o := case when TG_OP in ('UPDATE','DELETE') then to_jsonb(OLD) end;
  n := case when TG_OP in ('INSERT','UPDATE') then to_jsonb(NEW) end;
  select role, email into r, e from profiles where id=auth.uid();
  d := case when o is not null and n is not null and (o->>'status') is distinct from (n->>'status') then 'status: '||coalesce(o->>'status','-')||' -> '||coalesce(n->>'status','-')
            when o is not null and n is not null and (o->>'publication') is distinct from (n->>'publication') then 'publication: '||coalesce(o->>'publication','-')||' -> '||coalesce(n->>'publication','-')
            else null end;
  insert into audit_log(actor,actor_email,actor_role,action,module,record_ref,record_id,detail,old_values,new_values)
  values(auth.uid(), e, case when auth.uid() is null then 'public' else coalesce(r,'unknown') end, TG_OP, TG_TABLE_NAME,
         TG_TABLE_NAME, coalesce(coalesce(n,o)->>'id', coalesce(n,o)->>'key'), d, o, n);
  return coalesce(NEW,OLD);
end $$;

create or replace function public.audit_immutable() returns trigger language plpgsql as $$
begin raise exception 'audit_log is append-only'; end $$;
drop trigger if exists audit_no_change on audit_log;
create trigger audit_no_change before update or delete on audit_log for each row execute function audit_immutable();
drop trigger if exists audit_no_truncate on audit_log;
create trigger audit_no_truncate before truncate on audit_log for each statement execute function audit_immutable();

do $$ declare t text; begin
  foreach t in array array['profiles','site_settings','rescue_cases','case_updates','donations','expenses','volunteer_applications','contact_messages','stories'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row()', t);
  end loop; end $$;

-- 3. Stamp who verified a donation/expense; stop role or status tampering by non-founders.
create or replace function public.stamp_decision() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if TG_TABLE_NAME='donations' and new.status='verified' and old.status is distinct from 'verified' then new.verified_by:=auth.uid(); new.verified_at:=now(); end if;
  if TG_TABLE_NAME='expenses' and new.status='approved' and old.status is distinct from 'approved' then new.approved_by:=auth.uid(); end if;
  return new;
end $$;
drop trigger if exists stamp_don on donations; create trigger stamp_don before update on donations for each row execute function stamp_decision();
drop trigger if exists stamp_exp on expenses;  create trigger stamp_exp before update on expenses  for each row execute function stamp_decision();

-- 4. Public views (no private data) and Founder-only ledger.
create or replace view public.public_donation_feed as
  select case when show_name then donor_name else 'Anonymous' end as donor, amount, category, case_id, created_at, target_label
  from donations where status='verified';
create or replace view public.public_financial_totals as
  select coalesce((select sum(amount) from donations where status='verified'),0) as verified_donations,
         coalesce((select sum(amount) from expenses where status='approved'),0) as approved_expenses;
grant select on public.public_donation_feed, public.public_financial_totals to anon, authenticated;

create or replace view public.ledger with (security_invoker=true) as
  select created_at as at,'donation'::text as kind,id,amount as credit,0::numeric as debit from donations where status='verified'
  union all select created_at,'expense',id,0,amount from expenses where status='approved';
grant select on public.ledger to authenticated;

-- 5. Make yourself Founder (replace the email), AFTER creating that user in Authentication > Users:
-- insert into profiles(id,email,display_name,role,status) select id,email,'Founder','founder','approved' from auth.users where email='YOUR_EMAIL_HERE'
--   on conflict (id) do update set role='founder', status='approved';
