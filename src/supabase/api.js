import { supabase } from './client.js'
import { normalizeImages } from '../lib/images.js'
import { DEFAULT_FX } from '../lib/currency.js'

// The database speaks snake_case; the components speak camelCase. Every row
// crosses that boundary here so no component ever has to know the difference.

// ---- row <-> app shape ------------------------------------------------------
export function toProduct(row) {
  return {
    id: row.id,
    kind: row.kind || 'livestock',
    name: row.name || '',
    details: row.details || '',
    images: normalizeImages(Array.isArray(row.images) ? row.images : []),
    valuePKR: Number(row.value_pkr) || 0,
    // livestock
    breed: row.breed || '',
    age: row.age || '',
    weight: row.weight || '',
    type: row.type || '',
    owner: row.owner || { ownedByFarm: true },
    // equipment
    warranty: row.warranty || '',
    lifeSpan: row.life_span || '',
    archived: !!row.archived,
    createdAt: row.created_at || null,
  }
}

function fromProduct(p) {
  const row = {}
  if (p.id !== undefined) row.id = p.id
  if (p.kind !== undefined) row.kind = p.kind
  if (p.name !== undefined) row.name = p.name
  if (p.details !== undefined) row.details = p.details
  if (p.images !== undefined) row.images = normalizeImages(p.images)
  if (p.valuePKR !== undefined) row.value_pkr = Number(p.valuePKR) || 0
  if (p.breed !== undefined) row.breed = p.breed || null
  if (p.age !== undefined) row.age = p.age || null
  if (p.weight !== undefined) row.weight = p.weight || null
  if (p.type !== undefined) row.type = p.type || null
  if (p.owner !== undefined) row.owner = p.owner
  if (p.warranty !== undefined) row.warranty = p.warranty || null
  if (p.lifeSpan !== undefined) row.life_span = p.lifeSpan || null
  return row
}

export function toSponsorship(row) {
  return {
    id: row.id,
    productId: row.product_id,
    donor: row.donor || null,
    bankId: row.bank_id || null,
    amountPKR: Number(row.amount_pkr) || 0,
    isPartial: !!row.is_partial,
    status: row.status,
    recipient: row.recipient || null,
    reservedAt: row.reserved_at || null,
    confirmedAt: row.confirmed_at || null,
    cancelledAt: row.cancelled_at || null,
    createdAt: row.created_at || null,
  }
}

export function toSettings(row) {
  return {
    multiSelect: !!row.multi_select,
    gatherRecipientInfo: !!row.gather_recipient_info,
    collectOwnerInfo: !!row.collect_owner_info,
    reservationDays: Number(row.reservation_days) || 0,
    terms: row.terms || '',
    banks: Array.isArray(row.banks) ? row.banks : [],
    fxRates: row.fx_rates && typeof row.fx_rates === 'object' ? row.fx_rates : { ...DEFAULT_FX },
    partialEnabled: !!row.partial_enabled,
    partialLivestockEnabled: !!row.partial_livestock_enabled,
    partialLivestockMin: Number(row.partial_livestock_min) || 0,
    partialEquipmentEnabled: !!row.partial_equipment_enabled,
    partialEquipmentMin: Number(row.partial_equipment_min) || 0,
  }
}

const SETTINGS_COLUMNS = {
  multiSelect: 'multi_select',
  gatherRecipientInfo: 'gather_recipient_info',
  collectOwnerInfo: 'collect_owner_info',
  reservationDays: 'reservation_days',
  terms: 'terms',
  banks: 'banks',
  fxRates: 'fx_rates',
  partialEnabled: 'partial_enabled',
  partialLivestockEnabled: 'partial_livestock_enabled',
  partialLivestockMin: 'partial_livestock_min',
  partialEquipmentEnabled: 'partial_equipment_enabled',
  partialEquipmentMin: 'partial_equipment_min',
}

function fromSettings(patch) {
  const row = {}
  Object.entries(patch).forEach(([key, value]) => {
    const column = SETTINGS_COLUMNS[key]
    if (column) row[column] = value
  })
  return row
}

// Postgres errors from our guard triggers are technical — turn them into
// something an admin can act on.
export function friendlyError(error) {
  const msg = String(error?.message || error || 'Something went wrong.')
  if (msg.includes('Sponsorship exceeds remaining value')) {
    return 'That amount is more than what is still open on this item. Refresh and try again.'
  }
  if (msg.includes('is locked')) {
    return 'This item has open sponsorships, so it can’t be deleted until they are confirmed, cancelled, or released.'
  }
  if (msg.includes('row-level security') || msg.includes('JWT')) {
    return 'You need to be signed in as an admin to do that.'
  }
  return msg
}

function unwrap({ data, error }) {
  if (error) throw new Error(friendlyError(error))
  return data
}

// ---- reads ------------------------------------------------------------------
export async function fetchProducts() {
  const data = unwrap(
    await supabase.from('products').select('*').order('created_at', { ascending: false }),
  )
  return (data || []).map(toProduct)
}

export async function fetchSponsorships() {
  const data = unwrap(
    await supabase.from('sponsorships').select('*').order('reserved_at', { ascending: false }),
  )
  return (data || []).map(toSponsorship)
}

export async function fetchSettings() {
  const data = unwrap(await supabase.from('app_settings').select('*').eq('id', 1).single())
  return toSettings(data || {})
}

