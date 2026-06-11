# Production Readiness and Sign-off Checklist

This checklist is the post-Phase 9 go/no-go process for making the new **Supabase + Render + Vercel** backend production-ready.

Use it after Phase 9 implementation work is complete and before declaring the Firebase-era backend fully replaced.

## Goal

Prove that the production backend, scheduled jobs, frontend configuration, secrets, migrations, notifications, and cleanup decisions are safe enough for launch.

## Required evidence

Before final sign-off, capture links or notes for each item below:

- Supabase production project URL/reference.
- Supabase migration confirmation.
- Render web service URL and `/health` result.
- External scheduler run logs and Render backend job endpoint logs.
- Vercel deployment URL/custom domain.
- Local or CI test output.
- Admin bootstrap verification.
- Notification dry-run or real-send decision.
- Firebase migration/cleanup decision.

## Phase 9 sign-off run - 2026-06-08

Owner/approver: **Personal Web Project - Billy Opiyo**

Production URLs/evidence supplied for this run:

- Supabase project URL: `https://jcxqvbhlexlwbpdtqxgv.supabase.co`
- Render backend URL: `https://salon-shop-render-api.onrender.com`
- Vercel frontend URL: `https://royal-braids-salon.vercel.app`
- Base repository commit before sign-off changes: `31fd6f016fc9ec3cf991c3e1107e0cfd5ea0b8b7`
- Latest deployed validation commit: `9abd031 feat(admin): add login telemetry and security notices`

Validated during this run:

- `npm ci` completed successfully with 0 reported vulnerabilities.
- `npm ci --prefix backend` completed successfully with 0 reported vulnerabilities.
- `npm run test:phase9` passed after production config/CORS updates:
  - Root JavaScript/static checks passed.
  - Root unit/architecture tests passed: 2 files, 11 tests.
  - Backend tests passed: 19 files, 69 tests.
- `npm run test:e2e` passed after stabilizing the theme-preview test: 22 tests passed.
- Render `/health` returned HTTP 200 with `ok: true`, `environment: "production"`, and `supabaseConfigured: true`.
- Render CORS allowed `https://royal-braids-salon.vercel.app`.
- Unexpected browser origin was rejected by the live backend with no `access-control-allow-origin` header, but returned a generic HTTP 500. Local backend code has been hardened to return typed HTTP 403 (`cors_origin_not_allowed`); Render redeploy is required before this improvement is live.
- Vercel frontend URL returned HTTP 200 over HTTPS.
- `public/client-config.js` was updated locally with the production Supabase public URL, Supabase anon key, and Render API URL.
- Live Vercel `client-config.js` did **not** yet contain the newly configured Supabase/Render values at the time of this run; Vercel redeploy is required.

Follow-up validation after commit/deploy on 2026-06-09:

- Git latest commit: `9abd031 feat(admin): add login telemetry and security notices`.
- Live Vercel asset parity matched local SHA-256 hashes:
  - `public/client-config.js`: `C46B7BF035BF40170625D3368070DD03EEB5B0EEB9E74E567CDF3D82819816CB`
  - `public/JS/admin.js`: `6215C6D47D6EA5A58C288559655B613876353DA4FD75866619D5C45296355C49`
  - `public/JS/render-api-adapter.js`: `8738E13E672267035DAA530E28F91EEAC73E6888DDAE1FA8C8774487EE8607BB`
- Live `client-config.js` contains the expected production public identifiers for Supabase project ref `jcxqvbhlexlwbpdtqxgv`, Render backend `salon-shop-render-api`, and a public Supabase publishable/anon key marker `sb_publishable`.
- Render `/health` returned HTTP 200 with `ok: true`, `environment: "production"`, `supabaseConfigured: true`, and timestamp `2026-06-09T07:16:38.999Z`.
- Live Render CORS allowed `https://royal-braids-salon.vercel.app`.
- Live Render CORS rejected unexpected origin `https://example.invalid` with HTTP 403 and typed error `cors_origin_not_allowed`.
- Live Vercel `/`, `/admin.html`, `/client-config.js`, `/JS/admin.js`, and `/JS/render-api-adapter.js` returned HTTP 200.
- Live public/admin HTML static checks found no active Firebase SDK script references.

