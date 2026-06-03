# Booking, Waitlist, and Schedule Logic Guide

Focused technical and operational guide for how the Royal Braids admin booking flow works.

This file explains the relationship between:

- **Bookings**
- **Waitlist requests**
- **Schedule/calendar view**
- **Action buttons**
- **Status badges**
- **Slot locking and release logic**

Primary implementation files:

| Area                                                                         | File                                  |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| Admin layout, tabs, counters, filters, schedule controls                     | `public/admin.html`                   |
| Admin UI state, rendering, status badges, action buttons, realtime listeners | `public/JS/admin.js`                  |
| Protected backend actions for slot-safe booking/waitlist operations          | `functions/index.js`                  |
| Broader admin operating manual                                               | `public/ADMIN_CONSOLE_USER_MANUAL.md` |

---

## 1. High-Level System Overview

The admin console has three connected booking-management views:

1. **Bookings tab**
   - Shows booking records from Firestore.
   - Lets admins filter bookings by status.
   - Lets admins run lifecycle actions such as confirm, complete, cancel, or move a waitlisted booking to confirmed.

2. **Waitlist tab**
   - Shows waitlist records from Firestore.
   - Shows queue position badges for active waitlist requests.
   - Lets admins contact, cancel, close, or convert waitlist requests.

3. **Schedule tab**
   - Uses the same booking data as the Bookings tab.
   - Displays bookings in Day or Week calendar views.
   - Lets admins select a booking and run quick lifecycle actions from the detail panel.

The key rule is:

> The Schedule tab is another view of bookings. It does not have separate schedule records. It reads from the same `bookings` collection that the Bookings tab uses.

---

## 2. Firestore Collections Involved

### 2.1 `bookings`

Stores client appointment booking records.

Used by:

- Bookings tab
- Schedule tab
- Waitlist tab when a waitlist request has a linked waitlisted booking

Important booking fields include:

| Field                                                          | Purpose                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `status`                                                       | Main booking lifecycle status                                      |
| `bookingStatus`, `state`, `booking_state`, `currentStatus`     | Legacy/alternate status fields that are normalized by the admin UI |
| `bookingType`                                                  | Can identify confirmed or waitlist-style booking records           |
| `isWaitlisted`                                                 | Marks a booking as waitlisted when true                            |
| `waitlistId`                                                   | Links a booking to a `waitlist/{id}` record                        |
| `slotId`                                                       | Locked slot document ID when the booking owns an active slot       |
| `preferredSlotId`                                              | Preferred slot for waitlisted records                              |
| `date`                                                         | Appointment date                                                   |
| `time`                                                         | Appointment time                                                   |
| `stylistKey`                                                   | Normalized stylist key used for slot locking                       |
| `service`                                                      | Selected service                                                   |
| `email`, `phone`                                               | Client contact details                                             |
| `notes`, `specialRequest`                                      | Client request text                                                |
| `inspirationImageUrl`, `inspirationImage`, `referenceImageUrl` | Optional client image references                                   |

### 2.2 `waitlist`

Stores waitlist requests for unavailable slots.

Used by:

- Waitlist tab
- Bookings tab when **Waitlisted Only** is active
- Backend queue-position recalculation

Important waitlist fields include:

| Field                               | Purpose                                          |
| ----------------------------------- | ------------------------------------------------ |
| `status`                            | Waitlist lifecycle status                        |
| `preferredSlotId` or `slotId`       | Slot the client wants                            |
| `bookingId`                         | Linked waitlisted booking, if present            |
| `convertedBookingId`                | Booking created/converted after waitlist success |
| `queuePosition`                     | Numeric queue position                           |
| `queuePositionLabel`                | Human label such as `1st`, `2nd`, `3rd`          |
| `queueSize`                         | Number of active waitlist entries for the slot   |
| `preferredDate`                     | Requested appointment date                       |
| `preferredTime`                     | Requested appointment time                       |
| `service`, `stylist`, `stylistKey`  | Requested service/stylist data                   |
| `email`, `phone`                    | Client contact details                           |
| `notifiedAt`, `notificationChannel` | Automated/manual notification metadata           |
| `notes`                             | Client/admin notes                               |

### 2.3 `bookingSlots`

Stores slot-lock documents.

A slot lock prevents another confirmed booking from taking the same date/stylist/time combination.

Important slot fields include:

| Field                    | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `taken`                  | Whether the slot is locked              |
| `date`                   | Slot date                               |
| `time`                   | Slot time                               |
| `stylistKey`             | Slot stylist key                        |
| `bookingId`              | Booking that owns the slot              |
| `uid`                    | Client/user ID connected to the booking |
| `createdAt`, `updatedAt` | Slot timestamps                         |

Backend slot IDs are generated from:

```txt
date__stylistKey__timeWithoutSpacesOrColons
```

Example:

```txt
2026-06-01__fatima__0900AM
```

The exact time formatting depends on the booking time string after spaces and colons are removed.

---

## 3. Permission Requirement

The Bookings, Waitlist, and Schedule tabs are booking-management features.

An admin must have either:

- `canManageBookings`, or
- `super_admin` role

Relevant behavior:

- The frontend hides or disables tabs based on admin permissions.
- Backend callable functions also verify permission before making protected changes.
- Slot-sensitive actions are not trusted to frontend-only logic.