// ---- realtime ---------------------------------------------------------------
// One channel per table. Any insert/update/delete simply re-reads the table —
// the data set is small and it keeps every client perfectly in sync, which is
// what the old Firestore onSnapshot behaviour gave us.
function subscribeTable(table, onChange) {
  const channel = supabase
    .channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export const subscribeProducts = (cb) => subscribeTable('products', cb)
export const subscribeSponsorships = (cb) => subscribeTable('sponsorships', cb)
export const subscribeSettings = (cb) => subscribeTable('app_settings', cb)

// ---- products ---------------------------------------------------------------
export async function createProduct(product) {
  const data = unwrap(await supabase.from('products').insert(fromProduct(product)).select().single())
  return toProduct(data)
}

export async function updateProduct(id, patch) {
  const data = unwrap(
    await supabase.from('products').update(fromProduct(patch)).eq('id', id).select().single(),
  )
  return toProduct(data)
}

export async function deleteProduct(id) {
  unwrap(await supabase.from('products').delete().eq('id', id))
}

// ---- sponsorships -----------------------------------------------------------
// Donor reserving: one PENDING row per item. RLS allows anon inserts of
// pending rows only; the capacity trigger rejects anything over-committed.
export async function createSponsorships(rows) {
  const payload = rows.map((r) => ({
    id: r.id,
    product_id: r.productId,
    donor: r.donor,
    bank_id: r.bankId || null,
    amount_pkr: r.amountPKR,
    is_partial: !!r.isPartial,
    status: 'pending',
    reserved_at: new Date().toISOString(),
  }))
  const data = unwrap(await supabase.from('sponsorships').insert(payload).select())
  return (data || []).map(toSponsorship)
}

export async function confirmSponsorship(id, recipient) {
  const data = unwrap(
    await supabase
      .from('sponsorships')
      .update({ status: 'confirmed', recipient: recipient || null, confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single(),
  )
  return toSponsorship(data)
}

export async function setSponsorshipStatus(id, status) {
  const patch = { status }
  if (status === 'cancelled' || status === 'released') patch.cancelled_at = new Date().toISOString()
  const data = unwrap(
    await supabase.from('sponsorships').update(patch).eq('id', id).select().single(),
  )
  return toSponsorship(data)
}

// ---- settings ---------------------------------------------------------------
export async function saveSettings(patch) {
  const row = fromSettings(patch)
  if (Object.keys(row).length === 0) return null
  const data = unwrap(
    await supabase.from('app_settings').update(row).eq('id', 1).select().single(),
  )
  return toSettings(data)
}

// ---- auth -------------------------------------------------------------------
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data?.session || null
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session))
  return () => data?.subscription?.unsubscribe()
}

export async function signIn(email, password) {
  return unwrap(await supabase.auth.signInWithPassword({ email, password }))
}

export async function signOut() {
  await supabase.auth.signOut()
}

// HashRouter eats the URL fragment, so detectSessionInUrl is off and the
// invite / recovery `code` is exchanged by hand from /#/auth/callback.
export async function exchangeCode(code) {
  return unwrap(await supabase.auth.exchangeCodeForSession(code))
}

// PKCE keeps its verifier in the browser that STARTED the flow, so an invite
// opened on another device can't use `code`. Email templates that emit
// {{ .TokenHash }} work anywhere, so the callback tries this first.
export async function verifyTokenHash(tokenHash, type = 'invite') {
  return unwrap(await supabase.auth.verifyOtp({ token_hash: tokenHash, type }))
}

export async function requestPasswordReset(email) {
  const redirectTo = `${window.location.origin}${window.location.pathname}#/auth/callback`
  return unwrap(await supabase.auth.resetPasswordForEmail(email, { redirectTo }))
}

// The reset email is configured to send a 6-digit code rather than a link.
export async function verifyRecoveryCode(email, token) {
  return unwrap(await supabase.auth.verifyOtp({ email, token, type: 'recovery' }))
}

export async function updatePassword(password) {
  return unwrap(await supabase.auth.updateUser({ password }))
}

// ---- admin users ------------------------------------------------------------
export async function fetchAdmins() {
  const data = unwrap(
    await supabase.from('admin_profiles').select('*').order('created_at', { ascending: true }),
  )
  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    role: row.role || 'admin',
    active: !!row.active,
    createdAt: row.created_at || null,
  }))
}

// Invite by email. The magic link lands on /#/auth/callback, where the code is
// exchanged and the new admin is sent to "Set your password".
export async function inviteAdmin(email, fullName, role = 'admin') {
  const redirectTo = `${window.location.origin}${window.location.pathname}#/auth/callback`
  return unwrap(
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, data: { full_name: fullName || '', role } },
    }),
  )
}

export async function updateAdmin(id, patch) {
  const row = {}
  if (patch.fullName !== undefined) row.full_name = patch.fullName
  if (patch.role !== undefined) row.role = patch.role
  if (patch.active !== undefined) row.active = patch.active
  if (patch.email !== undefined) row.email = patch.email
  const data = unwrap(
    await supabase.from('admin_profiles').update(row).eq('id', id).select().single(),
  )
  return { id: data.id, email: data.email, fullName: data.full_name || '', role: data.role, active: !!data.active }
}

export async function deleteAdmin(id) {
  unwrap(await supabase.from('admin_profiles').delete().eq('id', id))
}