Final manual production sign-off confirmation on 2026-06-11:

- Supabase provider-console checks were completed manually and found okay, including migrations/schema readiness, RLS/Auth redirect configuration, and initial admin bootstrap verification.
- External scheduler/provider-console checks were completed manually and found okay, including first-run/backend job log review for all protected scheduled job endpoints.
- Full production manual browser/data-flow smoke checks were completed and found okay for the public customer flows, admin flows, and security/reliability checks listed in this document.
- No launch-blocking issues remained after the manual checks. Intentional launch decisions remain unchanged: notifications stay dry-run, Firebase files stay reference-only, and production launches as a new Supabase dataset.

Launch decisions recorded:

- Notification launch mode: keep dry-run for both email and WhatsApp until provider/template checks are intentionally approved.
- Production Firebase data migration: **Path B** - no Firebase production data/log migration; launch as a new Supabase dataset.
- Firebase cleanup mode: archived reference-only under `legacy/firebase-production-archive/`; archived files must not be active runtime/deployment dependencies.

Current recommendation: **GO for final launch**. The earlier frontend redeploy and Render CORS hardening gates are validated live, and the remaining provider-console/manual evidence items plus final production smoke tests were completed successfully on 2026-06-11.

## Entry criteria

- [x] Phase 9 implementation scope is complete or explicitly deferred.
- [x] No new backend feature work is being added during sign-off.
- [x] The production candidate branch/commit is identified.
- [x] `docs/deployment.md` and `docs/migration-cleanup.md` have been reviewed.
- [x] Required provider accounts are available: Supabase, Render, Vercel, Resend if email is enabled, WhatsApp Cloud API if WhatsApp is enabled, and Cloudinary if uploads are enabled.

## 1. Local and CI validation

Run from the repository root before deploying the production candidate:

```bash
npm ci
npm ci --prefix backend
npm run test:phase9
```

Run E2E tests when browser dependencies are installed:

```bash
npx playwright install chromium
npm run test:e2e
```

Checklist:

- [x] Root JavaScript/static checks pass.
- [x] Root unit/architecture tests pass.
- [x] Backend tests pass.
- [x] Playwright E2E tests pass, or any deferred E2E coverage is documented.
- [x] Test output is saved or linked for launch evidence.

## 2. Supabase production readiness

Checklist:

- [x] Production Supabase project is created or selected.
- [x] SQL migrations in `supabase/migrations/` are applied in timestamp order.
- [x] RLS is enabled for all application tables that need browser-facing protection.
- [x] Public-readable policies only expose approved public content.
- [x] User-owned private policies only expose owner data.
- [x] Admin policies require active admin records and appropriate permission checks.
- [x] Service-role-only tables are not directly browser-accessible.
- [x] Supabase Auth providers are configured.
- [x] Supabase Auth redirect URLs include the Vercel production domain and any custom domain.
- [x] At least one production `super_admin` row exists in `public.admin_users` for the initial admin account.
- [x] Production seed data has either been reviewed and applied intentionally, or explicitly skipped.
- [x] Database backup/restore expectations are known before go-live.

Evidence:

```text
Supabase project ref: https://jcxqvbhlexlwbpdtqxgv.supabase.co
Migration method used: Manual Supabase provider-console verification completed.
Migration date/time: Confirmed during final manual sign-off on 2026-06-11.
Super admin user/email: Initial production super_admin/admin bootstrap verified manually on 2026-06-11.
Notes: Supabase URL and anon key are configured and verified in live Vercel public/client-config.js. Production migrations, RLS/Auth redirects, seed/bootstrap decision, backup expectations, and initial super_admin row were confirmed manually before GO.
```

## 3. Render backend readiness

