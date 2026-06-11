# Migration and Cleanup Notes

This document tracks Phase 9 migration and cleanup expectations for the active **Supabase + Render + Vercel** rebuild.

For the complete post-Phase 9 launch gate, use [`docs/production-signoff.md`](./production-signoff.md). This file keeps the migration and Firebase cleanup details that feed into that sign-off.

## Migration sources and targets

| Legacy source                                   | New target                                                           | Status                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Firebase Auth users                             | Supabase Auth users + `public.profiles`                              | Manual/export-dependent                                                    |
| Firestore `adminUsers`                          | `public.admin_users`                                                 | Schema and Render endpoints exist; bootstrap required                      |
| Firestore bookings/slots/waitlist               | `public.bookings`, `public.booking_slots`, `public.waitlist_entries` | Schema and backend workflows exist; production data migration still manual |
| Firestore reviews/contact/content/gallery/blogs | Supabase public content tables + Render content endpoints            | Schema/backend coverage exists; production data migration still manual     |
| Firestore security/audit/timeline data          | Supabase security/activity/audit tables                              | Schema/backend coverage exists; production data migration still manual     |
| Firebase Functions scheduled/callable workflows | Render web service + protected scheduled-job HTTP endpoints           | Active architecture                                                        |
| Firebase Hosting                                | Vercel static frontend hosting                                       | Active architecture target                                                 |

## Supabase migration process

1. Create or select the target Supabase project.
2. Apply SQL migrations in timestamp order:

   ```bash
   supabase db push
   ```

3. If the CLI is unavailable, paste SQL files into the Supabase Dashboard SQL editor in timestamp order.
4. Apply `supabase/seed/phase_1_development_seed.sql` only to development/staging unless reviewed for production.
5. Verify RLS is enabled for every application table. The root Phase 9 unit tests include a static RLS coverage check.

## Production data migration guidance

No automated production Firebase-to-Supabase data migration is wired into the active validation workflow yet. Before migrating real customer data:

1. Export Firebase Auth users and Firestore collections from the production Firebase project.
2. Normalize IDs and status values using `docs/firebase-to-supabase-mapping.md`.
3. Import Supabase Auth users first, then profile/admin rows.
4. Import tenant/site/content records before bookings where foreign keys depend on them.
5. Import booking slots before bookings, then waitlist entries and notification history.
6. Recalculate waitlist queue positions after import.
7. Validate counts and spot-check records against the Firebase export.
8. Keep notification sending disabled or dry-run during import to avoid duplicate customer messages.

## Firebase cleanup policy

Firebase reference files have now been gathered under `legacy/firebase-production-archive/`. They remain historical reference material only and must not be active runtime, test, or deployment dependencies.

Already removed from the active root workflow:

- Root Firebase SDK / Firebase CLI / Firebase rules-unit-testing dependencies.
- Root `firebase emulators` scripts.
- Root Firestore rules test script.
- Root Functions Jest test invocation.
- Active browser Firebase SDK script loading from public/admin HTML.

Reference-only files now archived in `legacy/firebase-production-archive/`:

- `legacy/firebase-production-archive/.firebaserc`
- `legacy/firebase-production-archive/firebase.json`
- `legacy/firebase-production-archive/firestore.rules`
- `legacy/firebase-production-archive/functions/`
- `legacy/firebase-production-archive/tests/rules/`
- `legacy/firebase-production-archive/vitest.rules.config.js`
- `legacy/firebase-production-archive/admin-auth-export.json`
- `legacy/firebase-production-archive/README.md`

Legacy Firebase-focused sections in active public docs have been replaced with Supabase + Render + Vercel production wording.

Suggested final cleanup sequence:

1. Confirm Supabase migrations, Render backend, external scheduled jobs, and Vercel frontend are live.
2. Confirm booking, waitlist, admin, content, notification, and security smoke checks pass in staging.
3. Keep the `legacy/firebase-production-archive/` folder until the project owner decides whether to retain, tag, or delete the archive.
4. Remove the archive from the active branch only after confirming historical behavior no longer needs to be referenced.
5. Re-run `npm test` and deployment smoke checks after any archive deletion.

## Manual Phase 9 sign-off checklist

Use this compact checklist as the migration/cleanup portion of the full production sign-off process in [`docs/production-signoff.md`](./production-signoff.md).

- [ ] Supabase migrations applied to production.
- [ ] Initial production super admin created in `public.admin_users`.
- [ ] Render Blueprint applied and web service healthy.
- [ ] External scheduled jobs are enabled and logging successful dry-run or real runs.
- [ ] Vercel frontend configured with public Supabase/Render values.
- [ ] CORS allows only approved Vercel/custom domains.
- [ ] Notification providers verified in dry-run, then enabled intentionally.
- [ ] Production Firebase data migration completed or explicitly deferred.
- [x] Firebase reference files archived under `legacy/firebase-production-archive/` after parity sign-off.
