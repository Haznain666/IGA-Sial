import { supabase } from './client.js'
import { inviteClient } from './inviteClient.js'
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
    assetId: row.asset_id || '',
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
  if (p.assetId !== undefined) row.asset_id = p.assetId || null
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
    confirmationEmailSubject: row.confirmation_email_subject || '',
    confirmationEmailBody: row.confirmation_email_body || '',
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
  confirmationEmailSubject: 'confirmation_email_subject',
  confirmationEmailBody: 'confirmation_email_body',
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

// True when the database simply doesn't have a function yet — i.e. migration
// 0005 hasn't been applied. The panel degrades to its old behaviour instead of
// breaking, so deploying the build before running the SQL is safe.
function missingFunction(error) {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '')
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /Could not find the function/i.test(msg) ||
    /function .* does not exist/i.test(msg)
  )
}

// ---- reads ------------------------------------------------------------------
const PRODUCT_SELECT = 'id,kind,name,details,asset_id,value_pkr,breed,age,weight,type,owner,warranty,life_span,archived,created_at'

function sanitizeImages(input) {
  const list = Array.isArray(input) ? input : []
  return list.filter((img) => {
    if (typeof img === 'string') return !img.startsWith('data:image/')
    if (img && typeof img.url === 'string') return !img.url.startsWith('data:image/')
    return true
  })
}

export async function fetchProducts() {
  const data = unwrap(await supabase.from('products').select(PRODUCT_SELECT))
  return (data || [])
    .filter((row) => !row.archived)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .map((row) => ({ ...toProduct(row), images: sanitizeImages(row.images || []) }))
}

export async function fetchSponsorships() {
  const data = unwrap(await supabase.from('sponsorships').select('*'))
  return (data || [])
    .sort((a, b) => new Date(b.reserved_at || 0) - new Date(a.reserved_at || 0))
    .map(toSponsorship)
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
  const data = unwrap(
    await supabase.from('products').update({ archived: true }).eq('id', id).select().single(),
  )
  return toProduct(data)
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

// Update sponsorship fields (donor, recipient, bank_id, etc.)
export async function updateSponsorship(id, patch) {
  const row = {}
  if (patch.donor !== undefined) row.donor = patch.donor
  if (patch.recipient !== undefined) row.recipient = patch.recipient
  if (patch.bankId !== undefined) row.bank_id = patch.bankId
  if (patch.amountPKR !== undefined) row.amount_pkr = patch.amountPKR
  // allow updating other small fields if needed
  const data = unwrap(
    await supabase.from('sponsorships').update(row).eq('id', id).select().single(),
  )
  return toSponsorship(data)
}

// Simple outbox queue for outbound emails. The backend (cron or worker)
// should read from `inbox_entries` and deliver messages. This avoids
// embedding SMTP secrets in the client and lets the server send mail from
// the configured address (e.g. IGASialFarm@gmail.com).
export async function createInboxEntry(entry) {
  // entry: { to, subject, body, sponsorshipId }
  const row = {
    to_address: entry.to,
    subject: entry.subject,
    body: entry.body,
    from_address: entry.from || 'IGASialFarm@gmail.com',
    sponsorship_id: entry.sponsorshipId || null,
    created_at: new Date().toISOString(),
  }
  const data = unwrap(await supabase.from('inbox_entries').insert(row).select().single())
  return data
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
function toAdmin(row) {
  const lastSignInAt = row.last_sign_in_at || null
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    role: row.role || 'admin',
    active: !!row.active,
    createdAt: row.created_at || null,
    lastSignInAt,
    emailConfirmedAt: row.email_confirmed_at || null,
    // An invited admin is NOT yet an owner/admin in any meaningful sense —
    // they hold no session and may never have opened the e-mail. The panel
    // shows "Invited" until this flips. `null` = the database can't tell us
    // (migration 0005 not applied), so the UI stays silent rather than lying.
    pending: 'last_sign_in_at' in row ? !lastSignInAt : null,
  }
}

export async function fetchAdmins() {
  const { data, error } = await supabase.rpc('admin_users_list')
  if (!error) return (data || []).map(toAdmin)
  if (!missingFunction(error)) throw new Error(friendlyError(error))

  // Pre-0005 database: no sign-in information available.
  const rows = unwrap(
    await supabase.from('admin_profiles').select('*').order('created_at', { ascending: true }),
  )
  return (rows || []).map(toAdmin)
}

// Invite by e-mail.
//
// Two steps, and the order matters:
//  1. `admin_invite_prepare` puts the address on the allow-list the signup
//     trigger reads, and — if that person already exists in auth.users (a
//     re-invite) — restores their admin_profiles row there and then. Without
//     this, re-inviting a deleted address inserted nothing anywhere and the
//     person never appeared in the list.
//  2. The mail itself goes out through `inviteClient`, which uses the IMPLICIT
//     flow. See src/supabase/inviteClient.js: a PKCE link can only be opened in
//     the browser that sent it, which is never the invitee's phone.
export async function inviteAdmin(email, fullName, role = 'admin') {
  const address = String(email || '').trim()
  const name = String(fullName || '').trim()
  // Deliberately the same redirect target as before: it is already on the
  // project's redirect allow-list. Under the implicit flow Supabase overwrites
  // the fragment with the session anyway, so the link comes back as
  // `…/#access_token=…`; authRedirect.js handles both shapes.
  const redirectTo = `${window.location.origin}${window.location.pathname}#/auth/callback`

  let prepared = { existing: false }
  const { data, error } = await supabase.rpc('admin_invite_prepare', {
    p_email: address,
    p_full_name: name,
    p_role: role,
  })
  if (error && !missingFunction(error)) throw new Error(friendlyError(error))
  if (!error && data) prepared = data

  unwrap(
    await inviteClient.auth.signInWithOtp({
      email: address,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
        data: { full_name: name, role },
      },
    }),
  )
  return prepared
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

// Remove an admin for real: `admin_user_delete` deletes the auth.users row,
// which cascades to admin_profiles, their identities and their live sessions.
// Deleting only the profile row (what this used to do) left the account alive
// in Supabase and blocked any future re-invite.
//
// Returns { hardDeleted } so the UI can be honest when it is talking to a
// database where migration 0005 hasn't been applied yet.
export async function deleteAdmin(id) {
  const { error } = await supabase.rpc('admin_user_delete', { p_id: id })
  if (!error) return { hardDeleted: true }
  if (!missingFunction(error)) throw new Error(friendlyError(error))

  unwrap(await supabase.from('admin_profiles').delete().eq('id', id))
  return { hardDeleted: false }
}

// Is the signed-in user an ACTIVE admin? `null` means the database predates
// migration 0005 and can't answer — callers treat that as "don't block".
export async function checkActiveAdmin() {
  const { data, error } = await supabase.rpc('is_active_admin')
  if (error) {
    if (missingFunction(error)) return null
    return null
  }
  return !!data
}
