# Backend Rewrite Structure and Phases

## Purpose

This document defines how the backend should be rewritten cleanly using the approved ecosystem:

- **Supabase** for database, auth, storage, realtime, migrations, and Row Level Security.
- **Render** for the trusted backend API, jobs, webhooks, notifications, and privileged service-role operations.
- **Vercel** for frontend deployment and public/admin UI delivery.

The current Firebase Functions and browser JavaScript files are reference material only. Their business logic should be studied, mapped, and rewritten into a clean Supabase/Render/Vercel architecture.

---

## Current Legacy Reference Areas

The restored project currently contains a Firebase-era implementation. These files should be reviewed as behavior references:

| Legacy area | Files | Use as reference for |
| --- | --- | --- |
| Firebase Functions backend | `functions/index.js` | Booking lifecycle, waitlist workflows, admin callable operations, notifications, scheduled jobs, audit/security logging. |
| Function config | `functions/client-config.js`, `functions/waitlist-action-messages.js` | Business naming, notification text, Cloudinary folder conventions, client-level defaults. |
| Frontend public app | `public/JS/script.js` | Booking form behavior, public content rendering, client catalog behavior, review/contact flows. |
| Admin frontend | `public/JS/admin.js` | Admin screens, realtime expectations, permissions, booking/status actions, content management, security dashboards. |
| Client bootstrap scripts | `scripts/new-client.js` | White-label setup ideas and required client configuration fields. |
| Old tests | `tests/`, `functions/__tests__/` | Expected behavior, edge cases, and regression scenarios. |

Important: these files explain **what the system does**, not **how the new system should be implemented**.

---

## Target High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                            Vercel                               │
│                                                                 │
│  Public salon website + admin UI                                │
│  - Uses Supabase anon client where RLS allows                   │
│  - Calls Render API for privileged workflows                    │
│  - Contains no private secrets                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                            Render                               │
│                                                                 │
│  Backend API + workers + cron jobs                              │
│  - Verifies Supabase Auth JWTs                                  │
│  - Uses Supabase service role for trusted operations            │
│  - Sends email/WhatsApp notifications                           │
│  - Signs Cloudinary uploads                                     │
│  - Performs transactional booking/waitlist workflows            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ Supabase client / SQL / RPC
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Supabase                              │
│                                                                 │
│  Postgres + Auth + RLS + Storage + Realtime                     │
│  - Tables, constraints, indexes, policies                       │
│  - Public/admin data access rules                               │
│  - Realtime channels for approved frontend views                │
│  - Storage buckets for managed media if used                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Proposed Repository Structure

The exact structure can evolve, but the rebuild should separate frontend, backend, Supabase schema, and docs clearly.

```text
.
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── cors.js
│   │   ├── db/
│   │   │   ├── supabaseAdmin.js
│   │   │   ├── supabaseAuth.js
│   │   │   └── transactions.js
│   │   ├── middleware/
│   │   │   ├── requireAuth.js
│   │   │   ├── requireAdmin.js
│   │   │   ├── rateLimit.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── admins/
│   │   │   ├── bookings/
│   │   │   ├── bookingSlots/
│   │   │   ├── waitlist/
│   │   │   ├── reviews/
│   │   │   ├── contactMessages/
│   │   │   ├── gallery/
│   │   │   ├── blog/
│   │   │   ├── services/
│   │   │   ├── notifications/
│   │   │   ├── security/
│   │   │   ├── activityTimeline/
│   │   │   └── siteSettings/
│   │   ├── jobs/
│   │   │   ├── releaseExpiredBookingSlots.js
│   │   │   ├── sendUpcomingBookingReminders.js
│   │   │   └── syncWaitlistPositions.js
│   │   ├── integrations/
│   │   │   ├── cloudinary/
│   │   │   ├── resend/
│   │   │   └── whatsapp/
│   │   └── utils/
│   │       ├── dates.js
│   │       ├── errors.js
│   │       ├── ids.js
│   │       ├── normalize.js
│   │       └── validators.js
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabaseClient.js
│   │   │   └── renderApiClient.js
│   │   ├── modules/
│   │   └── config/
│   └── tests/
├── supabase/
│   ├── migrations/
│   ├── seed/
│   ├── policies/
│   ├── storage/
│   └── README.md
├── docs/
│   ├── firebase-to-supabase-mapping.md
│   ├── api-contracts.md
│   └── deployment.md
├── PROJECT_REBUILD_RULES.md
└── BACKEND_REWRITE_STRUCTURE_AND_PHASES.md
```

