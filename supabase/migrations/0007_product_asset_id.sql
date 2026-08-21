alter table public.products
  add column if not exists asset_id text;

create index if not exists products_asset_id_idx
  on public.products (asset_id);
