import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { initialState, defaultSettings } from '../data/seed.js'
import { uid } from '../lib/helpers.js'
import { ToastProvider } from './ToastContext.jsx'
import { firebaseEnabled } from '../firebase/config.js'
import * as fb from '../firebase/api.js'

const STORAGE_KEY = 'iga-sial-state-v1'
const CART_KEY = 'iga-cart'
const MAX_BANKS = 5

const AppContext = createContext(null)

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

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { products: initialState.products, settings: initialState.settings, donations: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== initialState.version) {
      return { products: initialState.products, settings: initialState.settings, donations: [] }
    }
    return {
      products: Array.isArray(parsed.products) ? parsed.products : initialState.products,
      settings: { ...initialState.settings, ...(parsed.settings || {}) },
      donations: Array.isArray(parsed.donations) ? parsed.donations : [],
    }
  } catch {
    return { products: initialState.products, settings: initialState.settings, donations: [] }
  }
}

function baseState() {
  const cart = loadCart()
  if (firebaseEnabled) {
    return { products: [], settings: defaultSettings, donations: [], cart, loading: true }
  }
  return { ...loadLocal(), cart, loading: false }
}

function buildDonationRecord(product, recipient) {
  return {
    id: uid('don'),
    productId: product.id,
    productName: product.name,
    productType: product.type,
    breed: product.breed || '',
    image: product.images?.[0] || null,
    amountPKR: product.valuePKR,
    donor: product.reservation?.donor || null,
    bankId: product.reservation?.bankId || null,
    recipient: recipient || null,
    reservedAt: product.reservation?.reservedAt || null,
    confirmedAt: new Date().toISOString(),
  }
}