---

## 4. Realtime Data Flow

### 4.1 Bookings Listener

The admin UI starts a realtime listener on:

```txt
bookings
```

Current implementation limit:

```txt
100 booking documents
```

When the listener receives updates:

1. Documents are loaded into `adminBookingDocs`.
2. Booking statuses are normalized.
3. Booking counters are recalculated.
4. The Bookings list is rendered.
5. The Schedule view is re-rendered from the same booking array.

### 4.2 Waitlist Listener

The admin UI starts a realtime listener on:

```txt
waitlist
```

Current implementation limit:

```txt
300 waitlist documents
```

When the listener receives updates:

1. Waitlist documents are normalized.
2. Queue positions are decorated/displayed.
3. Waitlist counters are recalculated.
4. The Waitlist list is rendered.
5. The Bookings tab is re-rendered so the **Waitlisted Only** filter can include waitlist records.

### 4.3 Schedule Uses Booking Data

The Schedule tab does not start its own Firestore listener.

It renders from `adminBookingDocs`, which is populated by the Bookings listener.

---

## 5. Booking Status Logic

### 5.1 Normalized Booking Statuses

The admin UI normalizes booking statuses into these values:

| Normalized status | Meaning                                            |
| ----------------- | -------------------------------------------------- |
| `pending`         | New booking awaiting admin action                  |
| `confirmed`       | Accepted active appointment                        |
| `completed`       | Appointment has been fulfilled                     |
| `cancelled`       | Booking has been cancelled                         |
| `waitlisted`      | Booking is connected to an active waitlist request |
| `expired`         | Pending booking/slot expired automatically         |
| `no_show`         | Confirmed appointment was missed/no-show           |

### 5.2 Accepted Aliases

The frontend converts several legacy or alternate status labels:

| Input value         | Normalized to |
| ------------------- | ------------- |
| `complete`          | `completed`   |
| `canceled`          | `cancelled`   |
| `waitlist`          | `waitlisted`  |
| `waiting`           | `waitlisted`  |
| `no-show`           | `no_show`     |
| `no show`           | `no_show`     |
| `noshow`            | `no_show`     |
| `in progress`       | `confirmed`   |
| `in_progress`       | `confirmed`   |
| `in-progress`       | `confirmed`   |
| unknown/empty value | `pending`     |

The backend also treats `booked` as `confirmed` for booking status normalization.

### 5.3 Booking Status Badge Classes

Booking cards and schedule details use status badges.

| Status       | Badge class               |
| ------------ | ------------------------- |
| `pending`    | `admin-status-pending`    |
| `confirmed`  | `admin-status-confirmed`  |
| `completed`  | `admin-status-completed`  |
| `cancelled`  | `admin-status-cancelled`  |
| `waitlisted` | `admin-status-waitlisted` |
| `expired`    | `admin-status-expired`    |
| `no_show`    | `admin-status-no-show`    |

Display note:

- `no_show` is displayed as `no show`.

---

## 6. Booking Tab Logic

### 6.1 Booking Counters

The Bookings tab calculates these counters from normalized booking data:

| Counter        | Meaning                                                             |
| -------------- | ------------------------------------------------------------------- |
| **Total**      | All loaded booking records                                          |
| **Pending**    | Bookings with `pending` status                                      |
| **Confirmed**  | Bookings with `confirmed` status                                    |
| **Waitlisted** | Waitlist entries if available, otherwise waitlisted booking records |
| **Completed**  | Bookings with `completed` status                                    |
| **Cancelled**  | Bookings with `cancelled` status                                    |

### 6.2 Booking Filters

Filter buttons in `public/admin.html` set `adminBookingStatusFilter`.

| Filter button       | Filter value | Result                                                                  |
| ------------------- | ------------ | ----------------------------------------------------------------------- |
| **All Bookings**    | `all`        | Shows all loaded bookings                                               |
| **Pending**         | `pending`    | Shows pending bookings only                                             |
| **Confirmed**       | `confirmed`  | Shows confirmed bookings only                                           |
| **Completed**       | `completed`  | Shows completed bookings only                                           |
| **Cancelled**       | `cancelled`  | Shows cancelled bookings only                                           |
| **Waitlisted Only** | `waitlisted` | Shows waitlist-centered rows using waitlist entries and linked bookings |

The **Waitlisted Only** filter is special:

- If waitlist documents are loaded, it builds rows from `waitlist` entries.
- It links each waitlist row to a booking if possible.
- If no waitlist documents are loaded, it falls back to waitlisted booking records.

### 6.3 Booking Card Information

A booking card can show:

- Client name
- Booking ID
- Status badge
- Waitlist badge/queue chip when relevant
- Service
- Stylist
- Date
- Time
- Email
- Phone
- WhatsApp/reminder metadata when available
- Notes or special request
- Inspiration image link/thumbnail when available

---

## 7. Booking Action Buttons

Booking action buttons are rendered by shared lifecycle logic in `public/JS/admin.js`.

This same lifecycle rendering is used by:

- Bookings tab booking cards
- Schedule tab selected-booking detail panel

### 7.1 Booking Action Matrix

