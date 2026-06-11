# Automated Testing Quick Start

This project now uses the Phase 9 validation stack for the active **Supabase + Render + Vercel** architecture.

The old Firebase emulator, Firestore rules, and Cloud Functions tests are archived under `legacy/firebase-production-archive/` for historical reference only. They are no longer part of the root `npm test` workflow.

## Active validation tools

1. **Vitest** for root/static frontend configuration and Phase 9 architecture checks.
2. **Vitest + Supertest** in `backend/` for Render API modules, middleware, service workflows, notification jobs, and integrations.
3. **Playwright** for browser end-to-end smoke/feature tests against the static `public/` frontend using the AppServices mock and the Supabase/Render adapters.
4. **Supabase SQL migrations** under `supabase/migrations/` as the source of truth for schema and RLS. Apply locally or in Supabase before deployment smoke checks.

## Install dependencies

Use Node.js `22` for this project. The repository includes `.nvmrc` and `.node-version` markers set to `22`.

From the project root:

```bash
npm ci
npm ci --prefix backend
npx playwright install chromium
```

## Useful commands

```bash
# Check active JavaScript syntax only
npm run check:js

# Run root/static frontend unit and Phase 9 architecture tests
npm run test:unit

# Run Render backend tests
npm run test:backend

# Run browser E2E tests against the static frontend
npm run test:e2e

# Run the non-browser Phase 9 validation subset
npm run test:phase9

# Run the full active local validation workflow
npm test
```

## What changed from the Firebase-era workflow

- `npm test` no longer starts Firebase emulators.
- `npm test` no longer runs Firestore rules tests.
- `npm test` no longer runs Jest tests under the archived `legacy/firebase-production-archive/functions/` folder.
- Root `check:js` no longer checks archived Firebase Functions files as active runtime code.
- Root dependencies no longer include Firebase SDK, Firebase CLI, or Firebase rules-unit-testing packages.

Legacy Firebase files now live in `legacy/firebase-production-archive/`, but they are not active validation targets.

## First active tests included

- Public homepage smoke test and mobile horizontal-overflow check.
- Public splash-screen progress/reveal checks.
- Public booking/waitlist/contact/review/dashboard/gallery/blog flows through the AppServices mock.
- Admin login, booking stats/filtering, schedule, reviews, contact inbox, waitlist, admin delegation, services, and security dashboard coverage.
- Root client config integrity tests for white-label identity, appearance/theme preset config, catalog consistency, public contact/media values, Supabase public config, and Render API config.
- Phase 9 architecture tests that verify:
  - root scripts target active Supabase/Render/Vercel validation,
  - active root dependencies do not include Firebase packages,
  - public/admin HTML loads Supabase and Render adapters instead of Firebase browser SDKs,
  - public client configuration does not expose private Render/Supabase/provider secrets,
  - `render.yaml` defines the Render web service and protected external scheduler endpoints,
  - every table created by the Supabase foundation migration has RLS enabled.
- Backend tests for health checks, auth/admin middleware, booking workflows, content modules, security modules, notification providers/services/jobs, Cloudinary signing, rate limiting, and activity timeline routes.

## Supabase validation notes

The root Phase 9 tests statically check that all migration-created tables have RLS enabled. Manual or CI Supabase database validation should still apply migrations to a real local/remote Supabase project:

```bash
supabase db push
```

If the Supabase CLI is unavailable, apply SQL files through the Supabase Dashboard SQL editor in timestamp order.

## Coverage map

Use this checklist when adding new Supabase/Render/Vercel features so automated coverage stays balanced:

- **Public E2E:** customer navigation, theme persistence/theme preset preview, booking/waitlist, auth/dashboard, reviews, favorites, contact, blog/gallery/service rendering, Render API adapter interactions, and responsive layout.
- **Admin E2E:** admin auth/permissions, booking lifecycle, schedule, content management, review moderation, contact inbox sorting/filtering, waitlist queue actions, services settings, admin delegation, and security dashboards.
- **Backend tests:** Render route contracts, service-layer business rules, transaction orchestration, admin authorization, rate limiting, notification idempotency, scheduled jobs, and provider dry-run behavior.
- **Supabase/RLS checks:** migration-created tables, RLS enablement, public read boundaries, authenticated owner access, admin permission boundaries, and service-role-only tables.
- **Root/unit checks:** white-label config integrity, adapter safety, public-only browser config, and Phase 9 architecture guardrails.
