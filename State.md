# IGA Sial Farm — Project State & Context

> Handoff/context doc. Read this first when opening `D:\iga-sial-farm` in a new session.
> Last updated: 2026-08-14.

---

## 1. What this is

A single-page **charity / donation website** for **IGA Sial Farm — Donate-a-Cow Program**
(a not-for-profit dairy initiative in Waryam Wala, Punjab, Pakistan). Donors browse animals,
"donate" one (or several) by paying, and the animal is gifted to a needy family. Content was
derived from the client's PowerPoint (`D:\IGA Sial\IGA_Sial_Farm_Donate_a_Cow_Presentation (v0.3).pptx`).

**Two surfaces:**
- **Public site** — marketing single-pager + the donation flow.
- **Super Admin** — a control panel at a separate URL that manages everything (products, confirmations,
  donation records, settings). No login yet (by client's choice, "for now").

**Data is global via Firebase Firestore** (real-time, so an admin change shows for every visitor),
with a **localStorage fallback** so the app still runs before Firebase is configured.

---

## 2. Stack

- **React 18** + **Vite 5** + **Tailwind CSS 3**
- **react-router-dom 6** (HashRouter — URLs look like `/#/select`; no server rewrites needed on deploy)
- **framer-motion** (reveals, modal/lightbox enter animation)
- **embla-carousel-react** + **embla-carousel-autoplay** (herd carousel)
- **lucide-react** (icons)
- **firebase 12** (Firestore; app-level SDK)
- Fonts: **Lexend** (headings) + **Source Sans 3** (body), via Google Fonts in `index.html`.

---

## 3. Run / build / deploy

```bash
cd D:\iga-sial-farm
npm install          # if node_modules missing
npm run dev          # dev server, http://localhost:5180
npm run build        # production build -> dist/
npm run preview      # preview the built dist
```

- Browser-preview launcher entry: **`iga-dev`** on port **4329** in `D:\.claude\launch.json`
  (root shared launch.json used by the preview tool; project also has its own `.claude/launch.json`).
- **Deploy:** client self-hosts. `npm run build`, upload `dist/`. HashRouter ⇒ no SPA rewrite rules needed.
  Super Admin URL becomes `https://<site>/#/super-admin`.

---

## 4. Current status

**Everything below is built and QA-verified in the browser. Production build passes clean (0 errors).**

Done & verified:
- Full public single-pager (all sections from the pptx).
- Donation flow: select → donate → reserve (block) → **Thank-You page** with bank transfer details.
- Super Admin area (Dashboard, Products CRUD, Confirmations, Donations Made, Settings).
- Portrait 4:5 fixed image frame everywhere + per-image zoom/position adjustment in Manage Product.
- Lightbox with prominent Close + prev/next + thumbnails.
- Editable exchange rates (Settings) flowing to all prices.
- Reserved-animal edit/delete lock; reservation auto-release after N days (Settings-configurable).
- Modal focus bug fixed (see Gotchas).
- Mobile-first pass — verified zero horizontal overflow at 375px on all key pages.
- Dual-mode store (Firestore global / localStorage fallback), lazy-loaded admin chunks.

**PENDING — the only open item:**
- **User must paste their Firebase web config into `src/firebase/config.js`** to switch from
  "Local preview" to "Global" mode. Until then it runs per-browser (a banner in Super Admin shows which
  mode is active). User chose **Firebase** for data and **self-hosting** for deploy.
- Optional/likely-next (not requested yet): add a passcode/login to Super Admin + lock down Firestore rules.

---

## 5. Architecture

### Data layer — `src/store/AppContext.jsx` (the heart of the app)
Single `useReducer` store exposed via `useApp()`. **Dual-mode**, decided by `firebaseEnabled` from
`src/firebase/config.js`:

- **Firebase mode** (config present): `onSnapshot` subscriptions stream `products`, `donations`, and the
  `config/app` settings doc into state (real-time, global). Action functions write to Firestore via
  `src/firebase/api.js`; Firestore latency-compensation reflects writes immediately.
- **Local mode** (no config): reducer mutations + `localStorage` persistence (key `iga-sial-state-v1`).

`useApp()` returns the same shape in both modes, so components never branch on mode. It exposes:
- state: `products`, `settings`, `cart`, `donations`, `loading`, `dataMode` (`'firebase'|'local'`), `MAX_BANKS`
- selectors: `availableProducts`, `reservedProducts`, `donatedProducts`, `bankById(id)`, `productById(id)`
- actions: `addProduct`, `updateProduct`, `deleteProduct`, `setSettings`, `addBank`, `updateBank`,
  `deleteBank`, `toggleCart`, `setCart`, `removeFromCart`, `clearCart`, `reserve`, `cancelReservation`,
  `confirmDonation`, `resetDemo`

**What's global vs local:** `products`, `settings`, `donations`, and reservations are global (Firestore).
The **cart** is always per-browser (`localStorage` key `iga-cart`) — it's a donor's in-progress selection.

**Two background effects in the provider:**
- Local persistence (local mode only) + cart persistence (both modes).
- **Reservation auto-release sweep**: every 60s (and on mount), any product with
  `status==='reserved'` whose `reservation.reservedAt` is older than `settings.reservationDays` is reverted
  to `available` (`0 = never`).

### Firestore layout (when configured)
- Collection `products` — one doc per animal (doc id = product id).
- Collection `donations` — one doc per confirmed donation record.
- Doc `config/app` — the single settings object.
- `seedIfEmpty()` writes the 5 demo animals + default settings on first run if empty.
- `fbResetAll()` powers the global "Reset demo data".
- Needs Firestore in **test mode** / open rules for now (no auth).

### Routing — `src/App.jsx`
- `PublicLayout` (Header + Footer) wraps: `/` (Home), `/select` (Animal Selection), `/donation`
  (donor form), `/thank-you`, and `*` (NotFound).
- `SuperAdminLayout` (own chrome, NO public header/footer) wraps: `/super-admin` (Dashboard, index),
  `/super-admin/products`, `/super-admin/confirmations`, `/super-admin/donations`, `/super-admin/settings`.
- **Super Admin pages are `React.lazy`** (separate chunks) so the donor experience stays light.
- Footer has **no** admin links — Super Admin is reached by typing the URL only.

---

## 6. Data model

**Product**
```
{ id, name, images: Image[], details (<=300), breed, age, weight,
  type: 'Calf'|'Heifer'|'Cow'|'Bull',
  valuePKR: number,                       // auto-converts to USD/AUD/SAR via settings.fxRates
  owner: { ownedByFarm: bool, firstName, lastName, cnic, phone, email },
  status: 'available'|'reserved'|'donated',
  reservation: null | { donor:{firstName,lastName,email,phone}, bankId, reservedAt(ISO) },
  donation:    null | <donation record>,  // set when confirmed
  createdAt(ISO) }
```

**Image** (portrait model — see `src/lib/images.js`)
```
{ url, zoom(1..2.5), posX(0..100), posY(0..100) }   // legacy plain strings are auto-normalized
```
Helpers: `normalizeImage`, `imageUrl(img)`, `firstImageUrl(product)`, `imageStyle(img)` (returns
`objectPosition` + `transform:scale`), `fileToScaledDataURL(file)` (canvas downscale on upload),
`PORTRAIT_ASPECT = '4 / 5'`.

**Settings** (`config/app` doc / `settings` in local state)
```
{ multiSelect: bool,           // Animal Selection: multi-select cart vs single "Donate now"
  gatherRecipientInfo: bool,   // Confirm Donation: show recipient popup (else confirm directly)
  collectOwnerInfo: bool,      // Manage Product: capture villager owner (else default IGA Sial Farm)
  reservationDays: number,     // auto-release reserved animals after N days (0 = never). default 7
  terms: string,               // T&C shown on donation page
  banks: Bank[] (max 5),       // shown in donation-page dropdown
  fxRates: { USD, AUD, SAR } }  // PKR per 1 unit; editable in Settings
```

**Bank**: `{ id, bankName, accountTitle, accountNumber, iban, swift, branch, currency }`

**Donation record** (built in `buildDonationRecord`, stored in `donations`):
`{ id, productId, productName, productType, breed, image, amountPKR, donor, bankId, recipient|null,
   reservedAt, confirmedAt }`

**Currency** (`src/lib/currency.js`): `DEFAULT_FX = {USD:278.5, AUD:183, SAR:74.3}` (PKR per unit),
`convertFromPKR(pkr, rates)`, `formatMoney(amount, cur)`. `CurrencyPills` reads live rates from context.

---

## 7. Key flows & behaviors

- **Home carousel (Herd)** — up to 5 available animals, live from store, clickable → lightbox, "Donate now" → `/select`.
- **Animal Selection (`/select`)** — all available animals, paginated (6/page).
  `settings.multiSelect` on ⇒ checkbox + "Add to donation" + floating cart bar; off ⇒ per-card "Donate now".
- **Donation page (`/donation`)** — donor form (first/last/email/phone, validated), total in 4 currencies,
  T&C accept checkbox, bank dropdown (details shown). "Proceed" reserves the cart's animals (blocks them,
  attaches donor to `reservation`) and routes the donor to **`/thank-you`** (NOT the admin page).