If the frontend remains in `public/` temporarily, the same boundaries still apply: browser code must use Supabase/Render clients only and must not initialize Firebase.

---

## Backend Module Pattern

Each backend module should have predictable files.

Example:

```text
backend/src/modules/bookings/
├── booking.routes.js
├── booking.controller.js
├── booking.service.js
├── booking.repository.js
├── booking.validators.js
├── booking.constants.js
└── booking.test.js
```

### Responsibilities

| Layer | Responsibility |
| --- | --- |
| `routes` | HTTP paths, middleware composition, request method definitions. |
| `controller` | Request parsing, response formatting, error handoff. |
| `service` | Business workflow and transaction orchestration. |
| `repository` | Supabase/Postgres reads and writes. |
| `validators` | Input validation and normalization. |
| `constants` | Status names, allowed values, domain constants. |
| `tests` | Unit and integration coverage for the module. |

Business rules should live in services, not controllers.

---

## Firebase-to-New-Architecture Mapping

| Firebase-era concept | New Supabase/Render/Vercel concept |
| --- | --- |
| Firebase Auth | Supabase Auth. |
| Firestore collections | Supabase Postgres tables. |
| Firestore document IDs | UUID primary keys or deterministic unique keys in Postgres. |
| Firestore security rules | Supabase RLS policies, database constraints, and Render authorization middleware. |
| Firebase callable functions | Render REST API endpoints. |
| Firestore triggers | Render service-layer actions, Supabase triggers, Postgres functions, or scheduled jobs depending on the workflow. |
| Firebase scheduled functions | Render cron jobs or background workers. |
| Firebase Functions secrets | Render environment variables. |
| Firebase web config | Supabase public URL/anon key and Render API URL. |
| Firestore realtime listeners | Supabase Realtime channels where appropriate. |
| Firebase Hosting | Vercel deployment. |
| Firebase emulator tests | Supabase local tests, backend integration tests, and frontend E2E tests. |

---

## Proposed Supabase Data Model

The schema should be designed with migrations and constraints. Names can be adjusted during detailed implementation, but the model below captures the major domains from the current app.

### Identity and admin tables

```text
profiles
admin_users
admin_audit_logs
admin_security_actions
login_activities
security_alerts
account_change_history
user_sessions
activity_timeline
rate_limits
```

### Booking and schedule tables

```text
bookings
booking_slots
waitlist_entries
booking_status_events
booking_notifications
```

### Content and public website tables

```text
site_settings
service_categories
services
service_variants
stylists
gallery_items
blog_posts
reviews
contact_messages
```

### Optional support tables

```text
notification_outbox
webhook_events
file_uploads
client_tenants
tenant_memberships
```

For multi-vendor or white-label expansion, add a `tenant_id` or `client_id` column to tenant-owned tables early rather than retrofitting it later.

---

## Critical Table Design Notes

### `profiles`

Purpose: public/private profile extension for `auth.users`.

Key fields:

```text
id uuid primary key references auth.users(id)
email text
display_name text
phone text
role text
created_at timestamptz
updated_at timestamptz
```

### `admin_users`

Purpose: admin access records and permission flags.

Key fields:

```text
id uuid primary key
user_id uuid references auth.users(id)
email text
display_name text
role text check role in ('super_admin', 'admin')
permissions jsonb
active boolean
created_by uuid
updated_by uuid
created_at timestamptz
updated_at timestamptz
```

### `booking_slots`

Purpose: schedule slot availability and occupancy.

Key fields:

```text
id uuid primary key
tenant_id uuid null
slot_date date
slot_time text
starts_at timestamptz
ends_at timestamptz null
stylist_key text
taken boolean default false
booking_id uuid null references bookings(id)
user_id uuid null references auth.users(id)
release_reason text null
released_at timestamptz null
created_at timestamptz
updated_at timestamptz
```

Important constraints:

- Unique slot identity by tenant/date/time/stylist.
- Prevent multiple active bookings for one slot.
- Keep `starts_at` queryable for reminders and expiration jobs.

