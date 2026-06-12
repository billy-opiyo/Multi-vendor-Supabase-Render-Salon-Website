# Booking, Waitlist, and Schedule Logic Guide

Deep technical and operational guide for the current **Supabase + Render + Vercel** booking system used by Royal Braids.

The legacy Firebase implementation is archived under `legacy/firebase-production-archive/` and is not the active runtime. The active booking lifecycle is centered on Supabase Postgres records, Render service-role workflows, browser-safe frontend adapters, and admin UI controls.

---

## 1. Scope of this guide

This document explains how the platform handles:

- Public booking slot discovery.
- Customer booking creation.
- Transactional slot locking.
- Waitlist fallback and queue position tracking.
- Client cancellation and rescheduling.
- Admin booking status updates.
- Admin waitlist conversion and closure.
- Schedule views generated from booking data.
- Scheduled jobs that release expired slots, send reminders, and process notifications.

It is meant for developers, QA testers, and operators who need to understand the business rules behind the UI.

---

## 2. Primary implementation files

| Area | File or directory | Responsibility |
| --- | --- | --- |
| Public booking UI | `public/JS/script.js` | Service/time/stylist form behavior, customer-facing booking state, dashboard appointment actions. |
| Admin booking UI | `public/JS/admin.js` | Bookings, Waitlist, and Schedule tabs plus lifecycle action handlers. |
| Static admin shell | `public/admin.html` | Containers and markup for admin operational views. |
| Public site shell | `public/index.html` | Booking form containers and customer dashboard markup. |
| Render API adapter | `public/JS/render-api-adapter.js` | Adds auth token and calls Render booking/admin endpoints. |
| Supabase browser adapter | `public/JS/supabase-browser-adapter.js` | Auth/session bridge and RLS-approved reads. |
| Backend booking module | `backend/src/modules/bookings/` | Slot-safe booking, waitlist, cancellation, reschedule, admin lifecycle services. |
| Backend notifications | `backend/src/modules/notifications/` | Reminder/outbox handling related to booking events. |
| Backend scheduled jobs | `backend/src/modules/jobs/`, `backend/src/jobs/` | Protected job execution. |
| Supabase schema/RLS | `supabase/migrations/`, `supabase/policies/` | Tables, constraints, policies, indexes, and status columns. |
| Legacy mapping | `docs/firebase-to-supabase-mapping.md` | Historical behavior mapping only. |

---

## 3. Core principle: the browser suggests, Render decides

The browser can collect user intent, validate obvious fields, and display available data, but it must not be the final authority for booking state.

Render must make final decisions for:

- Whether a slot is still available.
- Whether a booking can be created.
- Whether a booking can be cancelled or rescheduled.
- Whether a waitlist entry can be converted to confirmed.
- Whether a slot should be released.
- Whether notification/audit/activity rows should be written.
- Whether an admin has permission to run a lifecycle action.

This is necessary because multiple users/admins may act at the same time. Only the backend can safely coordinate transaction boundaries and service-role writes.

---

## 4. Main tables and their responsibilities

### `bookings`

Stores appointment records. Typical information includes:

- Customer/user reference.
- Customer name and contact details.
- Service and optional service variant.
- Stylist preference.
- Appointment date and time.
- Notes/reference image metadata where supported.
- Booking status.
- Linked `slot_id`.
- Linked `waitlist_id` where applicable.
- Created/updated timestamps and audit metadata.

The booking row is the main business object staff and customers recognize as an appointment request or appointment history item.

### `booking_slots`

Stores slot-lock rows. The purpose is to prevent double booking and support expiry/release workflows.

Important concepts:

- A slot should represent a specific bookable date/time/stylist/service grouping as defined by the backend rules.
- Slot lock/reservation must happen transactionally.
- Released/expired slots should preserve enough metadata for audit/recovery.
- Unique constraints should prevent two active bookings from owning the same slot.

### `waitlist_entries`

Stores customer demand for unavailable slots.

Important information:

- Linked customer/user.
- Linked booking where the workflow creates a waitlisted booking.
- Preferred date/time/stylist/service.
- Current waitlist status.
- Queue position and queue size.
- Notification state.
- Created/updated timestamps.

### Related tables

