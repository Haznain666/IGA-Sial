import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { uid } from '../lib/helpers.js'
import { ToastProvider } from './ToastContext.jsx'
import * as api from '../supabase/api.js'
import { onAuthChange, getSession } from '../supabase/api.js'
import { formatMoney } from '../lib/currency.js'

const CART_KEY = 'iga-cart'
const MAX_BANKS = 5

// Placeholder until the real settings row arrives, so first paint never
// dereferences undefined.
const EMPTY_SETTINGS = {
  multiSelect: true,
  gatherRecipientInfo: true,
  collectOwnerInfo: true,
  reservationDays: 7,
  terms: '',
  banks: [],
  fxRates: { USD: 278.5, AUD: 183, SAR: 74.3 },
  partialEnabled: false,
  partialLivestockEnabled: false,
  partialLivestockMin: 0,
  partialEquipmentEnabled: false,
  partialEquipmentMin: 0,
}

const AppContext = createContext(null)
let appBootstrapped = false

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.products, productsLoading: false }
    case 'SET_SPONSORSHIPS':
      return { ...state, sponsorships: action.sponsorships, sponsorshipsLoading: false }
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings, settingsLoading: false }
    case 'SET_SESSION':
      // A new session invalidates what we knew about admin rights.
      return { ...state, session: action.session, authLoading: false, isAdmin: null }
    case 'SET_IS_ADMIN':
      return { ...state, isAdmin: action.isAdmin }

    // ---- cart (always per-browser) ----
    case 'CART_TOGGLE': {
      const inCart = state.cart.includes(action.id)
      return {
        ...state,
        cart: inCart ? state.cart.filter((id) => id !== action.id) : [...state.cart, action.id],
      }
    }
    case 'CART_SET':
      return { ...state, cart: [...new Set(action.ids)] }
    case 'CART_REMOVE':
      return { ...state, cart: state.cart.filter((id) => id !== action.id) }
    case 'CART_CLEAR':
      return { ...state, cart: [] }

    default:
      return state
  }
}

