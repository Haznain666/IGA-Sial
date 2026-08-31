# IGA Sial Farm — Project State & Context

> Handoff/context doc. Read this first when opening `D:\iga-sial-farm` in a new session.
> Last updated: 2026-08-16 (admin user lifecycle: device-independent invites, hard delete, Invited status).

---

## 0. ⚠️ PENDING MANUAL STEP — apply migrations 0005 and 0006

`supabase/migrations/0005_admin_users.sql` and `0006_admin_rls.sql` are **written but not yet
applied**. Paste them into the Supabase SQL editor **in order** (0005 first — 0006 depends on
`public.is_active_admin()` which 0005 creates).

The shipped build works either way: every new RPC is called with a fallback to the old behaviour, so
nothing breaks while the SQL is outstanding. But **until 0005 is applied**:

- deleting an admin still only removes their `admin_profiles` row (the panel now says so out loud in
  the toast instead of claiming success),
- the **Invited** status can't be shown (the panel needs `auth.users.last_sign_in_at`),
- re-inviting a previously deleted address still won't restore their row.

Verify after applying:

```sql
select public.is_active_admin();                 -- must be true for your own account
select * from public.admin_users_list();         -- roster incl. last_sign_in_at
```

---

## 1. What this is

A single-page **charity / sponsorship website** for **IGA Sial Farm** (a not-for-profit dairy initiative in
Waryam Wala, Punjab, Pakistan). Sponsors browse **live stock** and **farm equipment**, sponsor one or
several (in full or in part), and the item is gifted on their behalf to a needy family. Content was
derived from the client's PowerPoint (`D:\IGA Sial\IGA_Sial_Farm_Donate_a_Cow_Presentation (v0.3).pptx`).

**Two surfaces:**
- **Public site** — marketing single-pager + the sponsorship flow.
- **Super Admin** — a control panel at `/#/super-admin`, **behind Supabase Auth**, that manages
  products, confirmations, sponsorship records, settings, and admin users.

**Data is global via Supabase Postgres** with **Realtime** subscriptions, so an admin change shows for
every visitor. There is **no local fallback** any more — Supabase is always configured.

---

## 2. Stack

- **React 18** + **Vite 5** + **Tailwind CSS 3**
- **react-router-dom 6** (HashRouter — URLs look like `/#/select`; no server rewrites needed on deploy)
- **@supabase/supabase-js 2** (Postgres + Auth + Realtime)
- **framer-motion** (reveals, modal/lightbox enter animation)
- **embla-carousel-react** + **embla-carousel-autoplay** (herd + equipment carousels)
- **lucide-react** (icons)
- Fonts: **Lexend** (headings) + **Source Sans 3** (body), via Google Fonts in `index.html`.

Firebase is **gone** (dependency uninstalled, `src/firebase/` deleted).

---

## 3. Run / build / deploy

```bash
cd D:\iga-sial-farm
npm install
npm run dev          # dev server, http://localhost:5180
npm run build        # production build -> dist/
npm run preview      # preview the built dist
```