| Table | Why it matters to booking |
| --- | --- |
| `profiles` | Customer identity/profile display and contact defaults. |
| `services` | Determines bookable service options, duration, active state, price display. |
| `service_variants` | Supports sub-services or detailed package options. |
| `stylists` | Determines staff/stylist choices and filters. |
| `notification_outbox` | Stores booking confirmations, reminders, cancellations, waitlist notices. |
| `activity_timeline` | Captures user/admin-visible lifecycle events. |
| `admin_audit_logs` | Captures privileged admin booking/waitlist changes. |

---

## 5. Permission requirement

Booking, Waitlist, and Schedule are booking-management features. An admin must have:

- `canManageBookings`, or
- `super_admin` role.

The UI may hide booking tabs for unauthorized users, but Render backend authorization is the source of truth. Every admin mutation must be checked server-side.

---

## 6. Public booking lifecycle

### Step-by-step flow

1. Customer chooses a service, variant if available, preferred date, preferred time, stylist, and notes/reference image if supported.
2. Browser validates required fields and friendly formatting.
3. Browser obtains current Supabase Auth session when the endpoint requires authentication.
4. Browser calls Render, usually through `window.RenderApi` / `AppServices` wrappers.
5. Render verifies the access token.
6. Render validates payload against backend rules.
7. Render confirms service/stylist/date/time are valid and bookable.
8. Render checks slot availability.
9. Render attempts to reserve the slot transactionally.
10. If reservation succeeds, Render creates/updates the booking and related records.
11. If reservation fails because the slot is unavailable, Render may create a waitlist entry if the flow supports it.
12. Render writes activity timeline and notification outbox rows where appropriate.
13. Browser receives a normalized response and shows the correct customer-facing state.

### Public endpoint examples

```txt
GET  /api/v1/booking-slots
POST /api/v1/bookings
GET  /api/v1/bookings/me
POST /api/v1/bookings/:bookingId/cancel
POST /api/v1/bookings/:bookingId/reschedule
GET  /api/v1/bookings/:bookingId/waitlist-queue
GET  /api/v1/waitlist/:waitlistId/queue
```

### Customer-visible outcomes

| Outcome | Meaning | UI expectation |
| --- | --- | --- |
| Booking confirmed/pending | Request was accepted and slot state was handled. | Show confirmation with date/time/service. |
| Waitlisted | Preferred slot was not available but demand was preserved. | Show queue position/queue size where available. |
| Validation failed | Required or invalid fields. | Show actionable form error. |
| Auth required | User must sign in. | Open auth modal or show login instruction. |
| Slot unavailable | Another booking took the slot first. | Offer waitlist or alternate slot. |
| Server/provider error | Backend or dependency problem. | Show safe retry/support message. |

---

## 7. Slot locking rules

Slot locking protects the salon from two customers booking the same staff/time combination.

Rules:

1. The backend must define the canonical slot identity.
2. The frontend may display available options but cannot guarantee availability.
3. Booking creation must check and reserve the slot in a single safe workflow.
4. Unique database constraints should prevent conflicting active locks.
5. Expired/pending slots should be released by backend lifecycle logic.
6. Cancelling or completing bookings should release or preserve slots according to the business rule for that status.
7. Admin release-slot actions must be audited.

Common slot states may include active/taken, released, expired, or similar values depending on schema implementation. The key invariant is that only one active booking can own a given bookable slot.

---

## 8. Canonical booking statuses

| Status | Meaning | Usually terminal? | Slot expectation |
| --- | --- | --- | --- |
| `pending` | Booking created but awaiting confirmation. | No | Slot may be temporarily held. |
| `confirmed` | Booking accepted and active. | No | Slot should remain held. |
| `completed` | Appointment fulfilled. | Yes | Slot may remain historical or be marked no longer active depending on reporting rules. |
| `cancelled` | Booking cancelled. | Yes | Slot should be released if it blocks availability. |
| `waitlisted` | Booking connected to waitlist entry. | No | Preferred slot is not actively owned unless converted. |
| `expired` | Pending/held booking exceeded allowed window. | Yes | Slot should be released. |
| `no_show` | Customer missed confirmed appointment. | Yes | Slot is historical; no future availability action needed. |

Legacy aliases from the old Firebase UI may still be normalized by adapters/services, but Supabase records should use canonical values.

---

## 9. Recommended status transition model

