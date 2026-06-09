# Firebase to Supabase/Render/Vercel Mapping

## Purpose

This document is the Phase 0 backend rewrite inventory. It maps the existing Firebase-era backend behavior to the new approved architecture:

- **Supabase**: Postgres, Auth, RLS, migrations, storage/realtime where appropriate.
- **Render**: trusted API, service-role Supabase access, workers, cron jobs, notification delivery, webhooks, Cloudinary signing.
- **Vercel**: frontend hosting and public/admin UI delivery.

The Firebase files listed here are reference-only. New runtime code must not import Firebase SDKs or deploy through Firebase.

---

## Legacy files reviewed for this checkpoint

| Legacy file                             | Purpose in old system                                                                                               | New role                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `functions/index.js`                    | Firebase callable functions, Firestore triggers, scheduled functions, notification logic, admin/security workflows. | Reference for backend business behavior.                                |
| `functions/client-config.js`            | White-label business name, contact notification email, timezone, Cloudinary folder.                                 | Reference for `site_settings`, Render env vars, and/or tenant settings. |
| `functions/waitlist-action-messages.js` | Waitlist slot-occupied error reason/message.                                                                        | Reference for Render error codes and API error details.                 |

---

## Backend function export parity matrix

Last verified in code on **2026-06-09** against `functions/index.js` and the current `backend/src` + `render.yaml` implementation.

Latest local validation on **2026-06-09**: `npm run test:phase9` passed (`check:js`, root unit tests 11/11, backend tests 72/72). The booking/waitlist/reminder/expired-slot parity fixes are covered by regression tests. Items marked partial or with conditional notes below still need either implementation or explicit product sign-off before final Firebase parity closure.

