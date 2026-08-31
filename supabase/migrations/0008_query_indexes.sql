-- Avoid timeouts when the app re-reads products/sponsorships on mount and on realtime updates.
create index if not exists products_created_at_idx
  on public.products (created_at desc);

create index if not exists sponsorships_reserved_at_idx
  on public.sponsorships (reserved_at desc);

create index if not exists sponsorships_product_status_idx
  on public.sponsorships (product_id, status);