The root `render.yaml` defines the Render web service only. Scheduled jobs are triggered by a free external scheduler through protected backend HTTP endpoints.

Checklist:

- [x] Render Blueprint is applied.
- [x] `salon-render-backend` web service is deployed.
- [x] Build command is `npm ci` with `rootDir: backend`.
- [x] Start command is `npm start`.
- [x] Health check path is `/health`.
- [x] `GET https://<render-service>/health` returns healthy output.
- [x] Render logs show no startup secret/config errors.
- [x] `NODE_ENV=production` is set.
- [x] `FRONTEND_ORIGIN` contains only approved Vercel/custom production origins.
- [x] CORS allows approved production origins.
- [x] CORS rejects unexpected browser origins.

Required Render server-only variables:

- [x] `SUPABASE_URL`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `SUPABASE_ANON_KEY` if used by server workflows
- [x] `FRONTEND_ORIGIN`
- [x] `NOTIFICATION_DRY_RUN`
- [x] `RESEND_API_KEY` if real email sends are enabled
- [x] `RESEND_FROM_EMAIL` if real email sends are enabled
- [x] `WHATSAPP_ACCESS_TOKEN` if real WhatsApp sends are enabled
- [x] `WHATSAPP_PHONE_NUMBER_ID` if real WhatsApp sends are enabled
- [x] `WHATSAPP_GRAPH_API_VERSION`
- [x] `CLOUDINARY_CLOUD_NAME` if uploads are enabled
- [x] `CLOUDINARY_API_KEY` if uploads are enabled
- [x] `CLOUDINARY_API_SECRET` if uploads are enabled
- [x] `CLOUDINARY_UPLOAD_FOLDER` if uploads are enabled
- [x] `JOB_SECRET` for protected scheduled job endpoints
- [x] `UPCOMING_REMINDER_LEAD_TIME_MINUTES`
- [x] `UPCOMING_REMINDER_WINDOW_MINUTES`
- [x] `EXPIRED_SLOT_GRACE_MINUTES`

Evidence:

```text
Render web service URL: https://salon-shop-render-api.onrender.com
/health result: HTTP 200; { ok: true, service: "salon-render-backend", environment: "production", supabaseConfigured: true, timestamp: "2026-06-09T07:16:38.999Z" }
Deployment commit: 9abd031 feat(admin): add login telemetry and security notices
Approved origins: https://royal-braids-salon.vercel.app
Notes: Live CORS allows the approved Vercel origin. Unexpected origin https://example.invalid is rejected with no access-control-allow-origin header, HTTP 403, and typed error cors_origin_not_allowed.
```

## 4. External scheduled job readiness

Checklist:

- [x] `salon-flush-notification-outbox` calls `POST /api/v1/jobs/flushNotificationOutbox/run` every 5 minutes.
- [x] `salon-upcoming-booking-reminders` calls `POST /api/v1/jobs/sendUpcomingBookingReminders/run` every 15 minutes.
- [x] `salon-release-expired-booking-slots` calls `POST /api/v1/jobs/releaseExpiredBookingSlots/run` every 15 minutes.
- [x] `salon-waitlist-slot-open-notifications` calls `POST /api/v1/jobs/syncWaitlistSlotOpenNotifications/run` every 15 minutes.
- [x] Each external scheduler request sends `X-Job-Secret: <JOB_SECRET>`.
- [x] Initial scheduler runs complete successfully with `NOTIFICATION_DRY_RUN=true`.
- [x] Logs are reviewed for failed queries, missing env vars, duplicate sends, or unexpected retries.
- [x] If real sends are enabled, one controlled booking/contact/reminder/waitlist test is verified with approved recipients.

Evidence:

```text
Notification outbox scheduler log: Manually reviewed during final sign-off on 2026-06-11; okay.
Reminder scheduler log: Manually reviewed during final sign-off on 2026-06-11; okay.
Expired slot release scheduler log: Manually reviewed during final sign-off on 2026-06-11; okay.
Waitlist slot-open scheduler log: Manually reviewed during final sign-off on 2026-06-11; okay.
Dry-run or real-send mode: Dry-run for both email and WhatsApp at launch unless intentionally changed later.
Notes: Render cron definitions are intentionally not used. External scheduler setup, `X-Job-Secret` usage, first-run logs, and Render backend job logs were manually verified for all four jobs.
```