| Legacy Firebase export                   | Firebase behavior                                                                                                                                                | Current Supabase/Render behavior                                                                                                                                                                                                                                      | Parity status                         | Notes / remaining risks                                                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createCloudinarySignedUpload`           | Callable signs Cloudinary uploads for authenticated users using Firebase secrets.                                                                                | Render endpoint `POST /api/v1/uploads/cloudinary/sign` through `content.routes.js`; adapter handler `createCloudinarySignedUpload`; signs with Render env vars `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.                                | Implemented                           | Current route requires content-admin permission because it is mounted under content admin routes. If public/client authenticated uploads need this callable, add a non-admin authenticated route. |
| `logLoginActivity`                       | Callable records successful/failed login activity, calculates risk, creates security alerts, allows unauthenticated failure logging.                             | Render endpoint `POST /api/v1/security/login-activity`; optional auth; writes login/security telemetry through security service and rate limit middleware.                                                                                                            | Implemented                           | Confirm frontend still sends all legacy fields (`attemptedEmail`, browser/device/location/source) so dashboards stay complete.                                                                    |
| `logAccountSecurityChange`               | Callable records account security changes and creates alerts for sensitive events.                                                                               | Render endpoint `POST /api/v1/account/security-change`; requires auth allowing password-reset flow; writes account-change/security alert records.                                                                                                                     | Implemented                           | Good functional replacement; field naming is normalized by validators.                                                                                                                            |
| `adminRestrictUserAccount`               | Admin callable applies temporary block, force logout, password reset requirement, or clears restrictions using Firebase custom claims and token revocation.      | Render endpoint `POST /api/v1/admin/security/users/:userId/restrict`; writes Supabase Auth app metadata and `profiles.security_restrictions`; middleware blocks restricted accounts.                                                                                  | Implemented with Supabase differences | Supabase cannot exactly mirror Firebase token revocation semantics in all clients. Frontend must check/reload session after restrictions.                                                         |
| `adminCreateAdminUser`                   | Super admin creates Firestore `adminUsers` record for an existing Firebase Auth user.                                                                            | Render endpoint `POST /api/v1/admin/users`; creates `admin_users`; writes `admin_audit_logs`.                                                                                                                                                                         | Implemented                           | Uses Supabase UUID route/body identity instead of Firebase UID.                                                                                                                                   |
| `adminUpdateAdminUser`                   | Super admin updates admin role, permissions, active state, display name; prevents self-edit through this flow.                                                   | Render endpoint `PATCH /api/v1/admin/users/:adminUserId`; validates role/permissions; writes audit diff.                                                                                                                                                              | Implemented                           | Confirm frontend passes the Supabase `admin_users.id`/`user_id` expected by adapter.                                                                                                              |
| `adminListAdminUsers`                    | Super admin lists Firestore `adminUsers`.                                                                                                                        | Render endpoint `GET /api/v1/admin/users`; reads `admin_users`.                                                                                                                                                                                                       | Implemented                           | Good functional replacement.                                                                                                                                                                      |
| `adminMoveWaitlistBookingToConfirmed`    | Admin transaction converts waitlisted booking to confirmed if preferred slot is available; marks slot taken; updates waitlist; recalculates queue; writes audit. | Render endpoint `POST /api/v1/admin/waitlist/:waitlistId/move-to-confirmed`; updates `bookings`, `booking_slots`, `waitlist_entries`; recalculates queue; writes audit/activity; queues confirmation.                                                                 | Parity fixed                          | 2026-06-09 fix restored Firebase-compatible slot-occupied message/details using `WAITLIST_SLOT_OCCUPIED_MESSAGE` and `reason: slot-occupied`.                                                     |
| `adminUpdateBookingStatusAndReleaseSlot` | Admin completes/cancels booking and deletes/releases linked booking slot.                                                                                        | Render endpoints `POST /api/v1/admin/bookings/:bookingId/status` and `POST /api/v1/admin/bookings/:bookingId/release-slot`; updates booking, releases slot, queues notifications/activity/audit.                                                                      | Implemented                           | Render releases slots by updating rows instead of deleting `bookingSlots`; this is intentional for auditability.                                                                                  |
| `clientGetWaitlistQueueInfo`             | Authenticated client fetches queue position for own booking/waitlist entry.                                                                                      | Render endpoint `GET /api/v1/waitlist/:waitlistId/queue`; requires ownership and recalculates queue.                                                                                                                                                                  | Implemented                           | Firebase accepted booking ID or waitlist ID; current Render route is waitlist ID based. Add booking-ID lookup route only if frontend still calls by booking ID.                                   |
| `clientCancelBooking`                    | Authenticated client cancels own pending/confirmed booking and deletes/releases slot.                                                                            | Render endpoint `POST /api/v1/bookings/:bookingId/cancel`; updates booking, releases slot, recalculates waitlist, queues notification/activity.                                                                                                                       | Implemented                           | Render also allows waitlisted cancellation; this keeps waitlist records synced.                                                                                                                   |
| `clientReleaseExpiredBookingSlot`        | Authenticated client can request expired slot release by slot ID.                                                                                                | Render endpoint `POST /api/v1/booking-slots/:slotId/release-expired`; adapter no longer stubs this call.                                                                                                                                                              | Parity fixed                          | 2026-06-09 fix restored real endpoint and 2-hour expiration checks. Authenticated-only like Firebase callable; no ownership check, matching old behavior.                                         |
| `clientRescheduleBooking`                | Authenticated client reschedules own pending/confirmed booking; reserves new slot and releases previous slot transactionally.                                    | Render endpoint `POST /api/v1/bookings/:bookingId/reschedule`; checks slot availability, reserves target slot, releases old slot, updates booking, queues notification/activity.                                                                                      | Implemented                           | Render status preservation matches Firebase (`pending` stays pending, confirmed remains confirmed) through service logic.                                                                         |
| `sendBookingConfirmationEmail`           | Firestore create trigger sends Resend email and writes send status fields on booking.                                                                            | Booking service queues `notification_outbox` email rows; Render worker sends Resend; `booking_notifications` tracks delivery.                                                                                                                                         | Implemented via outbox                | Different storage shape from Firebase (`emailStatus` fields moved to outbox/booking_notifications), but behavior is preserved.                                                                    |
| `sendBookingConfirmationWhatsApp`        | Firestore create trigger sends WhatsApp confirmation and writes status fields on booking.                                                                        | Booking service queues WhatsApp outbox rows; Render worker sends via WhatsApp Cloud API; status tracked idempotently.                                                                                                                                                 | Implemented via outbox                | Ensure Render env names are set (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_GRAPH_API_VERSION`).                                                                              |
| `sendUpcomingBookingWhatsAppReminders`   | Scheduled every 15 minutes; sends reminders for confirmed bookings around 2 hours before appointment, ±15 minute window, without duplicate reminders.            | Render cron `salon-upcoming-booking-reminders`, `npm run job:reminders`, every 15 minutes; lead time `120`, window `15`; idempotent outbox key uses booking/start time.                                                                                               | Parity fixed                          | 2026-06-09 fix changed previous 24-hour window/hourly schedule to Firebase timing. Regression test added in `backend/tests/notification.service.test.js`.                                         |
| `releaseExpiredBookingSlots`             | Scheduled every 15 minutes; releases occupied slots after 2-hour grace; pending → expired, confirmed → no_show.                                                  | Render cron `salon-release-expired-booking-slots`, `npm run job:release-expired-slots`, every 15 minutes; `EXPIRED_SLOT_GRACE_MINUTES=120`; updates bookings and releases slots; queues waitlist notifications.                                                       | Parity fixed                          | 2026-06-09 fix changed previous 60-minute grace/30-minute schedule to Firebase timing and added slot-document workflow. Regression tests added in `backend/tests/booking.service.test.js`.        |
| `initializeBookingSystemFields`          | Booking create trigger defaults `whatsappStatus` and `reminderSentAt`.                                                                                           | Render uses service-layer defaults plus `notification_outbox`/`booking_notifications`; no Firebase trigger fields required.                                                                                                                                           | Replaced intentionally                | Frontend should read notification status from new tables/API, not Firebase-era booking fields.                                                                                                    |
| `updateReviewRateLimit`                  | Review create trigger writes activity timeline event and updates review cooldown in `rateLimits`; cooldown is 2 minutes.                                         | Review endpoint/service writes the review and `review_posted` activity; `POST /api/v1/reviews` now validates first, then applies a 1-submission-per-2-minutes `review` rate limit through `rate_limits`.                                                              | Parity fixed                          | 2026-06-09 fix mounted validation-safe route cooldown middleware so malformed payloads still return validation errors before rate-limit/Supabase work.                                            |
| `trackReviewEdited`                      | Review update trigger writes timeline event when text/rating/service changes.                                                                                    | Admin review update route `PATCH /api/v1/admin/reviews/:reviewId` updates review fields/metadata, writes audit, and writes `review_edited` activity when text/rating/service changes; adapter now syncs admin review text/reply/featured edits and deletes to Render. | Parity fixed for admin edit flow      | Public customer self-edit parity should still be added only if the frontend reintroduces customer review editing.                                                                                 |
| `updateContactRateLimit`                 | Contact message create trigger writes activity timeline event and updates contact cooldown; cooldown is 60 seconds.                                              | Contact endpoint writes contact message, `contact_submitted` activity, and notification outbox row; `POST /api/v1/contact-messages` now validates first, then applies a 1-submission-per-60-seconds `contact` rate limit through `rate_limits`.                       | Parity fixed                          | 2026-06-09 fix mounted validation-safe route cooldown middleware so malformed payloads still return validation errors before rate-limit/Supabase work.                                            |
| `sendContactMessageNotificationEmail`    | Contact message create trigger sends Resend notification to configured business email.                                                                           | Contact endpoint queues notification outbox row to tenant/business contact email; Render worker sends Resend.                                                                                                                                                         | Implemented via outbox                | Requires `site_settings.contact_notification_email` or configured recipient path.                                                                                                                 |
| `trackBookingCreated`                    | Booking create trigger writes activity timeline event.                                                                                                           | Booking service writes `activity_timeline` during booking creation.                                                                                                                                                                                                   | Implemented                           | Good functional replacement.                                                                                                                                                                      |
| `trackBookingCanceled`                   | Booking update trigger writes activity event when status becomes `cancelled`.                                                                                    | Booking cancel/status service writes `activity_timeline` during cancellation/status change.                                                                                                                                                                           | Implemented                           | Good functional replacement.                                                                                                                                                                      |
| `syncWaitlistQueuePositions`             | Waitlist update trigger recalculates queue positions when slot/status/createdAt changes.                                                                         | Waitlist creation, cancellation, slot release, and promotion flows call queue recalculation service logic.                                                                                                                                                            | Implemented in service flows          | No DB trigger currently covers out-of-band SQL edits; avoid direct table edits or add RPC/trigger later.                                                                                          |
| `initializeWaitlistQueuePosition`        | Waitlist create trigger calculates initial queue position.                                                                                                       | Waitlisted booking creation creates waitlist entry then recalculates queue positions/size.                                                                                                                                                                            | Implemented                           | Good functional replacement.                                                                                                                                                                      |
| `notifyWaitlistOnSlotOpen`               | Booking slot delete trigger notifies first waiting waitlist entry by email/WhatsApp and marks status `notified`/`notification_failed`.                           | Slot release service and waitlist cron queue slot-open notifications via outbox and update waitlist notification state.                                                                                                                                               | Implemented via outbox                | Render releases slots by row update (`taken=false`, `released_at`) rather than delete; cron `salon-waitlist-slot-open-notifications` runs every 15 minutes.                                       |

---

## Firestore collection to Supabase table mapping

| Firestore collection   | New Supabase table(s)                                        | Notes                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bookings`             | `bookings`, `booking_status_events`, `booking_notifications` | Add `starts_at`, `tenant_id`, `slot_id`, lifecycle timestamps, status constraints.                                                                      |
| `bookingSlots`         | `booking_slots`                                              | Use unique constraint for tenant/date/time/stylist and prevent double-booking. Prefer updating/releasing rows over deleting if audit history is needed. |
| `waitlist`             | `waitlist_entries`                                           | Store preferred slot/date/time, queue position/size, status, notification metadata.                                                                     |
| `users`                | `profiles`, optional `user_security_restrictions`            | Supabase Auth is identity source; profile/security extension data lives in Postgres.                                                                    |
| `adminUsers`           | `admin_users`                                                | Database-backed admin roles and permission flags.                                                                                                       |
| `adminAuditLogs`       | `admin_audit_logs`                                           | Append-only audit records written by Render service role.                                                                                               |
| `adminSecurityActions` | `admin_security_actions`                                     | Admin restriction/security action history.                                                                                                              |
| `loginActivities`      | `login_activities`                                           | Login method/status/device/location/risk data.                                                                                                          |
| `securityAlerts`       | `security_alerts`                                            | Open/resolved alert workflow for admin dashboard.                                                                                                       |
| `accountChangeHistory` | `account_change_history`                                     | User account security change history.                                                                                                                   |
| `activityTimeline`     | `activity_timeline`                                          | Cross-domain admin/customer activity feed.                                                                                                              |
| `rateLimits`           | `rate_limits`                                                | Cooldowns for reviews/contact and potentially API abuse protection.                                                                                     |
| `reviews`              | `reviews`                                                    | Public approved reads, user-owned creation/edit rules, admin moderation.                                                                                |
| `contactMessages`      | `contact_messages`                                           | Public/customer submission, admin status/delete workflow, notification outbox.                                                                          |

Additional target tables from the rewrite plan that do not have a direct single Firebase trigger in `functions/index.js` but are needed for the rebuilt app:

```text
site_settings
service_categories
services
service_variants
stylists
gallery_items
blog_posts
notification_outbox
webhook_events
file_uploads
client_tenants
tenant_memberships
```

---

## Status, role, permission, and constant inventory

### Booking statuses

Canonical new statuses:

```text
pending
confirmed
completed
cancelled
waitlisted
expired
no_show
```

Legacy aliases currently normalized by backend logic:

| Legacy alias                                | Canonical status |
| ------------------------------------------- | ---------------- |
| `complete`                                  | `completed`      |
| `canceled`                                  | `cancelled`      |
| `booked`                                    | `confirmed`      |
| `waitlist`, `waiting`                       | `waitlisted`     |
| `no-show`, `no show`, `noshow`              | `no_show`        |
| `in progress`, `in_progress`, `in-progress` | `confirmed`      |

Client actions are currently allowed only for:

```text
pending
confirmed
```

Auto-release behavior:

| Current status | Auto-release status |
| -------------- | ------------------- |
| `pending`      | `expired`           |
| `confirmed`    | `no_show`           |

### Waitlist statuses

Canonical new statuses:

```text
waiting
notified
contacted
booked
cancelled
notification_failed
```

Legacy aliases currently normalized by backend logic:

| Legacy alias             | Canonical status |
| ------------------------ | ---------------- |
| `waitlist`, `waitlisted` | `waiting`        |
| `canceled`               | `cancelled`      |

Queue-active statuses:

```text
waiting
notified
contacted
notification_failed
```

### Admin roles and permissions

Roles:

```text
super_admin
admin
```

Permission keys:

```text
canManageAdmins
canManageBookings
canManageContent
canManageSecurity
```

Default non-super-admin permissions from legacy behavior:

```json
{
	"canManageAdmins": false,
	"canManageBookings": true,
	"canManageContent": true,
	"canManageSecurity": false
}
```

### Security and login constants

Login methods:

```text
google
email/password
anonymous
unknown
```

Login statuses:

```text
success
failure
```

Device types:

```text
mobile
desktop
tablet
unknown
```

Risk levels:

```text
low
medium
high
```

Security alert types and severities observed in legacy code:

| Alert type                       | Severity |
| -------------------------------- | -------- |
| `multiple_failed_login_attempts` | `high`   |
| `new_device_detected`            | `medium` |
| `login_unusual_country`          | `high`   |
| `rapid_repeated_logins`          | `high`   |
| `account_deleted`                | `high`   |
| `account_deactivated`            | `high`   |
| `password_changed`               | `medium` |
| `email_changed`                  | `medium` |
| `phone_changed`                  | `low`    |
| `profile_updated`                | `low`    |

Admin restriction actions:

```text
temporary_block
force_logout
force_password_reset
clear_restrictions
```

### Activity timeline types

```text
booking_created
booking_canceled
review_posted
review_edited
contact_submitted
```

### Timing rules

| Rule                               | Legacy value                   | New location                                                            |
| ---------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Review cooldown                    | 2 minutes                      | `POST /api/v1/reviews` validation-safe `rateLimit` middleware.          |
| Contact cooldown                   | 60 seconds                     | `POST /api/v1/contact-messages` validation-safe `rateLimit` middleware. |
| Failed login short window          | 5 minutes                      | Security service config.                                                |
| Login lock window                  | 15 minutes                     | Security service config.                                                |
| Login lock threshold               | 5 failed attempts              | Security service config.                                                |
| Login repeat failure threshold     | 3 failed attempts              | Security service config.                                                |
| Login lock duration                | 30 minutes                     | Security service config.                                                |
| WhatsApp reminder lead time        | 2 hours before appointment     | Notification job config.                                                |
| WhatsApp reminder window           | ±15 minutes                    | Notification job config.                                                |
| Expired booking slot release grace | 2 hours after appointment time | Booking job config.                                                     |

---

## White-label/client configuration mapping

Legacy `functions/client-config.js` currently contains:

| Legacy setting             | Current value             | New target                                                                                                 |
| -------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `businessName`             | `Royal Braids`            | `site_settings.business_name` or tenant config.                                                            |
| `teamName`                 | `Royal Braids Team`       | `site_settings.team_name` or tenant config.                                                                |
| `contactNotificationEmail` | `billyopiyo597@gmail.com` | Render env var for single-tenant, or `site_settings.contact_notification_email` for tenant-managed config. |
| `timezone`                 | `Africa/Nairobi`          | Shared app/tenant setting used by Render jobs and frontend display.                                        |
| `utcOffsetHours`           | `3`                       | Prefer timezone-aware date handling; keep only as fallback.                                                |
| `cloudinaryFolder`         | `royal-braids/gallery`    | Render Cloudinary signing default, optionally tenant-specific.                                             |

---

## Important backend workflow notes for rewrite

### Booking slots

- Legacy slot IDs are deterministic: `date__stylistKey__timeWithoutColonOrSpaces`.
- New schema should not rely only on encoded IDs. Use UUID primary keys plus a unique constraint such as `(tenant_id, slot_date, slot_time, stylist_key)` or `(tenant_id, starts_at, stylist_key)`.
- A slot must not be double-booked. This must be enforced with database constraints and transactional service logic.

### Waitlist queue

- Queue is ordered by `createdAt`, then document ID as tie-breaker.
- Active statuses are `waiting`, `notified`, `contacted`, and `notification_failed`.
- Queue position and queue size are mirrored onto booking records in the legacy app. In the new app, prefer canonical queue data in `waitlist_entries`, with API responses joining/mapping as needed.

### Notifications

- Legacy code sends notifications directly in Firestore triggers and scheduled functions.
- New code should use an outbox pattern:
  1. Business transaction writes domain change.
  2. Same transaction inserts `notification_outbox` row.
  3. Render worker sends through Resend or WhatsApp Cloud API.
  4. Worker marks notification as `sent`, `failed`, `skipped`, or retryable.
- Notification delivery must be idempotent.

### Activity and audit

- Admin actions should write `admin_audit_logs`.
- Customer/domain events should write `activity_timeline`.
- Do not rely on hidden Firestore triggers for core business history; write these records in service transactions where possible.

### Supabase Auth differences to resolve

The Firebase code uses custom claims and `revokeRefreshTokens` for account restriction workflows. Supabase-compatible behavior needs a dedicated design before implementation:

- temporary account blocks
- forced logout/session invalidation
- forced password reset
- admin-managed restriction visibility in the frontend

Potential target pieces:

- `profiles.security_restrictions` or `user_security_restrictions`
- Supabase Admin API user metadata/app metadata updates where safe
- Supabase Auth admin ban/sign-out capabilities where available
- Render middleware checks for restricted accounts on privileged endpoints
- frontend session checks against public-safe restriction state where appropriate

---

## First implementation checkpoint after this mapping

The next rebuild step should be **Phase 1: Supabase Foundation**, not Render route implementation yet.

Recommended immediate deliverables:

1. Create `supabase/migrations/` and migration naming convention.
2. Draft the first migration for identity/admin/security foundation:
   - `profiles`
   - `admin_users`
   - `admin_audit_logs`
   - `admin_security_actions`
   - `login_activities`
   - `security_alerts`
   - `account_change_history`
   - `activity_timeline`
   - `rate_limits`
3. Draft the booking foundation migration:
   - `booking_slots`
   - `bookings`
   - `waitlist_entries`
   - `booking_status_events`
   - `booking_notifications`
   - `notification_outbox`
4. Add status check constraints/enums and required indexes.
5. Enable RLS and write first policy pass.

Only after this foundation is in place should the Render backend be scaffolded under `backend/`.