| Current booking status | Buttons shown                           | What they do                                                                        |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------------------- |
| `pending`              | **Confirm**                             | Updates booking status to `confirmed`                                               |
| `pending`              | **Cancel + Release Slot**               | Sets booking to `cancelled` and releases its slot if one exists                     |
| `confirmed`            | **Complete + Release Slot**             | Sets booking to `completed` and releases its slot if one exists                     |
| `confirmed`            | **Cancel + Release Slot**               | Sets booking to `cancelled` and releases its slot if one exists                     |
| `waitlisted`           | **Move to Confirmed**                   | Attempts to lock the preferred slot and convert the waitlisted booking to confirmed |
| `completed`            | Disabled **No quick actions available** | Terminal state; no quick lifecycle action from this view                            |
| `cancelled`            | Disabled **No quick actions available** | Terminal state; no quick lifecycle action from this view                            |
| `expired`              | Disabled **No quick actions available** | Terminal/automated state; no quick lifecycle action from this view                  |
| `no_show`              | Disabled **No quick actions available** | Terminal/automated state; no quick lifecycle action from this view                  |

### 7.2 Confirm

Shown when booking status is:

```txt
pending
```

Effect:

- Updates the booking status to `confirmed`.
- Shows a success message such as:

```txt
✅ Booking updated to confirmed.
```

Important note:

- This is a simple status update from the admin UI.
- Slot-release safety is not involved because this action does not release a slot.

### 7.3 Complete + Release Slot

Shown when booking status is:

```txt
confirmed
```

Effect:

- Calls the protected backend callable function:

```txt
adminUpdateBookingStatusAndReleaseSlot
```

with target status:

```txt
completed
```

Backend behavior:

1. Verifies the caller can manage bookings.
2. Loads the booking from `bookings/{bookingId}`.
3. Confirms the current booking status is valid for completion.
4. Checks the booking's `slotId`.
5. Loads `bookingSlots/{slotId}`.
6. Verifies that the slot belongs to the booking before deleting it.
7. Deletes the slot lock if it is safe to release.
8. Updates the booking with completion metadata.
9. Writes an admin audit log entry.

Booking fields written can include:

| Field                  | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `status: "completed"`  | Marks the booking complete                |
| `completedAt`          | Server timestamp of completion            |
| `completedBy`          | Admin email/UID that completed it         |
| `adminActionUpdatedBy` | Admin email/UID that performed the action |
| `updatedAt`            | Server timestamp                          |
| `releasedSlotId`       | Slot ID that was released, if any         |
| `slotReleasedAt`       | Server timestamp of slot release          |
| `slotReleaseReason`    | `completed`                               |
| `slotReleaseSource`    | `admin_action`                            |
| `slotReleasedBy`       | Admin email/UID                           |

Success messages:

```txt
✅ Booking completed and slot released successfully.
```

or, if no slot lock was found:

```txt
✅ Booking completed. No locked slot was found to release.
```

### 7.4 Cancel + Release Slot

Shown when booking status is:

```txt
pending
confirmed
```

Effect:

- Calls the protected backend callable function:

```txt
adminUpdateBookingStatusAndReleaseSlot
```

with target status:

```txt
cancelled
```

Backend behavior:

1. Verifies the caller can manage bookings.
2. Loads the booking.
3. Confirms the current booking status is valid for cancellation.
4. Checks and safely deletes the slot lock if it belongs to the booking.
5. Updates cancellation metadata.
6. Writes an admin audit log entry.

Booking fields written can include:

| Field                  | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `status: "cancelled"`  | Marks the booking cancelled               |
| `cancelledAt`          | Server timestamp of cancellation          |
| `cancelledBy`          | Admin email/UID that cancelled it         |
| `adminActionUpdatedBy` | Admin email/UID that performed the action |
| `updatedAt`            | Server timestamp                          |
| `releasedSlotId`       | Slot ID that was released, if any         |
| `slotReleasedAt`       | Server timestamp of slot release          |
| `slotReleaseReason`    | `cancelled`                               |
| `slotReleaseSource`    | `admin_action`                            |
| `slotReleasedBy`       | Admin email/UID                           |

Success messages:

```txt
✅ Booking cancelled and slot released successfully.
```

or, if no slot lock was found:

```txt
✅ Booking cancelled. No locked slot was found to release.
```

Important waitlist rule:

> Waitlisted bookings should not be cancelled with booking-card slot-release actions. Cancel them from the Waitlist tab so the linked waitlist record stays synchronized.

The backend enforces this by rejecting release transitions from `waitlisted` status.

### 7.5 Move to Confirmed

Shown when booking status is:

```txt
waitlisted
```

Effect:

- Calls the protected backend callable function:

```txt
adminMoveWaitlistBookingToConfirmed
```

Backend behavior:

1. Verifies the caller can manage bookings.
2. Loads the waitlisted booking.
3. Confirms the booking status is `waitlisted`.
4. Reads the booking's `preferredSlotId` or `slotId`.
5. Checks required date/time details.
6. Loads `bookingSlots/{preferredSlotId}`.
7. If another booking already owns that slot, the action fails.
8. If the slot is available, writes/updates the slot lock.
9. Updates the booking to confirmed.
10. Updates the linked waitlist entry to `booked` if `waitlistId` exists.
11. Recalculates queue positions for the slot.
12. Writes an admin audit log entry.