- **Reserved animals** disappear from Home + Animal Selection; appear in Super Admin → Confirmations.
- **Confirm Donation (super-admin)** — per reserved card: **Confirm** (if `gatherRecipientInfo` on, opens a
  recipient popup — first/last name required, CNIC/phone/email optional; else confirms directly) or
  **Cancel** (release back to available). Cards show an "Auto-releases in X days" countdown.
- **Donations Made (super-admin)** — records with animal + donor + recipient + bank + dates; summary stats.
- **Manage Product (super-admin)** — CRUD. Up to 5 portrait images (upload OR paste URL) with per-image
  zoom/horizontal/vertical sliders + Reset. Name, details(≤300), breed, age, weight, type dropdown, PKR value
  with live FX. Owner section gated by `collectOwnerInfo`. **Reserved animals are locked** (no edit/delete
  until released — enforced in UI *and* in the store actions).
- **Settings (super-admin)** — the 3 toggles, Reservation hold time, Exchange rates, Terms editor, Banks
  (max 5), Reset demo data (global in Firebase mode).

---

## 8. File map

```
src/
  main.jsx                      # entry: HashRouter > AppProvider > App
  App.jsx                       # routes; PublicLayout + lazy SuperAdmin routes
  index.css                     # Tailwind layers + component classes (.btn-*, .field-*, .card, .chip, .container-x)
  data/seed.js                  # 5 demo animals, default settings, banks, terms. state version = 2
  lib/
    currency.js                 # FX + formatting (rates-aware)
    helpers.js                  # uid, initials, fullName, formatDate/Time, isEmail, isPhone, clamp
    images.js                   # portrait image model + helpers + upload downscale
  firebase/
    config.js                   # ⟵ USER PASTES FIREBASE CONFIG HERE; exports firebaseEnabled, db
    api.js                      # Firestore CRUD + realtime subscriptions + seed/reset
  store/
    AppContext.jsx              # dual-mode store (Firestore/local); useApp(); auto-release sweep
    ToastContext.jsx            # toast system (useToast)
  components/
    Header, Footer, Logo, PageHeader, SectionHeading, Reveal, ScrollToTop,
    Modal, Lightbox, AnimalCard, CurrencyPills, StatusBadge, EmptyState
  sections/                     # home sections: Hero, About, Concept, Highlights, Process,
                                #   Herd (carousel), Transparency (Manzil app mockup), MasterPlan, Contact
  pages/
    Home, AnimalSelection, DonationPage, ThankYou, NotFound,
    ManageProduct, ConfirmDonation, DonationsMade, SettingsPage,
    superadmin/SuperAdminLayout, superadmin/Dashboard
public/
  logo.jpg                      # THE official logo (client-provided; use only this)
  img/hero-mosque.png           # hero
  img/aerial.png                # About section
  img/masterplan.png            # Master Plan (click-to-zoom)
  img/logo-seal.jpg             # hi-res seal
```
Cow photos are **Unsplash** URLs (verified working) in `seed.js`. Real cow photos exist in the pptx but
Unsplash was requested for placeholders.

