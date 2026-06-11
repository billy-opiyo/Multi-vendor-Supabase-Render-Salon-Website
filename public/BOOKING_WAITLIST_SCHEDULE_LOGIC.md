# Booking, Waitlist, and Schedule Logic Guide

Focused technical and operational guide for the current **Supabase + Render + Vercel** booking flow.

The legacy Firebase implementation is archived under `legacy/firebase-production-archive/` and is not the active runtime.

## Primary implementation files

| Area | File |
| --- | --- |
| Admin layout and sections | `public/admin.html` |
| Public booking UI | `public/JS/script.js` |
| Admin booking/waitlist/schedule UI | `public/JS/admin.js` |
| Browser Supabase compatibility adapter | `public/JS/supabase-browser-adapter.js` |
| Browser Render API adapter | `public/JS/render-api-adapter.js` |
| Render backend booking module | `backend/src/modules/bookings/` |
| Supabase schema/RLS | `supabase/migrations/` |
| Mapping from old Firebase behavior | `docs/firebase-to-supabase-mapping.md` |

## 1. High-level system overview

The booking system has three connected admin views:

1. **Bookings tab** — shows booking records from Supabase/Render and lets admins filter by status or run lifecycle actions.
2. **Waitlist tab** — shows waitlist entries, queue positions, and conversion/cancel/status workflows.
3. **Schedule tab** — day/week calendar view generated from booking data; it does not own a separate schedule table.

## 2. Supabase tables involved

### `bookings`

Stores appointment booking records, customer/contact details, selected service/stylist, status, appointment date/time, linked `slot_id`, and optional `waitlist_id`.

### `booking_slots`

Stores slot-lock rows to prevent double-booking. Slots are released by updating rows rather than deleting them so audit/recovery metadata can remain available.

### `waitlist_entries`

Stores waitlist requests for unavailable slots, including linked booking, preferred date/time/stylist, status, queue position, queue size, and notification state.

## 3. Permission requirement

Booking, Waitlist, and Schedule are booking-management features. An admin must have:

- `canManageBookings`, or
- `super_admin` role.

Frontend hiding is convenience only. Render backend authorization is the source of truth for privileged actions.

## 4. Public booking flow

1. Customer chooses service, date, time, stylist, and optional image/notes.
2. Browser signs in or uses an allowed customer session where required.
3. Browser calls Render booking endpoint.
4. Render validates input and user/session.
5. Render checks slot availability and reserves the slot transactionally.
6. Render creates the booking and writes activity/notification records.
7. Browser shows confirmation or waitlist fallback if the slot is no longer available.

Active endpoint examples:

```txt
GET  /api/v1/booking-slots
POST /api/v1/bookings
POST /api/v1/bookings/:bookingId/cancel
POST /api/v1/bookings/:bookingId/reschedule
GET  /api/v1/bookings/:bookingId/waitlist-queue
GET  /api/v1/waitlist/:waitlistId/queue
```

## 5. Admin booking actions

Render endpoints own slot-safe mutations:

```txt
GET  /api/v1/admin/bookings
POST /api/v1/admin/bookings/:bookingId/status
POST /api/v1/admin/bookings/:bookingId/release-slot
GET  /api/v1/admin/waitlist
POST /api/v1/admin/waitlist/:waitlistId/status
POST /api/v1/admin/waitlist/:waitlistId/move-to-confirmed
```

These workflows can update `bookings`, `booking_slots`, `waitlist_entries`, status events, notification records, activity timeline rows, and admin audit logs.

## 6. Booking statuses

Canonical statuses:

| Status | Meaning |
| --- | --- |
| `pending` | New booking awaiting admin action |
| `confirmed` | Accepted active appointment |
| `completed` | Appointment fulfilled |
| `cancelled` | Booking cancelled |
| `waitlisted` | Booking connected to active waitlist request |
| `expired` | Pending booking/slot expired automatically |
| `no_show` | Confirmed appointment missed |

Legacy aliases from the old Firebase UI may still be normalized by adapters/services, but Supabase tables should use canonical values.

## 7. Waitlist queue rules

- Queue is grouped by preferred slot/date/time/stylist.
- Active waiting entries receive queue positions.
- Cancelled/closed/converted entries should not occupy active queue positions.
- Moving to confirmed checks slot availability before changing booking state.
- Slot release can trigger waitlist notification outbox rows.

## 8. Scheduled booking jobs

External scheduler calls protected Render endpoints:

```txt
POST /api/v1/jobs/releaseExpiredBookingSlots/run
POST /api/v1/jobs/sendUpcomingBookingReminders/run
POST /api/v1/jobs/syncWaitlistSlotOpenNotifications/run
POST /api/v1/jobs/flushNotificationOutbox/run
```

Each request must include:

```txt
X-Job-Secret: <JOB_SECRET>
```

## 9. Troubleshooting

### Slot appears double-booked

Check `booking_slots` unique constraints and `taken` state, Render booking logs, direct database edits, and booking status/audit records.

### Waitlist position looks wrong

Check entry status, preferred slot/date/time/stylist values, queue recalculation, and Render logs.

### Admin action fails

Check `canManageBookings` permission, record IDs, target slot availability, Render health, and Supabase service-role configuration on Render.

## 10. Safety rule

Use the provided public/admin UI and Render endpoints for booking lifecycle changes. Avoid manual Supabase edits for bookings, slots, and waitlist entries unless performing a controlled recovery with a written audit note.