// Availability is DERIVED from the sponsorship ledger — it mirrors the
// `product_status` view exactly, but computed client-side so realtime updates
// stay instant (Postgres views don't emit change events).
function money(product, rows) {
  const value = Number(product?.valuePKR) || 0
  let confirmed = 0
  let pending = 0
  rows.forEach((s) => {
    if (s.status === 'confirmed') confirmed += Number(s.amountPKR) || 0
    else if (s.status === 'pending') pending += Number(s.amountPKR) || 0
  })
  const committed = confirmed + pending
  const status =
    confirmed >= value && value > 0
      ? 'sponsored'
      : committed >= value && value > 0
        ? 'reserved'
        : committed > 0
          ? 'partial'
          : 'available'
  return { value, confirmed, pending, committed, remaining: Math.max(0, value - committed), status }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    products: [],
    sponsorships: [],
    settings: EMPTY_SETTINGS,
    cart: loadCart(),
    loading: true,
    productsLoading: true,
    sponsorshipsLoading: true,
    settingsLoading: true,
    session: null,
    authLoading: true,
    // true / false once checked; null = unknown (no session, or a database
    // that predates migration 0005 and can't answer).
    isAdmin: null,
  }))
  const stateRef = useRef(state)
  stateRef.current = state
  const loadSeq = useRef(0)
  const inflight = useRef({ products: false, sponsorships: false, settings: false })

  const reloadProducts = useCallback(async () => {
    if (inflight.current.products) return
    inflight.current.products = true
    const seq = ++loadSeq.current
    try {
      const products = await api.fetchProducts()
      if (seq !== loadSeq.current) return
      dispatch({ type: 'SET_PRODUCTS', products })
    } catch (e) {
      console.error('Could not load products:', e)
      if (seq === loadSeq.current) {
        dispatch({ type: 'SET_PRODUCTS', products: stateRef.current.products })
      }
    } finally {
      inflight.current.products = false
    }
  }, [])

  const reloadSponsorships = useCallback(async () => {
    if (inflight.current.sponsorships) return
    inflight.current.sponsorships = true
    const seq = ++loadSeq.current
    try {
      const sponsorships = await api.fetchSponsorships()
      if (seq !== loadSeq.current) return
      dispatch({ type: 'SET_SPONSORSHIPS', sponsorships })
    } catch (e) {
      console.error('Could not load sponsorships:', e)
      if (seq === loadSeq.current) {
        dispatch({ type: 'SET_SPONSORSHIPS', sponsorships: stateRef.current.sponsorships })
      }
    } finally {
      inflight.current.sponsorships = false
    }
  }, [])

  const reloadSettings = useCallback(async () => {
    if (inflight.current.settings) return
    inflight.current.settings = true
    const seq = ++loadSeq.current
    try {
      const settings = await api.fetchSettings()
      if (seq !== loadSeq.current) return
      dispatch({ type: 'SET_SETTINGS', settings })
    } catch (e) {
      console.error('Could not load settings:', e)
      if (seq === loadSeq.current) {
        dispatch({ type: 'SET_SETTINGS', settings: stateRef.current.settings })
      }
    } finally {
      inflight.current.settings = false
    }
  }, [])

  // Initial load + realtime subscriptions. React StrictMode intentionally
  // re-mounts components in development, so guard the boot sequence at module
  // scope to avoid duplicate fetches and timeout spikes.
  useEffect(() => {
    if (appBootstrapped) return undefined
    appBootstrapped = true

    reloadProducts()
    reloadSponsorships()
    reloadSettings()
    const unsubs = [
      api.subscribeProducts(reloadProducts),
      api.subscribeSponsorships(reloadSponsorships),
      api.subscribeSettings(reloadSettings),
    ]
    return () => unsubs.forEach((u) => u && u())
  }, [reloadProducts, reloadSponsorships, reloadSettings])

  // Auth session (Super Admin gate)
  useEffect(() => {
    getSession().then((session) => dispatch({ type: 'SET_SESSION', session }))
    return onAuthChange((session) => dispatch({ type: 'SET_SESSION', session }))
  }, [])

  // Holding a Supabase session is not the same as being an admin. Someone who
  // was deactivated or deleted keeps their JWT until it expires, so the panel
  // asks the database on every session change instead of trusting the token.
  const userId = state.session?.user?.id || null
  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    api.checkActiveAdmin().then((isAdmin) => {
      if (!cancelled) dispatch({ type: 'SET_IS_ADMIN', isAdmin })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Cart persists locally — it's a donor's in-progress selection.
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart))
    } catch {
      /* ignore quota errors */
    }
  }, [state.cart])

  // Auto-release sweep: any PENDING sponsorship older than the hold time is
  // released, freeing its amount back to the product (0 = never).
  useEffect(() => {
    const days = Number(state.settings.reservationDays) || 0
    if (days <= 0) return
    const sweep = () => {
      const cutoff = Date.now() - days * 86400000
      stateRef.current.sponsorships.forEach((s) => {
        if (s.status !== 'pending' || !s.reservedAt) return
        const t = new Date(s.reservedAt).getTime()
        if (Number.isFinite(t) && t < cutoff) {
          // Only an authenticated admin can write this (RLS); anon sweeps no-op.
          api.setSponsorshipStatus(s.id, 'released').catch(() => {})
        }
      })
    }
    sweep()
    const interval = setInterval(sweep, 60 * 1000)
    return () => clearInterval(interval)
  }, [state.settings.reservationDays])

  const actions = useMemo(
    () => ({
      addProduct: async (product) => {
        const prefix = product.kind === 'equipment' ? 'eq' : 'cow'
        const created = await api.createProduct({ id: uid(prefix), ...product })
        await reloadProducts()
        return created.id
      },
      updateProduct: async (id, patch) => {
        const updated = await api.updateProduct(id, patch)
        await reloadProducts()
        return updated
      },
      deleteProduct: async (id) => {
        await api.deleteProduct(id)
        dispatch({ type: 'CART_REMOVE', id })
        await reloadProducts()
      },

      setSettings: async (patch) => {
        const next = await api.saveSettings(patch)
        if (next) dispatch({ type: 'SET_SETTINGS', settings: next })
      },
      addBank: async (bank) => {
        const banks = stateRef.current.settings.banks || []
        if (banks.length >= MAX_BANKS) return false
        const next = await api.saveSettings({ banks: [...banks, { id: uid('bank'), ...bank }] })
        if (next) dispatch({ type: 'SET_SETTINGS', settings: next })
        return true
      },
      updateBank: async (id, patch) => {
        const banks = stateRef.current.settings.banks || []
        const next = await api.saveSettings({ banks: banks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
        if (next) dispatch({ type: 'SET_SETTINGS', settings: next })
      },
      deleteBank: async (id) => {
        const banks = stateRef.current.settings.banks || []
        const next = await api.saveSettings({ banks: banks.filter((b) => b.id !== id) })
        if (next) dispatch({ type: 'SET_SETTINGS', settings: next })
      },

      toggleCart: (id) => dispatch({ type: 'CART_TOGGLE', id }),
      setCart: (ids) => dispatch({ type: 'CART_SET', ids }),
      removeFromCart: (id) => dispatch({ type: 'CART_REMOVE', id }),
      clearCart: () => dispatch({ type: 'CART_CLEAR' }),

      // items: [{ productId, amountPKR, isPartial }]
      sponsor: async (items, donor, bankId) => {
        const rows = items.map((it) => ({
          id: uid('spn'),
          productId: it.productId,
          donor,
          bankId: bankId || null,
          amountPKR: it.amountPKR,
          isPartial: !!it.isPartial,
        }))
        const created = await api.createSponsorships(rows)
        dispatch({ type: 'CART_CLEAR' })
        await reloadSponsorships()
        await reloadProducts()
        return created
      },
      confirmSponsorship: async (id, recipient) => {
        // Confirm in DB
        const confirmed = await api.confirmSponsorship(id, recipient)
        await reloadSponsorships()
        await reloadProducts()

        // Queue a confirmation email (outbox). The server/worker should deliver
        // messages from inbox_entries. Do best-effort here — failures should
        // not block the confirmation flow.
        try {
          const sponsorEmail = confirmed?.donor?.email
          if (sponsorEmail) {
            const settings = stateRef.current.settings || {}
            const template = settings.confirmationEmailBody || ''
            const subjectTemplate = settings.confirmationEmailSubject || ''
            const product = stateRef.current.products.find((p) => p.id === confirmed.productId) || null
            const ctx = {
              donor: confirmed.donor || {},
              product,
              sponsorship: confirmed,
              amount: confirmed.amountPKR || 0,
              amountFormatted: formatMoney(confirmed.amountPKR || 0, 'PKR'),
            }
            const render = (t) => {
              if (!t) return ''
              return String(t)
                .replace(/{{\s*donor_firstName\s*}}/g, ctx.donor.firstName || '')
                .replace(/{{\s*donor_lastName\s*}}/g, ctx.donor.lastName || '')
                .replace(/{{\s*donor_email\s*}}/g, ctx.donor.email || '')
                .replace(/{{\s*product_name\s*}}/g, product?.name || '')
                .replace(/{{\s*product_id\s*}}/g, product?.id || '')
                .replace(/{{\s*sponsorship_id\s*}}/g, confirmed.id || '')
                .replace(/{{\s*amount\s*}}/g, String(ctx.amount || ''))
                .replace(/{{\s*amountPKR\s*}}/g, ctx.amountFormatted || '')
            }
            const subject = subjectTemplate ? render(subjectTemplate) : `Sponsorship confirmed — ${product?.name || ''}`
            const body = render(template)
            await api.createInboxEntry({ to: sponsorEmail, subject, body, sponsorshipId: confirmed.id })
          }
        } catch (e) {
          // don't block the UI flow — log and move on
          // eslint-disable-next-line no-console
          console.error('Could not queue confirmation email:', e)
        }
      },
      cancelSponsorship: async (id) => {
        await api.setSponsorshipStatus(id, 'cancelled')
        await reloadSponsorships()
        await reloadProducts()
      },
      releaseSponsorship: async (id) => {
        await api.setSponsorshipStatus(id, 'released')
        await reloadSponsorships()
        await reloadProducts()
      },
      updateSponsorship: async (id, patch) => {
        const updated = await api.updateSponsorship(id, patch)
        await reloadSponsorships()
        await reloadProducts()
        return updated
      },

      signIn: (email, password) => api.signIn(email, password),
      signOut: () => api.signOut(),
    }),
    [reloadProducts, reloadSponsorships],
  )

  const value = useMemo(() => {
    const { products, sponsorships, settings } = state

    // One pass over the ledger, then every helper is an O(1) lookup.
    const byProduct = new Map()
    sponsorships.forEach((s) => {
      if (!byProduct.has(s.productId)) byProduct.set(s.productId, [])
      byProduct.get(s.productId).push(s)
    })
    const stats = new Map()
    products.forEach((p) => stats.set(p.id, money(p, byProduct.get(p.id) || [])))
    const statOf = (id) => stats.get(id) || { value: 0, confirmed: 0, pending: 0, committed: 0, remaining: 0, status: 'available' }

    const isPartialEligible = (product) => {
      if (!product || !settings.partialEnabled) return false
      if (product.kind === 'equipment') {
        return settings.partialEquipmentEnabled && product.valuePKR >= (settings.partialEquipmentMin || 0)
      }
      return settings.partialLivestockEnabled && product.valuePKR >= (settings.partialLivestockMin || 0)
    }

    const openOf = (id) => (byProduct.get(id) || []).filter((s) => s.status === 'pending')

    return {
      ...state,
      loading: state.productsLoading || state.sponsorshipsLoading || state.settingsLoading,
      ...actions,
      MAX_BANKS,
      livestock: products.filter((p) => p.kind !== 'equipment' && statOf(p.id).status !== 'sponsored'),
      equipment: products.filter((p) => p.kind === 'equipment' && statOf(p.id).status !== 'sponsored'),

      statusOf: (id) => statOf(id).status,
      remainingOf: (id) => statOf(id).remaining,
      committedOf: (id) => statOf(id).committed,
      confirmedOf: (id) => statOf(id).confirmed,
      statsOf: statOf,
      isPartialEligible,
      hasOpenSponsorships: (id) => openOf(id).length > 0,

      // Public site: anything still open for a contribution.
      availableProducts: products.filter((p) => {
        const s = statOf(p.id).status
        return s === 'available' || s === 'partial'
      }),
      // Admin Confirmations: anything with money awaiting confirmation.
      reservedProducts: products.filter((p) => (byProduct.get(p.id) || []).some((s) => s.status === 'pending')),
      // Sponsorships Made: fully sponsored, every contribution confirmed.
      completedProducts: products.filter((p) => statOf(p.id).status === 'sponsored'),

      sponsorsOf: (id) => (byProduct.get(id) || []).filter((s) => s.status === 'confirmed'),
      pendingOf: (id) => (byProduct.get(id) || []).filter((s) => s.status === 'pending'),
      sponsorshipsOf: (id) => byProduct.get(id) || [],

      bankById: (id) => (settings.banks || []).find((b) => b.id === id) || null,
      productById: (id) => products.find((p) => p.id === id) || null,
    }
  }, [state, actions])

  return (
    <AppContext.Provider value={value}>
      <ToastProvider>{children}</ToastProvider>
    </AppContext.Provider>
  )
}