Booking fields written can include:

| Field                   | Value/Purpose                         |
| ----------------------- | ------------------------------------- |
| `status`                | `confirmed`                           |
| `bookingType`           | `confirmed`                           |
| `isWaitlisted`          | `false`                               |
| `waitlistStatus`        | `booked`                              |
| `slotId`                | The preferred slot that is now locked |
| `waitlistPosition`      | `null`                                |
| `waitlistPositionLabel` | empty string                          |
| `waitlistQueueSize`     | `null`                                |
| `waitlistConvertedAt`   | Server timestamp                      |
| `waitlistConvertedBy`   | Admin email/UID                       |
| `updatedAt`             | Server timestamp                      |

Linked waitlist fields written can include:

| Field                | Value/Purpose                 |
| -------------------- | ----------------------------- |
| `status`             | `booked`                      |
| `bookedAt`           | Server timestamp              |
| `bookedBy`           | Admin email/UID               |
| `convertedBookingId` | Booking ID that was converted |
| `queuePosition`      | `null`                        |
| `queuePositionLabel` | empty string                  |
| `updatedAt`          | Server timestamp              |

Success messages:

```txt
✅ Waitlisted booking moved to confirmed and slot locked.
```

or from the Waitlist tab:

```txt
✅ Waitlist request moved to confirmed booking and slot locked.
```

Failure case:

- If the preferred slot is still occupied by another booking, the action fails.
- The admin should cancel/release or complete/release the occupying booking first, then retry the waitlist conversion.

---

## 8. Waitlist Status Logic

### 8.1 Normalized Waitlist Statuses

The waitlist flow uses these statuses:

| Waitlist status       | Meaning                                               |
| --------------------- | ----------------------------------------------------- |
| `waiting`             | Client is waiting for the slot                        |
| `notified`            | Automation has notified the client about availability |
| `contacted`           | Admin manually contacted the client                   |
| `booked`              | Waitlist request is closed as booked                  |
| `cancelled`           | Waitlist request was cancelled                        |
| `notification_failed` | Automated notification failed                         |

### 8.2 Waitlist Status Aliases

The backend normalizes:

| Input value         | Normalized to |
| ------------------- | ------------- |
| `waitlist`          | `waiting`     |
| `waitlisted`        | `waiting`     |
| `canceled`          | `cancelled`   |
| unknown/empty value | `waiting`     |

### 8.3 Active Queue Statuses

Only these statuses are treated as active queue entries:

```txt
waiting
notified
contacted
notification_failed
```

Active queue entries receive queue position labels.

Closed statuses do not receive active queue positions:

```txt
booked
cancelled
```

---

## 9. Waitlist Queue Position Logic

Waitlist queue positions are calculated per slot.

The backend groups waitlist entries by:

```txt
preferredSlotId
```

or fallback:

```txt
slotId
```

Then it:

1. Loads all waitlist entries for that slot.
2. Filters to active queue statuses only.
3. Sorts active entries by `createdAt` ascending.
4. Uses the document ID as a tie-breaker.
5. Assigns queue positions starting at `1`.
6. Writes queue metadata back to waitlist entries.
7. Mirrors queue metadata onto linked waitlisted booking records when possible.

Queue labels use ordinal text:

| Position | Label  |
| -------- | ------ |
| 1        | `1st`  |
| 2        | `2nd`  |
| 3        | `3rd`  |
| 4        | `4th`  |
| 11       | `11th` |
| 12       | `12th` |
| 13       | `13th` |
| 21       | `21st` |

The UI displays queue chips like:

```txt
1st in queue
2nd in queue
3rd in queue
```

If queue size is known, the accessible label includes:

```txt
Waitlist place: 1st of 3
```

---

## 10. Waitlist Tab Logic

### 10.1 Waitlist Counters

The Waitlist tab calculates:

| Counter       | Meaning                                        |
| ------------- | ---------------------------------------------- |
| **Total**     | All loaded waitlist requests                   |
| **Waiting**   | Requests with `waiting` status                 |
| **Contacted** | Requests with `contacted` or `notified` status |
| **Booked**    | Requests with `booked` status                  |
| **Cancelled** | Requests with `cancelled` status               |

### 10.2 Waitlist Sort Options

The Waitlist tab supports these sort modes:

| Sort option               | Purpose                               |
| ------------------------- | ------------------------------------- |
| **Newest first**          | Newest/recently updated first         |
| **Oldest first**          | Earliest joined first                 |
| **Appointment date/time** | Earliest requested appointment first  |
| **Waiting first**         | Active waiting/contact statuses first |
| **Name (A-Z)**            | Alphabetical client order             |

### 10.3 Waitlist Card Information

A waitlist card can show:

- Client name
- Waitlist ID
- Linked Booking ID, if available
- Waitlist status badge
- Queue chip, if active
- Waitlist place summary
- Service
- Stylist
- Preferred date
- Preferred time
- Slot ID
- Email link
- Phone link
- Joined timestamp
- Updated timestamp
- Notification timestamp
- Notification channel
- Waitlist notes
- Inspiration image link

---

## 11. Waitlist Action Buttons

Waitlist action buttons are rendered based on:

