# Supabase Foundation — Phase 1

This folder contains the Supabase foundation for the current Supabase + Render + Vercel production architecture.

The Firebase-era implementation is archived under `legacy/firebase-production-archive/` for reference only. Active runtime behavior should use:

- **Supabase** for Postgres, Auth, RLS, migrations, optional Storage, and Realtime.
- **Render** for trusted service-role workflows, notifications, protected job execution endpoints, Cloudinary signing, and privileged admin actions.
- **Vercel** for public/admin frontend delivery.

## Folder structure

```text
supabase/
├── config.toml
├── migrations/
│   ├── 20260606000100_phase_1_core_schema.sql
│   └── 20260606000200_phase_1_rls_policies.sql
├── policies/
│   └── README.md
├── seed/
│   └── phase_1_development_seed.sql
└── storage/
    └── README.md
```

## Migration naming convention

Use timestamped, append-only migrations:

```text
YYYYMMDDHHMMSS_phase_or_domain_description.sql
```

Examples:

```text
20260606000100_phase_1_core_schema.sql
20260606000200_phase_1_rls_policies.sql
20260606000300_phase_1_seed_data.sql
```

Do not edit migrations that have already been applied to a shared environment. Add a new migration instead.

## Phase 1 migrations

### `20260606000100_phase_1_core_schema.sql`

Creates the first-pass schema for:

- Identity/admin/security: `profiles`, `admin_users`, `admin_audit_logs`, `admin_security_actions`, `login_activities`, `security_alerts`, `account_change_history`, `activity_timeline`, `rate_limits`.
- Booking/waitlist/notifications: `booking_slots`, `bookings`, `waitlist_entries`, `booking_status_events`, `booking_notifications`, `notification_outbox`.
- Public content: `site_settings`, `service_categories`, `services`, `service_variants`, `stylists`, `gallery_items`, `blog_posts`, `reviews`, `contact_messages`.
- Multi-tenant/media support: `client_tenants`, `tenant_memberships`, `file_uploads`, `webhook_events`.

It also adds status checks, foreign keys, indexes, uniqueness constraints, and updated-at triggers.

### `20260606000200_phase_1_rls_policies.sql`

Enables RLS and adds initial policies for:

- Public reads of approved/active public content.
- Authenticated user reads for own private rows.
- Conservative public submissions for pending reviews/contact messages.
- Admin reads/management through centralized helper functions.
- Service-role-only internal tables such as `notification_outbox`, `rate_limits`, and `webhook_events`.

Transactional booking and waitlist writes are intentionally deferred to Render service-role workflows in later phases.

## Local usage notes

After Supabase CLI is available in the active developer workflow, the expected commands are:

```bash
supabase start
supabase db reset
```

The seed file configured in `config.toml` is:

```text
supabase/seed/phase_1_development_seed.sql
```

If applying manually to a remote development project, apply files in this order:

1. `migrations/20260606000100_phase_1_core_schema.sql`
2. `migrations/20260606000200_phase_1_rls_policies.sql`
3. `seed/phase_1_development_seed.sql` when seed data is desired

## Media decision for Phase 1

Phase 1 keeps **Cloudinary as the preferred managed media provider** because the legacy app already uses Cloudinary concepts and the target Render backend will provide signed upload endpoints.

Supabase Storage remains available for future use, but no active bucket policy is required yet. See `storage/README.md`.

## Phase 9 deployment notes

- The Render backend now exists under `backend/` and is covered by backend tests.
- Booking, waitlist, content, notification, security, and admin workflows are represented by Render modules and tests.
- Scheduled jobs are triggered by a free external scheduler through protected Render backend HTTP endpoints; see `docs/scheduled-jobs.md`.
- RLS policies remain the Supabase authorization foundation and should be validated against a real Supabase project before production launch.
- Admin bootstrap still requires a controlled manual step once Supabase Auth users exist: create the first active `super_admin` row in `public.admin_users` using a trusted SQL/admin process.
- See `docs/deployment.md` and `docs/migration-cleanup.md` for Phase 9 deployment and cleanup checklists.