- Env (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
  `vite.config.js` exposes only the browser-safe `VITE_` prefix, so the app reads those values via `import.meta.env.VITE_*`.
- Browser-preview launcher entry: **`iga-dev`** (`.claude/launch.json`).

**Deploy — see `DEPLOY.md` for the full runbook.**

| | |
|---|---|
| Repo | [Haznain666/IGA-Sial](https://github.com/Haznain666/IGA-Sial) (renamed from the misspelled `IAG-Sial`) |
| Production | **https://igasial.codexmill.com** — Hostinger, tracking the `deploy` branch |
| Staging | https://haznain666.github.io/IGA-Sial/ — Pages, from `main` via `pages.yml` |
| CI | `ci.yml` builds on every push/PR; `deploy-branch.yml` publishes the build; `pages.yml` deploys staging |

**Branches:** `main` is the source of truth. **`deploy` holds build output only** and is force-pushed by
`.github/workflows/deploy-branch.yml` on every push to `main` — never commit to it by hand. Hostinger
clones a repo but does **not** run a build, which is why the `deploy` branch exists; pointing Hostinger
at `main` would serve the unbuilt source tree.

HashRouter ⇒ no SPA rewrite rules needed anywhere; do **not** add a `.htaccess` rewrite. GitHub Pages
serves from a subpath so `pages.yml` sets `BASE_PATH=/IGA-Sial/`; `igasial.codexmill.com` is a subdomain
with its own document root, so `deploy-branch.yml` deliberately sets no BASE_PATH (base stays `/`).

---

## 4. Current status

Built and browser-verified: Supabase data layer, Donation→Sponsorship ledger model, equipment, uniform
product cards, partial payments, pagination, slim confirmation cards, Supabase Auth gate on Super Admin.
`npm run build` passes with 0 errors.

**Done since that build (verified against the live database):**
- `0003_realtime.sql` **applied** — `products`, `sponsorships`, `app_settings` are all in the
  `supabase_realtime` publication.
- `0004_auto_release.sql` **applied** — auto-release now runs **server-side hourly via pg_cron**
  (`release-expired-sponsorships`, `0 * * * *`), not in the browser. See Gotchas for why.
- **Email templates configured**: reset-password emits the 6-digit `{{ .Token }}`. The **Invite user**
  template was set to `{{ .TokenHash }}` — but note the panel never called Supabase's invite endpoint,
  it called `signInWithOtp`, which sends the **Magic Link** template. That template still carried
  `{{ .ConfirmationURL }}`, which is where the `?code=` in the 2026-08-16 bug report came from. The
  invite path no longer depends on either template (see "Admin user lifecycle" below).
- The stray QA test sponsorship has been **deleted**; the ledger is empty and all 9 products are
  `available`.

**Verified on the live deploy (2026-08-14):**
- Card design constant **holds**: every card identical, livestock and equipment alike, including long
  titles — 846×323 at 375px, 914×375 at 1280px. Zero horizontal overflow at either width.
- Pagination present on product selection (`nav[aria-label="Pagination"]`, 9 products → 2 pages).
- Auth gate holds on deep links (`/#/super-admin/settings` → sign-in).
- All product images resolve; no console errors.
- Two bugs found and fixed here: public/ images were not base-path aware (404'd on Pages — see
  `assetUrl()` in `lib/images.js`), and one Unsplash photo had been removed upstream.

**Full end-to-end QA passed against the live deploy, signed in as a real admin (2026-08-14):**
Partial payments were switched on, exercised end to end, and switched back off afterwards. Verified:
- Eligibility rule is exact — with thresholds 100k/200k, 8 of 9 items showed the "Partial sponsorship
  available" chip; the Rs 165,000 Chaff Cutter (below the 200k equipment minimum) correctly did not.
- A Rs 40,000 partial on Noor (Rs 120,000) → ledger row `is_partial`, status `partial`, remaining
  Rs 80,000, **`value_pkr` never mutated**. Item stayed publicly visible.
- Chip behaviour (NOTE: superseded — see "Chip states" below; pending items now show a chip too).
- Amount input is bound to **remaining**, not full value (`min=1 max=80000` after the first payment), and
  the sponsor page defaults to the remaining balance.
- Over-sponsorship (Rs 100,000 against Rs 80,000 remaining) is blocked client-side in `handleSubmit`
  before any API call, with the DB trigger as a second line of defence.
- Second partial completing the value → item **disappeared from the public site** (spec §8).
- Sponsorships Made shows **one** card, "2 sponsors", both sponsors with contact details and their
  individual amounts, recipient, and a Fully-sponsored timestamp (spec §5d).
- Confirmations card is 404px vs 861px public, no main image, thumbnails 34×42 magnifying to 178×222 on
  hover (spec §7). Recipient modal focuses the first field and holds focus while typing (Gotchas §10).
- All QA rows deleted afterwards; ledger empty, all 9 products `available`, partial toggles back off.

**Fixed (was a defect):** a **confirmed** contribution on an item that was not yet fully sponsored
became invisible in Super Admin — it left Confirm sponsorships (no longer `pending`) but had not reached
Sponsorships made (which lists only fully sponsored items). Confirmations now has a read-only
**"Confirmed, still collecting"** section. Spec §5d is unchanged: Sponsorships made still lists only
completed items.

**Input masks.** `formatCNIC` → `12345-1234567-1` and `formatMobile` → `0300-123 4567` (both in
`lib/helpers.js`) are applied as the user types, on the recipient dialog and the villager-owner form.
**Deliberately NOT applied to the sponsor's phone on checkout** — sponsors pay in USD/AUD/SAR and are
often overseas, so a Pakistani mask would corrupt a valid foreign number.

**Admin money fields** use `formatAmountInput` / `parseAmountInput` (`lib/currency.js`): thousands
separators while typing, 2dp settled on blur. They are `type="text"` + `inputMode="decimal"` because
`<input type="number">` cannot display separators. Decimals are NOT applied mid-keystroke — doing so
fights the caret and makes the field unusable.

**⛔ ICONOGRAPHY RULE — non-negotiable.** This is a Muslim charity in Pakistan. **Never use pig, pork,
or piggy-bank imagery anywhere on this site.** A `PiggyBank` icon shipped on the partial-sponsorship
chips and was rightly rejected by the client; it is replaced everywhere with **`HandCoins`**.
Before adding any icon, check it against this rule — also avoid alcohol and other-faith religious
symbols. `grep -rn "PiggyBank\|Piggy" src/` must return nothing.

**Chip states (current spec — supersedes the earlier §5b "nothing until confirmed" rule).**
`src/components/PartialChips.jsx` renders exactly ONE chip, in priority order:

| Condition | Chip |
|---|---|
| `confirmed > 0` and balance open | **Partially sponsored · Rs X left** |
| `pending > 0`, nothing confirmed yet | **Partially reserved · Rs X left** |
| Qualifies, nothing committed | **Partial sponsorship available** |

Only one chip shows because **card height is a hard design constant** — a second chip wraps on narrow
cards and breaks it. Chips are `whitespace-nowrap`; verified no overflow at 375px (widest chip 197px).

The **remaining balance** is shown on all three public surfaces: home carousels, `/select`, and the
`/sponsor` checkout ("Rs X available to sponsor"). There is **no separate product detail route** —
`/select` is the detail surface. All amounts are the DERIVED remaining balance; **`value_pkr` is never
modified by a sponsorship**, and the item's real value stays displayed alongside.

**Fixed (was a defect):** partial-sponsorship chips were rendered **inline in `ProductCard` only**, so
the home-page **Meet the Herd** and **Equipment** carousels — which have their own markup — showed no
chips even when an item qualified. Now extracted into **`src/components/PartialChips.jsx`**, the single
source of truth, used by ProductCard *and* both carousels.
**If you add another surface that renders a product, render `<PartialChips>` on it too** — that drift is
exactly what caused this bug.

**Fixed (was a defect):** four `[role="switch"]` toggles reached screen readers with **no accessible
name**. Root cause: they used `<label htmlFor={id}>`, but a `<button role="switch">` is **not a labelable
element**, so `htmlFor` bound to nothing. Now wired with `aria-labelledby` + `aria-describedby`.
Verified on the live deploy — all six switches announce correctly:
"Allow multi-select on the selection page", "Gather recipient info on confirm", "Collect owner info on
Manage Products", "Enable partial payments", "Partial payments for Live Stock / Equipment", and the
sponsor page's "Partial sponsor".
**Don't reintroduce it:** never use `<label htmlFor>` on a switch built from a `<button>`.

### Admin user lifecycle — rebuilt 2026-08-16

Four defects, one root cause each. All four are fixed; the last three need migration 0005 applied.

**1. "PKCE code verifier not found in storage" when opening an invite on a phone.**
`inviteAdmin` used `signInWithOtp` on the main client, which runs the **PKCE** flow. PKCE writes a
`code_verifier` into the localStorage of the browser that STARTS the flow — the admin's laptop — and
mails a link carrying only `?code=`. Redeeming it requires that verifier, which the invitee's phone
never has. So the invite could only ever be opened on the sending admin's own browser: a 100%
failure, not an intermittent one.

Fixed by sending invites through **`src/supabase/inviteClient.js`**, a second Supabase client whose
only difference is `flowType: 'implicit'` (plus `persistSession: false` and its own `storageKey`, so
it can never touch the signed-in admin's session). No verifier is involved; the link comes back
carrying the session in the URL fragment, redeemable on any device.

**`src/supabase/authRedirect.js`** picks that up. It runs in `main.jsx` **before the router mounts**,
because Supabase overwrites the fragment of the redirect target — `…/#/auth/callback` comes back as
`…/#access_token=…` and HashRouter would render Not Found over a perfectly good invite. It handles
all four shapes that can arrive (implicit tokens, `token_hash`, a stray `?code=`, and an
`error_code=otp_expired` payload), scrubs the credential out of the address bar with `replaceState`,
then hands off to a real route. A `hashchange` listener covers the case where the link is clicked
while the site is already open in that tab (fragment changes, no reload, boot pass never runs).
**Don't move `consumeAuthRedirect()` after `createRoot`** — the ordering is the whole point.

`AuthCallback` is now the handler for the leftovers rather than the main path, and translates
Supabase's developer-facing errors into sentences an admin can act on.

**2. Deleting an admin didn't delete anything in Supabase.** `deleteAdmin` removed the
`admin_profiles` row only; the `auth.users` row lived on with its sessions. `admin_user_delete()`
(0005) deletes the auth user, which cascades to the profile, identities and sessions.

**3. Re-inviting a deleted address did nothing visible.** Because the auth user still existed, no
INSERT fired on `auth.users`, so `on_auth_user_created` never re-created the profile — the person
was invited into a void. Two fixes: deletes are now real (#2), and `admin_invite_prepare()` restores
the profile directly when the address already exists in `auth.users`.

**4. An invited admin displayed their role before ever signing in.** The panel showed "owner"
the moment the invite went out, which read as "this person is now Super Admin" — exactly wrong while
their link was failing. `admin_users_list()` returns `auth.users.last_sign_in_at`, and anyone
without one renders as **Invited**, with a "Resend invite" button, and the line "they become
&lt;role&gt; once they sign in for the first time".

**Security, closed on the way past (0005/0006).** The old signup trigger gave an `admin_profiles`
row to *every* new auth user, and every write policy read `auth.role() = 'authenticated'` — so any
signed-in Supabase user could write products, sponsorships and settings, and "Deactivate" was purely
cosmetic. Admin profiles are now created only for e-mails on the `admin_invites` allow-list, with
the role taken **from the allow-list, never from `user_metadata`** (which a user can set on
themselves), and every write policy is `to authenticated using (public.is_active_admin())`.
`SuperAdminLayout` asks the database on each session change instead of trusting the JWT, so a
deactivated or deleted admin loses the panel immediately rather than at token expiry.

**Open items:**
- ✅ **Auth is live.** SMTP runs through Resend (`smtp.resend.com:465`, user `resend`, sender
  `info@codexmill.com`). Site URL and the redirect allow-list point at the Pages deploy. The first Super
  Admin (`haznain666@gmail.com`) was invited by email, set their own password, and signed in; the
  `on_auth_user_created` trigger wrote the `admin_profiles` row (role `admin`, active).
  **Gotcha:** Resend rejects every send until the domain is marked Verified in its dashboard — correct
  DNS records are not enough, someone must press Verify. That failure surfaces as a bare `500` on
  `/auth/v1/invite`; the real message is in Auth Logs.
- **Supabase Auth URLs point at production.** Site URL = `https://igasial.codexmill.com`; the redirect
  allow-list holds both `https://igasial.codexmill.com/**` and the Pages URL (kept for staging).
- ⛔ **Hostinger MCP connector still returns `Unauthenticated`** — irrelevant now that deployment goes
  through Git, but it means Claude cannot inspect or manage the hosting account directly. Add an API
  token (hPanel → API) to the MCP config if that is ever wanted.
- Hostinger's Git deployment must target the **subdomain's own document root**, not `public_html`.

---

## 5. Architecture

### Data layer

- **`src/supabase/client.js`** — the configured client.
  `auth: { persistSession: true, flowType: 'pkce', detectSessionInUrl: false }`.
  `detectSessionInUrl` is **off** because HashRouter eats the fragment; the callback is handled by hand.
- **`src/supabase/api.js`** — every read/write, plus the **snake_case ⇄ camelCase mapping**
  (`toProduct` / `fromProduct`, `toSponsorship`, `toSettings` / `fromSettings`). Components never see
  snake_case. Also holds `friendlyError()`, which turns the DB guard-trigger errors
  (over-sponsoring, locked product, RLS) into human sentences for toasts.
- **`src/store/AppContext.jsx`** — single `useReducer` store exposed via `useApp()`. Supabase-only.
  On mount it fetches products / sponsorships / settings and opens three Realtime channels
  (`postgres_changes` on each table); any change re-reads that table.

`useApp()` exposes:
- state: `products`, `livestock`, `equipment`, `sponsorships`, `settings`, `cart`, `loading`,
  `session`, `authLoading`, `MAX_BANKS`
- derived: `statusOf(id)`, `remainingOf(id)`, `committedOf(id)`, `confirmedOf(id)`, `statsOf(id)`,
  `isPartialEligible(product)`, `hasOpenSponsorships(id)`, `availableProducts`, `reservedProducts`,
  `completedProducts`, `sponsorsOf(id)`, `pendingOf(id)`, `sponsorshipsOf(id)`, `bankById`, `productById`
- actions: `addProduct`, `updateProduct`, `deleteProduct`, `setSettings`, `addBank`, `updateBank`,
  `deleteBank`, `toggleCart`, `setCart`, `removeFromCart`, `clearCart`, `sponsor`,
  `confirmSponsorship`, `cancelSponsorship`, `releaseSponsorship`, `signIn`, `signOut`

**All action functions are async and can throw** — call sites wrap them in `try/catch` and toast
`e.message`.

**What's global vs local:** products, sponsorships, settings and admin users are global (Postgres).
The **cart** is still per-browser (`localStorage` key `iga-cart`) — it's a sponsor's in-progress selection.

**Auto-release — the authority is the DATABASE, not the browser.** `release_expired_sponsorships()`
runs hourly under pg_cron and sets any **pending** sponsorship older than `reservation_days` to
`released` (0 = never), freeing its amount.

The client also sweeps every 60s for snappy feedback, but that is a **convenience only**: RLS blocks
anonymous writes, so a visitor's sweep silently no-ops. Before pg_cron, an unattended site kept items
reserved forever. If you ever change the release rule, change it in `0004_auto_release.sql` first —
the client sweep must never be the only thing enforcing it.

### Database (`supabase/migrations/`)

- `0001_init.sql` — schema, view, guard triggers, RLS. `0002_seed.sql` — content. `0003_realtime.sql` —
  adds the three tables to the `supabase_realtime` publication (idempotent).
- **`products`** holds livestock AND equipment, discriminated by `kind` (`'livestock' | 'equipment'`).
  Livestock uses breed/age/weight/type/owner; equipment uses warranty/life_span. Both use
  name/details/images/value_pkr.
- **`sponsorships`** is a **ledger** — many rows per product:
  `{ id, product_id, donor, bank_id, amount_pkr, is_partial, status, recipient, reserved_at,
  confirmed_at, cancelled_at }`, status ∈ `pending | confirmed | cancelled | released`.
- **Availability is DERIVED, never stored.** The `product_status` view gives
  `confirmed_pkr / pending_pkr / committed_pkr / remaining_pkr` and a status of
  `available | partial | reserved | sponsored`. **A product's `value_pkr` is never mutated.**
- **`app_settings`** is a single row (`id = 1`), snake_case columns.
- **`admin_profiles`** mirrors `auth.users` via the `on_auth_user_created` trigger.
- DB triggers enforce: no over-sponsoring, and no deleting a product with open (pending/confirmed)
  sponsorships. Both surface as friendly toasts.

### Routing — `src/App.jsx`
- `PublicLayout` wraps `/` (Home), `/select` (ProductSelection), `/sponsor` (SponsorPage),
  `/thank-you`, `*` (NotFound). `/donation` redirects to `/sponsor` for old links.
- `/auth/callback` (AuthCallback) and `/set-password` (SetPassword) are standalone lazy routes.
- `SuperAdminLayout` wraps `/super-admin` (Dashboard, index), `products`, `confirmations`,
  `sponsorships`, `settings`, `admin-users`. **The layout is the auth gate** — no session ⇒ it renders
  `AdminAuth` instead of the panel, so every child route is protected in one place.
- Super Admin pages are `React.lazy` (separate chunks).

---

## 6. Data model (app-side, camelCase)

**Product**
```
{ id, kind: 'livestock'|'equipment', name, details (<=300), images: Image[], valuePKR,
  breed, age, weight, type: 'Calf'|'Heifer'|'Cow'|'Bull',      // livestock
  owner: { ownedByFarm, firstName, lastName, cnic, phone, email },
  warranty, lifeSpan,                                           // equipment
  archived, createdAt }
```

**Sponsorship**
```
{ id, productId, donor:{firstName,lastName,email,phone}, bankId, amountPKR, isPartial,
  status: 'pending'|'confirmed'|'cancelled'|'released',
  recipient: null | {firstName,lastName,cnic,phone,email},
  reservedAt, confirmedAt, cancelledAt, createdAt }
```

**Image** (portrait model — `src/lib/images.js`, unchanged)
`{ url, zoom(1..2.5), posX(0..100), posY(0..100) }`; helpers `normalizeImage(s)`, `imageUrl`,
`firstImageUrl`, `imageStyle`, `fileToScaledDataURL`, `PORTRAIT_ASPECT = '4 / 5'`.

**Settings**
```
{ multiSelect, gatherRecipientInfo, collectOwnerInfo, reservationDays, terms, banks[], fxRates,
  partialEnabled, partialLivestockEnabled, partialLivestockMin,
  partialEquipmentEnabled, partialEquipmentMin }
```

**Partial eligibility:** `partialEnabled && <category>Enabled && valuePKR >= <category>Min`.

---

## 7. Key flows & behaviors

- **Home** — Hero, About, Concept, Highlights, Process, **Herd** (livestock carousel),
  **Equipment** (equipment carousel), Transparency, MasterPlan, Contact.
- **Selection (`/select`)** — all available live stock + equipment, a category filter
  (Everything / Live Stock / Equipment), **paginated 6/page**. `settings.multiSelect` on ⇒ checkbox +
  "Add to sponsorship" + floating cart bar; off ⇒ per-card "Sponsor now".
- **Sponsor page (`/sponsor`)** — sponsor form, T&C, bank dropdown, and per-item **Partial Sponsor**
  toggle for eligible items (with an explanatory line). Amount is validated `> 0` and
  `<= remaining` (not the full value); the remaining amount is always shown. "Proceed" inserts one
  **pending** sponsorship row per item and routes to `/thank-you`.
- **Hidden when full:** a product disappears from the public site once *committed* (pending +
  confirmed) reaches its value. Cancel / release / auto-release frees the amount and it reappears.
- **Confirmations (super-admin)** — one **compact** card per *pending sponsorship* (not per product):
  no hero image, no lightbox, just small thumbnails that **magnify on hover/focus**, plus amount,
  remaining, sponsor contact, reserved date and the auto-release countdown. Paginated 6/page.
  Confirm opens the recipient popup when `gatherRecipientInfo` is on.
- **Sponsorships Made (super-admin)** — a product appears **once**, only when fully sponsored with
  every contribution confirmed. The card lists **all** sponsors with contact details and each one's
  amount, plus the recipient.
- **Manage Products (super-admin)** — two tabs, **Animal Profile** and **Equipment**, each with its own
  Add button and editor fields. Both use the **same** `ImageManager` (up to 5 portrait images with
  per-image zoom / horizontal / vertical sliders + Reset). Products with open sponsorships hide the
  edit/delete controls and explain why.
- **Settings (super-admin)** — sponsorship toggles, **Partial Payment** (master toggle + independent
  toggle & PKR threshold for Live Stock and Equipment), reservation hold time, exchange rates, terms,
  banks (max 5).
- **Admin Users (super-admin)** — list `admin_profiles`, invite by email, edit name/role,
  deactivate/reactivate, delete. You can't deactivate or delete yourself.

---

## 8. File map

```
src/
  main.jsx                      # entry: HashRouter > AppProvider > App
  App.jsx                       # routes; PublicLayout + auth routes + lazy SuperAdmin routes
  index.css                     # Tailwind layers + component classes (.btn-*, .field-*, .card, .chip, .container-x)
  data/constants.js             # ANIMAL_TYPES, PRODUCT_KINDS, KIND_LABEL, MAX_IMAGES, DETAILS_MAX
  lib/
    currency.js                 # FX + formatting (rates-aware)
    helpers.js                  # uid, initials, fullName, formatDate/Time, isEmail, isPhone, clamp
    images.js                   # portrait image model + helpers + upload downscale
  supabase/
    client.js                   # configured client (PKCE, detectSessionInUrl off)
    api.js                      # all CRUD + realtime + auth + admin users + case mapping
  store/
    AppContext.jsx              # Supabase-only store; useApp(); derived money math; auto-release sweep
    ToastContext.jsx            # toast system (useToast)
  components/
    Header, Footer, Logo, PageHeader, SectionHeading, Reveal, ScrollToTop,
    Modal, Lightbox, ProductCard, Pagination, CurrencyPills, StatusBadge, EmptyState
  sections/                     # Hero, About, Concept, Highlights, Process, Herd,
                                #   Equipment, Transparency, MasterPlan, Contact
  pages/
    Home, ProductSelection, SponsorPage, ThankYou, NotFound,
    ManageProduct, ConfirmSponsorships, SponsorshipsMade, SettingsPage, AdminUsers,
    auth/AdminAuth, auth/AuthCallback, auth/SetPassword,
    superadmin/SuperAdminLayout, superadmin/Dashboard
supabase/migrations/            # 0001_init … 0004_auto_release, 0005_admin_users, 0006_admin_rls
public/
  logo.jpg, img/hero-mosque.png, img/aerial.png, img/masterplan.png, img/logo-seal.jpg
```

---

## 9. Design system

- Palette **"Emerald & Gold"** (derived from the logo):
  - primary emerald `#1E8A6E` (brand-500), pine `#0F4A3C` (brand-800), moss `#517336`,
    gold CTA `#FBB315` (gold-400), ink `#1C1B16`, cream `#F6F7F3`, sand `#EBEDE4`, parchment `#FBFBF8`.
  - Full ramps + `moss`, `pine`, shadows (`soft`/`lift`/`gold`), fonts, animations in `tailwind.config.js`.
- Style direction: **Organic Biophilic** — rounded corners (cards 12–24px), soft natural shadows,
  generous whitespace (tightened for mobile). Buttons: `.btn-gold` (primary CTA), `.btn-primary`,
  `.btn-outline`, `.btn-ghost`, `.btn-pine`, sizes `.btn-lg/md/sm`.
- **Uniform product card is a design constant.** `ProductCard` is used for live stock AND equipment,
  on the public site AND in Super Admin. Every zone has a reserved height (thumbnail strip `h-[60px]`,
  details `line-clamp-2 h-10`, owner row `h-5`, chip row `min-h-[26px]`) and long text truncates, so
  cards never resize because content is longer. Verified identical: 861px at 375px, 914px at 1280px.

---

## 10. Gotchas / decisions (don't re-break these)

- **Modal focus (fixed):** `Modal`'s focus/keydown `useEffect` must depend ONLY on `[open]`, using an
  `onCloseRef` for the latest `onClose`. If `onClose` is in the deps, the effect re-runs on every parent
  render (each keystroke) and steals focus to the Close button. It focuses the **first form field**.
- **AnimatePresence + portal + StrictMode (fixed):** `Modal` and `Lightbox` render `null` when closed
  (enter animation only). Do NOT wrap their mount/unmount in `AnimatePresence` again — under React 18
  StrictMode + `createPortal` the exit animation left an invisible `opacity:0` overlay blocking clicks.
- **`detectSessionInUrl` must stay off.** HashRouter would consume the fragment. `/auth/callback`
  reads the credential from both `location.search` and the hash query, and its effect is guarded by a
  ref because StrictMode double-invokes and a code can only be redeemed once.
- **PKCE `code` only works in the browser that started the flow.** This is why invites go out through
  the implicit-flow `inviteClient` and never through the main (PKCE) client. **Do not "tidy up" that
  second client away** — collapsing it back onto `supabase` re-breaks every invite opened on a phone.
  `AuthCallback` still prefers `token_hash` + `verifyOtp()` over `exchangeCodeForSession()` so old
  links and `{{ .TokenHash }}` templates keep working.
- **`consumeAuthRedirect()` must run before `createRoot`** (`src/main.jsx`). Supabase replaces the
  fragment of the redirect URL, so the auth payload and the HashRouter route occupy the same slot;
  the payload has to be read and the URL rewritten to a route before the router looks at it.
- **Never take an admin's role from `user_metadata`.** The invitee can set their own metadata, so it
  is an escalation path. The role comes from the `admin_invites` allow-list row written by an
  existing admin.
- **Settings arrive after mount.** Anything that seeds local state from `settings` must reconcile in an
  effect. `SponsorPage` does this for the bank dropdown default — without it the visible first option
  and the submitted `bankId` disagreed (a real bug caught in browser QA).
- **Grid children need `min-w-0`.** The `<select>` of bank names has a wide min-content, which blew the
  page out to 414px at a 375px viewport until `min-w-0` was added to the `SponsorPage` grid children.
- **Availability is computed client-side** in `AppContext` (`money()`), mirroring the `product_status`
  view. Views don't emit `postgres_changes`, so reading the view would not be realtime. Keep the two
  in sync if the status rules ever change.
- **Product `value_pkr` is never mutated by a sponsorship.** All money movement is ledger rows.
- **RLS:** anon can read products/sponsorships/settings and INSERT a `pending` sponsorship. Everything
  else needs an authenticated session. Deleting an `admin_profiles` row removes panel access but does
  **not** delete the `auth.users` row (that needs the service-role key / dashboard).
- **Cart is never global.** Products / sponsorships / settings are.
- **Bundle:** admin is code-split (`React.lazy`); `vite.config.js` `manualChunks` splits
  react / supabase / motion.

---

## 11. Related context

- Memory: `project-iga-sial-farm` (in `C:\Users\PC\.claude\projects\D--\memory\`).
- Source assets & original pptx: `D:\IGA Sial\`.
- Client preferences on file: $10k agency-grade quality bar; keep project markdown docs in the Obsidian
  vault by project folder (this State.md lives in-repo intentionally so a new session finds it immediately).
