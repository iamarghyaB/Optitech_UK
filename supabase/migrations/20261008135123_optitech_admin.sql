create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.enquiries (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check (length(name) between 2 and 100),
  email text not null check (length(email) between 3 and 254),
  business text not null default '', phone text not null default '',
  requirements text not null check (length(requirements) between 10 and 5000),
  service jsonb not null, package jsonb, consent boolean not null check (consent),
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost','archived')),
  internal_notes text not null default '' check (length(internal_notes) <= 10000),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  payload_hash text not null
);
create index enquiries_created_idx on public.enquiries(created_at desc, id);
create index enquiries_status_created_idx on public.enquiries(status, created_at desc);
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null, entity_id text,
  details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index admin_audit_created_idx on public.admin_audit_log(created_at desc);
create index admin_audit_actor_idx on public.admin_audit_log(actor_id);
-- Service-only credentials; hashed tokens never leave the database.
create table public.integration_credentials (
  name text primary key, token_hash text not null, expires_at timestamptz
);
alter table public.admin_memberships enable row level security;
alter table public.enquiries enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.integration_credentials enable row level security;
revoke all on public.admin_memberships, public.enquiries, public.admin_audit_log, public.integration_credentials from anon, authenticated;
grant select on public.admin_memberships, public.enquiries, public.admin_audit_log to authenticated;
grant all on public.admin_memberships, public.enquiries, public.admin_audit_log, public.integration_credentials to service_role;
grant usage, select on sequence public.admin_audit_log_id_seq to service_role;
create policy own_membership on public.admin_memberships for select to authenticated using (user_id = (select auth.uid()));
create function public.current_admin_role() returns text language sql stable security invoker set search_path = '' as $$
  select role from public.admin_memberships where user_id = (select auth.uid()) and active
$$;
revoke all on function public.current_admin_role() from public, anon;
grant execute on function public.current_admin_role() to authenticated, service_role;
create policy admins_read_enquiries on public.enquiries for select to authenticated using ((select public.current_admin_role()) in ('admin','super_admin'));
create policy super_admins_read_audit on public.admin_audit_log for select to authenticated using ((select public.current_admin_role()) = 'super_admin');
create function public.admin_update_enquiry(p_actor uuid, p_id uuid, p_version integer, p_status text, p_notes text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.enquiries;
begin
  if not exists (select 1 from public.admin_memberships where user_id = p_actor and active) then raise exception 'Forbidden'; end if;
  update public.enquiries set status = p_status, internal_notes = p_notes, updated_at = now(), version = version + 1
    where id = p_id and version = p_version returning * into result;
  if result.id is null then raise exception 'Conflict: reload the enquiry'; end if;
  insert into public.admin_audit_log(actor_id, action, entity_id, details) values (p_actor, 'enquiry.updated', p_id::text, jsonb_build_object('status',p_status,'version',result.version));
  return to_jsonb(result) - 'payload_hash';
end $$;
revoke all on function public.admin_update_enquiry(uuid, uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.admin_update_enquiry(uuid, uuid, integer, text, text) to service_role;
create function public.admin_set_member_active(p_actor uuid, p_member uuid, p_active boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  -- Serialise role changes and check the actor inside the same transaction.
  lock table public.admin_memberships in share row exclusive mode;
  if not exists (select 1 from public.admin_memberships where user_id=p_actor and role='super_admin' and active) then raise exception 'Forbidden'; end if;
  if p_actor=p_member then raise exception 'You cannot disable your own access'; end if;
  if not exists (select 1 from public.admin_memberships where user_id=p_member and role='admin') then raise exception 'Only staff admin accounts can be changed here'; end if;
  update public.admin_memberships set active=p_active where user_id=p_member;
  insert into public.admin_audit_log(actor_id,action,entity_id,details) values(p_actor,'admin.access_changed',p_member::text,jsonb_build_object('active',p_active));
end $$;
revoke all on function public.admin_set_member_active(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_member_active(uuid, uuid, boolean) to service_role;
