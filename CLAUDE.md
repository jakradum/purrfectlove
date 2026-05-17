# CLAUDE.md — Purrfect Love Codebase Guide

This file is for Claude Code only. It is not committed to the remote repo.
Update it as the project evolves.

---

## What This Project Is

**Purrfect Love** is a cat adoption and rescue community based in India.
It has two distinct products in this repo:

1. **Main site** (`purrfectlove.org`) — adoption listings, blog, content
2. **Care portal** (`care.purrfectlove.org`) — a members-only cat sitting marketplace where verified members can request and offer cat sitting for each other

Almost all active development happens on the **care portal**. When the user says "the portal" or "the community", they mean the care portal.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Vercel |
| Auth | Supabase (OTP-based, no passwords) |
| Database | Supabase (PostgreSQL) |
| CMS / Profiles | Sanity Studio |
| Email | Resend |
| Analytics | PostHog |
| Maps | Leaflet + OpenStreetMap / Nominatim (reverse geocoding) |
| Cron triggers | **cron-job.org** (see Infrastructure section) |

---

## Repository Structure

```
src/
  app/
    api/
      care/           ← all care portal API routes
        bookings/     ← request, accept, decline, cancel, my, [id], messages (GET/POST), messages/attachment (POST)
        cron/         ← server-side scheduled jobs
          reminder/             ← 2-day-before-sit emails
          expire-bookings/      ← safety-net fallback at 120h
          pending-booking-nudges/ ← 24h/48h reminders + auto-withdraw at 96h
        sitters/      ← marketplace sitter list + single-member lookup
        send-otp/     ← OTP login
        verify-otp/
        profile/
        messages/
        notifications/
        admin/        ← member approval/rejection, deletion emails
        ...
      cron/           ← non-care cron jobs (scores, sit-prompts, message-reminders)
    care/             ← care portal pages (Next.js App Router)
      [memberId]/     ← public member profile page
      bookings/
      login/
      profile/
      join/
      ...
  components/
    Care/             ← all care portal React components
      Marketplace.jsx
      SitterCard.jsx
      SitterProfile.jsx
      BookingDetailModal.jsx
      BookingMessages.jsx
      BookingRequestModal.jsx
      BookingsPage.jsx
      FilterBar.jsx
      AvailabilityStrip.jsx
      AvailabilityCalendar.jsx
      CareNavbar.jsx
      Skeletons.jsx
      Care.module.css   ← single CSS module for the entire care portal
      ...
  middleware.js         ← auth guard for all care portal routes
  lib/
    supabaseServer.js   ← getSupabaseUser(), createSupabaseDbClient()
    resend.js
    posthogServer.js
```

---

## Branch Workflow

- **`staging`** — all development happens here
- **`main`** — production; only merge when ready to release
- Always push to both `staging` and `main` when deploying (user confirms before push)
- Never push until the user says it's ready

---

## Infrastructure

### Cron Jobs — IMPORTANT

**Cron jobs are triggered by cron-job.org, NOT GitHub Actions.**

GitHub Actions was set up first but was failing. The `.github/workflows/cron-*.yml` files still exist but are not the active trigger — cron-job.org calls the API endpoints directly.

**Every time you add a new cron endpoint, you must do ALL of the following:**

1. Create the route under `src/app/api/care/cron/` or `src/app/api/cron/`
2. Add its path to `PUBLIC_PREFIXES` in `src/middleware.js` — without this, the middleware intercepts the unauthenticated request and redirects to `/login` (307), breaking the cron silently
3. Tell the user to register it on cron-job.org with:
   - Method: `GET`
   - Header: `Authorization: Bearer <CRON_SECRET>`
   - Schedule: as required

**Active cron endpoints:**
| Endpoint | Schedule | What it does |
|---|---|---|
| `/api/care/cron/reminder` | Daily 02:30 UTC | 2-day-before-sit contact release emails to both parties |
| `/api/care/cron/expire-bookings` | Hourly | Safety-net: sets very old pending bookings (120h+) to `expired` |
| `/api/care/cron/pending-booking-nudges` | Hourly | 24h/48h reminders to sitter; auto-withdraws at 96h or 12h before sit |
| `/api/cron/calculate-scores` | — | Recalculates member scores |
| `/api/cron/sit-prompts` | — | Post-sit confirmation prompts |
| `/api/cron/message-reminders` | — | Unread message reminders (48-49h old) |

### Vercel

Deployed automatically on push to `main`. Care portal is served from `care.purrfectlove.org` via a subdomain rewrite in `middleware.js` — requests to `care.purrfectlove.org/x` are internally rewritten to `/care/x`.

---

## Authentication

- **OTP-based** — no passwords. User enters email → receives a 6-digit OTP → verified → Supabase session created
- Flow: `send-otp` route → `verify-otp` route → session cookie set
- Supabase `user.user_metadata.sitterId` holds the Sanity `catSitter._id` — this is the link between auth and profile
- The middleware (`src/middleware.js`) protects all care portal routes. Public paths are explicitly listed in `PUBLIC_PREFIXES` — any route not in that list requires a valid Supabase session

