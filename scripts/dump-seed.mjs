// Dumps the live Supabase content back into supabase/migrations/0002_seed.sql so
// the committed migration always matches reality. Run: node scripts/dump-seed.mjs
import { writeFileSync } from 'node:fs'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://befqbzgoygekawcguzrz.supabase.co'
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_HvqFNZGsHk84BIvwwk2TUQ_orHGIlD7'
const h = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const j = (v) => `${q(JSON.stringify(v))}::jsonb`

const get = async (path) => {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: h })
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`)
  return r.json()
}

const products = await get('products?select=*&order=kind,created_at')
const settings = (await get('app_settings?select=*'))[0]

const cols = [
  'id', 'kind', 'name', 'details', 'images', 'value_pkr',
  'breed', 'age', 'weight', 'type', 'owner', 'warranty', 'life_span', 'created_at',
]
const val = (p, c) => (c === 'images' || c === 'owner' ? (p[c] === null ? 'null' : j(p[c])) : c === 'value_pkr' ? p[c] : q(p[c]))

const lines = products.map(
  (p) => `insert into public.products (${cols.join(', ')}) values (${cols.map((c) => val(p, c)).join(', ')}) on conflict (id) do nothing;`,
)

lines.push(
  `update public.app_settings set ` +
    [
      `multi_select = ${settings.multi_select}`,
      `gather_recipient_info = ${settings.gather_recipient_info}`,
      `collect_owner_info = ${settings.collect_owner_info}`,
      `reservation_days = ${settings.reservation_days}`,
      `terms = ${q(settings.terms)}`,
      `banks = ${j(settings.banks)}`,
      `fx_rates = ${j(settings.fx_rates)}`,
      `partial_enabled = ${settings.partial_enabled}`,
      `partial_livestock_enabled = ${settings.partial_livestock_enabled}`,
      `partial_livestock_min = ${settings.partial_livestock_min}`,
      `partial_equipment_enabled = ${settings.partial_equipment_enabled}`,
      `partial_equipment_min = ${settings.partial_equipment_min}`,
    ].join(', ') +
    ` where id = 1;`,
)

const sql = `-- Seed data, dumped from the live project by scripts/dump-seed.mjs.\n-- Re-run that script after changing content in Super Admin to keep this in sync.\n\n${lines.join('\n\n')}\n`
writeFileSync('supabase/migrations/0002_seed.sql', sql)
console.log(`Wrote 0002_seed.sql — ${products.length} products, ${sql.length} bytes`)
