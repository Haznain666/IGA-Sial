-- Realtime: the app subscribes to postgres_changes on these three tables so an
-- admin edit shows up for every visitor without a refresh (the behaviour the
-- old Firestore onSnapshot listeners gave us).
--
-- Without this publication the app still works — it just falls back to the
-- fetch-on-load behaviour and stops being live.
--
-- Safe to re-run: adding a table that is already published raises
-- duplicate_object, which we swallow.

do $$
declare
  t text;
begin
  foreach t in array array['products', 'sponsorships', 'app_settings'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end;
$$;