- The waitlist entry status
- Whether the waitlist row has a linked booking
- Whether the linked booking is still `waitlisted`

### 11.1 Waitlist Action Matrix

| Waitlist status / condition                           | Buttons shown                               | Meaning                                                                        |
| ----------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| Active queue status + linked waitlisted booking       | **Move to Confirmed (Locks Slot)**          | Converts linked waitlisted booking into confirmed booking if slot is available |
| Active queue status + no linked waitlisted booking    | Disabled **Move to Confirmed (Locks Slot)** | Cannot convert because there is no linked waitlisted booking to safely lock    |
| Active queue status where status is not `waiting`     | **Set Waiting**                             | Returns request to `waiting`                                                   |
| `waiting`, `notified`, or `notification_failed`       | **Mark Contacted**                          | Marks that admin contacted the client                                          |
| Active queue status without linked waitlisted booking | **Mark Booked / Close Waitlist**            | Status-only closure; does not lock a slot                                      |
| Active queue status                                   | **Cancel Request**                          | Cancels the waitlist request and syncs linked booking if possible              |
| Closed or blocked state                               | Disabled **No quick actions available**     | No valid action from that row                                                  |

### 11.2 Move to Confirmed (Locks Slot)

Use when:

- The client accepted the available opening.
- The waitlist row has a linked booking.
- The linked booking is still `waitlisted`.
- The preferred slot is available.

Effect:

- Calls `adminMoveWaitlistBookingToConfirmed`.
- Locks the slot in `bookingSlots`.
- Converts the booking to `confirmed`.
- Marks the waitlist request as `booked`.

This is the correct action when the admin wants a real confirmed booking with slot locking.

### 11.3 Set Waiting

Use when:

- A request was accidentally moved away from `waiting`.
- The client remains interested.
- The entry should return to the active queue.

Effect on waitlist record:

```txt
status: waiting
adminUpdatedBy: current admin
updatedAt: server timestamp
```

Effect on linked booking if synced:

```txt
status: waitlisted
bookingType: waitlist
isWaitlisted: true
waitlistStatus: waiting
waitlistAdminUpdatedBy: current admin
waitlistUpdatedAt: server timestamp
updatedAt: server timestamp
```

### 11.4 Mark Contacted

Use after manually contacting the client by phone, email, WhatsApp, or another channel.

Effect on waitlist record:

```txt
status: contacted
contactedAt: server timestamp
contactedBy: current admin
adminUpdatedBy: current admin
updatedAt: server timestamp
```

Effect on linked booking if synced:

```txt
status: waitlisted
bookingType: waitlist
isWaitlisted: true
waitlistStatus: contacted
waitlistAdminUpdatedBy: current admin
waitlistUpdatedAt: server timestamp
updatedAt: server timestamp
```

### 11.5 Mark Booked / Close Waitlist

This is a **status-only** action.

Use when:

- The waitlist request was handled outside the slot-locking conversion flow.
- The admin intentionally wants to close the waitlist row without locking a slot.

Effect on waitlist record:

```txt
status: booked
bookedAt: server timestamp
bookedBy: current admin
adminUpdatedBy: current admin
updatedAt: server timestamp
```

Important:

> **Mark Booked / Close Waitlist does not lock a booking slot.**

If the client should receive a confirmed slot, use:

```txt
Move to Confirmed (Locks Slot)
```

### 11.6 Cancel Request

Use when:

- The client no longer wants the slot.
- The waitlist request is invalid.
- The admin needs to remove the entry from the active queue.

Effect on waitlist record:

```txt
status: cancelled
cancelledAt: server timestamp
cancelledBy: current admin
adminUpdatedBy: current admin
updatedAt: server timestamp
```

Effect on linked booking if synced:

```txt
status: cancelled
isWaitlisted: false
waitlistStatus: cancelled
cancelledAt: server timestamp
cancelledBy: current admin
waitlistAdminUpdatedBy: current admin
waitlistUpdatedAt: server timestamp
updatedAt: server timestamp
```

This is the preferred way to cancel waitlisted bookings because it keeps the `waitlist` and `bookings` records synchronized.

---

## 12. Waitlist Status Badges

Waitlist cards use `admin-status-badge` plus a status-specific class.

The exact class mapping is implemented in `public/JS/admin.js` through waitlist badge helper functions.

Operationally, the badges represent:

| Waitlist status       | Badge meaning                          |
| --------------------- | -------------------------------------- |
| `waiting`             | Client is actively waiting             |
| `notified`            | Client has been notified automatically |
| `contacted`           | Admin has contacted client manually    |
| `booked`              | Waitlist request is closed as booked   |
| `cancelled`           | Waitlist request is cancelled          |
| `notification_failed` | Automated notification attempt failed  |

Active queue statuses may also show the queue chip, for example:

```txt
1st in queue
```

---

## 13. Schedule Tab Logic

### 13.1 Schedule Data Source

The Schedule tab renders from the same normalized booking array used by the Bookings tab:

```txt
adminBookingDocs
```

It does not use a separate `schedule` collection.

### 13.2 Schedule Views

The schedule supports two views:

| View     | Meaning                                     |
| -------- | ------------------------------------------- |
| **Day**  | Shows one selected day                      |
| **Week** | Shows a Monday-to-Sunday week; default view |