### `bookings`

Purpose: booking records and lifecycle state.

Key fields:

```text
id uuid primary key
tenant_id uuid null
user_id uuid references auth.users(id)
slot_id uuid null references booking_slots(id)
waitlist_id uuid null references waitlist_entries(id)
first_name text
last_name text
email text
phone text
service text
service_id uuid null
stylist text
appointment_date date
appointment_time text
starts_at timestamptz
status text
notes text
inspiration_image_url text
metadata jsonb
created_at timestamptz
updated_at timestamptz
cancelled_at timestamptz null
completed_at timestamptz null
expired_at timestamptz null
no_show_at timestamptz null
```

Allowed booking statuses:

```text
pending
confirmed
completed
cancelled
waitlisted
expired
no_show
```

### `waitlist_entries`

Purpose: queue records when preferred slots are unavailable.

Key fields:

```text
id uuid primary key
tenant_id uuid null
user_id uuid references auth.users(id)
booking_id uuid null references bookings(id)
preferred_slot_id uuid null references booking_slots(id)
preferred_date date
preferred_time text
service text
stylist text
status text
queue_position integer null
queue_size integer null
notified_at timestamptz null
created_at timestamptz
updated_at timestamptz
```

Allowed waitlist statuses:

```text
waiting
notified
contacted
booked
cancelled
notification_failed
```

---

## Supabase RLS Policy Plan

RLS policies should be written intentionally, table by table.

### Public-readable tables

Examples:

- Approved reviews.
- Published blog posts.
- Active gallery items.
- Active services and service categories.
- Public site settings.

Policy direction:

```text
Public can read rows where status/visibility is public.
Only admins can insert/update/delete.
```

### User-owned private tables

Examples:

- Bookings.
- Waitlist entries.
- Profiles.
- Account change history.

Policy direction:

```text
Authenticated users can read their own rows.
Authenticated users can create their own allowed rows.
Updates are restricted by ownership, status, and workflow rules.
Complex lifecycle changes should go through Render.
```

### Admin-managed tables

Examples:

- Admin users.
- Admin audit logs.
- Security alerts.
- Login activity dashboards.
- Contact messages.

Policy direction:

```text
Only active admins with required permissions can read/write.
Sensitive writes should go through Render service-role endpoints.
```

### Service-role-only tables

Examples:

- Notification outbox.
- Webhook events.
- Internal rate limits.
- Some audit/event tables.

Policy direction:

```text
No direct browser access.
Render writes and reads through service role.
```

---

## Render Backend API Plan

### Public/customer endpoints

```text
GET    /api/v1/site-settings/public
GET    /api/v1/services
GET    /api/v1/gallery
GET    /api/v1/blog-posts
GET    /api/v1/reviews
POST   /api/v1/reviews
POST   /api/v1/contact-messages
POST   /api/v1/bookings
GET    /api/v1/bookings/me
POST   /api/v1/bookings/:bookingId/cancel
POST   /api/v1/bookings/:bookingId/reschedule
GET    /api/v1/waitlist/:waitlistId/queue
```

### Admin endpoints

```text
GET    /api/v1/admin/bookings
POST   /api/v1/admin/bookings/:bookingId/status
POST   /api/v1/admin/bookings/:bookingId/release-slot
GET    /api/v1/admin/waitlist
POST   /api/v1/admin/waitlist/:waitlistId/move-to-confirmed
GET    /api/v1/admin/reviews
POST   /api/v1/admin/reviews/:reviewId/moderate
GET    /api/v1/admin/contact-messages
POST   /api/v1/admin/contact-messages/:messageId/status
DELETE /api/v1/admin/contact-messages/:messageId
GET    /api/v1/admin/gallery
POST   /api/v1/admin/gallery
PATCH  /api/v1/admin/gallery/:itemId
DELETE /api/v1/admin/gallery/:itemId
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PATCH  /api/v1/admin/users/:userId
GET    /api/v1/admin/security/login-activities
GET    /api/v1/admin/security/alerts
POST   /api/v1/admin/security/users/:userId/restrict
```

### Utility endpoints

```text
POST   /api/v1/uploads/cloudinary/sign
POST   /api/v1/security/login-activity
POST   /api/v1/account/security-change
```