### memberVerified flag

Sanity `catSitter` documents have a `memberVerified` boolean. Studio-added members may have `null` (not `false`) for this field.
- The marketplace sitters API (`/api/care/sitters`) uses `memberVerified == true` (strict)
- The OTP login route backfills `memberVerified: true` in Sanity if a user logs in successfully and the flag is unset

---

## Data Architecture

### Two data stores — understand which owns what

**Sanity** owns member profiles:
- Document type: `catSitter`
- Key fields: `name`, `email`, `phone`, `location` (lat/lng), `locationName` (cached neighbourhood), `bio`, `photo`, `coverImage`, `avatarColour`, `canSit`, `canDoHomeVisit`, `canHostCats`, `maxCatsPerDay`, `feedingTypes`, `behavioralTraits`, `cats[]`, `memberVerified`, `identityVerified`, `trustedSitter`, `siteAdmin`, `hideEmail`, `hideWhatsApp`, `deletionRequested`, `otpPermanentlyBlocked`
- Note: `availabilityDefault`, `unavailableDatesV2`, `blockedByBooking` were migrated to Supabase. The fields may still exist in Sanity documents as stale data — ignore them; the authoritative source is now Supabase.

**Supabase** owns transactional data and availability:
- `bookings` table — all booking requests and their lifecycle
- `booking_messages` table — in-booking message thread between sitter and parent
- `membership_requests` table — join form submissions
- `sitter_availability` table — member availability (migrated from Sanity in April 2026)

### Bookings Table (Supabase)

```
id                      text PK
booking_ref             text UNIQUE       human-readable ref e.g. "Purr2304"
sitter_id               text              Sanity catSitter._id
parent_id               text              Sanity catSitter._id
start_date              date
end_date                date
cats                    text[]            cat names (display only)
cat_keys                text[]            Sanity cat _key values (used for vaxx gate)
message                 text
sit_type                text              'home_visit' | 'drop_off' | null
status                  text              see lifecycle below
created_at              timestamptz
notified_at             timestamptz       when sitter was emailed the request
notification_delivered  boolean
responded_at            timestamptz       when sitter accepted/declined
response_time_hours     numeric
cancellation_reason     text
cancelled_by            text              sitter_id | parent_id | 'system'
cancelled_at            timestamptz
deleted_at              timestamptz       soft delete
reminder_24h_sent_at    timestamptz       set by pending-booking-nudges cron
reminder_48h_sent_at    timestamptz       set by pending-booking-nudges cron
```

### Booking Status Lifecycle

```
pending → confirmed   (sitter accepts)
pending → declined    (sitter declines)
pending → cancelled   (parent withdraws, or system auto-withdraws at 96h/12h-before-start)
pending → expired     (safety-net cron at 120h — no emails sent)
pending → unavailable (race condition — another booking already filled those dates)
confirmed → cancelled (either party cancels after acceptance)
```

### sitter_availability Table (Supabase)

```
sitter_id            text PRIMARY KEY   Sanity catSitter._id
availability_default text               'available' | 'unavailable' (default: 'available')
unavailable_dates    text[]             ISO date strings e.g. ['2026-05-01', '2026-05-02']
blocked_by_booking   text[]             ISO date strings blocked by accepted bookings
```

**Two atomic SQL functions** handle `blocked_by_booking` to avoid read-modify-write races:
- `availability_merge_blocked(p_sitter_id, p_dates)` — called on booking accept; upserts row if missing, then adds dates
- `availability_unmerge_blocked(p_sitter_id, p_dates)` — called on booking cancel; upserts row if missing, then removes dates

Both functions upsert the `sitter_availability` row — safe to call even if the member has never had availability set up. Use `db.rpc('availability_merge_blocked', ...)` / `db.rpc('availability_unmerge_blocked', ...)` — never read-modify-write `blocked_by_booking` manually.

### Availability — Two Separate Fields (Critical)

These are completely independent. Do not confuse them:

| Field | Managed by | Used for |
|---|---|---|
| `unavailable_dates` (was `unavailableDatesV2`) | Sitter manually via AvailabilityStrip UI | Sitter's self-reported unavailability |
| `blocked_by_booking` (was `blockedByBooking`) | Booking flows automatically | Dates auto-blocked when a booking is accepted; cleared when cancelled |

The marketplace filters on both. The availability strip/calendar only reads/writes `unavailable_dates`. If a sitter's dates look blocked after a cancellation and it's not from `blocked_by_booking`, it's because they manually marked those dates in `unavailable_dates`.

API routes use camelCase internally (`unavailableDatesV2`, `blockedByBooking`) when returning JSON to the client — the column → response field mapping is in `profile/route.js` and `sitters/route.js`.

---

