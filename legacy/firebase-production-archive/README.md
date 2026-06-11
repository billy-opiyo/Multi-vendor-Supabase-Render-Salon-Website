# Legacy Firebase Production Archive

Archived on **2026-06-11** after the project moved fully to the active **Supabase + Render + Vercel** production architecture.

This folder keeps the previous Firebase production implementation together in one place so it can be reviewed, exported, tagged, or deleted later without mixing it with the active runtime code.

## Archive contents

| Path | Legacy purpose |
| --- | --- |
| `.firebaserc` | Firebase project alias/config selection. |
| `firebase.json` | Firebase Hosting, Firestore Rules, and emulator configuration. |
| `firestore.rules` | Old Firestore security rules. Supabase RLS is now the active authorization model. |
| `functions/` | Old Firebase Cloud Functions backend, function tests, Firebase dependencies, and backend white-label config. |
| `tests/rules/` | Old Firestore Rules emulator tests. |
| `vitest.rules.config.js` | Old Vitest config for Firestore Rules tests. |
| `admin-auth-export.json` | Historical Firebase Auth/Admin export artifact. Treat as sensitive reference data if it contains real account metadata. |
| `.firebase/` | Firebase local cache/artifacts. |
| `firebase-debug.log`, `firestore-debug.log` | Historical Firebase emulator/debug logs. |

## Current production architecture

The active production system is now:

- **Supabase** for Postgres, Auth, Row Level Security, migrations, optional Storage, and approved Realtime usage.
- **Render** for the trusted backend API, service-role workflows, notification outbox/jobs, Cloudinary signing, and admin-only operations.
- **Vercel** for the static public/admin frontend.

Active code and validation live outside this archive:

```txt
backend/     # Render backend API and jobs
public/      # Vercel-served public/admin frontend
supabase/    # Supabase migrations, policies, seed, storage notes
tests/       # Active root unit/E2E tests
docs/        # Current Supabase + Render + Vercel deployment and sign-off docs
```

## Rules for this archive

- Do **not** deploy from this folder.
- Do **not** run Firebase emulators as part of active project validation.
- Do **not** add Firebase SDK usage back into active frontend/backend code.
- Use these files only to understand historical behavior or to support a one-time Firebase data export/migration decision.
- If this archive is removed later, keep a Git tag/branch if long-term historical reference is needed.

## Active replacements

| Legacy Firebase capability | Active replacement |
| --- | --- |
| Firebase Auth | Supabase Auth |
| Firestore collections | Supabase Postgres tables |
| Firestore Rules | Supabase RLS + database constraints + Render authorization middleware |
| Firebase callable functions | Render REST endpoints under `/api/v1` |
| Firebase scheduled functions | External scheduler calling protected Render job endpoints |
| Firebase Hosting | Vercel static frontend deployment |
| Firebase Functions secrets | Render environment variables |

See also:

- `docs/deployment.md`
- `docs/production-signoff.md`
- `docs/migration-cleanup.md`
- `docs/firebase-to-supabase-mapping.md`