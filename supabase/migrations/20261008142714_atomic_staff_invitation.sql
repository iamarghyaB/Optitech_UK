create function public.admin_register_staff(p_actor uuid, p_user uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.admin_memberships where user_id=p_actor and active and role='super_admin') then raise exception 'Forbidden'; end if;
  insert into public.admin_memberships(user_id,role) values(p_user,'admin');
  insert into public.admin_audit_log(actor_id,action,entity_id) values(p_actor,'admin.invited',p_user::text);
end $$;
revoke all on function public.admin_register_staff(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_register_staff(uuid, uuid) to service_role;