| From | To | Actor | Notes |
| --- | --- | --- | --- |
| none | `pending` | Customer/backend | New booking request accepted but not confirmed. |
| none | `confirmed` | Customer/backend or admin/backend | If business rules allow instant confirmation. |
| none | `waitlisted` | Customer/backend | Slot unavailable and waitlist accepted. |
| `pending` | `confirmed` | Admin/backend | Confirm after staff review. |
| `pending` | `cancelled` | Customer/admin/backend | Release held slot where applicable. |
| `pending` | `expired` | Scheduled job/backend | Release stale held slot. |
| `confirmed` | `completed` | Admin/backend | Service delivered. |
| `confirmed` | `cancelled` | Customer/admin/backend | Release slot and consider waitlist notification. |
| `confirmed` | `no_show` | Admin/backend | Customer missed appointment. |
| `waitlisted` | `confirmed` | Admin/backend | Must re-check slot availability. |
| `waitlisted` | `cancelled` | Customer/admin/backend | Remove from active queue. |

Avoid unsupported direct transitions unless the backend explicitly implements and audits them.

---

## 10. Waitlist queue logic

### Queue grouping

Waitlist positions are meaningful only for equivalent demand groups. A group is generally based on preferred booking attributes such as:

- Appointment date.
- Appointment time.
- Stylist preference.
- Service or service variant.

The exact grouping must match backend implementation. If grouping changes, update the UI labels and tests.

### Active queue entries

Entries should occupy queue positions only when they are still waiting. Cancelled, closed, expired, or converted entries should not hold active positions.

### Queue recalculation

Queue position and queue size may be recalculated after:

- New waitlist entry creation.
- Waitlist entry cancellation/closure.
- Move-to-confirmed conversion.
- Slot release.
- Admin status update.

### Move-to-confirmed workflow

1. Admin selects an active waitlist entry.
2. Browser calls Render admin endpoint.
3. Render verifies admin permission.
4. Render re-checks the target slot.
5. If available, Render reserves the slot and updates booking/waitlist state.
6. Render writes notification/activity/audit records.
7. Browser refreshes waitlist and bookings views.

Endpoint example:

```txt
POST /api/v1/admin/waitlist/:waitlistId/move-to-confirmed
```

---

## 11. Client cancellation and rescheduling

### Cancellation

Endpoint example:

```txt
POST /api/v1/bookings/:bookingId/cancel
```

Expected backend responsibilities:

- Verify the booking belongs to the authenticated customer or that actor has permission.
- Validate cancellation window/policy if implemented.
- Update booking status.
- Release slot if needed.
- Update waitlist queue or create slot-open notifications where appropriate.
- Record activity and notification outbox rows.

### Rescheduling

Endpoint example:

```txt
POST /api/v1/bookings/:bookingId/reschedule
```

Expected backend responsibilities:

- Verify ownership/permission.
- Validate new date/time/stylist/service selection.
- Check and reserve new slot.
- Release old slot safely after successful new reservation or as one transaction.
- Update booking record.
- Trigger notification/activity records.

Do not implement reschedule by editing appointment date/time directly in the browser. That can create slot conflicts.

---

## 12. Admin booking actions

Admin booking endpoints include:

```txt
GET  /api/v1/admin/bookings
POST /api/v1/admin/bookings/:bookingId/status
POST /api/v1/admin/bookings/:bookingId/release-slot
GET  /api/v1/admin/waitlist
POST /api/v1/admin/waitlist/:waitlistId/status
POST /api/v1/admin/waitlist/:waitlistId/move-to-confirmed
```

One admin click can update multiple records. For example, cancelling with release-slot may update:

- `bookings`
- `booking_slots`
- `waitlist_entries`
- `notification_outbox`
- `activity_timeline`
- `admin_audit_logs`

Admin UI must wait for backend success before assuming the state changed.

---

## 13. Schedule view logic

The Schedule tab is a projection of booking data, not its own data source.

Schedule should be generated from bookings with relevant statuses and appointment date/time values. Typical views:

- Day view.
- Week view.
- Booking detail panel.
- Status-based styling.
- Service/stylist/customer labels.

If the Schedule tab conflicts with the Bookings tab, treat the underlying booking records as the source of truth and inspect filters/status/date parsing.

---

## 14. Scheduled booking jobs

The platform uses protected Render job endpoints triggered by an external scheduler.

Endpoint pattern:

```txt
POST /api/v1/jobs/:jobName/run
Header: X-Job-Secret: <JOB_SECRET>
```

Known jobs:

