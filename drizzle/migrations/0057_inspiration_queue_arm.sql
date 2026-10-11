-- lovable-cron-fallback-reviewed: queue processor armed on enqueue and unscheduled when the queue drains
create or replace function public.inspiration_queue_arm() returns void language plpgsql security definer set search_path = public, cron as $$
begin
  if not exists (select 1 from cron.job where jobname = 'ugc-inspiration') then
    perform cron.schedule('ugc-inspiration', '* * * * *', $c$select net.http_post(url := 'https://project--d2a94640-0eb5-45b3-b9c3-fa235b3dabd0.lovable.app/api/public/cron/ugc/inspiration', headers := jsonb_build_object('x-cron-secret', (select cron_token from public.ugc_settings where id = 1), 'content-type','application/json'), timeout_milliseconds := 300000)$c$);
  end if;
end $$;
create or replace function public.inspiration_queue_disarm() returns void language plpgsql security definer set search_path = public, cron as $$
begin
  if exists (select 1 from cron.job where jobname = 'ugc-inspiration') then perform cron.unschedule('ugc-inspiration'); end if;
end $$;
revoke all on function public.inspiration_queue_arm() from public, anon, authenticated;
revoke all on function public.inspiration_queue_disarm() from public, anon, authenticated;
grant execute on function public.inspiration_queue_arm() to service_role;
grant execute on function public.inspiration_queue_disarm() to service_role;