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
- Render cron job run logs.
- Vercel deployment URL/custom domain.
- Local or CI test output.
- Admin bootstrap verification.
- Notification dry-run or real-send decision.
- Firebase migration/cleanup decision.

## Entry criteria

- [ ] Phase 9 implementation scope is complete or explicitly deferred.
- [ ] No new backend feature work is being added during sign-off.
- [ ] The production candidate branch/commit is identified.
- [ ] `docs/deployment.md` and `docs/migration-cleanup.md` have been reviewed.
- [ ] Required provider accounts are available: Supabase, Render, Vercel, Resend if email is enabled, WhatsApp Cloud API if WhatsApp is enabled, and Cloudinary if uploads are enabled.

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

- [ ] Root JavaScript/static checks pass.
- [ ] Root unit/architecture tests pass.
- [ ] Backend tests pass.
- [ ] Playwright E2E tests pass, or any deferred E2E coverage is documented.
- [ ] Test output is saved or linked for launch evidence.

## 2. Supabase production readiness

Checklist:

- [ ] Production Supabase project is created or selected.
- [ ] SQL migrations in `supabase/migrations/` are applied in timestamp order.
- [ ] RLS is enabled for all application tables that need browser-facing protection.
- [ ] Public-readable policies only expose approved public content.
- [ ] User-owned private policies only expose owner data.
- [ ] Admin policies require active admin records and appropriate permission checks.
- [ ] Service-role-only tables are not directly browser-accessible.
- [ ] Supabase Auth providers are configured.
- [ ] Supabase Auth redirect URLs include the Vercel production domain and any custom domain.
- [ ] At least one production `super_admin` row exists in `public.admin_users` for the initial admin account.
- [ ] Production seed data has either been reviewed and applied intentionally, or explicitly skipped.
- [ ] Database backup/restore expectations are known before go-live.

Evidence:

```text
Supabase project ref:
Migration method used:
Migration date/time:
Super admin user/email:
Notes:
```

## 3. Render backend readiness

The root `render.yaml` defines the web service and cron jobs.

Checklist:

- [ ] Render Blueprint is applied.
- [ ] `salon-render-backend` web service is deployed.
- [ ] Build command is `npm ci` with `rootDir: backend`.
- [ ] Start command is `npm start`.
- [ ] Health check path is `/health`.
- [ ] `GET https://<render-service>/health` returns healthy output.
- [ ] Render logs show no startup secret/config errors.
- [ ] `NODE_ENV=production` is set.
- [ ] `FRONTEND_ORIGIN` contains only approved Vercel/custom production origins.
- [ ] CORS allows approved production origins.
- [ ] CORS rejects unexpected browser origins.

Required Render server-only variables:

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ANON_KEY` if used by server workflows
- [ ] `FRONTEND_ORIGIN`
- [ ] `NOTIFICATION_DRY_RUN`
- [ ] `RESEND_API_KEY` if real email sends are enabled
- [ ] `RESEND_FROM_EMAIL` if real email sends are enabled
- [ ] `WHATSAPP_ACCESS_TOKEN` if real WhatsApp sends are enabled
- [ ] `WHATSAPP_PHONE_NUMBER_ID` if real WhatsApp sends are enabled
- [ ] `WHATSAPP_GRAPH_API_VERSION`
- [ ] `CLOUDINARY_CLOUD_NAME` if uploads are enabled
- [ ] `CLOUDINARY_API_KEY` if uploads are enabled
- [ ] `CLOUDINARY_API_SECRET` if uploads are enabled
- [ ] `CLOUDINARY_UPLOAD_FOLDER` if uploads are enabled
- [ ] `JOB_SECRET` if protected job endpoints/scripts are enabled
- [ ] `UPCOMING_REMINDER_WINDOW_MINUTES`
- [ ] `EXPIRED_SLOT_GRACE_MINUTES`

Evidence:

```text
Render web service URL:
/health result:
Deployment commit:
Approved origins:
Notes:
```

## 4. Render cron/job readiness

Checklist:

- [ ] `salon-flush-notification-outbox` exists and runs `npm run job:notifications` every 5 minutes.
- [ ] `salon-upcoming-booking-reminders` exists and runs `npm run job:reminders` hourly.
- [ ] `salon-release-expired-booking-slots` exists and runs `npm run job:release-expired-slots` every 30 minutes.
- [ ] `salon-waitlist-slot-open-notifications` exists and runs `npm run job:waitlist-slot-open` every 15 minutes.
- [ ] Each cron job has the required Supabase and provider environment variables.
- [ ] Initial cron runs complete successfully with `NOTIFICATION_DRY_RUN=true`.
- [ ] Logs are reviewed for failed queries, missing env vars, duplicate sends, or unexpected retries.
- [ ] If real sends are enabled, one controlled booking/contact/reminder/waitlist test is verified with approved recipients.

Evidence:

```text
Notification outbox cron log:
Reminder cron log:
Expired slot release cron log:
Waitlist slot-open cron log:
Dry-run or real-send mode:
Notes:
```

## 5. Vercel/frontend readiness

The current frontend is the static app under `public/`.

Checklist:

- [ ] Vercel project is connected to the production candidate branch/commit.
- [ ] Static frontend output/directory is configured correctly.
- [ ] `public/client-config.js` contains the production Supabase public URL.
- [ ] `public/client-config.js` contains the production Supabase anon key only.
- [ ] `public/client-config.js` contains the production Render API base URL.
- [ ] No service-role key, Resend key, WhatsApp token, Cloudinary API secret, or webhook secret exists in browser config.
- [ ] Public pages load over HTTPS.
- [ ] Admin page loads over HTTPS.
- [ ] Browser network requests do not load Firebase SDK scripts as active runtime dependencies.
- [ ] Browser API calls point to the production Render backend and/or approved Supabase endpoints.

Evidence:

```text
Vercel deployment URL:
Custom domain:
Render API base URL in frontend:
Supabase URL in frontend:
Notes:
```

## 6. Production smoke tests

Run these against the deployed production candidate.

### Public/customer flows

- [ ] Public home page loads.
- [ ] Services/content/gallery/reviews load from Supabase or Render as expected.
- [ ] Contact message submission succeeds.
- [ ] Review submission succeeds and follows moderation rules.
- [ ] Booking submission succeeds for an available slot.
- [ ] Attempted double booking is blocked or waitlisted according to business rules.
- [ ] Customer booking lookup works for an authenticated customer where applicable.
- [ ] Customer cancel/reschedule works only when allowed.

### Admin flows

- [ ] Admin login uses Supabase Auth.
- [ ] Non-admin authenticated user is rejected from admin-only endpoints.
- [ ] Inactive admin is rejected.
- [ ] Active admin can load dashboard data.
- [ ] Admin booking status update works and writes audit/activity records.
- [ ] Admin waitlist action works and maintains queue consistency.
- [ ] Admin review moderation works.
- [ ] Admin contact message status/delete workflow works.
- [ ] Admin gallery/content management works if enabled.
- [ ] Admin security/activity views load trustworthy data.

### Security and reliability checks

- [ ] Sensitive endpoints are rate-limited.
- [ ] Authorization failures return safe error messages.
- [ ] Backend logs do not print private secrets.
- [ ] Audit/security events are written for privileged actions.
- [ ] Transactional booking workflow prevents inconsistent slot state.

Evidence:

```text
Smoke test date/time:
Tester:
Browsers/devices used:
Issues found:
Issues resolved/deferred:
```

## 7. Notification go/no-go

Checklist:

- [ ] `NOTIFICATION_DRY_RUN=true` is used during first production smoke checks.
- [ ] Notification templates have been reviewed for production wording, salon details, timezone, and contact info.
- [ ] Resend sender/domain is verified before enabling email sends.
- [ ] WhatsApp template/token/phone number configuration is verified before enabling WhatsApp sends.
- [ ] Test recipients are approved before real provider sends.
- [ ] Failed notification rows are retryable and visible in logs/data.
- [ ] Final decision is recorded: keep dry-run, enable email only, enable WhatsApp only, or enable both.

Decision:

```text
Notification mode at launch:
Approved by:
Date/time:
Notes:
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

