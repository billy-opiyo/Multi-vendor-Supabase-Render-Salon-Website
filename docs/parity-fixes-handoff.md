# Parity Fixes Handoff

Generated: 2026-06-11 08:53 Africa/Nairobi

## Scope

This handoff summarizes the Firebase-to-Supabase/Render parity fixes from the working tree. It focuses on booking slot availability parity, expired-slot release parity, waitlist queue lookup parity, and visible Render sync error handling.

The source changes described here are currently uncommitted and should be reviewed/tested before merging.

## Current Working Tree Summary

`git status --short` showed these modified source files:

```txt
M backend/src/modules/bookings/booking.controller.js
M backend/src/modules/bookings/booking.repository.js
M backend/src/modules/bookings/booking.routes.js
M backend/src/modules/bookings/booking.service.js
M backend/src/modules/bookings/booking.validators.js
M public/JS/admin.js
M public/JS/render-api-adapter.js
M public/JS/script.js
M public/JS/supabase-browser-adapter.js
```

`git diff --stat` showed roughly:

```txt
9 files changed, 467 insertions(+), 7 deletions(-)
```

## Already Completed Parity Tasks

### 1. Public booking-slot listing parity

Completed backend pieces:

- Added `GET /api/v1/booking-slots`.
- Added public slot list validation via `bookingSlotListQuerySchema`.
- Added repository support for reading `booking_slots` with filters:
  - `tenant_id`
  - `date`
  - `from`
  - `to`
  - `stylist_key`
  - `taken`
  - `limit`
  - `offset`
- Default behavior lists future taken slots when no date range is supplied.

Completed frontend pieces:

- Added `bookingSlots` as a remote collection in `public/JS/supabase-browser-adapter.js`.
- Enabled public-page polling for booking slots, not only admin-page polling.
- Added booking-slot row mapping from Supabase/Render shape back into legacy-compatible frontend shape.
- Added legacy booking slot IDs using the format:

```txt
YYYY-MM-DD__stylistKey__timeKey
```

### 2. Legacy booking-slot ID expired release parity

Completed backend pieces:

- Added `POST /api/v1/booking-slots/legacy/:legacySlotId/release-expired`.
- Added `legacyBookingSlotParamsSchema` for legacy slot ID route validation.
- Added legacy slot ID parsing in booking service.
- Added lookup by date/stylist, then normalized time matching.
- Reused the existing expired-slot release workflow after resolving the real Supabase slot.

Completed frontend pieces:

- Updated `clientReleaseExpiredBookingSlot()` in `public/JS/render-api-adapter.js`.
- If the slot ID is a UUID, the adapter calls:

```txt
POST /api/v1/booking-slots/:slotId/release-expired
```

- If the slot ID is not a UUID, the adapter calls:

```txt
POST /api/v1/booking-slots/legacy/:legacySlotId/release-expired
```

### 3. Booking-based waitlist queue lookup parity

Completed backend pieces:

- Added `GET /api/v1/bookings/:bookingId/waitlist-queue`.
- Added service method to look up the booking, enforce booking ownership, find the waitlist entry by `booking.waitlist_id` or `booking_id`, recalculate the queue, and return queue info.
- Added repository method `findWaitlistByBookingId()`.

Completed frontend pieces:

- Updated `clientGetWaitlistQueueInfo()` in `public/JS/render-api-adapter.js`.
- If `bookingId` is provided, it calls:

```txt
GET /api/v1/bookings/:bookingId/waitlist-queue
```

- If only `waitlistId` is provided, it keeps using:

```txt
GET /api/v1/waitlist/:waitlistId/queue
```

### 4. Render sync error visibility parity

Completed shared/frontend pieces:

- Added `dispatchRenderSyncError()` in `public/JS/supabase-browser-adapter.js`.
- Failed Render mutation syncs now dispatch:

```txt
appservices:render-sync-error
```

- Event detail includes:
  - `collectionName`
  - `documentId`
  - `operation`
  - `message`
  - `code`
  - `status`
  - `createdAt`
- The latest error is also stored on adapter state as `lastRenderSyncError`.

Completed public UI pieces:

- Added public sync error message helpers in `public/JS/script.js`.
- Public pages now surface visible warnings such as local-save-successful but Render-sync-needs-attention.

Completed admin UI pieces:

- Added admin sync error target routing in `public/JS/admin.js`.
- Admin sync errors are routed to context-specific message areas for collections such as:
  - `adminUsers`
  - `blogs`
  - `bookings`
  - `contactMessages`
  - `galleryStyles`
  - `reviews`
  - `waitlist`

## Edited Files and Purpose

| File                                                 | Purpose of current parity edits                                                                                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/modules/bookings/booking.controller.js` | Added controllers for public booking-slot listing, booking-based waitlist queue lookup, and legacy-slot expired release.                                  |
| `backend/src/modules/bookings/booking.repository.js` | Added data-access helpers for public slot listing, slot lookup by date/stylist, and waitlist lookup by booking ID.                                        |
| `backend/src/modules/bookings/booking.routes.js`     | Added new Render API routes for booking slots, booking waitlist queue lookup, and legacy expired-slot release.                                            |
| `backend/src/modules/bookings/booking.service.js`    | Added legacy slot ID parsing/resolution, public slot listing delegation, booking-based waitlist queue workflow, and legacy expired-slot release workflow. |
| `backend/src/modules/bookings/booking.validators.js` | Added schemas for public booking-slot list query validation and legacy slot ID params.                                                                    |
| `public/JS/admin.js`                                 | Added visible admin message handling for Render sync failures.                                                                                            |
| `public/JS/render-api-adapter.js`                    | Added UUID detection and route selection for expired-slot release; added booking-ID route support for waitlist queue lookup.                              |
| `public/JS/script.js`                                | Added public visible Render sync error warnings.                                                                                                          |
| `public/JS/supabase-browser-adapter.js`              | Added booking slot remote collection polling/mapping and Render sync error event dispatching.                                                             |

## Remaining Parity Gap Fixes

Continuation update: 2026-06-11 09:40 Africa/Nairobi. The high-priority validation fixes below have been implemented, and `npm run test:phase9` passed after the changes. Remaining unchecked items are manual UI/UX or production policy sign-off items rather than missing implementation/test coverage.

### High priority

- [x] Add backend unit tests for `listPublicBookingSlots()` service/repository behavior.
- [x] Add backend route tests for `GET /api/v1/booking-slots` validation and success shape.
- [x] Add backend unit tests for `getWaitlistQueueByBooking()`:
  - owner can view queue,
  - non-owner receives `403`,
  - missing waitlist entry receives `404`,
  - `booking.waitlist_id` path and `booking_id` lookup path both work.
- [x] Add backend unit tests for `releaseExpiredBookingSlotForClientByLegacyId()`:
  - valid legacy ID resolves matching slot,
  - invalid legacy ID returns `legacy_booking_slot_id_invalid`,
  - no matching slot returns `booking_slot_not_found`,
  - not-yet-expired slot is not released,
  - expired slot reuses existing release workflow.
- [x] Add route guard test for `POST /api/v1/booking-slots/legacy/:legacySlotId/release-expired` requiring auth.
- [x] Add frontend/unit or E2E coverage for `clientReleaseExpiredBookingSlot()` selecting UUID vs legacy routes.
- [x] Add frontend/unit or E2E coverage for `clientGetWaitlistQueueInfo()` selecting booking route vs waitlist route.

### Medium priority

- [x] Verify legacy slot ID time normalization against all frontend time formats currently produced by booking UI:
  - `09:00`
  - `9:00`
  - `9 AM`
  - `9:00 AM`
  - any configured salon-specific labels.
- [x] Verify `stylist_key` normalization matches both legacy frontend IDs and backend `slugifyStylistKey()` behavior.
- [ ] Confirm public booking slot polling interval (`5000ms`) does not over-poll Render/Supabase in production.
- [x] Confirm `GET /api/v1/booking-slots` is intentionally unauthenticated and safe under the project privacy model.
- [x] Confirm query default `taken=true` matches the old Firebase `bookingSlots` public read behavior expected by the UI.
- [x] Confirm the booking slot list returns enough data for the public UI but no private/sensitive fields.

### UI/UX validation still needed

- [ ] Verify public Render sync error message appears near the correct user-facing form/message area.
- [ ] Verify admin Render sync error message appears in the correct admin panel section.
- [ ] Verify sync error messages are understandable and not too alarming when local fallback save succeeded.
- [ ] Verify sync error messages clear after normal message timeout and do not stack excessively.

### Firebase parity closure checks

- [x] Compare these Render flows against legacy Firebase callable behavior in `legacy/firebase-production-archive/functions/index.js`:
  - `clientReleaseExpiredBookingSlot`
  - `clientGetWaitlistQueueInfo`
  - public `bookingSlots` reads/listeners
- [x] Confirm no browser code path still depends on active Firebase runtime behavior for these flows.
- [x] Update any existing mapping docs if these endpoints are considered parity-complete.

## Commands / Checks Run During This Handoff

Continuation checks run on 2026-06-11 after applying the remaining parity fixes:

| Command / check                                                                                                                | Status | Notes                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------- |
| `npm --prefix backend test -- booking.service.test.js booking.repository.test.js booking.parity.routes.test.js --reporter dot` | Passed | Focused backend parity coverage: 3 files, 25 tests.                                       |
| `npm run test:unit -- --run tests/unit/render-api-adapter.test.js`                                                             | Passed | Root unit suite ran 3 files, 13 tests including new Render adapter routing tests.         |
| `npm run check:js`                                                                                                             | Passed | Static JS syntax check for public/scripts files.                                          |
| `npm run test:backend`                                                                                                         | Passed | Backend suite: 21 files, 99 tests.                                                        |
| `npm run test:phase9`                                                                                                          | Passed | Active Supabase/Render/Vercel validation: `check:js`, root unit 13/13, backend 99/99.     |
| `npm test`                                                                                                                     | Passed | Full active validation: `check:js`, root unit 13/13, backend 99/99, Playwright E2E 23/23. |

The following inspection commands/tools were run while creating the original handoff to understand the working tree and draft the parity notes:

| Command / check                                    | Status | Notes                                                                                                                    |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `git status --short`                               | Run    | Confirmed 9 modified source files.                                                                                       |
| `git diff --stat`                                  | Run    | Confirmed approximate change size: 467 insertions, 7 deletions.                                                          |
| `git diff -- <edited files>`                       | Run    | Reviewed the uncommitted parity changes. Output was partially truncated, so targeted file reads/searches were also used. |
| Search Markdown docs for parity/testing references | Run    | Found active Supabase/Render/Vercel validation notes in `AUTOMATED_TESTING.md` and existing parity mapping docs.         |
| Read targeted backend/frontend files               | Run    | Reviewed service/validator/test context relevant to the parity changes.                                                  |

## Additional Automated Test Commands

These commands are the active validation commands for parity changes and have now been rerun successfully on 2026-06-11:

```cmd
npm run check:js
```

```cmd
npm run test:backend
```

```cmd
npm run test:phase9
```

```cmd
npm run test:e2e
```

```cmd
npm test
```

Notes:

- `npm run test:phase9` is the recommended non-browser validation subset for the active Supabase/Render/Vercel architecture.
- `npm test` includes syntax checks, root unit tests, backend tests, and Playwright E2E tests.
- The old Firebase emulator/rules/functions tests remain historical reference only and are not part of the active root `npm test` workflow.

## Existing Historical Validation Reference

`docs/firebase-to-supabase-mapping.md` notes a previous local validation on 2026-06-09 where:

```txt
npm run test:phase9
```

passed with root unit tests and backend tests. That historical result has been superseded by the 2026-06-11 reruns listed above, including full `npm test` with Playwright E2E 23/23.

## Remaining Manual Follow-ups

Automated implementation/test coverage for the high-priority parity gaps is complete. Remaining items are manual/product checks:

1. Confirm the public booking slot polling interval (`5000ms`) does not over-poll Render/Supabase in production.
2. Manually verify public/admin Render sync error messages appear in the right UI areas, clear correctly, and use acceptable wording.
3. If product requirements change, revisit whether public/customer review self-edit parity needs to be reintroduced.

## Handoff Risk Notes

- The new public `bookingSlots` remote collection is unauthenticated by design in the adapter. Confirm this matches RLS/API privacy expectations before production.
- Legacy slot ID parsing depends on `date__stylist__time` format and normalized time matching. Any mismatch between frontend legacy IDs and backend stored `slot_time` can break expired-slot release.
- `listPublicBookingSlots()` defaults to `taken=true`. If the UI needs available slots too, callers must pass `taken=false` or the default may need adjustment.
- Render sync error surfacing improves visibility, but it may expose backend error wording directly to users/admins. Review error message wording before production launch.