| Job | Purpose |
| --- | --- |
| `releaseExpiredBookingSlots` | Releases stale pending/held booking slots. |
| `sendUpcomingBookingReminders` | Creates/sends reminders for upcoming appointments. |
| `syncWaitlistSlotOpenNotifications` | Detects open slots and notifies eligible waitlist entries. |
| `flushNotificationOutbox` | Sends queued email/WhatsApp notifications through providers. |

Job security rules:

- Never expose `JOB_SECRET` in `public/`.
- Scheduler must send the secret in the header.
- Failed jobs should be investigated in Render logs and relevant database tables.

---

## 15. Notification side effects

Booking and waitlist workflows may create notification intents. Examples:

- Booking received/confirmed.
- Booking cancelled.
- Booking rescheduled.
- Upcoming appointment reminder.
- Slot opened for waitlist.
- Admin/customer contact notification.

Notification sending may be dry-run controlled. An outbox row can exist even if no real provider message was sent.

Troubleshooting notifications requires checking:

1. Outbox row status.
2. `NOTIFICATION_DRY_RUN`.
3. Provider environment variables.
4. Scheduler execution.
5. Render provider logs/errors.

---

## 16. Common race conditions and protections

### Two customers choose the same slot

Expected result: only one transaction reserves the slot. The other receives slot unavailable or waitlist response.

Protections:

- Backend transaction.
- Unique slot constraints.
- Fresh availability check at booking time.

### Admin converts waitlist while customer books same opening

Expected result: backend slot lock decides the winner. The losing action fails gracefully.

Protections:

- Re-check slot availability during conversion.
- Do not rely on stale UI availability.

### Customer cancels while admin changes status

Expected result: backend validation prevents invalid transition or applies one consistent transition.

Protections:

- Status transition validation.
- Updated timestamp/version checks where implemented.
- Refresh UI after mutation.

### Expiry job runs while admin reviews pending booking

Expected result: expired pending holds are released; admin must refresh before confirming.

Protections:

- Backend validation blocks confirm if slot state is no longer valid.
- Admin UI reload after failed action.

---

## 17. Error handling expectations

Frontend should show useful messages without exposing sensitive backend detail.

| Error type | UI response |
| --- | --- |
| Validation error | Highlight field or show actionable correction. |
| Auth error | Prompt sign-in or session refresh. |
| Permission error | Explain that the admin lacks access. |
| Slot unavailable | Offer alternate slot or waitlist. |
| Conflict/race condition | Ask user/admin to refresh and retry. |
| Provider/job error | Show safe generic message; check backend logs. |
| Network error | Show retry guidance and confirm Render health. |

Never show service-role keys, SQL details, provider tokens, or stack traces to normal users.

---

## 18. QA checklist

Public booking QA:

- Booking form validates required fields.
- Unauthenticated customer is prompted to sign in where required.
- Available slots load from backend.
- Successful booking creates expected visible dashboard record.
- Slot conflict produces graceful unavailable/waitlist outcome.
- Customer cancellation updates dashboard and releases slot where expected.
- Customer reschedule reserves new slot and does not duplicate old slot.

Admin booking QA:

- Non-booking admin cannot see/run booking actions.
- Booking admin can list and filter bookings.
- Status update changes record and writes activity/audit where expected.
- Release-slot action updates slot availability.
- Waitlist conversion re-checks availability.
- Schedule view reflects booking status/date changes.

Job QA:

- Job endpoints reject missing/invalid `X-Job-Secret`.
- Expired slot job releases stale holds.
- Reminder job creates/sends expected notification records.
- Outbox flush handles dry-run and provider modes correctly.

---

## 19. Recovery guidance

Manual database recovery should be rare and controlled.

Before manual edits:

1. Export or snapshot affected rows.
2. Identify related booking, slot, waitlist, notification, and audit rows.
3. Decide the intended final state.
4. Prefer using Render/admin endpoints if possible.
5. If SQL/manual edit is unavoidable, record what changed and why.
6. Recalculate/check waitlist positions if affected.
7. Run smoke checks after recovery.

Manual edits are risky because a booking lifecycle action often affects multiple tables.

---

## 20. Safety rules

- Use Render endpoints for booking lifecycle changes.
- Keep slot availability decisions server-side.
- Do not expose job secrets or service-role keys to the browser.
- Do not hard-delete operational records unless policy requires it.
- Keep status values canonical.
- Keep admin actions audited.
- Update this guide when booking endpoints, statuses, queue grouping, or scheduled jobs change.