- [ ] Decision owner is recorded.
- [ ] Reason for deferral/no migration is recorded.
- [ ] Any manual seed/bootstrap data needed for launch is documented.
- [ ] Customer-facing impact is understood.

Decision:

```text
Migration path selected: Path A / Path B
Owner:
Date/time:
Reason/notes:
```

## 9. Firebase archive/removal decision

Firebase files can stay temporarily as reference material, but they must not be active runtime/deployment dependencies.

Checklist:

- [ ] Confirm no active browser Firebase SDK script loading remains.
- [ ] Confirm root deployment/test workflow no longer depends on Firebase CLI/emulators/functions tests.
- [ ] Confirm Firebase Functions are not the production backend target.
- [ ] Confirm Firebase Hosting is not the production frontend target.
- [ ] Archive/tag Firebase reference files if historical behavior needs preservation.
- [ ] Remove Firebase reference files from the active branch only after parity sign-off, or explicitly defer removal.
- [ ] Re-run tests after any cleanup/removal.

Reference-only candidates listed in `docs/migration-cleanup.md` include:

- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `functions/`
- `tests/rules/`
- `vitest.rules.config.js`
- legacy Firebase-focused documentation sections

Decision:

```text
Firebase cleanup mode: archive/remove now / defer reference-only files
Owner:
Date/time:
Notes:
```

## 10. Final go/no-go sign-off

Launch should be approved only when all critical checks are complete or explicitly deferred with an owner.

| Area | Status | Owner | Evidence/notes |
| --- | --- | --- | --- |
| Local/CI tests | Pending |  |  |
| Supabase migrations/RLS/Auth | Pending |  |  |
| Render web service | Pending |  |  |
| Render cron jobs | Pending |  |  |
| Vercel frontend config | Pending |  |  |
| Production smoke tests | Pending |  |  |
| Notification mode | Pending |  |  |
| Data migration decision | Pending |  |  |
| Firebase archive/removal decision | Pending |  |  |
| Final launch approval | Pending |  |  |

Final decision:

```text
GO / NO-GO:
Approved by:
Date/time:
Production commit/tag:
Known deferred items:
Rollback owner/path:
```

## Exit criteria

- [ ] Production backend is deployed and healthy on Render.
- [ ] Supabase production schema, RLS, Auth redirects, and admin bootstrap are confirmed.
- [ ] Vercel frontend uses only public production values.
- [ ] Cron jobs run successfully.
- [ ] Notification mode is intentionally chosen.
- [ ] Core public and admin workflows pass smoke testing.
- [ ] Data migration is complete or explicitly deferred.
- [ ] Firebase runtime dependency is removed, archived, or explicitly marked reference-only.
- [ ] Final go/no-go table is completed.