# Supabase Auth Migration — File Map
> Purrfect Love Care Portal · read-only audit, no code changes made

---

## Task: OTP Send Logic
**Read:**
- `src/app/api/care/send-otp/route.js` — full send flow; Twilio SMS + Resend email paths, rate limiting, Sanity OTP document creation

**Modify:**
- `src/app/api/care/send-otp/route.js` — replace entirely: Sanity OTP creation + Twilio/Resend dispatch → `supabase.auth.signInWithOtp({ phone })` or `signInWithOtp({ email })`

**Delete:**
- `src/app/api/care/send-otp/route.js` — can be deleted once Supabase OTP is wired directly from the client (if using client-side Supabase SDK) or replaced with a thin wrapper

**Notes:**
- Currently looks up the member in Sanity (`catSitter` + `teamMember`) before sending, to gate on `memberVerified == true`. This pre-send verification gate has no Supabase equivalent out of the box — needs a separate check (e.g. a Supabase Edge Function or a thin server route that validates membership before calling `signInWithOtp`).
- In-memory rate limit (3 OTPs/hour per identifier) resets on server restart. Supabase has built-in OTP rate limiting — the custom Map can be dropped.
- Phone normalisation logic (strips spaces, E.164 validation) will still be needed in the UI before calling Supabase.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` become redundant as app env vars once Supabase handles SMS delivery via its own Twilio integration (configured in Supabase dashboard).

---

## Task: OTP Verify Logic
**Read:**
- `src/app/api/care/verify-otp/route.js` — code validation, attempts counter, session cookie issuance, first-login welcome email

**Modify:**
- `src/app/api/care/verify-otp/route.js` — replace: Sanity OTP lookup + JWT cookie → `supabase.auth.verifyOtp({ phone/email, token, type: 'sms'/'email' })`; keep welcome-email logic as a post-verify side-effect

**Delete:**
- `src/app/api/care/verify-otp/route.js` — likely deleted and replaced entirely; welcome email side-effect may move to a Supabase Auth Webhook or stay as a thin post-verify API call triggered client-side after `onAuthStateChange`

**Notes:**
- Attempts counter (max 5, 1 s artificial delay on failure) is handled natively by Supabase — custom counter in Sanity (`otpCode.attempts`) can be dropped.
- Welcome email (`welcomeSent` flag on `catSitter`) is currently sent here on first login. After migration this needs to fire from either a Supabase Auth Webhook (`auth.users` insert trigger) or a post-login client-side call.
- `teamMember` fallback path (admin staff login by name lookup when no `catSitter` record exists): Supabase has no equivalent — admin accounts must have `catSitter` records, or this path is dropped and admins use a separate flow.
- Cookie (`auth_token`, HttpOnly, 90-day Max-Age) is replaced by Supabase session management (`access_token` + `refresh_token` cookies set by `@supabase/ssr`).

---

## Task: JWT Generation and Session Management
**Read:**
- `src/lib/careAuth.js` — `signToken()` and `verifyToken()` using `jose`, HS256, 90-day expiry, `JWT_SECRET` env var; payload fields: `identifier`, `identifierType`, `sitterId`, `name`, `isTeamMember`

**Modify:**
- `src/lib/careAuth.js` — replace entirely with a Supabase server-side session helper (e.g. `createServerClient` from `@supabase/ssr`); or delete and inline where needed
- `src/app/api/care/logout/route.js` — replace `Set-Cookie: auth_token; Max-Age=0` with `supabase.auth.signOut()`

**Delete:**
- `src/lib/careAuth.js` — fully redundant once Supabase issues and verifies tokens
- `src/app/api/care/logout/route.js` — replace with a Supabase signOut call (can be client-side)

**Notes:**
- Current JWT payload carries `sitterId` (Sanity document `_id`). After migration, `sitterId` must be stored in Supabase `user_metadata` at signup/approval time so protected routes can still resolve the Sanity document without an extra lookup.
- `isTeamMember` is also in the payload — store in `user_metadata` or use a Supabase custom role.
- 90-day session: Supabase default is 1-hour access token + rolling refresh token. Verify this matches UX expectations; configure `auth.session_expiry` in Supabase project settings if needed.
- `JWT_SECRET` env var becomes redundant — Supabase manages its own signing keys (JWKS).
- Cookie name changes from `auth_token` to Supabase's `sb-<project-ref>-auth-token` format.

---

## Task: Middleware Auth Verification
**Read:**
- `src/middleware.js` — cookie extraction regex (`/auth_token=([^;]+)/`), `verifyToken()` call, public route allowlist, `deletionRequested` Sanity check, subdomain rewrite logic for `care.purrfectlove.org`

**Modify:**
- `src/middleware.js` — replace manual cookie parse + `verifyToken()` with `createServerClient` from `@supabase/ssr` and `supabase.auth.getUser()`; update `deletionRequested` check to read `sitterId` from `session.user.user_metadata.sitterId` instead of the JWT payload; keep public route allowlist and subdomain rewrite logic unchanged

**Delete:** none — file stays, auth internals change

**Notes:**
- Public route allowlist will need to drop `/api/care/send-otp` and `/api/care/verify-otp` once those routes are removed (Supabase OTP called client-side).
- The `deletionRequested` Sanity query depends on `sitterId` from the token payload — this field must be in Supabase `user_metadata` before middleware can work.
- Subdomain rewrite (`care.purrfectlove.org` → `/care/*`) is entirely unrelated to auth and stays as-is.
- `verifyToken` import from `careAuth` is removed; `careAuth.js` import dropped from middleware entirely.

---

## Task: API Routes That Call getAuth() or verifyToken()
**Read:**
- `src/app/api/care/profile/route.js` — canonical `getAuth()` pattern; also contains `resolveLocation()` business logic to preserve unchanged
- `src/app/api/care/bookings/my/route.js` — typical protected route for pattern reference
- `src/app/api/care/messages/inbox/route.js` — typical protected route for pattern reference

**Modify (all 29 files — replace local `getAuth()` with Supabase session read):**
- `src/app/api/care/admin/score/route.js`
- `src/app/api/care/admin/stats/route.js`
- `src/app/api/care/admin/send-deletion-email/route.js`
- `src/app/api/care/block/[memberId]/route.js`
- `src/app/api/care/bookings/[id]/route.js`
- `src/app/api/care/bookings/accept/route.js`
- `src/app/api/care/bookings/active-count/route.js`
- `src/app/api/care/bookings/cancel/route.js`
- `src/app/api/care/bookings/my/route.js`
- `src/app/api/care/bookings/request/route.js`
- `src/app/api/care/bookings/blocked-dates/route.js`
- `src/app/api/care/contact/share/route.js`
- `src/app/api/care/data-export/route.js`
- `src/app/api/care/delete-account/route.js`
- `src/app/api/care/feedback/submit/route.js`
- `src/app/api/care/messages/[id]/read/route.js`
- `src/app/api/care/messages/inbox/route.js`
- `src/app/api/care/messages/report/route.js`
- `src/app/api/care/messages/send/route.js`
- `src/app/api/care/notifications/route.js`
- `src/app/api/care/profile/route.js`
- `src/app/api/care/report/route.js`
- `src/app/api/care/request-deletion/route.js`
- `src/app/api/care/sitters/route.js`
- `src/app/api/care/sit-confirm/route.js`
- `src/app/api/care/upload-cover/route.js`
- `src/app/api/care/upload-photo/route.js`
- `src/app/api/care/admin/approve-member/route.js` *(currently has NO auth check — add one during migration)*
- `src/app/api/care/admin/broadcast/route.js` *(currently has NO auth check — add one during migration)*

**Delete:** none — all files stay, only the `getAuth()` helper block changes in each

**Notes:**
- Every route defines an identical local `getAuth()` function (cookie regex + `verifyToken`). After migration this becomes a shared `getSupabaseUser(request)` helper in a new file (suggest `src/lib/supabaseServer.js`) — one change to propagate across all 29 files.
- All routes use `payload.sitterId` to query Sanity. After migration this value comes from `session.user.user_metadata.sitterId`. The Sanity query logic itself does not change.
- `payload.isTeamMember` is read in at least one admin route — must be in `user_metadata`.
- `admin/approve-member` and `admin/broadcast` have no auth today — opportunity to add `siteAdmin` gating.
- `admin/stats` checks `sitter.isAdmin` (field does not exist in schema; should be `siteAdmin`) — fix during migration.

---

## Task: Sanity OTP Schema
**Read:**
- `src/sanity/schemaTypes/otpCode.js` — fields: `phone`, `email`, `code`, `expiresAt`, `attempts (max 5)`
- `src/sanity/schemaTypes/index.js` — confirms `otpCode` is imported and registered in `schema.types`

**Modify:**
- `src/sanity/schemaTypes/index.js` — remove `import otpCode from './otpCode'` and remove `otpCode` from the `types` array

**Delete:**
- `src/sanity/schemaTypes/otpCode.js` — entirely redundant once Supabase manages OTP tokens natively

**Notes:**
- Purge all existing `otpCode` documents from the Sanity dataset before go-live — they contain live auth codes. Run `*[_type == "otpCode"]` in Sanity Vision and delete.
- Sanity Studio will warn if the schema type is removed while documents still exist in the dataset — purge first.
- `attempts` counter and `expiresAt` TTL are both handled natively by Supabase — no replacement schema needed.

---

## Task: Environment Variable References
**Read:**
- `src/app/api/care/send-otp/route.js` — `TWILIO_*`, `RESEND_API_KEY`
- `src/app/api/care/verify-otp/route.js` — `RESEND_API_KEY`, `NODE_ENV`
- `src/lib/careAuth.js` — `JWT_SECRET`
- `src/middleware.js` — no direct env var reads; uses imported `verifyToken` which reads `JWT_SECRET`

**Modify:**
- `.env.local` and Vercel project environment settings — add Supabase vars; retire JWT + Twilio vars once migration is verified complete

**Delete (env vars to retire after migration is stable):**
- `JWT_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

**Add (new env vars required):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — for server-side admin operations (middleware, protected API routes)

**Keep (unchanged):**
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_TOKEN`
- `RESEND_API_KEY` — still needed for adoption contract emails, booking cancellation emails, and welcome emails; if Supabase email OTP is routed through Resend as SMTP provider, same key covers both
- `NODE_ENV`

**Notes:**
- Twilio vars don't literally disappear — they move from app `.env` into the Supabase dashboard (Auth → SMS Provider settings). Same values, different location.
- `RESEND_API_KEY` is dual-purpose: OTP emails (migrating to Supabase) and transactional emails (adoption contracts, cancellations — staying in-app). Keep the var regardless.
- Add Supabase vars to Vercel for both `staging` and `production` environments; use separate Supabase projects per environment if possible.

---

## Auth architecture decisions (implemented — do not re-derive)

### Email-only OTP (decided during migration)
Phone OTP has been removed entirely. All users (India and Germany) authenticate via email OTP only.

**What changed:**
- `send-otp/route.js` — email path only; `phoneVariants`, E.164 validation, Twilio, phone Sanity queries all deleted
- `verify-otp/route.js` — hardcoded `type: 'email'`; phone Sanity lookup removed; `phoneVariants` deleted
- `LoginForm.jsx` — phone/email tab toggle, country code selector (+91/+49), phone input, `switchToPhone` all removed; single email field; `ACCOUNT_NOT_FOUND` points to join page only (no phone fallback)

**`shouldCreateUser: false`** — set on `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })`. The Sanity membership gate blocks non-members before Supabase is called, but this flag is a second line of defence: if the gate fails for any reason, Supabase will not silently create an account for the unknown email.

**Phone in Sanity schema** — `phone` field on `catSitter` documents is kept. It is used for WhatsApp contact display on member profiles. It is no longer used for authentication.

**Twilio vars** — `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` are no longer needed anywhere (Supabase phone provider is disabled). Remove from `.env.local` and Vercel project settings.

**`ipapi.co`** — kept in `LoginForm.jsx` as a stub fetch (no-op result handler) for potential future locale/country use. Currently has no functional effect.

---

## Task: Login UI Components
**Read:**
- `src/components/Care/LoginForm.jsx` — two-step UI (identifier entry → OTP input), phone/email tab toggle, country code selector (+91/+49), `ipapi.co` country detection, 60-second resend countdown, `ACCOUNT_NOT_FOUND` error path
- `src/app/care/login/page.js` — server component wrapper; passes `loginRedirect` prop to `LoginForm`
- `src/app/de/care/login/page.js` — German locale variant; identical structure to English

**Modify:**
- `src/components/Care/LoginForm.jsx` — replace `fetch('/api/care/send-otp', ...)` with `supabase.auth.signInWithOtp(...)` and `fetch('/api/care/verify-otp', ...)` with `supabase.auth.verifyOtp(...)`; replace manual post-verify redirect with `supabase.auth.onAuthStateChange('SIGNED_IN', () => router.push(loginRedirect))`
- `src/app/care/login/page.js` — add server-side session check (`createServerClient`) to redirect already-authenticated users away from the login page
- `src/app/de/care/login/page.js` — same as above

**Delete:** none — all three files stay, API calls inside them change

**Notes:**
- Two-step UI flow maps cleanly onto Supabase: `signInWithOtp` triggers delivery, `verifyOtp` completes sign-in. No structural changes to the component layout needed.
- Phone normalisation (E.164, country code prefix) must stay in the component — Supabase requires valid E.164 for phone OTP.
- `ipapi.co` country detection and 60-second resend countdown are unrelated to auth — both stay unchanged.
- The `ACCOUNT_NOT_FOUND` / 403 error state (shown when identifier not in Sanity `catSitter`) no longer exists in Supabase's native flow — Supabase sends an OTP to any valid identifier. The `memberVerified` gate must be reimplemented as either: (a) a pre-send server route that checks Sanity before calling `signInWithOtp`, or (b) a post-login check that signs the user back out if `sitterId` is not found in Sanity.
- `reason=expired` and `reason=session` URL params (set by middleware redirects) need equivalent signals from the new Supabase middleware path.
- The `LoginForm` currently imports nothing from `careAuth` — it only calls fetch. UI change surface is minimal.
