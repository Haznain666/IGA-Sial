import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// ┌────────────────────────────────────────────────────────────────────────┐
// │  PASTE YOUR FIREBASE WEB CONFIG BELOW to make the site GLOBAL.           │
// │                                                                          │
// │  Firebase console → Project settings (gear) → General tab →              │
// │  "Your apps" → Web app → SDK setup and configuration → "Config".         │
// │  Copy the values into the object below.                                  │
// │                                                                          │
// │  These values are PUBLIC by design (they ship in every web app) — safe   │
// │  to keep here. Then create a Firestore database and, for now (no login), │
// │  start it in "test mode" so reads/writes are allowed.                    │
// │                                                                          │
// │  Until this is filled in, the site runs in LOCAL preview mode            │
// │  (per-browser data) so you can still develop and demo.                   │
// └────────────────────────────────────────────────────────────────────────┘
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let db = null
if (firebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig)
    db = getFirestore(app)
  } catch (err) {
    // Bad config — fall back to local mode rather than crashing the app.
    console.error('Firebase init failed; running in local mode.', err)
  }
}

export { db }