---

## 9. Design system

- Palette **"Emerald & Gold"** (chosen by client; derived from the logo):
  - primary emerald `#1E8A6E` (brand-500), pine `#0F4A3C` (brand-800), moss `#517336`,
    gold CTA `#FBB315` (gold-400), ink `#1C1B16`, cream `#F6F7F3`, sand `#EBEDE4`, parchment `#FBFBF8`.
  - Full ramps + `moss`, `pine`, shadows (`soft`/`lift`/`gold`), fonts, animations in `tailwind.config.js`.
- Style direction: **Organic Biophilic** — rounded corners (cards 12–24px), soft natural shadows, generous
  whitespace (tightened for mobile). Buttons: `.btn-gold` (primary CTA), `.btn-primary` (emerald),
  `.btn-outline`, `.btn-ghost`, `.btn-pine`, sizes `.btn-lg/md/sm`.

---

## 10. Gotchas / decisions (don't re-break these)

- **Modal focus (fixed):** `Modal`'s focus/keydown `useEffect` must depend ONLY on `[open]`, using an
  `onCloseRef` for the latest `onClose`. If `onClose` is in the deps, the effect re-runs on every parent
  render (each keystroke) and steals focus to the Close button. It focuses the **first form field**, not the
  close button.
- **AnimatePresence + portal + StrictMode (fixed):** `Modal` and `Lightbox` render `null` when closed
  (enter animation only). Do NOT wrap their mount/unmount in `AnimatePresence` again — under React 18
  StrictMode + `createPortal` the exit animation left an invisible `opacity:0` overlay that blocked clicks.
