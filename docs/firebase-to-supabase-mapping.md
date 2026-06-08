# Firebase to Supabase/Render/Vercel Mapping

## Purpose

This document is the Phase 0 backend rewrite inventory. It maps the existing Firebase-era backend behavior to the new approved architecture:

- **Supabase**: Postgres, Auth, RLS, migrations, storage/realtime where appropriate.
- **Render**: trusted API, service-role Supabase access, workers, cron jobs, notification delivery, webhooks, Cloudinary signing.
- **Vercel**: frontend hosting and public/admin UI delivery.

The Firebase files listed here are reference-only. New runtime code must not import Firebase SDKs or deploy through Firebase.

---

## Legacy files reviewed for this checkpoint

| Legacy file | Purpose in old system | New role |
| --- | --- | --- |
| `functions/index.js` | Firebase callable functions, Firestore triggers, scheduled functions, notification logic, admin/security workflows. | Reference for backend business behavior. |
| `functions/client-config.js` | White-label business name, contact notification email, timezone, Cloudinary folder. | Reference for `site_settings`, Render env vars, and/or tenant settings. |
| `functions/waitlist-action-messages.js` | Waitlist slot-occupied error reason/message. | Reference for Render error codes and API error details. |

---

## Backend function export mapping

| Legacy Firebase export | Firebase behavior | New Supabase/Render behavior | Target phase | Status |
| --- | --- | --- | --- | --- |
| `createCloudinarySignedUpload` | Callable function signs Cloudinary uploads for authenticated users using Firebase secrets. | Render endpoint `POST /api/v1/uploads/cloudinary/sign`; verify Supabase JWT; sign with Render env vars `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; return consistent JSON. | Phase 6 | Planned |
| `logLoginActivity` | Callable function records successful/failed login activity, calculates risk, creates security alerts. Allows unauthenticated failure logging. | Render endpoint `POST /api/v1/security/login-activity`; write to `login_activities`; create `security_alerts`; apply rate limiting; support safe unauthenticated failure events. | Phase 7 | Planned |
| `logAccountSecurityChange` | Callable function records account security changes and creates alerts for sensitive events. | Render endpoint `POST /api/v1/account/security-change`; require Supabase auth; write `account_change_history`; create `security_alerts` for sensitive changes. | Phase 7 | Planned |
| `adminRestrictUserAccount` | Callable admin action applies temporary block, force logout, password reset requirement, or clears restrictions using Firebase custom claims and token revocation. | Render endpoint `POST /api/v1/admin/security/users/:userId/restrict`; require admin security permission; store restrictions in `profiles`/`user_security_restrictions`; use Supabase-compatible admin controls for bans/session invalidation/password reset. | Phase 3 / Phase 7 | Needs Supabase Auth design |
| `adminCreateAdminUser` | Super admin creates Firestore `adminUsers` record for an existing Firebase Auth user. | Render endpoint `POST /api/v1/admin/users`; require super admin; create `admin_users`; write `admin_audit_logs`. | Phase 3 | Planned |
| `adminUpdateAdminUser` | Super admin updates admin role, permissions, active state, display name. Prevents self-edit through this flow. | Render endpoint `PATCH /api/v1/admin/users/:userId`; require super admin; validate role/permissions; write audit diff to `admin_audit_logs`. | Phase 3 | Planned |
| `adminListAdminUsers` | Super admin lists Firestore `adminUsers`. | Render endpoint `GET /api/v1/admin/users`; require super admin; read `admin_users`. | Phase 3 | Planned |
| `adminMoveWaitlistBookingToConfirmed` | Admin transaction converts a waitlisted booking to confirmed if preferred slot is available; marks slot taken; updates waitlist; recalculates queue; writes audit. | Render endpoint `POST /api/v1/admin/waitlist/:waitlistId/move-to-confirmed`; transaction over `bookings`, `booking_slots`, `waitlist_entries`; enforce no double-booking; recalculate queue; write `admin_audit_logs` and activity/notification outbox rows. | Phase 4 | Planned |
| `adminUpdateBookingStatusAndReleaseSlot` | Admin completes/cancels booking and deletes/releases linked booking slot. | Render endpoint `POST /api/v1/admin/bookings/:bookingId/status` or `POST /api/v1/admin/bookings/:bookingId/release-slot`; transaction updates booking status and releases slot; write audit/activity events. | Phase 4 | Planned |
| `clientGetWaitlistQueueInfo` | Authenticated client fetches queue position for own booking/waitlist entry. | Render endpoint `GET /api/v1/waitlist/:waitlistId/queue` and/or `GET /api/v1/bookings/:bookingId/waitlist-queue`; require ownership via Supabase JWT/RLS. | Phase 4 | Planned |
| `clientCancelBooking` | Authenticated client cancels own pending/confirmed booking and deletes/releases slot. | Render endpoint `POST /api/v1/bookings/:bookingId/cancel`; transaction updates `bookings`, releases `booking_slots`, syncs waitlist, queues notifications/activity. | Phase 4 | Planned |
| `clientReleaseExpiredBookingSlot` | Authenticated client can request expired slot release by slot ID. | Prefer Render cron `releaseExpiredBookingSlots`; if kept, expose guarded endpoint `POST /api/v1/booking-slots/:slotId/release-expired` with strict validation. | Phase 4 / Phase 5 | Review before keeping |
| `clientRescheduleBooking` | Authenticated client reschedules own pending/confirmed booking; reserves new slot and releases previous slot transactionally. | Render endpoint `POST /api/v1/bookings/:bookingId/reschedule`; transaction checks target slot availability, reserves new slot, releases old slot, updates booking, queues activity/notification. | Phase 4 | Planned |
| `sendBookingConfirmationEmail` | Firestore create trigger sends Resend email and writes send status fields on booking. | Booking service inserts `notification_outbox` row in same transaction; Render worker sends Resend email; update `booking_notifications`/outbox status. | Phase 5 | Planned |
| `sendBookingConfirmationWhatsApp` | Firestore create trigger sends WhatsApp confirmation and writes status fields on booking. | Booking service inserts WhatsApp `notification_outbox` row; Render worker sends via WhatsApp Cloud API; update delivery status idempotently. | Phase 5 | Planned |
| `sendUpcomingBookingWhatsAppReminders` | Firebase scheduled function runs every 15 minutes; sends 2-hour WhatsApp reminders for confirmed bookings without `reminderSentAt`. | Render cron/job `sendUpcomingBookingReminders`; query `bookings.starts_at`; enqueue/send reminder idempotently; track in `booking_notifications` or `notification_outbox`. | Phase 5 | Planned |
| `releaseExpiredBookingSlots` | Firebase scheduled function every 15 minutes releases expired occupied slots after 2-hour grace; pending -> expired, confirmed -> no_show. | Render cron/job `releaseExpiredBookingSlots`; transactionally update `booking_slots` and `bookings`; write release reason/source and activity/audit events. | Phase 5 | Planned |
| `initializeBookingSystemFields` | Booking create trigger defaults `whatsappStatus` and `reminderSentAt`. | Use database defaults, migrations, and service-layer defaults; avoid trigger-only hidden state where possible. | Phase 1 / Phase 4 | Planned |
| `updateReviewRateLimit` | Review create trigger writes activity timeline event and updates review cooldown in `rateLimits`. | Review service/endpoint writes `reviews`, `activity_timeline`, and `rate_limits` transactionally or via controlled service flow. | Phase 6 / Phase 7 | Planned |
| `trackReviewEdited` | Review update trigger writes timeline event when text/rating/service changes. | Review moderation/edit service writes `activity_timeline` when edit is accepted. | Phase 6 / Phase 7 | Planned |
| `updateContactRateLimit` | Contact message create trigger writes activity timeline event and updates contact cooldown. | Contact endpoint writes `contact_messages`, `activity_timeline`, `rate_limits`, and notification outbox row. | Phase 6 / Phase 7 | Planned |
| `sendContactMessageNotificationEmail` | Contact message create trigger sends Resend notification to configured business email. | Contact endpoint creates `notification_outbox`; Render worker sends Resend email to tenant/business contact email; update delivery status. | Phase 5 / Phase 6 | Planned |
| `trackBookingCreated` | Booking create trigger writes activity timeline event. | Booking service writes `activity_timeline` inside the booking transaction. | Phase 4 / Phase 7 | Planned |
| `trackBookingCanceled` | Booking update trigger writes activity event when status becomes `cancelled`. | Cancel service writes `activity_timeline` inside the cancellation transaction. | Phase 4 / Phase 7 | Planned |
| `syncWaitlistQueuePositions` | Waitlist update trigger recalculates queue positions when slot/status/createdAt changes. | Waitlist service recalculates positions in transactions; optional Postgres function/RPC for queue recalculation. | Phase 4 | Planned |
| `initializeWaitlistQueuePosition` | Waitlist create trigger calculates initial queue position. | Waitlist creation service calculates queue position transactionally; store `queue_position`, `queue_size`. | Phase 4 | Planned |
| `notifyWaitlistOnSlotOpen` | Booking slot delete trigger notifies first waiting waitlist entry by email/WhatsApp and marks status `notified` or `notification_failed`. | Slot release service queues waitlist notification in `notification_outbox`; Render worker sends; update `waitlist_entries.status`, `notified_at`, `notification_channel`. | Phase 4 / Phase 5 | Planned |

---

## Firestore collection to Supabase table mapping

| Firestore collection | New Supabase table(s) | Notes |
| --- | --- | --- |
| `bookings` | `bookings`, `booking_status_events`, `booking_notifications` | Add `starts_at`, `tenant_id`, `slot_id`, lifecycle timestamps, status constraints. |
| `bookingSlots` | `booking_slots` | Use unique constraint for tenant/date/time/stylist and prevent double-booking. Prefer updating/releasing rows over deleting if audit history is needed. |
| `waitlist` | `waitlist_entries` | Store preferred slot/date/time, queue position/size, status, notification metadata. |
| `users` | `profiles`, optional `user_security_restrictions` | Supabase Auth is identity source; profile/security extension data lives in Postgres. |
| `adminUsers` | `admin_users` | Database-backed admin roles and permission flags. |
| `adminAuditLogs` | `admin_audit_logs` | Append-only audit records written by Render service role. |
| `adminSecurityActions` | `admin_security_actions` | Admin restriction/security action history. |
| `loginActivities` | `login_activities` | Login method/status/device/location/risk data. |
| `securityAlerts` | `security_alerts` | Open/resolved alert workflow for admin dashboard. |
| `accountChangeHistory` | `account_change_history` | User account security change history. |
| `activityTimeline` | `activity_timeline` | Cross-domain admin/customer activity feed. |
| `rateLimits` | `rate_limits` | Cooldowns for reviews/contact and potentially API abuse protection. |
| `reviews` | `reviews` | Public approved reads, user-owned creation/edit rules, admin moderation. |
| `contactMessages` | `contact_messages` | Public/customer submission, admin status/delete workflow, notification outbox. |

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

| Legacy alias | Canonical status |
| --- | --- |
| `complete` | `completed` |
| `canceled` | `cancelled` |
| `booked` | `confirmed` |
| `waitlist`, `waiting` | `waitlisted` |
| `no-show`, `no show`, `noshow` | `no_show` |
| `in progress`, `in_progress`, `in-progress` | `confirmed` |

Client actions are currently allowed only for:

```text
pending
confirmed
```

Auto-release behavior:

| Current status | Auto-release status |
| --- | --- |
| `pending` | `expired` |
| `confirmed` | `no_show` |

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

| Legacy alias | Canonical status |
| --- | --- |
| `waitlist`, `waitlisted` | `waiting` |
| `canceled` | `cancelled` |

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

| Alert type | Severity |
| --- | --- |
| `multiple_failed_login_attempts` | `high` |
| `new_device_detected` | `medium` |
| `login_unusual_country` | `high` |
| `rapid_repeated_logins` | `high` |
| `account_deleted` | `high` |
| `account_deactivated` | `high` |
| `password_changed` | `medium` |
| `email_changed` | `medium` |
| `phone_changed` | `low` |
| `profile_updated` | `low` |

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

| Rule | Legacy value | New location |
| --- | --- | --- |
| Review cooldown | 2 minutes | `rate_limits` policy/service constant. |
| Contact cooldown | 60 seconds | `rate_limits` policy/service constant. |
| Failed login short window | 5 minutes | Security service config. |
| Login lock window | 15 minutes | Security service config. |
| Login lock threshold | 5 failed attempts | Security service config. |
| Login repeat failure threshold | 3 failed attempts | Security service config. |
| Login lock duration | 30 minutes | Security service config. |
| WhatsApp reminder lead time | 2 hours before appointment | Notification job config. |
| WhatsApp reminder window | ±15 minutes | Notification job config. |
| Expired booking slot release grace | 2 hours after appointment time | Booking job config. |

---

## White-label/client configuration mapping

Legacy `functions/client-config.js` currently contains:

| Legacy setting | Current value | New target |
| --- | --- | --- |
| `businessName` | `Royal Braids` | `site_settings.business_name` or tenant config. |
| `teamName` | `Royal Braids Team` | `site_settings.team_name` or tenant config. |
| `contactNotificationEmail` | `billyopiyo597@gmail.com` | Render env var for single-tenant, or `site_settings.contact_notification_email` for tenant-managed config. |
| `timezone` | `Africa/Nairobi` | Shared app/tenant setting used by Render jobs and frontend display. |
| `utcOffsetHours` | `3` | Prefer timezone-aware date handling; keep only as fallback. |
| `cloudinaryFolder` | `royal-braids/gallery` | Render Cloudinary signing default, optionally tenant-specific. |

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
