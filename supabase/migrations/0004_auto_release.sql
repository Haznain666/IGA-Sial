-- Server-side auto-release of expired reservations.
--
-- Why this exists: the client previously swept expired holds in the browser.
-- That only worked while a signed-in admin had a tab open — RLS blocks anonymous
-- writes, so visitor browsers silently no-op'd, and an unattended site would
-- keep items reserved forever. Release is a business rule, so it belongs in the
-- database, running whether or not anyone is looking.
--
-- Honours app_settings.reservation_days, with 0 meaning "never auto-release".

create or replace function public.release_expired_sponsorships()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_days     integer;
  v_released integer;
begin
  select reservation_days into v_days from public.app_settings where id = 1;

  if v_days is null or v_days <= 0 then
    return 0;
  end if;

  update public.sponsorships
     set status       = 'released',
         cancelled_at = now()
   where status = 'pending'
     and reserved_at < now() - (v_days || ' days')::interval;

  get diagnostics v_released = row_count;
  return v_released;
end;
$$;

comment on function public.release_expired_sponsorships is
  'Releases pending sponsorships older than app_settings.reservation_days. Scheduled hourly via pg_cron.';

-- Schedule it. pg_cron ships with Supabase but is not enabled by default.
create extension if not exists pg_cron with schema extensions;

do $$
begin
  -- Re-running this migration should not stack duplicate jobs.
  perform cron.unschedule('release-expired-sponsorships')
  where exists (select 1 from cron.job where jobname = 'release-expired-sponsorships');

  perform cron.schedule(
    'release-expired-sponsorships',
    '0 * * * *',                       -- hourly, on the hour
    $cron$select public.release_expired_sponsorships();$cron$
  );
exception
  when others then
    -- If pg_cron is unavailable the function still exists and can be called
    -- manually or from an edge function; don't fail the whole migration.
    raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end;
$$;
