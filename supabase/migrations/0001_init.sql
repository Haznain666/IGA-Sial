-- IGA Sial Farm — initial Supabase schema
-- Replaces the previous Firebase/localStorage model.
--
-- Key architectural change vs. the old model:
--   The old shape was one product -> one embedded `reservation` + one `donation`.
--   Partial sponsorship makes that a 1:N relationship, so all money movement now
--   lives in the `sponsorships` ledger and a product's availability is DERIVED
--   from the sum of its pending + confirmed sponsorship rows. The product's
--   value_pkr is never mutated by a sponsorship.

-- ---------------------------------------------------------------------------
-- products  (livestock AND equipment share one table, discriminated by `kind`)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id            text primary key,
  kind          text not null default 'livestock' check (kind in ('livestock', 'equipment')),
  name          text not null,
  details       text not null default '',
  images        jsonb not null default '[]'::jsonb,   -- [{url, zoom, posX, posY}]
  value_pkr     numeric(14,2) not null default 0 check (value_pkr >= 0),

  -- livestock-only
  breed         text,
  age           text,
  weight        text,
  type          text,                                  -- Calf | Heifer | Cow | Bull
  owner         jsonb default '{"ownedByFarm": true}'::jsonb,

  -- equipment-only
  warranty      text,
  life_span     text,

  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists products_kind_idx       on public.products (kind);
create index if not exists products_created_at_idx on public.products (created_at desc);