function reducer(state, action) {
  switch (action.type) {
    // ---- realtime (Firebase) snapshots ----
    case 'SET_PRODUCTS':
      return { ...state, products: action.products, loading: false }
    case 'SET_DONATIONS':
      return { ...state, donations: action.donations }
    case 'SET_SETTINGS_DOC':
      return { ...state, settings: { ...defaultSettings, ...(action.settings || {}) } }

    // ---- local mutations ----
    case 'ADD_PRODUCT':
      return { ...state, products: [action.product, ...state.products] }
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      }
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.id) }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'RESERVE': {
      const reservedAt = new Date().toISOString()
      return {
        ...state,
        products: state.products.map((p) =>
          action.ids.includes(p.id) && p.status === 'available'
            ? { ...p, status: 'reserved', reservation: { donor: action.donor, bankId: action.bankId || null, reservedAt } }
            : p,
        ),
      }
    }
    case 'CANCEL_RESERVATION':
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id ? { ...p, status: 'available', reservation: null } : p,
        ),
      }
    case 'CONFIRM_DONATION':
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id ? { ...p, status: 'donated', donation: action.record } : p,
        ),
        donations: [action.record, ...state.donations],
      }
    case 'RESET':
      return {
        ...state,
        products: initialState.products.map((p) => ({ ...p })),
        settings: { ...initialState.settings },
        donations: [],
      }

    // ---- cart (always local) ----
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

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, baseState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Firebase realtime subscriptions (global mode)
  useEffect(() => {
    if (!firebaseEnabled) return
    fb.seedIfEmpty().catch((e) => console.error('Seed failed:', e))
    const unsubs = [
      fb.subscribeProducts((products) => dispatch({ type: 'SET_PRODUCTS', products })),
      fb.subscribeSettings((settings) => settings && dispatch({ type: 'SET_SETTINGS_DOC', settings })),
      fb.subscribeDonations((donations) => dispatch({ type: 'SET_DONATIONS', donations })),
    ]
    return () => unsubs.forEach((u) => u && u())
  }, [])

  // Local persistence (fallback mode)
  useEffect(() => {
    if (firebaseEnabled) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: initialState.version,
          products: state.products,
          settings: state.settings,
          donations: state.donations,
        }),
      )
    } catch {
      /* ignore quota errors */
    }
  }, [state.products, state.settings, state.donations])

  // Cart persists locally in both modes
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart))
    } catch {
      /* ignore */
    }
  }, [state.cart])

  // Auto-release reserved animals once their hold time expires (0 = never).
  useEffect(() => {
    const days = Number(state.settings.reservationDays) || 0
    if (days <= 0) return
    const sweep = () => {
      const cutoff = Date.now() - days * 86400000
      stateRef.current.products.forEach((p) => {
        if (p.status !== 'reserved' || !p.reservation?.reservedAt) return
        const t = new Date(p.reservation.reservedAt).getTime()
        if (Number.isFinite(t) && t < cutoff) {
          if (firebaseEnabled) fb.fbUpdateProduct(p.id, { status: 'available', reservation: null })
          else dispatch({ type: 'CANCEL_RESERVATION', id: p.id })
        }
      })
    }
    sweep()
    const interval = setInterval(sweep, 60 * 1000)
    return () => clearInterval(interval)
  }, [state.settings.reservationDays])

  const actions = useMemo(() => {
    const writeSettings = (patch) => {
      if (firebaseEnabled) fb.fbSetSettings(patch)
      else dispatch({ type: 'SET_SETTINGS', patch })
    }
    return {
      addProduct: (product) => {
        const record = {
          id: uid('cow'),
          status: 'available',
          reservation: null,
          donation: null,
          createdAt: new Date().toISOString(),
          ...product,
        }
        if (firebaseEnabled) fb.fbSetProduct(record)
        else dispatch({ type: 'ADD_PRODUCT', product: record })
        return record.id
      },
      updateProduct: (id, patch) => {
        // Reserved animals are locked until released.
        const existing = stateRef.current.products.find((x) => x.id === id)
        if (existing && existing.status === 'reserved') return
        if (firebaseEnabled) fb.fbUpdateProduct(id, patch)
        else dispatch({ type: 'UPDATE_PRODUCT', id, patch })
      },
      deleteProduct: (id) => {
        const existing = stateRef.current.products.find((x) => x.id === id)
        if (existing && existing.status === 'reserved') return
        if (firebaseEnabled) fb.fbDeleteProduct(id)
        else dispatch({ type: 'DELETE_PRODUCT', id })
        dispatch({ type: 'CART_REMOVE', id })
      },

      setSettings: writeSettings,
      addBank: (bank) => {
        const banks = stateRef.current.settings.banks || []
        if (banks.length >= MAX_BANKS) return false
        writeSettings({ banks: [...banks, { id: uid('bank'), ...bank }] })
        return true
      },
      updateBank: (id, patch) => {
        const banks = stateRef.current.settings.banks || []
        writeSettings({ banks: banks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
      },
      deleteBank: (id) => {
        const banks = stateRef.current.settings.banks || []
        writeSettings({ banks: banks.filter((b) => b.id !== id) })
      },

      toggleCart: (id) => dispatch({ type: 'CART_TOGGLE', id }),
      setCart: (ids) => dispatch({ type: 'CART_SET', ids }),
      removeFromCart: (id) => dispatch({ type: 'CART_REMOVE', id }),
      clearCart: () => dispatch({ type: 'CART_CLEAR' }),

      reserve: (ids, donor, bankId) => {
        if (firebaseEnabled) {
          fb.fbReserve(ids, { donor, bankId: bankId || null, reservedAt: new Date().toISOString() })
        } else {
          dispatch({ type: 'RESERVE', ids, donor, bankId })
        }
        dispatch({ type: 'CART_CLEAR' })
      },
      cancelReservation: (id) => {
        if (firebaseEnabled) fb.fbUpdateProduct(id, { status: 'available', reservation: null })
        else dispatch({ type: 'CANCEL_RESERVATION', id })
      },
      confirmDonation: (id, recipient) => {
        const product = stateRef.current.products.find((p) => p.id === id)
        if (!product || product.status !== 'reserved') return
        const record = buildDonationRecord(product, recipient)
        if (firebaseEnabled) fb.fbConfirm(id, record)
        else dispatch({ type: 'CONFIRM_DONATION', id, record })
      },

      resetDemo: () => {
        if (firebaseEnabled) fb.fbResetAll().catch((e) => console.error('Reset failed:', e))
        else dispatch({ type: 'RESET' })
        dispatch({ type: 'CART_CLEAR' })
      },
    }
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      ...actions,
      MAX_BANKS,
      dataMode: firebaseEnabled ? 'firebase' : 'local',
      availableProducts: state.products.filter((p) => p.status === 'available'),
      reservedProducts: state.products.filter((p) => p.status === 'reserved'),
      donatedProducts: state.products.filter((p) => p.status === 'donated'),
      bankById: (id) => state.settings.banks.find((b) => b.id === id) || null,
      productById: (id) => state.products.find((p) => p.id === id) || null,
    }),
    [state, actions],
  )

  return (
    <AppContext.Provider value={value}>
      <ToastProvider>{children}</ToastProvider>
    </AppContext.Provider>
  )
}