### 13.3 Schedule Navigation Buttons

| Button       | Behavior in Day view | Behavior in Week view |
| ------------ | -------------------- | --------------------- |
| **Previous** | Moves back 1 day     | Moves back 1 week     |
| **Today**    | Jumps to today       | Jumps to current week |
| **Next**     | Moves forward 1 day  | Moves forward 1 week  |

### 13.4 Schedule Date Parsing

The schedule determines each booking's date from these fields, in order:

1. `date`
2. `bookingDate`
3. `appointmentDate`
4. `serviceDate`
5. `slotDate`
6. `createdAt`

The schedule determines booking time from:

1. `time`
2. `bookingTime`
3. `slotTime`

If no valid time is found, it defaults to:

```txt
9:00 AM
```

### 13.5 Time Buckets

Bookings are grouped into schedule buckets by hour:

| Time range  | Bucket     |
| ----------- | ---------- |
| 00:00-05:59 | Late Night |
| 06:00-11:59 | Morning    |
| 12:00-16:59 | Afternoon  |
| 17:00-21:59 | Evening    |
| 22:00-23:59 | Late Night |

Within each day, bookings are sorted by appointment start time.

### 13.6 Schedule Event Content

Each schedule event button shows:

- Time
- Client name
- Service

Schedule event classes include:

```txt
admin-schedule-event
```

plus a status class from `getStatusClass(status)`, for example:

```txt
admin-status-confirmed
```

The selected event also gets:

```txt
is-selected
```

### 13.7 Schedule Legend

The schedule legend shows color/status meanings for:

- Pending
- Confirmed
- Waitlisted
- Completed
- Cancelled

These legend dots correspond to the same status categories used by booking badges and schedule event classes.

### 13.8 Selecting a Schedule Booking

When the schedule renders:

1. It groups bookings by visible date.
2. It sorts them by time.
3. It keeps a list of visible booking IDs.
4. If the currently selected booking is still visible, it stays selected.
5. If nothing is selected, the first visible booking is selected automatically.
6. Clicking an event sets it as the selected booking.

### 13.9 Schedule Detail Panel

The selected booking detail panel shows:

- Client name
- Booking ID
- Status badge
- Service
- Stylist
- Date
- Time
- Email
- Phone
- Special request
- Inspiration image link, if provided
- Previous/Next booking buttons
- Lifecycle action buttons based on booking status

### 13.10 Schedule Quick Actions

Schedule quick actions use the same lifecycle rules as booking cards:

| Selected booking status | Schedule quick actions                                 |
| ----------------------- | ------------------------------------------------------ |
| `pending`               | **Confirm**, **Cancel + Release Slot**                 |
| `confirmed`             | **Complete + Release Slot**, **Cancel + Release Slot** |
| `waitlisted`            | **Move to Confirmed**                                  |
| `completed`             | Disabled **No quick actions available**                |
| `cancelled`             | Disabled **No quick actions available**                |
| `expired`               | Disabled **No quick actions available**                |
| `no_show`               | Disabled **No quick actions available**                |

---

## 14. Backend Slot Safety Rules

Slot-sensitive actions are handled by Firebase callable functions in `functions/index.js`.

### 14.1 Why Backend Functions Are Used

Slot locking/releasing must be atomic and permission-protected.

The backend protects against:

- A non-admin releasing slots.
- A slot being released by the wrong booking.
- A waitlisted booking being confirmed into an occupied slot.
- A waitlist request and linked booking becoming unsynchronized.

### 14.2 `adminMoveWaitlistBookingToConfirmed`

This function is used by:

- Booking card **Move to Confirmed**
- Schedule detail **Move to Confirmed**
- Waitlist card **Move to Confirmed (Locks Slot)**

Allowed only when:

- Caller is an authorized booking admin.
- Booking exists.
- Booking status is `waitlisted`.
- Booking has a preferred slot.
- Booking has date and time details.
- The preferred slot is not occupied by another booking.

It writes:

- `bookingSlots/{preferredSlotId}` lock
- `bookings/{bookingId}` confirmation metadata
- `waitlist/{waitlistId}` booked metadata, if linked
- admin audit log

### 14.3 `adminUpdateBookingStatusAndReleaseSlot`

This function is used by:

- **Complete + Release Slot**
- **Cancel + Release Slot**

Allowed transitions:

| Current booking status | Target status              | Allowed?                                             |
| ---------------------- | -------------------------- | ---------------------------------------------------- |
| `confirmed`            | `completed`                | Yes                                                  |
| `completed`            | `completed`                | Backend allows idempotent completion-style release   |
| `pending`              | `cancelled`                | Yes                                                  |
| `confirmed`            | `cancelled`                | Yes                                                  |
| `cancelled`            | `cancelled`                | Backend allows idempotent cancellation-style release |
| `waitlisted`           | `completed` or `cancelled` | No; manage from waitlist or move to confirmed first  |
| anything else          | invalid target             | No                                                   |

Before deleting a slot, the backend verifies:

- The booking has a `slotId`.
- `bookingSlots/{slotId}` exists.
- The slot belongs to the booking by matching `bookingId`, or by legacy UID fallback rules.

If the slot belongs to another booking, the backend refuses to release it.

---

