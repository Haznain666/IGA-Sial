-- ---------------------------------------------------------------------------
-- 0006_admin_rls.sql — make "admin" mean an ACTIVE admin_profiles row.
--
-- Apply AFTER 0005 (it depends on public.is_active_admin()).
--
-- Before this, every write policy read `auth.role() = 'authenticated'`, which
-- means *any* signed-in Supabase user could write products, sponsorships and
-- settings — including someone who had just been deactivated or deleted in the
-- panel but still held a live session. Deactivating an admin was cosmetic.
--
-- Reads stay exactly as they were: the public site must be able to read
-- products, sponsorships and settings anonymously, and a donor must still be
-- able to insert a PENDING sponsorship.
-- ---------------------------------------------------------------------------

drop policy if exists products_write      on public.products;
drop policy if exists sponsorships_write  on public.sponsorships;
drop policy if exists settings_write      on public.app_settings;
drop policy if exists profiles_read       on public.admin_profiles;
drop policy if exists profiles_write      on public.admin_profiles;
drop policy if exists admin_invites_rw    on public.admin_invites;

create policy products_write on public.products
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy sponsorships_write on public.sponsorships
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy settings_write on public.app_settings
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

-- An admin may read the roster; anyone signed in may read their OWN row, which
-- is what the panel needs to decide whether to let them in at all.
create policy profiles_read on public.admin_profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_active_admin());

create policy profiles_write on public.admin_profiles
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy admin_invites_rw on public.admin_invites
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

-- Sanity check after applying — this must return true for your own account:
--   select public.is_active_admin();