### Job endpoints or workers

Depending on the Render setup, jobs can run as cron commands or protected HTTP endpoints.

```text
releaseExpiredBookingSlots
sendUpcomingBookingReminders
syncWaitlistPositions
flushNotificationOutbox
```

---

## Transactional Workflow Design

### Create booking

Required behavior:

1. Validate customer and appointment input.
2. Resolve requested slot.
3. Start database transaction.
4. If slot is open, create booking and mark slot taken.
5. If slot is occupied, create waitlist entry and waitlisted booking if the product requires it.
6. Write activity timeline event.
7. Queue confirmation/waitlist notification.
8. Commit transaction.
9. Dispatch notification asynchronously or through an outbox worker.

### Cancel booking

Required behavior:

1. Verify caller owns booking or is an authorized admin.
2. Check booking can be cancelled.
3. Start transaction.
4. Set booking status to `cancelled`.
5. Release slot if attached and releasable.
6. Update waitlist queue for the released slot.
7. Queue waitlist notification if applicable.
8. Write audit/activity entries.
9. Commit transaction.

### Reschedule booking

Required behavior:

1. Verify caller owns booking or is an authorized admin.
2. Validate new slot.
3. Start transaction.
4. Confirm new slot is available.
5. Release previous slot.
6. Reserve new slot.
7. Update booking date/time/slot fields.
8. Write activity and notification records.
9. Commit transaction.

### Move waitlist entry to confirmed

Required behavior:

1. Require admin booking permission.
2. Load waitlist entry and linked booking.
3. Confirm preferred slot is now available.
4. Start transaction.
5. Mark slot taken.
6. Set booking status to `confirmed`.
7. Set waitlist status to `booked`.
8. Recalculate queue positions.
9. Write admin audit log.
10. Queue confirmation notification.

### Auto-release expired slots

Required behavior:

1. Scheduled Render job finds occupied slots with `starts_at` older than configured grace period.
2. For each slot, transactionally inspect linked booking.
3. Convert `pending` bookings to `expired`.
4. Convert `confirmed` past bookings to `no_show` if the business rule requires it.
5. Release slot.
6. Record release reason/source.
7. Write audit/activity event.

---

## Notification Architecture

The Firebase-era functions currently mix data triggers and notification sends. The rewrite should use an outbox-style design for reliability.

### Recommended tables

```text
notification_outbox
booking_notifications
```

### Flow

1. Business transaction writes the booking/contact/waitlist change.
2. Same transaction inserts a notification outbox row.
3. Render worker/job reads pending notification rows.
4. Worker sends through Resend or WhatsApp Cloud API.
5. Worker marks row as sent, skipped, or failed.
6. Related booking/contact/waitlist row receives delivery metadata if needed.

### Providers

| Provider | Use |
| --- | --- |
| Resend | Booking emails, contact notifications, admin alerts. |
| WhatsApp Cloud API | Booking confirmation, reminders, waitlist notifications. |
| Cloudinary | Signed upload generation and managed media workflows. |

### Notification rules

- Notification delivery must be idempotent.
- Failed sends should be retryable.
- Provider secrets stay on Render.
- Notification templates should be centralized.
- Customer-facing messages should use client/site settings.

---

## Realtime Strategy

Use Supabase Realtime selectively.

Good realtime candidates:

- Admin booking list updates.
- Admin waitlist list updates.
- Admin contact messages.
- Gallery/content preview updates.
- Booking status updates for the logged-in customer.

Avoid realtime for:

- Privileged lifecycle mutations.
- Admin permission decisions.
- Secret-dependent operations.
- Complex transactional workflows.

Those must go through Render or database transactions.

---

## Rewrite Phases

## Phase 0: Freeze and Inventory Legacy Behavior

Goal: understand the current Firebase-era app before changing runtime architecture.

Tasks:

- Inventory all Firebase Functions exports from `functions/index.js`.
- Inventory all Firestore collections used by frontend/admin code.
- Inventory all status values for bookings, waitlist, reviews, contact messages, security events, and admin roles.
- Inventory current notification templates and timing rules.
- Inventory admin permissions and dashboard features.
- Create a Firebase-to-Supabase mapping table.