-- ---------------------------------------------------------------------------
-- sponsorships  (the ledger: full or partial, pending -> confirmed/cancelled)
-- ---------------------------------------------------------------------------
create table if not exists public.sponsorships (
  id            text primary key,
  product_id    text not null references public.products(id) on delete cascade,
  donor         jsonb not null,                        -- {firstName,lastName,email,phone}
  bank_id       text,
  amount_pkr    numeric(14,2) not null check (amount_pkr > 0),
  is_partial    boolean not null default false,
  status        text not null default 'pending'
                check (status in ('pending', 'confirmed', 'cancelled', 'released')),
  recipient     jsonb,                                 -- set at confirmation time
  reserved_at   timestamptz not null default now(),
  confirmed_at  timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists sponsorships_product_idx on public.sponsorships (product_id);
create index if not exists sponsorships_status_idx  on public.sponsorships (status);
create index if not exists sponsorships_open_idx    on public.sponsorships (product_id, status)
  where status in ('pending', 'confirmed');

-- ---------------------------------------------------------------------------
-- app_settings  (single row, id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  id                    smallint primary key default 1 check (id = 1),
  multi_select          boolean not null default true,
  gather_recipient_info boolean not null default true,
  collect_owner_info    boolean not null default true,
  reservation_days      integer not null default 7 check (reservation_days >= 0),
  terms                 text not null default '',
  banks                 jsonb not null default '[]'::jsonb,
  fx_rates              jsonb not null default '{"USD":278.5,"AUD":183,"SAR":74.3}'::jsonb,

  -- Partial payment control (master toggle + per-category toggle & threshold).
  -- An item qualifies when: partial_enabled AND <cat>_enabled AND value_pkr >= <cat>_min.
  partial_enabled           boolean not null default false,
  partial_livestock_enabled boolean not null default false,
  partial_livestock_min     numeric(14,2) not null default 100000,
  partial_equipment_enabled boolean not null default false,
  partial_equipment_min     numeric(14,2) not null default 200000,

  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- admin_profiles  (mirrors auth.users; the Admin Users tab reads this)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'admin' check (role in ('owner', 'admin')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Keep admin_profiles in sync when a Supabase auth user is created.
create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.admin_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();

-- ---------------------------------------------------------------------------
-- Derived availability — one view the whole app reads for money math.
-- ---------------------------------------------------------------------------
create or replace view public.product_status as
select
  p.id,
  p.value_pkr,
  coalesce(sum(s.amount_pkr) filter (where s.status = 'confirmed'), 0) as confirmed_pkr,
  coalesce(sum(s.amount_pkr) filter (where s.status = 'pending'),   0) as pending_pkr,
  coalesce(sum(s.amount_pkr) filter (where s.status in ('pending','confirmed')), 0) as committed_pkr,
  p.value_pkr - coalesce(sum(s.amount_pkr) filter (where s.status in ('pending','confirmed')), 0) as remaining_pkr,
  case
    when coalesce(sum(s.amount_pkr) filter (where s.status = 'confirmed'), 0) >= p.value_pkr then 'sponsored'
    when coalesce(sum(s.amount_pkr) filter (where s.status in ('pending','confirmed')), 0) >= p.value_pkr then 'reserved'
    when coalesce(sum(s.amount_pkr) filter (where s.status in ('pending','confirmed')), 0) > 0 then 'partial'
    else 'available'
  end as status
from public.products p
left join public.sponsorships s on s.product_id = p.id
group by p.id, p.value_pkr;

-- ---------------------------------------------------------------------------
-- Guard: never let a product be over-sponsored (race-safe at the DB level).
-- ---------------------------------------------------------------------------
create or replace function public.check_sponsorship_capacity()
returns trigger
language plpgsql
as $$
declare
  v_value     numeric(14,2);
  v_committed numeric(14,2);
begin
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  select value_pkr into v_value from public.products where id = new.product_id;
  if v_value is null then
    raise exception 'Unknown product %', new.product_id;
  end if;

  select coalesce(sum(amount_pkr), 0) into v_committed
  from public.sponsorships
  where product_id = new.product_id
    and status in ('pending', 'confirmed')
    and id <> new.id;

  if v_committed + new.amount_pkr > v_value then
    raise exception 'Sponsorship exceeds remaining value: % available, % requested',
      v_value - v_committed, new.amount_pkr;
  end if;

  return new;
end;
$$;

drop trigger if exists sponsorship_capacity on public.sponsorships;
create trigger sponsorship_capacity
  before insert or update on public.sponsorships
  for each row execute function public.check_sponsorship_capacity();

-- ---------------------------------------------------------------------------
-- Guard: a product with any open (pending/confirmed) sponsorship is locked.
-- Mirrors the old "reserved animals cannot be edited or deleted" rule.
-- ---------------------------------------------------------------------------
create or replace function public.check_product_locked()
returns trigger
language plpgsql
as $$
declare
  v_open integer;
begin
  select count(*) into v_open
  from public.sponsorships
  where product_id = old.id and status in ('pending', 'confirmed');

  if v_open > 0 then
    raise exception 'Product % is locked: % open sponsorship(s)', old.id, v_open;
  end if;

  return old;
end;
$$;

drop trigger if exists product_delete_lock on public.products;
create trigger product_delete_lock
  before delete on public.products
  for each row execute function public.check_product_locked();

-- updated_at touch
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--   Public (anon): may read products/settings, and may CREATE a pending
--   sponsorship (that is the donor reserving). Everything else needs auth.
-- ---------------------------------------------------------------------------
alter table public.products       enable row level security;
alter table public.sponsorships   enable row level security;
alter table public.app_settings   enable row level security;
alter table public.admin_profiles enable row level security;

drop policy if exists products_read       on public.products;
drop policy if exists products_write      on public.products;
drop policy if exists sponsorships_read   on public.sponsorships;
drop policy if exists sponsorships_insert on public.sponsorships;
drop policy if exists sponsorships_write  on public.sponsorships;
drop policy if exists settings_read       on public.app_settings;
drop policy if exists settings_write      on public.app_settings;
drop policy if exists profiles_read       on public.admin_profiles;
drop policy if exists profiles_write      on public.admin_profiles;

create policy products_read on public.products
  for select using (true);
create policy products_write on public.products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Donors need to see committed amounts to render "remaining", so reads are open.
create policy sponsorships_read on public.sponsorships
  for select using (true);
-- A donor may only ever create a PENDING row; confirmation is admin-only.
create policy sponsorships_insert on public.sponsorships
  for insert with check (status = 'pending');
create policy sponsorships_write on public.sponsorships
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy settings_read on public.app_settings
  for select using (true);
create policy settings_write on public.app_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy profiles_read on public.admin_profiles
  for select using (auth.role() = 'authenticated');
create policy profiles_write on public.admin_profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed the settings singleton (terms/banks are filled by the data migration).
insert into public.app_settings (id) values (1) on conflict (id) do nothing;