- **Reserved lock:** `updateProduct`/`deleteProduct` no-op on `status==='reserved'` (store-level guard),
  and the Manage Product UI hides the buttons + shows a lock note.
- **State version = 2** (`seed.js`). Bumping the shape? bump the version so stale localStorage is discarded.
  Legacy string images are auto-normalized by `normalizeImage`, so mixed data won't crash.
- **Firebase safe to commit:** web config (apiKey etc.) is public by design; keeping it in `config.js` is fine.
- **Cart is never global.** Reservations/products/settings/donations are.
- **Bundle:** admin is code-split (`React.lazy`); `vite.config.js` `manualChunks` split react/firebase/motion.
  Firebase (~147KB gz) loads on every page because the store needs it in global mode — inherent.

---

## 11. Firebase setup (hand to client)

1. https://console.firebase.google.com → create/open a project.
2. Project settings (⚙️) → General → Your apps → add a **Web app** → copy the `firebaseConfig` values.
3. Paste them into **`src/firebase/config.js`** (labelled placeholder). `firebaseEnabled` flips true automatically.
4. Build → **Firestore Database** → Create database → start in **test mode** (allows read/write; no login yet).
5. Rebuild/redeploy. Super Admin banner switches to "Global mode".

---

## 12. Related context

- Memory: `project-iga-sial-farm` (in `C:\Users\PC\.claude\projects\D--\memory\`) has the same key facts.
- Source assets & original pptx: `D:\IGA Sial\`.
- Client preferences on file: $10k agency-grade quality bar; keep project markdown docs in the Obsidian vault
  by project folder (this State.md lives in-repo intentionally so a new session finds it immediately).
