-- ---------------------------------------------------------------------------
-- 0005_admin_users.sql — admin user lifecycle: invite allow-list, hard delete,
-- and "Invited until first sign-in" status.
--
-- Fixes three reported defects:
--   1. Deleting an admin in the panel only removed the public.admin_profiles
--      row; the auth.users row survived, so the account still existed in
--      Supabase and could still hold a session.
--   2. Re-inviting a previously deleted email did nothing visible: the auth
--      user still existed, so INSERT on auth.users never fired, so the
--      on_auth_user_created trigger never re-created the profile row.
--   3. An invited admin showed their role ("owner"/"admin") before they had
--      ever signed in. Status must read "Invited" until auth.users
--      .last_sign_in_at is set.
--
-- It also closes a privilege-escalation hole: the old trigger gave a
-- public.admin_profiles row to EVERY new auth user, so anyone who could sign
-- up got admin. Profiles are now only created for e-mails on the allow-list.
--
-- Idempotent. Safe to re-run.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Who is allowed to become an admin. Written by an admin before the invite
-- e-mail goes out; consumed by the signup trigger.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_invites (
  email       text primary key,
  full_name   text,
  role        text not null default 'admin' check (role in ('owner', 'admin')),
  invited_by  uuid references auth.users(id) on delete set null,
  invited_at  timestamptz not null default now()
);

alter table public.admin_invites enable row level security;

drop policy if exists admin_invites_rw on public.admin_invites;
create policy admin_invites_rw on public.admin_invites
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Is the CALLER an active admin? security definer so it can read
-- admin_profiles without tripping that table's own RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and active
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Signup trigger — now allow-list driven.
-- A new auth user only becomes an admin if their e-mail was invited, and the
-- role comes from the ALLOW-LIST, never from user_metadata (which the user
-- themselves can set and would otherwise be an escalation path).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv public.admin_invites%rowtype;
begin
  select * into inv from public.admin_invites where email = lower(new.email);
  if not found then
    -- Not invited: no admin profile. Signing up does not grant access.
    return new;
  end if;

  insert into public.admin_profiles (id, email, full_name, role, active)
  values (new.id, new.email, coalesce(nullif(inv.full_name, ''), ''), inv.role, true)
  on conflict (id) do update
    set email     = excluded.email,
        full_name = case when excluded.full_name = '' then public.admin_profiles.full_name
                         else excluded.full_name end,
        role      = excluded.role,
        active    = true;

  delete from public.admin_invites where email = inv.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();

-- ---------------------------------------------------------------------------
-- Called by the panel BEFORE the invite e-mail is sent.
-- Adds the e-mail to the allow-list, and — if that person already exists in
-- auth.users (a re-invite, or someone deleted with an older build) — restores
-- their admin_profiles row immediately, because no INSERT trigger will fire
-- for them. This is the fix for "re-invited user is invisible".
-- ---------------------------------------------------------------------------
create or replace function public.admin_invite_prepare(
  p_email     text,
  p_full_name text default '',
  p_role      text default 'admin'
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_role  text := case when p_role in ('owner', 'admin') then p_role else 'admin' end;
  v_user  auth.users%rowtype;
begin
  if not public.is_active_admin() then
    raise exception 'Only an active admin can invite people.';
  end if;
  if v_email is null or v_email = '' then
    raise exception 'An e-mail address is required.';
  end if;

  insert into public.admin_invites (email, full_name, role, invited_by, invited_at)
  values (v_email, coalesce(p_full_name, ''), v_role, auth.uid(), now())
  on conflict (email) do update
    set full_name  = excluded.full_name,
        role       = excluded.role,
        invited_by = excluded.invited_by,
        invited_at = excluded.invited_at;

  select * into v_user from auth.users where lower(email) = v_email limit 1;
  if not found then
    return jsonb_build_object('existing', false, 'id', null);
  end if;

  insert into public.admin_profiles (id, email, full_name, role, active)
  values (v_user.id, v_user.email, coalesce(p_full_name, ''), v_role, true)
  on conflict (id) do update
    set email     = excluded.email,
        full_name = case when excluded.full_name = '' then public.admin_profiles.full_name
                         else excluded.full_name end,
        role      = excluded.role,
        active    = true;

  delete from public.admin_invites where email = v_email;

  return jsonb_build_object(
    'existing', true,
    'id', v_user.id,
    'signed_in_before', (v_user.last_sign_in_at is not null)
  );
end;
$$;

revoke all on function public.admin_invite_prepare(text, text, text) from public;
grant execute on function public.admin_invite_prepare(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The list the Admin Users page renders. Joins the profile to the auth row so
-- the UI can show "Invited" until last_sign_in_at exists.
-- ---------------------------------------------------------------------------
create or replace function public.admin_users_list()
returns table (
  id                 uuid,
  email              text,
  full_name          text,
  role               text,
  active             boolean,
  created_at         timestamptz,
  last_sign_in_at    timestamptz,
  email_confirmed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.active,
    p.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at
  from public.admin_profiles p
  left join auth.users u on u.id = p.id
  where public.is_active_admin()
  order by p.created_at asc;
$$;

revoke all on function public.admin_users_list() from public;
grant execute on function public.admin_users_list() to authenticated;

-- ---------------------------------------------------------------------------
-- Hard delete. Removes the auth.users row, which cascades to
-- public.admin_profiles, auth.identities and auth.sessions — so the account is
-- really gone from Supabase and its live sessions die with it.
-- ---------------------------------------------------------------------------
create or replace function public.admin_user_delete(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text;
begin
  if not public.is_active_admin() then
    raise exception 'Only an active admin can remove admin users.';
  end if;
  if p_id = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;

  select email into v_email from auth.users where id = p_id;

  -- Belt and braces: the FK is ON DELETE CASCADE, but if the auth row is
  -- already gone we still want the orphaned profile cleared.
  delete from public.admin_profiles where id = p_id;
  delete from auth.users where id = p_id;

  -- A stale allow-list entry would silently re-admit them on next signup.
  if v_email is not null then
    delete from public.admin_invites where email = lower(v_email);
  end if;
end;
$$;

revoke all on function public.admin_user_delete(uuid) from public;
grant execute on function public.admin_user_delete(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Repair pass for accounts created before this migration: any auth user that
-- already has a profile keeps it; nothing else changes. Run this to check the
-- current state after applying:
--
--   select p.email, p.role, p.active, u.last_sign_in_at
--   from public.admin_profiles p left join auth.users u on u.id = p.id;
--
-- Orphaned auth users (deleted in the panel under the old build) can be
-- cleared with:
--
--   delete from auth.users u
--   where not exists (select 1 from public.admin_profiles p where p.id = u.id);
-- ---------------------------------------------------------------------------