## 15. Common Workflows

### 15.1 Normal Booking Workflow

1. Client submits a booking.
2. Booking appears in **Bookings** as `pending`.
3. Admin reviews service, stylist, date, time, notes, email, phone, and image.
4. If accepted, admin clicks **Confirm**.
5. Booking becomes `confirmed`.
6. Booking appears in the Schedule view on its appointment date.
7. After service is fulfilled, admin clicks **Complete + Release Slot**.
8. Booking becomes `completed` and its slot lock is released.

### 15.2 Cancellation Workflow

1. Admin finds the pending or confirmed booking.
2. Admin clicks **Cancel + Release Slot**.
3. Backend verifies the slot belongs to the booking.
4. Booking becomes `cancelled`.
5. Slot lock is deleted if present.
6. Waitlist automation/queue handling can respond to the opened slot.

### 15.3 Waitlist-to-Confirmed Workflow

1. A client requests a slot that is unavailable.
2. A waitlist record is created in `waitlist`.
3. A linked waitlisted booking may exist in `bookings`.
4. Waitlist tab shows the request with a queue position.
5. When a slot opens, admin contacts the first queued client.
6. Admin clicks **Mark Contacted**.
7. If the client accepts, admin clicks **Move to Confirmed (Locks Slot)**.
8. Backend checks slot availability.
9. If available, backend locks the slot and confirms the booking.
10. Waitlist entry becomes `booked`.
11. Queue positions are recalculated.

### 15.4 Waitlist Decline/Cancellation Workflow

1. Admin contacts the client.
2. Client declines or request is invalid.
3. Admin clicks **Cancel Request**.
4. Waitlist entry becomes `cancelled`.
5. Linked waitlisted booking is synced to `cancelled` if possible.
6. Queue positions can move forward for remaining active clients.

### 15.5 Daily Schedule Workflow

1. Open **Schedule**.
2. Click **Today**.
3. Use **Day** for today's work or **Week** for planning.
4. Review bookings by time bucket.
5. Click each schedule event to see details.
6. Use **Previous Booking** and **Next Booking** to move through visible bookings.
7. Confirm pending bookings where appropriate.
8. Complete or cancel confirmed bookings using slot-release actions.
9. For waitlisted bookings, use **Move to Confirmed** first, or manage cancellation from **Waitlist**.

---

## 16. Difference Between Similar Actions

### 16.1 Confirm vs Move to Confirmed

| Action                | Used for              | Slot behavior                           |
| --------------------- | --------------------- | --------------------------------------- |
| **Confirm**           | `pending` bookings    | Simple status update to `confirmed`     |
| **Move to Confirmed** | `waitlisted` bookings | Backend checks and locks preferred slot |

Use **Move to Confirmed** for waitlisted bookings because the slot may still be occupied and must be locked safely.

### 16.2 Mark Booked vs Move to Confirmed

| Action                             | Used for                                              | Result                          |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------- |
| **Mark Booked / Close Waitlist**   | Closing a waitlist request without slot locking       | Updates waitlist status only    |
| **Move to Confirmed (Locks Slot)** | Converting a waitlist request into a real appointment | Locks slot and confirms booking |

Important:

> If the salon expects the client to appear on the schedule as a confirmed appointment, use **Move to Confirmed (Locks Slot)**.

### 16.3 Cancel + Release Slot vs Cancel Request

| Action                    | Used for                   | Result                                                     |
| ------------------------- | -------------------------- | ---------------------------------------------------------- |
| **Cancel + Release Slot** | Pending/confirmed bookings | Cancels booking and releases slot lock                     |
| **Cancel Request**        | Waitlist requests          | Cancels waitlist entry and syncs linked waitlisted booking |

Use **Cancel Request** for waitlisted clients so the waitlist record and linked booking stay synchronized.

---

## 17. Status Badge Summary

### 17.1 Booking Badges

| Badge text   | Meaning                           | Typical actions                                |
| ------------ | --------------------------------- | ---------------------------------------------- |
| `pending`    | Awaiting admin decision           | Confirm, Cancel + Release Slot                 |
| `confirmed`  | Active accepted appointment       | Complete + Release Slot, Cancel + Release Slot |
| `completed`  | Appointment fulfilled             | No quick actions                               |
| `cancelled`  | Booking cancelled                 | No quick actions                               |
| `waitlisted` | Waiting for unavailable slot      | Move to Confirmed                              |
| `expired`    | Auto-expired pending booking/slot | No quick actions                               |
| `no show`    | Missed confirmed appointment      | No quick actions                               |

### 17.2 Waitlist Badges

| Badge text            | Meaning                  | Typical actions                                                          |
| --------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `waiting`             | Active queue request     | Mark Contacted, Cancel Request, Move to Confirmed if linked              |
| `notified`            | Client was notified      | Mark Contacted, Set Waiting, Cancel Request, Move to Confirmed if linked |
| `contacted`           | Admin contacted client   | Set Waiting, Cancel Request, Move to Confirmed if linked                 |
| `notification_failed` | Auto-notification failed | Mark Contacted, Set Waiting, Cancel Request                              |
| `booked`              | Closed as booked         | No quick actions                                                         |
| `cancelled`           | Request cancelled        | No quick actions                                                         |

---

