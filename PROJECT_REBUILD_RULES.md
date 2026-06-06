# Project Rebuild Rules

## Purpose

This file is the rebuild rulebook for this salon marketplace / white-label salon website project. The project has been restored to its original Firebase-era state, but the next rebuild must move forward using only:

- **Supabase**
- **Render**
- **Vercel**

There must be **no Firebase integration** in the rebuilt application. Existing Firebase Functions, scripts, and browser JavaScript files may remain in the repository temporarily as reference material only.

---

## Non-Negotiable Platform Decision

### Approved ecosystem

| Platform | Responsibility |
| --- | --- |
| **Supabase** | Postgres database, Supabase Auth, Row Level Security, Storage, Realtime, migrations, database functions/triggers where appropriate. |
| **Render** | Backend API, privileged server-side logic, admin-only workflows, scheduled jobs, notification delivery, webhooks, Cloudinary signing, service-role Supabase access. |
| **Vercel** | Frontend hosting and deployment for the public salon website/admin frontend. |

### Disallowed ecosystem

The rebuilt project must not use Firebase as an active dependency, runtime, deployment target, or data source.

Disallowed in new code:

- Firebase Auth
- Firestore
- Firebase Realtime Database
- Firebase Storage
- Firebase Hosting
- Firebase Cloud Functions
- Firebase callable functions
- Firebase scheduled functions
- Firebase SDK imports in frontend code
- Firebase Admin SDK in backend code
- Firebase security rules as the active authorization model
- Firebase emulator workflows as the active local development model

Existing Firebase files may be kept only until their logic has been reviewed and replaced.

---

## Reference-Only Rule for Existing JavaScript

The current repository contains Firebase-oriented files from the original implementation. These files are useful because they describe important business behavior, but they must not define the rebuilt architecture.

### Reference-only files

Use these files to understand current behavior:

- `functions/index.js`
- `functions/client-config.js`
- `functions/waitlist-action-messages.js`
- `scripts/new-client.js`
- `scripts/optimize-images.js`
- `scripts/test-static-server.js`
- `public/client-config.js`
- `public/JS/script.js`
- `public/JS/admin.js`
- Existing tests under `tests/` and `functions/__tests__/`
- Existing Firebase config/rules files such as `firebase.json`, `.firebaserc`, and `firestore.rules`

### What may be reused conceptually

The rebuild may reuse these ideas from the existing files:

- Domain names and workflows.
- Booking and schedule behavior.
- Booking slot release rules.
- Waitlist queue behavior.
- Admin permissions and audit concepts.
- Review moderation concepts.
- Contact message workflow.
- Security/login activity tracking concepts.
- Activity timeline concepts.
- Notification content and delivery intent.
- Client white-label configuration concepts.
- Validation rules and status names, after review.

### What must not be reused directly

Do not carry forward Firebase-specific implementation details:

- `firebase.initializeApp(...)`
- `firebase.auth()`
- `firebase.firestore()`
- `admin.firestore()`
- `admin.auth()`
- `onCall(...)`
- `onDocumentCreated(...)`
- `onDocumentUpdated(...)`
- `onDocumentDeleted(...)`
- `onSchedule(...)`
- Firestore collection/document access patterns.
- Firestore security rules as production authorization.
- Firebase CLI deployment scripts.

The correct approach is a clean rewrite that preserves business intent while replacing infrastructure with Supabase, Render, and Vercel.

---

## Target Ownership Rules

### Supabase owns data and authorization boundaries

Supabase is the source of truth for:

- Users and identities through Supabase Auth.
- Postgres tables for bookings, slots, waitlist, reviews, contact messages, content, gallery records, security events, admin roles, audit logs, and activity timeline.
- Row Level Security policies.
- Database migrations.
- Storage buckets and storage policies.
- Realtime subscriptions where client-facing realtime updates are required.

Supabase service-role credentials must only be used from the trusted Render backend, never from browser code or Vercel public frontend bundles.