Deliverables:

- `docs/firebase-to-supabase-mapping.md`
- Domain workflow notes.
- List of legacy files that are reference-only.

Success criteria:

- No major Firebase behavior is unmapped.
- The team knows what must be rebuilt, retired, or deferred.

---

## Phase 1: Supabase Foundation

Goal: create the database/auth/storage foundation.

Tasks:

- Initialize Supabase project configuration.
- Create migration folder and migration naming convention.
- Create core tables.
- Add enums/check constraints for status fields.
- Add foreign keys and indexes.
- Enable RLS on all relevant tables.
- Write initial RLS policies.
- Create seed data for development.
- Decide whether media uses Supabase Storage, Cloudinary, or both.

Deliverables:

- Supabase migrations.
- Seed files.
- RLS policy files/notes.
- Local Supabase development notes.

Success criteria:

- Schema can be recreated from migrations.
- RLS is enabled and tested.
- No app logic depends on Firestore.

---

## Phase 2: Render Backend Foundation

Goal: create the trusted backend service.

Tasks:

- Create `backend/` Node.js project.
- Choose Express, Fastify, or another lightweight HTTP framework.
- Add environment variable validation.
- Add Supabase admin client.
- Add auth JWT verification middleware.
- Add admin permission middleware.
- Add request logging and error handling.
- Add CORS configuration for Vercel origins.
- Add health check endpoint.
- Add test framework.

Deliverables:

- `backend/src/server.js`
- `backend/src/app.js`
- `backend/src/config/env.js`
- `backend/src/db/supabaseAdmin.js`
- Middleware for auth/admin/errors.
- `GET /health` endpoint.

Success criteria:

- Backend runs locally.
- Backend can connect to Supabase.
- Backend can verify authenticated requests.
- Backend is ready for Render deployment.

---

## Phase 3: Auth, Profiles, Admins, and Permissions

Goal: replace Firebase Auth/Admin SDK behavior with Supabase Auth and database-backed admin permissions.

Tasks:

- Implement profile creation/sync flow.
- Implement admin lookup by Supabase user ID/email.
- Implement admin role and permission checks.
- Implement admin audit logging.
- Rebuild admin create/update/list workflows.
- Rebuild account restriction concepts using Supabase-compatible mechanisms.
- Define how force logout/password reset is handled under Supabase.

Deliverables:

- Admin tables and policies.
- Admin backend endpoints.
- Admin middleware.
- Tests for permission checks.

Success criteria:

- Super admins can manage admins.
- Normal admins are restricted by permissions.
- Admin audit logs are written consistently.

---

## Phase 4: Booking, Slots, and Waitlist Core

Goal: rebuild the most important business domain transactionally.

Tasks:

- Implement slot schema and constraints.
- Implement booking schema and constraints.
- Implement waitlist schema and constraints.
- Implement create booking workflow.
- Implement cancel booking workflow.
- Implement reschedule workflow.
- Implement admin status update and release workflow.
- Implement move waitlist to confirmed workflow.
- Implement queue position calculation.
- Add transaction tests for double-booking prevention.

Deliverables:

- Booking module.
- Booking slot module.
- Waitlist module.
- Transaction tests.

Success criteria:

- A slot cannot be double-booked.
- Booking lifecycle transitions are controlled.
- Waitlist entries remain ordered and consistent.
- Customer/admin permissions are enforced.

---

## Phase 5: Notifications and Scheduled Jobs

Goal: replace Firebase triggers/scheduled functions with Render jobs and an outbox pattern.

Tasks:

- Create notification outbox table.
- Create notification templates.
- Implement Resend integration.
- Implement WhatsApp Cloud API integration.
- Implement booking confirmation notifications.
- Implement contact message notification emails.
- Implement upcoming booking reminders.
- Implement waitlist slot-open notifications.
- Implement expired slot release scheduled job.
- Add retry/idempotency handling.

Deliverables:

- Notification module.
- Resend integration.
- WhatsApp integration.
- Render cron/job definitions.
- Tests for notification queue behavior.

Success criteria:

- Notifications are not sent inside fragile client code.
- Failed sends are trackable.
- Scheduled jobs work without Firebase Functions.

---

## Phase 6: Public Content, Reviews, Gallery, and Contact Messages

