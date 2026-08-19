# Release Notes — v2.1 "Admin accounts"

**IGA Sial Farm** · 16 August 2026 · live at **https://igasial.codexmill.com**

A focused release on one thing: admin accounts. Invitations now work on any phone or computer,
removing an admin actually removes them, and someone who has been invited is shown as **Invited**
until the day they first sign in.

> **One manual step:** apply `supabase/migrations/0005_admin_users.sql` and then
> `0006_admin_rls.sql` in the Supabase SQL editor. The site works before you do — it just can't
> hard-delete accounts or show the Invited status until then.

---

## What changed

**Invitation links work on any device.**
Opening an invite on a phone failed every time with *"PKCE code verifier not found in storage"*.
The link was tied to the browser it was sent from, so only the admin who sent it could open it —
which is nobody's actual phone. Invitations no longer work that way: the link now opens on any
device, in any browser, first time.

**Links that genuinely can't work now say why.**
Expired, already-used and damaged links each get a plain-English explanation and a next step,
instead of a developer error message.

**Removing an admin removes them from Supabase.**
Previously it only took away their panel profile; the underlying login stayed alive. Deleting now
removes the account, ends any session they have open, and frees the email address to be invited
again later.

**Re-inviting someone you removed works.**
Inviting an address that had been deleted used to silently do nothing — no entry appeared in the
list. That's fixed, including for accounts left behind by the old behaviour.

**"Invited" is now a status.**
An invited teammate showed their role — Owner or Admin — from the moment the invite was sent, even
though they had never signed in and, in some cases, couldn't. They now read as **Invited**, with the
date the invitation went out, a note that they become their role on first sign-in, and a **Resend
invite** button. The role appears once they've actually signed in.

**Deactivating an admin now means something.**
Deactivate and Delete previously left the person able to keep working until their session expired.
Access is now checked against the database, so it ends immediately. Signing up to Supabase no longer
grants panel access on its own — only invited addresses become admins.

---

# Release Notes — v2.0 "Sponsorship"

**IGA Sial Farm** · released 15 August 2026 · live at **https://igasial.codexmill.com**

The largest release since launch. The site moves off Firebase onto Supabase, adds **equipment
sponsorship** alongside live stock, introduces **partial payments** so several sponsors can share one
item, and puts the Super Admin panel behind a **real login**. 101 files changed.

---

## Highlights

| | |
|---|---|
| **Database** | Firebase → **Supabase Postgres** with row-level security and live updates |
| **Equipment** | A whole new category to sponsor, sitting alongside the herd |
| **Partial payments** | Several sponsors can fund one animal or machine between them |
| **Security** | Super Admin now requires a login; invite teammates by email |
| **Hosting** | Live on your own domain, auto-deploying from GitHub |

---

## 1. Sponsorship, not donation

Every "donation" is now a **sponsorship**, and every "cow" is **live stock** — in the wording, the page
addresses, and the admin screens. Old links still work: `/donation` redirects to `/sponsor`.

Public pages now speak about live stock **and** equipment wherever they describe sponsoring.

## 2. Equipment sponsorship

- A new **"Sponsor the tools behind the herd"** section on the home page, mirroring Meet the Herd.
- Equipment carries **title, description, price, warranty, life span and photos**.
- Super Admin gains **Equipment** and **Add Equipment** tabs beside Animal Profile, with the same
  multi-photo upload and per-image zoom and positioning used for animals.
- Four starter items are seeded: milking machine, chaff cutter, solar water pump, milk chilling tank.

## 3. Partial payments

Several sponsors can now share the cost of one item.

**You control it** in Settings → Partial payment: a master switch, plus an independent switch and a
minimum value for **Live Stock** and **Equipment** separately. An item qualifies when the master is on,
its category is on, and its value is at or above that category's minimum.

**Sponsors see** a "Partial sponsorship available" tag on qualifying items, and can turn on **Partial
sponsor** at checkout to give any amount up to the remaining balance.

**Three tags tell the whole story**, everywhere an item appears:

| Tag | Meaning |
|---|---|
| **Partial sponsorship available** | Qualifies, nobody has contributed yet |
| **Partially reserved · Rs X left** | Money pledged, awaiting your confirmation |
| **Partially sponsored · Rs X left** | Money confirmed and received |

**The rules that protect you:**

- An item's price **never changes**. Every figure shown is the remaining balance, calculated live.
- An item disappears from the public site once fully committed, and **comes back automatically** if a
  contribution is cancelled or expires.
- Nobody can contribute more than the amount still open — enforced in the browser *and* in the database.
- An item with money against it **cannot be deleted** until it is fully free again.
- Each contribution goes through the **same confirmation and auto-release rules** as a full sponsorship.
- An item only reaches **Sponsorships made** once its full value is confirmed — shown as a single card
  listing every sponsor, their contact details and the amount each one gave.

## 4. Super Admin login

- The whole panel now sits behind a **Supabase email and password login**.
- New **Admin Users** tab: invite a teammate by email, they set their own password, and you can edit or
  deactivate them later.
- **Forgotten password** sends a **6-digit code** to the user's email.
- Auth emails are delivered through Resend from `info@codexmill.com`.

## 5. Admin panel improvements

- **Confirm sponsorships** cards are much more compact — the large photo is gone, replaced by
  thumbnails that magnify when you hover them.
- **Pagination** on the sponsorship selection page and the confirmations queue.
- **Every card is exactly the same size**, live stock and equipment alike, on the public site and in
  Super Admin. Long names and descriptions are trimmed with "…" rather than stretching the card.
- **CNIC** and **Mobile number** format themselves as you type — `12345-1234567-1` and `0300-123 4567` —
  on the recipient dialog and the villager-owner form.
- Money fields show **thousands separators** and settle to two decimals.

---

## Fixes

- **Confirmed part-payments were invisible.** Money you had confirmed on an item that was not yet fully
  sponsored vanished from the admin panel: it had left the confirmation queue but had not yet reached
  Sponsorships made. There is now a **"Confirmed, still collecting"** section so received money is always
  visible.
- **Partial tags were missing on the home page.** The Meet the Herd and Equipment carousels showed no
  tags at all, however the settings were configured.
- **Auto-release was unreliable.** Expiring a held contribution only happened while an administrator had
  the site open in a browser. It now runs **on the server every hour**, whether anyone is looking or not.
- **Broken images on the live site** — the logo and photographs failed to load once deployed.
- **A product photo had been removed** by the stock-photo provider and no longer loaded.
- **Settings switches were unusable with a screen reader** — they announced no name at all.
- **The Equipment minimum-value field stayed editable** while equipment partial payments were switched
  off. The card now reads as disabled, and the field and Save button are properly disabled with it.
- **Pig imagery removed.** A piggy-bank icon from the icon library was used on the partial-payment tags
  and settings. It has been replaced everywhere, and recorded as a permanent rule for this project.

---

## For the record

**Nothing was lost in the migration.** All five animals, the settings, bank accounts and terms moved
across, with the terms rewritten for sponsorship and partial payments.

**How updates reach the site now:** a change is pushed to GitHub, built automatically, and published to
`igasial.codexmill.com` without anyone uploading files by hand.

**Known items still open:**

- Partial payments for **Equipment** are switched **off** — turn the category on in Settings when you
  want it.
- Live stock is represented by a meat-cut icon in the admin panel; a dairy icon would suit better.
- A staging copy of the site remains on GitHub Pages for testing before changes go live.

*Full technical detail, including database schema and deployment runbook, is in `State.md` and
`DEPLOY.md`.*