## 5. Vercel/frontend readiness

The current frontend is the static app under `public/`.

Checklist:

- [x] Vercel project is connected to the production candidate branch/commit.
- [x] Static frontend output/directory is configured correctly.
- [x] `public/client-config.js` contains the production Supabase public URL.
- [x] `public/client-config.js` contains the production Supabase anon key only.
- [x] `public/client-config.js` contains the production Render API base URL.
- [x] No service-role key, Resend key, WhatsApp token, Cloudinary API secret, or webhook secret exists in browser config.
- [x] Public pages load over HTTPS.
- [x] Admin page loads over HTTPS.
- [x] Browser network requests do not load Firebase SDK scripts as active runtime dependencies.
- [x] Browser API calls point to the production Render backend and/or approved Supabase endpoints.

Evidence:

```text
Vercel deployment URL: https://royal-braids-salon.vercel.app
Custom domain: None provided.
Render API base URL in frontend: https://salon-shop-render-api.onrender.com (verified live)
Supabase URL in frontend: https://jcxqvbhlexlwbpdtqxgv.supabase.co (verified live)
Notes: Vercel URL returns HTTP 200 over HTTPS. Live asset parity matched local SHA-256 for client-config.js, JS/admin.js, and JS/render-api-adapter.js after commit/deploy. Live / and /admin.html returned HTTP 200, and static HTML checks found no active Firebase SDK script references.
```

## 6. Production smoke tests

Run these against the deployed production candidate.

### Public/customer flows

- [x] Public home page loads.
- [x] Services/content/gallery/reviews load from Supabase or Render as expected.
- [x] Contact message submission succeeds.
- [x] Review submission succeeds and follows moderation rules.
- [x] Booking submission succeeds for an available slot.
- [x] Attempted double booking is blocked or waitlisted according to business rules.
- [x] Customer booking lookup works for an authenticated customer where applicable.
- [x] Customer cancel/reschedule works only when allowed.

### Admin flows

- [x] Admin login uses Supabase Auth.
- [x] Non-admin authenticated user is rejected from admin-only endpoints.
- [x] Inactive admin is rejected.
- [x] Active admin can load dashboard data.
- [x] Admin booking status update works and writes audit/activity records.
- [x] Admin waitlist action works and maintains queue consistency.
- [x] Admin review moderation works.
- [x] Admin contact message status/delete workflow works.
- [x] Admin gallery/content management works if enabled.
- [x] Admin security/activity views load trustworthy data.

### Security and reliability checks

- [x] Sensitive endpoints are rate-limited.
- [x] Authorization failures return safe error messages.
- [x] Backend logs do not print private secrets.
- [x] Audit/security events are written for privileged actions.
- [x] Transactional booking workflow prevents inconsistent slot state.

Evidence:

```text
Smoke test date/time: 2026-06-08 local validation run; 2026-06-09 non-secret live HTTP/config/CORS checks passed after frontend/backend redeploy; 2026-06-11 full manual production smoke completed.
Tester: Personal Web Project - Billy Opiyo / Cline-assisted validation.
Browsers/devices used: Playwright Chromium local E2E; CLI HTTP checks against production; production manual browser/device smoke completed by project owner.
Issues found: E2E theme-preview flow was flaky when navigating twice in-test; earlier live Vercel config was not redeployed; earlier live CORS unexpected-origin rejection returned generic 500.
Issues resolved/deferred: Theme-preview E2E was made deterministic and passed. Vercel frontend assets now match local deployed assets. Render CORS hardening is live and returns typed HTTP 403 for unexpected origins. Full production manual public/admin/security smoke checks were completed on 2026-06-11 with no launch-blocking issues.
```