### Render owns privileged backend behavior

Render is the execution environment for server-side logic that cannot safely run in the browser.

Render backend responsibilities include:

- Admin-only API endpoints.
- Booking lifecycle workflows requiring server-side transactions.
- Waitlist conversion workflows.
- Scheduled jobs such as booking reminder checks and expired-slot release.
- Email notification delivery through Resend or an equivalent provider.
- WhatsApp Cloud API notification delivery.
- Cloudinary signed upload generation.
- Webhooks.
- Audit logging.
- Rate limiting and abuse protection.
- Service-role Supabase access.

### Vercel owns frontend delivery

Vercel is responsible for hosting the public/admin frontend.

Frontend code may use:

- Supabase public anon key.
- Supabase Auth client.
- Supabase realtime subscriptions where permitted by RLS.
- Render API base URL.
- Public configuration values.

Frontend code must not include:

- Supabase service-role key.
- Provider secrets.
- WhatsApp tokens.
- Resend API keys.
- Cloudinary API secret.
- Any Firebase configuration for new runtime behavior.

---

## Rebuild Architecture Rules

### Rewrite, do not patch

The migration must not be a shallow replacement of Firebase method calls. Each domain should be rewritten with clear boundaries:

- Database schema first.
- RLS policies first.
- Backend service layer second.
- Frontend adapter/client layer third.
- Tests and migration validation throughout.

### Use explicit domain modules

Backend code should be organized around domain concepts, not around infrastructure SDK calls.

Recommended domains:

- Auth/profile
- Users
- Admins and permissions
- Bookings
- Booking slots/schedule
- Waitlist
- Reviews
- Contact messages
- Gallery/media
- Blog/content
- Notifications
- Security events
- Activity timeline
- Client/site settings

### Use database constraints for core correctness

Critical invariants should be protected at the database level where possible:

- A booking slot cannot be double-booked.
- Booking status must be one of the allowed statuses.
- Waitlist status must be one of the allowed statuses.
- Admin roles and permission keys must be controlled.
- Timestamps and ownership columns must be consistent.
- User-owned rows must reference valid users.

### Use transactions for lifecycle changes

Operations that touch multiple records must be transactional. Examples:

- Creating a booking and reserving a slot.
- Cancelling a booking and releasing a slot.
- Rescheduling a booking from one slot to another.
- Moving a waitlisted booking into a confirmed slot.
- Auto-releasing expired slots.
- Updating booking status while writing audit/activity records.

---

## Security Rules

### Supabase RLS is mandatory

Every user-facing table must have Row Level Security enabled. Public access must be explicit and minimal.

Minimum policy expectations:

- Customers can read and manage only their own private booking/profile records.
- Public visitors can read only approved public content, active services, public gallery items, and approved reviews.
- Public visitors can create limited contact/waitlist/booking records only through safe policies or through Render API endpoints.
- Admins can access admin surfaces only if their role/permission record allows it.
- Service-role operations happen only from Render.

### Admin authorization must be centralized

Admin checks should not be scattered randomly across handlers.

Use a centralized authorization layer for:

- Super admin checks.
- Admin role checks.
- Permission checks such as booking management, content management, security management, and admin management.
- Audit logging.

### No secrets in browser code

Public frontend config may include only safe public values:

- Supabase project URL.
- Supabase anon key.
- Render public API URL.
- Public Cloudinary cloud name/upload preset only if unsigned uploads are intentionally allowed.
- Branding and contact information.

Private secrets must live in platform environment variables.

---

## Configuration Rules

### Environment variables

Use environment variables per platform.

Render backend examples:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` if needed for token validation flows
- `JWT_SECRET` or Supabase JWT verification configuration if needed
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `WHATSAPP_CLOUD_ACCESS_TOKEN`
- `WHATSAPP_CLOUD_PHONE_NUMBER_ID`
- `WHATSAPP_CLOUD_API_VERSION`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_ORIGIN`

Vercel frontend examples:

- `NEXT_PUBLIC_SUPABASE_URL` or equivalent public build variable.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or equivalent public build variable.
- `NEXT_PUBLIC_RENDER_API_URL`.

### Client white-label config

The current `public/client-config.js` demonstrates a useful white-label configuration concept. In the rebuild, client/site configuration should move toward one of these approaches:

- Static public configuration generated at build time for Vercel.
- Supabase `site_settings`, `service_categories`, `services`, and `stylists` tables.
- A combination of static fallback config plus database-managed admin settings.

The rebuilt version must remove Firebase config from client-facing configuration.

---

## API Rules

Render APIs should be versioned and predictable.

Recommended base path:

```text
/api/v1
```

Recommended endpoint style:

```text
GET    /api/v1/bookings
POST   /api/v1/bookings
POST   /api/v1/bookings/:id/cancel
POST   /api/v1/bookings/:id/reschedule
POST   /api/v1/admin/bookings/:id/status
POST   /api/v1/admin/waitlist/:id/move-to-confirmed
POST   /api/v1/uploads/cloudinary/sign
POST   /api/v1/contact-messages
POST   /api/v1/security/login-activity
```

API responses should be JSON and should use consistent error shapes.

Suggested error shape:

```json
{
  "ok": false,
  "code": "permission_denied",
  "message": "Admin booking management permission required",
  "details": {}
}
```

---

## Testing Rules

The rebuild should include tests for:

- Supabase migrations.
- RLS policies.
- Backend service functions.
- Booking transaction behavior.
- Waitlist queue behavior.
- Admin authorization behavior.
- Notification idempotency.
- Frontend API/Supabase adapters.
- End-to-end booking and admin workflows.

Firebase emulator tests should not be the future testing foundation. They may be read only to understand expected behavior.

---

## Deployment Rules

### Vercel

Deploy only frontend/static app concerns to Vercel.

### Render

Deploy only backend services, cron jobs, workers, and webhook handlers to Render.

### Supabase

Deploy schema, policies, functions, triggers, and storage configuration through migrations and controlled Supabase workflows.

### No Firebase deploys

The rebuild must not rely on:

```text
firebase deploy
firebase emulators:start
firebase functions:config:set
firebase hosting
```

Existing Firebase commands in old files should be considered legacy documentation only until removed or replaced.

---

## Migration Documentation Rule

Every Firebase-era behavior that is replaced should be documented in a mapping table before implementation or during the implementation phase.

Recommended mapping format:

| Legacy Firebase behavior | New Supabase/Render/Vercel behavior | Status |
| --- | --- | --- |
| Firestore `bookings` collection | Supabase `bookings` table + RLS + Render booking service | Planned |
| Firebase callable `clientCancelBooking` | Render `POST /api/v1/bookings/:id/cancel` | Planned |
| Firestore trigger on booking create | Render service call and notification job | Planned |

---

## Pull Request / Change Checklist

Before any rebuild change is considered acceptable, confirm:

- [ ] No new Firebase dependency was added.
- [ ] No Firebase SDK import was added.
- [ ] No Firebase deployment workflow was added.
- [ ] Supabase table changes are represented by migrations.
- [ ] RLS policies were considered for every table touched.
- [ ] Privileged logic runs only on Render backend.
- [ ] Browser code uses only public keys/config.
- [ ] Existing Firebase-era JS was used only as reference.
- [ ] Tests or validation notes were added.
- [ ] Documentation was updated when architecture changed.

---

## Definition of Done for the Rebuild Direction

The rebuild direction is correctly established when:

- The active architecture uses Supabase for data/auth/storage/realtime.
- The active backend runs on Render.
- The active frontend deploys on Vercel.
- Firebase files are no longer part of runtime behavior.
- Existing Firebase logic has been mapped, rewritten, tested, and then safely archived or removed.
- The project can be deployed without Firebase CLI, Firebase SDKs, Firestore, Firebase Auth, Firebase Hosting, or Firebase Cloud Functions.
