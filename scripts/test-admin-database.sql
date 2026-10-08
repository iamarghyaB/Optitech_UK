-- Run as project operator. All fixtures and changes are rolled back.
begin;
do $$
declare owner_id uuid; test_id uuid:=gen_random_uuid(); result jsonb;
begin
  select user_id into owner_id from public.admin_memberships where role='super_admin' and active limit 1;
  if owner_id is null then raise exception 'Missing super admin'; end if;
  begin
    perform public.admin_register_staff(gen_random_uuid(),owner_id);
    raise exception 'Unauthorized staff grant accepted';
  exception when others then if sqlerrm <> 'Forbidden' then raise; end if; end;
  begin
    perform public.admin_register_staff(owner_id,owner_id);
    raise exception 'Existing owner role replaced';
  exception when unique_violation then null; end;
  insert into public.enquiries(id,name,email,requirements,service,consent,payload_hash)
  values(test_id,'Verification fixture','verification@example.invalid','Temporary verification request', '{"slug":"web-development","title":"Web Development"}',true,'fixture');
  result:=public.admin_update_enquiry(owner_id,test_id,1,'quoted','Temporary internal note');
  if result->>'status'<>'quoted' or (result->>'version')::int<>2 or result->>'internal_notes'<>'Temporary internal note' then raise exception 'Update failed'; end if;
  if not exists(select 1 from public.admin_audit_log where entity_id=test_id::text and actor_id=owner_id and action='enquiry.updated') then raise exception 'Audit missing'; end if;
  begin
    perform public.admin_update_enquiry(owner_id,test_id,1,'won','Stale update');
    raise exception 'Stale update unexpectedly accepted';
  exception when others then if sqlerrm not like 'Conflict:%' then raise; end if; end;
  begin
    perform public.admin_update_enquiry(gen_random_uuid(),test_id,2,'won','Unauthorized update');
    raise exception 'Unauthorized update unexpectedly accepted';
  exception when others then if sqlerrm <> 'Forbidden' then raise; end if; end;
  begin
    perform public.admin_set_member_active(owner_id,owner_id,false);
    raise exception 'Owner disabled';
  exception when others then if sqlerrm <> 'You cannot disable your own access' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub',(select user_id::text from public.admin_memberships where role='super_admin' limit 1),true);
set local role authenticated;
do $$ begin
  if public.current_admin_role()<>'super_admin' then raise exception 'Owner role lookup failed'; end if;
  if (select count(*) from public.enquiries where name='Verification fixture')<>1 then raise exception 'Admin RLS read failed'; end if;
  begin
    insert into public.admin_memberships(user_id,role) values(gen_random_uuid(),'super_admin');
    raise exception 'Client privilege escalation accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.integration_credentials;
    raise exception 'Credentials readable';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
do $$ begin
  if public.current_admin_role() is not null or exists(select 1 from public.enquiries) or exists(select 1 from public.admin_audit_log) or exists(select 1 from public.admin_memberships) then raise exception 'Unprivileged RLS leaked data'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform * from public.enquiries;
    raise exception 'Anonymous data access accepted';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