## 7. Notification go/no-go

Checklist:

- [x] `NOTIFICATION_DRY_RUN=true` is used during first production smoke checks.
- [x] Notification templates have been reviewed for production wording, salon details, timezone, and contact info.
- [x] Resend sender/domain is verified before enabling email sends.
- [x] WhatsApp template/token/phone number configuration is verified before enabling WhatsApp sends.
- [x] Test recipients are approved before real provider sends.
- [x] Failed notification rows are retryable and visible in logs/data.
- [x] Final decision is recorded: keep dry-run, enable email only, enable WhatsApp only, or enable both.

Decision:

```text
Notification mode at launch: Keep dry-run for both email and WhatsApp.
Approved by: Personal Web Project - Billy Opiyo
Date/time: 2026-06-08
Notes: Provider credentials may be configured, but real sends are intentionally not approved for launch in this sign-off run.
```

## 8. Production data migration decision

Choose one path before final sign-off.

### Path A: Production Firebase data migration required

- [ ] Firebase Auth users are exported.
- [ ] Firestore collections are exported.
- [ ] IDs/status values are normalized using `docs/firebase-to-supabase-mapping.md`.
- [ ] Supabase Auth users are imported first.
- [ ] `profiles` and `admin_users` rows are imported after Auth users.
- [ ] Tenant/site/content records are imported before dependent bookings.
- [ ] Booking slots are imported before bookings.
- [ ] Waitlist entries and notification history are imported after bookings.
- [ ] Waitlist queue positions are recalculated.
- [ ] Counts are validated against Firebase exports.
- [ ] Sample records are spot-checked.
- [ ] Notifications remain dry-run or disabled during migration to avoid duplicate customer messages.

### Path B: Production Firebase data migration deferred/not required

- [x] Decision owner is recorded.
- [x] Reason for deferral/no migration is recorded.
- [x] Any manual seed/bootstrap data needed for launch is documented.
- [x] Customer-facing impact is understood.

Decision:

```text
Migration path selected: Path B
Owner: Personal Web Project - Billy Opiyo
Date/time: 2026-06-08
Reason/notes: No Firebase production data/log migration is desired. Launch should start with a new Supabase dataset and no real Firebase customer data copied over.
```

## 9. Firebase archive/removal decision

Firebase files are archived under `legacy/firebase-production-archive/` as reference material only and must not be active runtime/deployment dependencies.

Checklist:

- [x] Confirm no active browser Firebase SDK script loading remains.
- [x] Confirm root deployment/test workflow no longer depends on Firebase CLI/emulators/functions tests.
- [x] Confirm Firebase Functions are not the production backend target.
- [x] Confirm Firebase Hosting is not the production frontend target.
- [x] Archive Firebase reference files under `legacy/firebase-production-archive/` if historical behavior needs preservation.
- [x] Remove Firebase runtime files from the active root paths after parity sign-off, while retaining the archive for historical reference.
- [x] Re-run tests after any cleanup/removal.

Reference-only archive contents listed in `docs/migration-cleanup.md` include:

- `legacy/firebase-production-archive/.firebaserc`
- `legacy/firebase-production-archive/firebase.json`
- `legacy/firebase-production-archive/firestore.rules`
- `legacy/firebase-production-archive/functions/`
- `legacy/firebase-production-archive/tests/rules/`
- `legacy/firebase-production-archive/vitest.rules.config.js`
- `legacy/firebase-production-archive/admin-auth-export.json`

Decision:

```text
Firebase cleanup mode: archived reference-only files
Owner: Personal Web Project - Billy Opiyo
Date/time: 2026-06-11
Notes: Firebase files have been moved from active root paths into legacy/firebase-production-archive/ as historical/reference material. Active root test/deployment workflow no longer depends on Firebase CLI/emulators/functions tests, and public HTML has no active Firebase SDK script loading.
```

## 10. Final go/no-go sign-off

Launch should be approved only when all critical checks are complete or explicitly deferred with an owner.

