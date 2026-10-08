-- Built-in event trigger utility is not an application RPC.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
create policy service_credentials_only on public.integration_credentials for all to service_role using (true) with check (true);