Goal: rebuild content/admin modules using Supabase and Render.

Tasks:

- Implement service category and services tables.
- Implement stylists table if needed.
- Implement gallery item management.
- Implement Cloudinary signing endpoint.
- Implement blog/content management.
- Implement review creation/moderation flow.
- Implement contact message creation/status/delete flow.
- Add RLS for public reads and admin writes.

Deliverables:

- Content modules.
- Review module.
- Contact module.
- Gallery/media module.
- RLS tests.

Success criteria:

- Public website can load approved content.
- Admin can manage content securely.
- Contact notifications work through Render.

---

## Phase 7: Security, Activity Timeline, and Observability

Goal: preserve useful security/admin visibility from the Firebase-era app.

Tasks:

- Implement login activity tracking endpoint.
- Implement account change history endpoint.
- Implement risk scoring logic if still needed.
- Implement security alerts.
- Implement activity timeline events.
- Implement admin dashboard queries.
- Add structured backend logs.
- Add rate limits for sensitive endpoints.

Deliverables:

- Security module.
- Activity timeline module.
- Admin dashboard data endpoints.
- Rate limiting middleware.

Success criteria:

- Admin security dashboard has trustworthy data.
- Sensitive endpoints are rate-limited.
- Audit/security events are consistent.

---

## Phase 8: Frontend Adapter Replacement

Goal: remove Firebase SDK usage from public/admin frontend behavior.

Tasks:

- Create Supabase browser client.
- Create Render API client.
- Replace Firebase Auth flows with Supabase Auth.
- Replace Firestore reads with Supabase queries or Render API calls.
- Replace Firestore realtime listeners with Supabase Realtime where allowed.
- Replace Firebase callable function calls with Render API calls.
- Remove Firebase config from public client configuration.
- Update admin UI data loading and actions.

Deliverables:

- `frontend/src/lib/supabaseClient.js` or equivalent.
- `frontend/src/lib/renderApiClient.js` or equivalent.
- Updated public booking/contact/review flows.
- Updated admin dashboard flows.

Success criteria:

- Browser code contains no Firebase runtime calls.
- Frontend works against Supabase/Render.
- Public keys only are exposed.

---

## Phase 9: Testing, Migration, Deployment, and Cleanup

Goal: prove the new system works and remove Firebase runtime dependency.

Tasks:

- Add unit tests for backend modules.
- Add integration tests for Supabase policies and workflows.
- Add E2E tests for public booking and admin actions.
- Create data migration scripts if production Firebase data must be moved.
- Deploy frontend to Vercel.
- Deploy backend to Render.
- Apply Supabase migrations.
- Verify environment variables across platforms.
- Remove or archive Firebase runtime files after replacement.
- Update README and deployment docs.

Deliverables:

- Test suite.
- Migration scripts if needed.
- Vercel deployment notes.
- Render deployment notes.
- Supabase migration/deployment notes.
- Cleanup PR removing Firebase runtime dependencies.

Success criteria:

- App deploys without Firebase.
- Tests pass.
- Core booking/admin workflows are verified.
- Firebase files are no longer active runtime dependencies.

---

## Suggested Implementation Order

Recommended order for practical development:

1. Create Supabase schema and policies.
2. Create Render backend foundation.
3. Implement auth/admin permission layer.
4. Implement booking/slot/waitlist transactions.
5. Implement notifications/jobs.
6. Implement content/reviews/contact/gallery.
7. Replace frontend Firebase usage.
8. Add tests and deployment workflows.
9. Remove Firebase runtime dependencies.

Do not start by deleting legacy files. First map behavior, rebuild replacements, verify parity, then remove legacy runtime pieces safely.

---

## Key Success Criteria for the Backend Rewrite

The backend rewrite is successful when:

- Supabase schema is migration-driven.
- RLS is enabled and tested.
- Render owns privileged workflows.
- Vercel frontend uses only public configuration.
- Booking workflows are transaction-safe.
- Waitlist behavior is deterministic.
- Notifications are reliable and idempotent.
- Admin permissions are centralized.
- Security/audit logs are preserved.
- No active Firebase SDK, Firebase Functions, Firestore, Firebase Auth, Firebase Hosting, or Firebase CLI deployment is required.