| Area                              | Status                          | Owner                              | Evidence/notes                                                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local/CI tests                    | Passed locally                  | Personal Web Project - Billy Opiyo | `npm ci`, `npm ci --prefix backend`, `npm run test:phase9` passed. Latest Phase 9 run: root unit 11/11, backend 69/69. `npm run test:e2e` passed 22/22.                                                                                                    |
| Supabase migrations/RLS/Auth      | Confirmed manually              | Personal Web Project - Billy Opiyo | Project URL recorded. Migration/schema readiness, RLS/Auth redirects, seed/bootstrap decision, backup expectations, and initial admin bootstrap were manually verified on 2026-06-11.                                                                      |
| Render web service                | Passed live HTTP/CORS checks    | Personal Web Project - Billy Opiyo | Live `/health` passed with `supabaseConfigured: true`; approved Vercel CORS origin passed; unexpected origin now returns typed HTTP 403 `cors_origin_not_allowed`.                                                                                         |
| External scheduled jobs           | Confirmed manually              | Personal Web Project - Billy Opiyo | Free external scheduler jobs call the protected Render backend job endpoints with `X-Job-Secret`; provider-console scheduler logs and Render backend job logs were manually reviewed on 2026-06-11 and found okay.                                         |
| Vercel frontend config            | Passed live asset/config parity | Personal Web Project - Billy Opiyo | Vercel URL returns HTTP 200. Live `client-config.js`, `JS/admin.js`, and `JS/render-api-adapter.js` match local SHA-256 hashes and contain the expected public Supabase/Render values.                                                                     |
| Production smoke tests            | Passed manual production smoke  | Personal Web Project - Billy Opiyo | Local Playwright E2E passed; non-secret live HTTP/config/CORS checks passed after redeploy; full manual production public/admin/security workflow smoke was completed on 2026-06-11 with no launch-blocking issues.                                        |
| Notification mode                 | Approved dry-run                | Personal Web Project - Billy Opiyo | Launch mode is dry-run for both email and WhatsApp. Real sends are not approved in this sign-off.                                                                                                                                                          |
| Data migration decision           | Approved Path B                 | Personal Web Project - Billy Opiyo | No Firebase production data/log migration; launch as new Supabase dataset.                                                                                                                                                                                 |
| Firebase archive/removal decision | Archived reference-only         | Personal Web Project - Billy Opiyo | Firebase files were moved under `legacy/firebase-production-archive/`; no active browser Firebase SDK script loading found in public HTML and root workflow no longer uses Firebase deploy/test commands.                                                    |
| Final launch approval             | GO for final launch             | Personal Web Project - Billy Opiyo | Supabase migrations/RLS/Auth/admin bootstrap are confirmed, external scheduler/backend job logs are reviewed, and full production manual smoke tests passed. Notifications remain intentionally dry-run. Firebase cleanup remains deferred reference-only. |

Final decision:

```text
GO / NO-GO: GO for final launch.
Approved by: Personal Web Project - Billy Opiyo
Date/time: 2026-06-11 final manual production sign-off
Production commit/tag: 9abd031 feat(admin): add login telemetry and security notices
Known deferred items: keep notifications dry-run; Firebase archive remains reference-only until the owner decides whether to tag/delete it. No launch-blocking manual/provider-console checks remain open.
Rollback owner/path: Personal Web Project - Billy Opiyo; rollback by reverting to last known good Git commit/deployment in Render and Vercel if redeploy introduces regressions.
```

## Exit criteria

- [x] Production backend is deployed and healthy on Render.
- [x] Supabase production schema, RLS, Auth redirects, and admin bootstrap are confirmed.
- [x] Vercel frontend uses only public production values.
- [x] External scheduled jobs run successfully.
- [x] Notification mode is intentionally chosen.
- [x] Core public and admin workflows pass smoke testing.
- [x] Data migration is complete or explicitly deferred.
- [x] Firebase runtime dependency is removed, archived, or explicitly marked reference-only.
- [x] Final go/no-go table is completed.