## Contact Release Rules

Contact details (email, phone) between sitter and parent are **only released when**:
1. Booking status is `confirmed` AND
2. Current time is within 2 days of `start_date`

This is enforced in `src/app/api/care/bookings/[id]/route.js`. The 2-day-before-sit reminder cron also emails contact details at that threshold.

### Location Sharing

- **Home visit** (sitter travels to parent): sitter sees parent's location, parent does not see sitter's
- **Drop-off** (parent travels to sitter): parent sees sitter's location, sitter does not see parent's

---

## Email Pattern

All transactional emails use Resend. The branded email template (`brandedEmail` + `ctaButton` helpers) is copy-pasted into each route file that needs it — it is not a shared import. When adding emails to a new route, copy the helpers from `src/app/api/care/cron/reminder/route.js`.

From address: `Purrfect Love Community <no-reply@purrfectlove.org>`

---

## Distance Calculation

Haversine formula with a **1.66x road multiplier** (India-specific) used throughout. Straight-line km × 1.66 ≈ road km. Used in:
- Marketplace card filtering (radius)
- Booking detail modal (distance between parties)
- 2-day reminder emails

---

## Key Gotchas

- **Middleware whitelist**: any new API route that doesn't need session auth (webhooks, crons, OTP) must be added to `PUBLIC_PREFIXES` in `src/middleware.js` or it will 307 redirect to login
- **Sanity null vs false**: `memberVerified == true` is strict GROQ — members added directly in Studio may have `null`, not `false`. Be intentional about `== true` vs `!= false`
- **`sitterId` is the Sanity `_id`**: both sitter and parent are `catSitter` documents — the distinction is only in the booking's `sitter_id` / `parent_id` columns
- **No `seen_at` on bookings**: there is no field tracking when the sitter viewed a request. Only `notified_at` (email sent) and `responded_at` (acted on) exist
- **Soft deletes**: bookings use `deleted_at` for soft deletes. Always filter `.is('deleted_at', null)` in queries
- **Care subdomain rewrite**: `care.purrfectlove.org/x` → internally `/care/x`. Middleware handles this after auth check. API routes are excluded from the rewrite
- **`locationName`**: a cached reverse-geocoded neighbourhood name stored on `catSitter` in Sanity. Routes that need it check for a cached value first, then call Nominatim and write back asynchronously — never block on it
- **Vaccination gate**: booking requests are blocked (client-side and server-side 422) if any selected cat is missing a vaccination record in Sanity (`vaccinationRecord.file.asset._ref`). `cat_keys` on the bookings row is the link back to specific Sanity cat `_key` values for this check.
- **Availability is now in Supabase**: do not read or write `availabilityDefault`, `unavailableDatesV2`, or `blockedByBooking` from/to Sanity. All availability reads/writes go through the `sitter_availability` table. The Sanity fields are stale and will be cleaned up later.
- **Booking messages polling**: the care portal has no client-side Supabase client, so `BookingMessages` uses 5s polling (not Supabase Realtime). Mark-as-read fires server-side on every GET fetch. Realtime infrastructure is in place for a future upgrade.
- **`hasUnreadMessage` on bookings list**: `/api/care/bookings/my` queries `booking_messages` for unread counts and includes `hasUnreadMessage: bool` on each booking. `BookingsPage` shows a red dot and clears it optimistically on modal open.
- **Parked branch `feat/blocked-dates-display`**: WIP work to show `blocked_by_booking` dates as amber in `AvailabilityStrip` (both mini strip and expanded calendar). Not working correctly — parked for later.

---

## Environment Variables (names only)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
SANITY_API_TOKEN
RESEND_API_KEY
CRON_SECRET
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

---

## SQL Migrations

Schema changes are tracked as standalone `.sql` files in the project root:
- `supabase-phase2.sql` — main schema
- `supabase-pending-nudges.sql` — `reminder_24h_sent_at`, `reminder_48h_sent_at` columns + index
- `supabase-sitter-availability.sql` — `sitter_availability` table + `availability_merge_blocked` / `availability_unmerge_blocked` SQL functions (April 2026)
- `booking_messages` table — created directly in Supabase SQL editor (no .sql file); columns: `id uuid`, `booking_id text`, `sender_id text`, `body text`, `attachment_url text`, `attachment_name text`, `created_at timestamptz`, `read_at timestamptz`, `deleted_at timestamptz`. Realtime enabled (`REPLICA IDENTITY FULL` + added to `supabase_realtime` publication).

Run migrations manually in the Supabase SQL editor. There is no automated migration runner.

### One-time data migration scripts

`scripts/` contains one-time scripts run locally with `node`:
- `scripts/migrateSitterAvailability.mjs` — migrated availability data from Sanity to `sitter_availability` (30 members, April 2026; already run, do not re-run)
- `scripts/notifyVaccinationRecords.mjs` — emailed all verified members about vaccination record requirement (April 2026; already run)