## 18. Common Error/Warning Cases

### 18.1 Move to Confirmed Fails Because Slot Is Occupied

Meaning:

- The waitlisted booking wants a slot that is still locked by another booking.

Fix:

1. Find the occupying booking.
2. Complete or cancel it with slot release, if appropriate.
3. Retry **Move to Confirmed**.

### 18.2 Move to Confirmed Disabled

Possible reasons:

- The waitlist row has no linked booking.
- The linked booking is already confirmed/completed/cancelled.
- The row is no longer in an active queue status.

Fix:

- If the client truly needs a confirmed appointment, create or restore the correct waitlisted booking link first.
- If the request was handled outside the app, use **Mark Booked / Close Waitlist** only as a status-only closure.

### 18.3 Slot Release Says No Locked Slot Was Found

Meaning:

- The booking was updated successfully, but no matching `bookingSlots/{slotId}` lock existed.

Possible causes:

- Legacy booking without `slotId`.
- Slot was already released.
- Slot record was deleted manually or by automation.

### 18.4 Linked Booking Sync Warning on Waitlist Action

Meaning:

- The waitlist status was saved, but the admin UI could not update the linked booking.

Fix:

- Check the linked booking ID.
- Verify permissions and Firestore rules.
- Manually inspect both `waitlist/{id}` and `bookings/{bookingId}` if needed.

---

## 19. Best Practices

1. **Use the right tab for the right lifecycle.**
   - Booking lifecycle actions belong in Bookings/Schedule.
   - Waitlist request lifecycle actions belong in Waitlist.

2. **Do not mark a waitlist request as booked if the client needs a real locked appointment.**
   - Use **Move to Confirmed (Locks Slot)** instead.

3. **Always release slots through the provided buttons.**
   - Use **Complete + Release Slot** or **Cancel + Release Slot**.
   - Avoid manually deleting slot documents unless troubleshooting with developer/admin approval.

4. **Contact clients in queue order.**
   - Queue badges show who should be contacted first for a slot.

5. **Cancel waitlisted clients from the Waitlist tab.**
   - This keeps `waitlist` and linked `bookings` records synchronized.

6. **Check the Schedule after major changes.**
   - Because Schedule renders from bookings, it is a quick way to verify the day/week view after confirmations, cancellations, or conversions.

---

## 20. Quick Reference Tables

### 20.1 Booking Buttons

| Status       | Confirm | Complete + Release Slot | Cancel + Release Slot | Move to Confirmed | No quick actions |
| ------------ | ------- | ----------------------- | --------------------- | ----------------- | ---------------- |
| `pending`    | Yes     | No                      | Yes                   | No                | No               |
| `confirmed`  | No      | Yes                     | Yes                   | No                | No               |
| `waitlisted` | No      | No                      | No                    | Yes               | No               |
| `completed`  | No      | No                      | No                    | No                | Yes              |
| `cancelled`  | No      | No                      | No                    | No                | Yes              |
| `expired`    | No      | No                      | No                    | No                | Yes              |
| `no_show`    | No      | No                      | No                    | No                | Yes              |

### 20.2 Waitlist Buttons

| Status/condition                                  | Move to Confirmed | Set Waiting | Mark Contacted | Mark Booked / Close | Cancel Request |
| ------------------------------------------------- | ----------------- | ----------- | -------------- | ------------------- | -------------- |
| `waiting` + linked waitlisted booking             | Yes               | No          | Yes            | No                  | Yes            |
| `waiting` + no linked booking                     | Disabled          | No          | Yes            | Yes                 | Yes            |
| `notified` + linked waitlisted booking            | Yes               | Yes         | Yes            | No                  | Yes            |
| `notified` + no linked booking                    | Disabled          | Yes         | Yes            | Yes                 | Yes            |
| `contacted` + linked waitlisted booking           | Yes               | Yes         | No             | No                  | Yes            |
| `contacted` + no linked booking                   | Disabled          | Yes         | No             | Yes                 | Yes            |
| `notification_failed` + linked waitlisted booking | Yes               | Yes         | Yes            | No                  | Yes            |
| `notification_failed` + no linked booking         | Disabled          | Yes         | Yes            | Yes                 | Yes            |
| `booked`                                          | No                | No          | No             | No                  | No             |
| `cancelled`                                       | No                | No          | No             | No                  | No             |

### 20.3 Schedule Buttons

| Control              | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| **Previous**         | Move to previous day/week                           |
| **Today**            | Jump to current day/week                            |
| **Next**             | Move to next day/week                               |
| **Day**              | Show one day                                        |
| **Week**             | Show seven-day week                                 |
| **Previous Booking** | Select previous visible booking in schedule details |
| **Next Booking**     | Select next visible booking in schedule details     |

---

## 21. Mental Model

Use this simplified model:

```txt
bookings = appointment records
waitlist = queue requests for unavailable slots
bookingSlots = locks that prevent double-booking
schedule = calendar view generated from bookings
```

And this operational rule:

```txt
Pending booking -> Confirm -> Confirmed booking -> Complete/Cancel + Release Slot

Unavailable slot -> Waitlist request -> Contact client -> Move to Confirmed if accepted and slot is available
```

The safest path is always to use the provided admin buttons rather than manually editing Firestore records.
