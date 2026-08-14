import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, getDoc, writeBatch,
} from 'firebase/firestore'
import { db } from './config.js'
import { seedProducts, defaultSettings } from '../data/seed.js'

const PRODUCTS = 'products'
const DONATIONS = 'donations'
const CONFIG = 'config'
const SETTINGS_ID = 'app'

const settingsRef = () => doc(db, CONFIG, SETTINGS_ID)
const productRef = (id) => doc(db, PRODUCTS, id)
const donationRef = (id) => doc(db, DONATIONS, id)

// ---- realtime subscriptions -------------------------------------------------
export function subscribeProducts(cb) {
  return onSnapshot(collection(db, PRODUCTS), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

export function subscribeDonations(cb) {
  return onSnapshot(collection(db, DONATIONS), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

export function subscribeSettings(cb) {
  return onSnapshot(settingsRef(), (snap) => cb(snap.exists() ? snap.data() : null))
}

// ---- writes -----------------------------------------------------------------
export const fbSetProduct = (product) => setDoc(productRef(product.id), product)
export const fbUpdateProduct = (id, patch) => updateDoc(productRef(id), patch)
export const fbDeleteProduct = (id) => deleteDoc(productRef(id))
export const fbSetSettings = (patch) => setDoc(settingsRef(), patch, { merge: true })
export const fbAddDonation = (record) => setDoc(donationRef(record.id), record)

export async function fbReserve(ids, reservation) {
  const batch = writeBatch(db)
  ids.forEach((id) => batch.update(productRef(id), { status: 'reserved', reservation }))
  await batch.commit()
}

export async function fbConfirm(id, donation) {
  await updateDoc(productRef(id), { status: 'donated', donation })
  await fbAddDonation(donation)
}

// ---- seeding / reset --------------------------------------------------------
export async function seedIfEmpty() {
  const settingsSnap = await getDoc(settingsRef())
  if (!settingsSnap.exists()) await setDoc(settingsRef(), defaultSettings)

  const productsSnap = await getDocs(collection(db, PRODUCTS))
  if (productsSnap.empty) {
    const batch = writeBatch(db)
    seedProducts.forEach((p) => batch.set(productRef(p.id), p))
    await batch.commit()
  }
}

export async function fbResetAll() {
  const [productsSnap, donationsSnap] = await Promise.all([
    getDocs(collection(db, PRODUCTS)),
    getDocs(collection(db, DONATIONS)),
  ])
  const batch = writeBatch(db)
  productsSnap.forEach((d) => batch.delete(d.ref))
  donationsSnap.forEach((d) => batch.delete(d.ref))
  seedProducts.forEach((p) => batch.set(productRef(p.id), p))
  batch.set(settingsRef(), defaultSettings)
  await batch.commit()
}
