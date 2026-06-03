# Royal Braids (Salon Shop)

Production-ready Firebase salon platform for **Royal Braids** with:

- Public website (`public/index.html`) with branded splash screen, services, gallery, booking, reviews, blog, and contact
- Client authentication + personal dashboard (appointments, reviews, favorites, account settings)
- Admin console (`public/admin.html`) for bookings, schedule view, waitlist, gallery, blogs, reviews, filtered messages, service visibility, security monitoring, and admin-user delegation
- Firestore realtime data pipelines
- Cloud Functions automation for email + WhatsApp booking notifications and waitlist alerts

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Latest Project Changes (Current State)](#2-latest-project-changes-current-state)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Runtime Architecture](#5-runtime-architecture)
6. [Public-Site Features](#6-public-site-features)
7. [Client Auth + Dashboard Features](#7-client-auth--dashboard-features)
8. [Admin Features](#8-admin-features)
9. [Firestore Data Model](#9-firestore-data-model)
10. [Security Model (`firestore.rules`)](#10-security-model-firestorerules)
11. [Cloud Functions](#11-cloud-functions)
12. [Local Setup](#12-local-setup)
13. [Deployment](#13-deployment)
14. [Testing & QA Guide](#14-testing--qa-guide)
15. [Important Notes](#15-important-notes)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project Summary

This project is built to:

1. Showcase salon services, styles, and content dynamically.
2. Accept online bookings with anti-double-booking slot locking.
3. Support authenticated client self-service (dashboard, favorites, reschedule/cancel actions).
4. Give admins one panel for operations (bookings, calendar schedule, waitlist, content, messages, services, security, and admin users).
5. Enforce security via Firebase Auth + strict Firestore Rules.

---

## 2. Latest Project Changes (Current State)

- Added **branded public splash screen**:
  - 10-second Royal Braids welcome overlay with hero imagery, handwriting title animation, loading copy, and accessible progressbar semantics
  - Reduced-motion duration fallback, scroll-to-top reset on fresh visits, completion event dispatch, and `window.royalBraidsSplash` runtime controls for safe testing/manual completion
- Added **client theme presets + setup preview**:
  - `public/client-config.js` now separates `appearance.mode` from `appearance.preset`, so client brand palettes can change independently from visitor light/dark preference
  - Built-in presets include `gold`, `champagne`, `rose-gold`, `emerald`, `plum-gold`, `terracotta`, `teal`, `blush`, and `lavender`, with optional exact `theme` overrides for custom brand colors
  - `public/JS/theme-preset-preview.js` adds an opt-in developer panel when opening public/admin pages with `?themePreview=1`
- Added/expanded **Client Dashboard self-service**:
  - Client-side booking reschedule flow with slot re-locking
  - Client-side booking cancellation flow
  - Realtime dashboard sections for appointments/reviews/favorites
- Added full **Manage Account runtime implementation**:
  - Profile updates (name/email/phone/avatar)
  - Password change + password reset actions
  - Theme/accessibility/notification preferences persistence
  - Account delete confirmation flow in UI
- Added **Waitlist workflow** for lost booking slots:
  - Public app prompts client to join waitlist when slot was just taken
  - Waitlist entries stored in Firestore (`waitlist` collection)
  - Backend notifies next waitlisted client when a slot lock is deleted
- Expanded **Cloud Functions automation**:
  - Email booking confirmation via Resend
  - WhatsApp booking confirmation on create
  - Scheduled WhatsApp reminders for confirmed bookings about 2 hours before appointment time
  - Booking system field initialization + per-user review/contact rate-limit updates
- Expanded **Admin operations**:
  - Schedule tab with day/week calendar view and quick booking actions
  - Waitlist tab with realtime queue monitoring, counters, sorting, and status transitions
  - Lifecycle-safe booking action rendering across Bookings and Schedule
  - `Complete + Release Slot` and `Cancel + Release Slot` now use protected backend callable slot-release handling
  - Waitlisted bookings must be moved to confirmed first, or cancelled from Waitlist, so linked waitlist records remain synchronized
  - Admin realtime listeners now start only for sections covered by the signed-in admin's permissions
  - Messages tab now has status filter chips for New, Read, and Resolved messages with active-state and empty-result feedback
  - Existing CRUD/moderation modules maintained for gallery, blogs, reviews, and messages
- Added **Service Category Visibility Management**:
  - New **Services** tab in admin console for category ON/OFF controls
  - Realtime settings stored in `siteSettings/serviceCategories`
  - Public services list, booking service dropdown, and gallery/service filters respect enabled categories
- Added **Client Security History in Dashboard**:
  - Client dashboard now renders per-user login activity history
  - Backed by callable security logging and `loginActivities` read access scoped to owner/admin
- Added **Role-based Admin Access + Delegation**:
  - Admin access is now driven by `adminUsers/{uid}` records (role + active state + permissions)
  - Super-admin-only management flows for creating/updating/listing admin users
  - Scoped admin UI rendering by permission (`canManageBookings`, `canManageContent`, `canManageSecurity`)
  - Added admin delegation/audit support with server-written `adminAuditLogs`
- Updated **WhatsApp reminder timing**:
  - Reminder scheduler still runs every 15 minutes, but now targets confirmed bookings roughly 2 hours away
  - Reminder copy, logging, and status handling now match the 2-hour reminder timing
- Added **braids-first service/gallery refinements**:
  - Public Services includes a dedicated **Braids Services** category tab
  - Public Gallery includes service-category filtering alongside existing sort/filter controls
  - Braids-specific gallery labels/actions now surface “Most Booked Braids” and “View All Braids” where relevant
- Added **very-small-screen UI polish**:
  - Compact <=490px service/gallery chips, feature pills, waitlist badges, review/auth badges, admin status badges, and dashboard count badges
  - Improved badge contrast, single-line behavior, and ellipsis fallback to reduce wrapping/clipping on narrow phones

---

## 3. Tech Stack

### Frontend

- HTML + CSS + Vanilla JavaScript
- Public script: `public/JS/script.js`
- Splash controller: `public/JS/splash.js`
- Client config/theming scripts: `public/client-config.js`, `public/JS/apply-client-config.js`, `public/JS/theme-preset-preview.js`
- Admin script: `public/JS/admin.js`

### Firebase

- Firebase Hosting (`public/`)
- Firebase Authentication (Email/Password + Anonymous)
- Cloud Firestore
- Firestore Security Rules (`firestore.rules`)
- Firebase App Check (configured in public/admin apps)

### Media + Automation

- Cloudinary unsigned uploads (booking/gallery/review/blog images)
- Sharp-powered local optimizer for static assets in `public/IMG`
- Firebase Cloud Functions (`functions/index.js`)
- Resend transactional email API
- WhatsApp Cloud API for confirmations/reminders

---

## 4. Project Structure

```txt
.
├── firebase.json
├── .firebaserc
├── firestore.rules
├── functions/
│   ├── index.js
│   └── package.json
└── public/
    ├── index.html
    ├── client-config.js
    ├── admin.html
    ├── README.md
    ├── CSS/style.css
    ├── JS/apply-client-config.js
    ├── JS/theme-preset-preview.js
    ├── JS/splash.js
    ├── JS/script.js
    ├── JS/admin.js
    └── IMG/
```

---

## 5. Runtime Architecture

### Public App (`index.html` + `script.js`)

1. Runs the `splash.js` branded welcome overlay before revealing the main site shell.
2. Loads `client-config.js`, applies `appearance`/theme CSS variables, and optionally enables the `?themePreview=1` developer preset panel.
3. Initializes Firebase/Auth/Firestore/App Check.
4. Renders fallback datasets first.
5. Starts realtime listeners for gallery/blog/reviews and slot availability.
6. Handles booking, waitlist fallback, reviews, favorites, contact, and account workflows.

### Client Dashboard Runtime

- Reads authenticated user data from:
  - `bookings`
  - `reviews`
  - `users/{uid}/favorites`
- Supports booking reschedule/cancel actions.
- Upserts user profile data in `users/{uid}`.

### Admin App (`admin.html` + `admin.js`)

1. Email/password admin login gated by `adminUsers/{uid}` role, active state, and permissions.
2. Loads the same client config/theming layer as the public app, including opt-in `?themePreview=1` preset preview for setup checks.
3. Permission-scoped realtime listeners for bookings, waitlist, gallery, blogs, reviews, contact messages, services, admin users, and security data.
4. Calendar-like schedule board (day/week), waitlist queue, and lifecycle-safe operational booking management.

### Backend Automation

- Functions trigger on booking creation and slot release events.
- Email + WhatsApp booking notifications.
- Scheduled WhatsApp reminders about 2 hours before confirmed appointments.
- Waitlist notification dispatch for newly opened slots.

---

## 6. Public-Site Features

### Splash / Welcome Experience

- Branded Royal Braids splash overlay with hero image background and handwriting-style title animation
- Accessible loading status/progressbar (`role="status"` + `role="progressbar"`) with percent text/fill updates
- Configurable duration through `data-splash-duration` or `window.ROYAL_BRAIDS_SPLASH_DURATION_MS`
- Reduced-motion fallback duration for users who prefer reduced animation
- Completion API/event (`window.royalBraidsSplash.complete()` and `royalBraids:splashComplete`) for testing and controlled reveal behavior

### Theme Presets / Brand Appearance

- `public/client-config.js` exposes `appearance.mode` for the default light/dark mode and `appearance.preset` for the client brand palette
- Supported presets: `gold`, `champagne`, `rose-gold`, `emerald`, `plum-gold`, `terracotta`, `teal`, `blush`, and `lavender`
- Visitor-saved light/dark preference in `localStorage.theme` overrides only the mode, not the selected brand preset
- Optional `theme` overrides can set exact CSS values for clients with custom color requirements
- Developer-only preview panel: open `index.html?themePreview=1` or `admin.html?themePreview=1` to switch presets visually, reset to config, or disable preview for the tab

### Services

- JS-driven service catalog + category tabs, including dedicated Braids Services
- “Book This Service” quick-fill action

### Gallery

- Realtime Firestore gallery with fallback dataset
- Service-category filters plus length/size/style-type filters, sorting, and featured rails
- Before/after lightbox support
- Save-style to favorites

### Booking

- Required validation + optional inspiration image upload
- Realtime slot availability from `bookingSlots`
- Transactional slot lock + booking write
- If race condition occurs (slot taken), optional waitlist enrollment

### Reviews

- Public feed shows approved reviews only
- Auth-gated submission for non-anonymous signed-in users
- Pending moderation on create/update
- Abuse report increments `reportsCount`

### Blog

- Realtime blog rendering with fallback content
- Public card rendering with controls for browsing

### Contact

- Firestore-backed contact pipeline (`status: new` on create)
- Success messaging in UI

---

## 7. Client Auth + Dashboard Features

- Auth modal:
  - Email/password sign-in/register
  - Forgot password
  - Continue as guest
- Dashboard:
  - Recent appointments and reviews
  - Favorites list + quick actions
  - Profile summary fields
- Manage Account runtime:
  - Profile updates + optional avatar upload
  - Password security tools (change/reset + strength checks)
  - Preferences (theme, font size, accessibility, notifications)
  - Account deletion confirmation flow
- Booking self-service:
  - Reschedule booking
  - Cancel booking

---

## 8. Admin Features

### Access + UX

- Firebase admin login gated by `adminUsers/{uid}` role, active state, and scoped permissions
- Password visibility toggle
- Section tabs: **Bookings, Schedule, Gallery, Blogs, Reviews, Messages, Waitlist, Services, Admins, Security**
- Confirmation modal for destructive actions
- Permission-scoped realtime listeners stop/not-start when the signed-in admin lacks the required section permission

### Admins (Role + Permission Management)

- Dedicated **Admins** section for super-admin-managed delegation
- Manage per-admin:
  - Role (`super_admin` / `admin`)
  - Active/inactive access state
  - Permission flags (`canManageAdmins`, `canManageBookings`, `canManageContent`, `canManageSecurity`)
- Client writes to `adminUsers` are blocked; mutations are server-managed through callable functions
- Delegation mutations are recorded to `adminAuditLogs` for accountability

### Bookings + Schedule

- Realtime bookings list + status cards
- Lifecycle-safe booking actions based on current status:
  - Pending: **Confirm** or **Cancel + Release Slot**
  - Confirmed: **Complete + Release Slot** or **Cancel + Release Slot**
  - Waitlisted: **Move to Confirmed** only; complete/cancel release buttons are disabled with guidance
  - Completed/cancelled: no quick lifecycle action
- Protected backend slot-release flow for admin completion/cancellation actions through `adminUpdateBookingStatusAndReleaseSlot`
- Slot-release metadata on booking docs can include `releasedSlotId`, `slotReleasedAt`, `slotReleaseReason`, `slotReleaseSource`, and `slotReleasedBy`
- Admin audit logging for booking completion/cancellation slot-release actions
- Day/week schedule board with quick-detail action panel using the same lifecycle-safe rules

### Waitlist

- Dedicated **Waitlist** admin tab for booked-slot waitlist requests
- Realtime queue from the `waitlist` collection with counters for total, waiting, contacted, booked, and cancelled
- Sort modes: newest, oldest, appointment date/time, waiting-first, and name A-Z
- Request cards show client/contact details, desired service/date/time/stylist, notification channel/status, and notes
- Admin status transitions: set waiting, mark contacted, mark booked, and cancel request
- Waitlist tab access follows booking-management permissions (`canManageBookings`)

### Gallery

- Create/edit/delete styles
- Cloudinary upload (after + optional before image)
- Featured flags + live preview + checklist/progress meter

### Blogs

- Create/edit/delete blog posts
- Fields: title, excerpt, read time, publish date, URL, image

### Reviews

- Realtime moderation queue + sorting
- Actions: approve/reject/pending, edit, reply, feature, delete
- Local blocked-word list helper for moderation

### Messages

- Realtime inbox + status stats
- Status filter chips for New, Read, and Resolved messages with accessible pressed states and all-message toggle behavior
- Sort modes (newest/oldest/status/name)
- Status transitions: `new`, `read`, `resolved`

### Services

- New **Services** admin tab for realtime service-category visibility control
- Toggle categories between active/inactive states with grouped cards and counters
- Saves to `siteSettings/serviceCategories` and updates public UI behavior live
- Public runtime consumes these settings to:
  - Hide disabled categories from Services section tabs/cards
  - Remove disabled category options from booking service dropdown
  - Exclude disabled-category items from gallery/filter results

### Security

- Dedicated **Security** tab in admin console with realtime monitoring blocks for:
  - Login activity (`loginActivities`)
  - Session tracking (`collectionGroup("sessions")`)
  - Security alerts (`securityAlerts`)
  - Account change history (`accountChangeHistory`)
  - User behavior timeline (`activityTimeline`)
- Security counters/widgets:
  - Total/success/failed logins
  - Suspicious events, locked accounts, repeated wrong passwords, high-risk logins
  - Online users + online sessions + multi-device user detection
  - Daily KPI widgets (today logins, failed attempts, new registrations, returning users, provider mix)
- Advanced login activity controls:
  - Sort: newest, oldest, failed-first, suspicious-first
  - Filters: risk, date, date range, provider, device, known/anonymous user, country, status
  - Search by email/username/booking ID
  - Export visible rows to CSV/Excel
  - Clear all filters action
- Risk and anomaly model surfaced in UI:
  - Risk level (`low` / `medium` / `high`) with score and trust score
  - Repeated failures, rapid repeated logins, new device/browser, country-change anomalies
  - Temporary lock indicators from backend (`lockUntil`, failed-attempt windows)
- Inline admin incident response actions (per linked user):
  - **Temp Block** (`temporary_block`)
  - **Force Logout** (`force_logout`)
  - **Force Password Reset** (`force_password_reset`)
  - **Clear Restrictions** (`clear_restrictions`)
  - Backed by callable function `adminRestrictUserAccount`

---

## 9. Firestore Data Model

Main collections used:

- `bookings/{bookingId}`
- `bookingSlots/{slotId}`
- `waitlist/{waitlistId}`
- `galleryStyles/{styleId}`
- `blogs/{blogId}`
- `reviews/{reviewId}`
- `users/{userId}`
- `users/{userId}/favorites/{favoriteId}`
- `contactMessages/{messageId}`
- `rateLimits/{uid}` (function-managed internal cooldown docs)
- `adminUsers/{uid}`
- `adminAuditLogs/{logId}`
- `adminSecurityActions/{actionId}`
- `loginActivities/{activityId}`
- `securityAlerts/{alertId}`
- `accountChangeHistory/{eventId}`
- `activityTimeline/{eventId}`

---

## 10. Security Model (`firestore.rules`)

Core behavior:

- Helper guards: `isSignedIn()`, `isAdmin()`, owner/admin checks
- Strict payload and changed-key validation for create/update operations
- Booking owner update logic supports constrained reschedule/cancel paths
- Public reads only where intended (`galleryStyles`, `blogs`, approved reviews, slot availability)
- Waitlist create/read/update constraints added
- Internal `rateLimits` collection is not client-readable/writeable
- `adminUsers` access model:
  - Signed-in users can read only their own admin-access document
  - Super admins can read all admin-access documents
  - Direct client create/update/delete is blocked
- `adminAuditLogs` read scope is super-admin only (client writes blocked)
- Security collections are server-written only (no direct client create/update/delete):
  - `loginActivities`
  - `securityAlerts`
  - `accountChangeHistory`
  - `activityTimeline`
- Admin-only security reads are enforced for dashboard monitoring collections.
- Session monitoring rules support admin `collectionGroup("sessions")` reads.

---

## 11. Cloud Functions

File: `functions/index.js`

- `sendBookingConfirmationEmail` (on booking create)
- `sendBookingConfirmationWhatsApp` (on booking create)
- `sendUpcomingBookingWhatsAppReminders` (scheduled every 15 minutes; sends around 2 hours before confirmed appointments)
- `initializeBookingSystemFields` (booking defaults patch)
- `updateReviewRateLimit` (on review create)
- `trackReviewEdited` (on review update)
- `updateContactRateLimit` (on contact create)
- `trackBookingCreated` (on booking create timeline/audit)
- `trackBookingCanceled` (on booking update timeline/audit)
- `notifyWaitlistOnSlotOpen` (on booking slot deletion)
- `createCloudinarySignedUpload` (callable signed-upload helper)
- `adminMoveWaitlistBookingToConfirmed` (callable waitlisted-booking conversion + preferred-slot locking)
- `adminUpdateBookingStatusAndReleaseSlot` (callable admin completion/cancellation + safe slot release + audit logging)
- `logLoginActivity` (callable login telemetry + risk/scoring + alert triggers)
- `logAccountSecurityChange` (callable account security-change audit + optional alert)
- `adminRestrictUserAccount` (callable admin security actions: block/logout/reset/clear)
- `adminCreateAdminUser` (callable super-admin admin-user creation)
- `adminUpdateAdminUser` (callable super-admin admin-user updates)
- `adminListAdminUsers` (callable admin-access directory listing)

Required function secrets include:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `WHATSAPP_CLOUD_ACCESS_TOKEN`
- `WHATSAPP_CLOUD_PHONE_NUMBER_ID`

---

## 12. Local Setup

### Prerequisites

- Node.js + npm
- Firebase CLI
- Firebase project access

### Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### Optimize Static Images

Static images in `public/IMG` can be compressed/resized locally with Sharp before deployment:

```bash
npm run optimize:images:dry-run
npm run optimize:images
```

The workflow preserves existing image paths so HTML, JS, service-worker, and client-config references continue to work.

### Firebase Checklist

1. Enable Firestore.
2. Enable Authentication providers:
   - Email/Password
   - Anonymous
3. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

4. Set function secrets:

```bash
firebase functions:secrets:set CLOUDINARY_CLOUD_NAME
firebase functions:secrets:set CLOUDINARY_API_KEY
firebase functions:secrets:set CLOUDINARY_API_SECRET
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set RESEND_FROM_EMAIL
firebase functions:secrets:set WHATSAPP_CLOUD_ACCESS_TOKEN
firebase functions:secrets:set WHATSAPP_CLOUD_PHONE_NUMBER_ID
```

5. Deploy functions:

```bash
firebase deploy --only functions
```

6. Deploy hosting:

```bash
firebase deploy --only hosting:main-site
```

---

## 13. Deployment

Deploy all:

```bash
firebase deploy
```

Deploy specific components:

- Hosting only: `firebase deploy --only hosting:main-site`
- Rules only: `firebase deploy --only firestore:rules`
- Functions only: `firebase deploy --only functions`

---

## 14. Testing & QA Guide

Use this section as the project QA checklist for releases, Firebase deployments, and feature regressions.

> **Current status:** this project includes automated JavaScript syntax checks, Vitest unit tests, Firestore Rules emulator tests, Playwright E2E coverage, and Functions Jest tests. Manual Firebase Console checks, browser-console review, and Cloud Functions logs are still recommended for production integrations such as real email/WhatsApp delivery.

### Testing environments

- **Local/static preview:** open `public/index.html` and `public/admin.html` directly, or serve the `public/` folder with a local static server.
- **Firebase Hosting / deployed site:** recommended for realistic Firebase Auth, Firestore, App Check, Cloud Functions, Cloudinary upload, email, and WhatsApp verification.
- **Firebase Console:** keep Firestore open during QA to verify document writes, status changes, and security-rule behavior.

### Pre-test checklist

- [ ] Firebase Authentication providers are enabled: Email/Password and Anonymous.
- [ ] Firestore rules in `firestore.rules` are deployed.
- [ ] Cloud Functions in `functions/index.js` are deployed with the Node.js 22 runtime.
- [ ] Required function secrets are set for Cloudinary, Resend, and WhatsApp Cloud API.
- [ ] At least one `super_admin` document exists in `adminUsers/{uid}`.
- [ ] Admin test account has `canManageBookings` permission for Bookings, Schedule, and Waitlist QA.
- [ ] Test accounts are available for guest, client, admin, and super-admin flows.
- [ ] Browser DevTools and Cloud Functions logs are available for troubleshooting.
- [ ] Responsive QA viewports are ready in DevTools, especially 490px, 390px, and 360px widths.
- [ ] Theme preset preview URLs are ready for visual checks: `index.html?themePreview=1` and `admin.html?themePreview=1`.

Deploy rules/functions before full QA:

```bash
firebase deploy --only firestore:rules
firebase deploy --only functions
```

Deploy hosting for production-style UI verification:

```bash
firebase deploy --only hosting:main-site
```

### End-to-end QA checklist

Use the following scenarios to confirm all major features are working.

### A) Public website smoke test

1. Open `index.html` (or deployed site) and verify:
   - The Royal Braids splash screen appears, progresses, then reveals the main website without leaving the page scrolled away from the top.
   - Hero, Services, Gallery, Reviews, Blog, and Contact sections render.
   - Dark mode toggle works.
   - The configured `data-theme-preset` is applied and the preset preview panel is hidden unless `?themePreview=1` is present.
   - At <=490px viewport width, service tabs, gallery filter chips, feature pills, waitlist badges, review/auth badges, and dashboard count badges stay compact/readable without clipping.
2. In **Gallery**:
   - Change filters/sort options.
   - Open a style in lightbox; test next/prev and close.
   - Expected: list updates correctly and lightbox navigation works.

### A2) Theme preset / preview QA

Use this after changing `public/client-config.js`, `public/CSS/style.css`, or the theme preview script.

1. Open `index.html` normally and verify the preview panel is not visible.
2. Open `index.html?themePreview=1` and verify the **Theme presets** panel appears.
3. Select several presets, including `rose-gold`, `emerald`, and `lavender`.
4. Expected:
   - `document.documentElement.dataset.themePreset` changes to the selected preset key.
   - Primary buttons, highlights, service dropdown styling, scrollbar accents, and light/dark mode surfaces use the selected palette.
5. Click **Reset to config** and verify the page returns to `appearance.preset` from `client-config.js`.
6. Click **Disable** and verify the panel disappears and the URL no longer contains `themePreview`.
7. Repeat a quick check on `admin.html?themePreview=1` to confirm the shared preview script loads on the admin shell without login-page errors.

### B) Auth + dashboard test

1. Click **Log In** and create a test account (email/password).
2. Open **My Dashboard** and confirm:
   - Profile info appears.
   - Favorites count/list updates after saving a style.
3. In **Manage Account**:
   - Update name/phone and save.
   - Trigger password reset email.
   - Change theme/accessibility/preferences and save.
   - Expected: success messages appear and profile/preferences persist.

### C) Booking + slot locking test

1. Submit booking form with valid data.
2. Confirm success UI appears.
3. In Firestore, verify:
   - New doc in `bookings`.
   - Corresponding doc in `bookingSlots` with `taken: true`.
4. In dashboard:
   - Use **Reschedule** to pick a new slot.
   - Use **Cancel** on another active booking.
   - Expected: slot changes/cancellation reflected in Firestore and UI.

### D) Waitlist test (race condition path)

1. Attempt to book an already-taken slot (or simulate by taking slot in another session first).
2. Accept the waitlist prompt.
3. Verify new document in `waitlist` with `status: "waiting"`.
4. Delete the related `bookingSlots/{slotId}` lock (admin cancellation path is easiest).
5. Expected: top waitlisted client gets notified (email/WhatsApp based on available contact data) and waitlist status updates.

### E) Admin waitlist operations test

Use this to verify the current **Admin → Waitlist** queue after creating at least one waitlist request.

1. Sign in to `admin.html` with an admin account that has `canManageBookings`.
2. Open **Waitlist** and verify:
   - Total, Waiting, Contacted, Booked, and Cancelled counters render.
   - Existing `waitlist` documents appear without permission errors.
   - Request cards show client name/contact, desired service/date/time/stylist, notification details, and notes when present.
3. Test **Sort Waitlist** modes:
   - Newest first
   - Oldest first
   - Appointment date/time
   - Waiting first
   - Name A-Z
4. Run each status action on a test request:
   - **Set Waiting**
   - **Mark Contacted**
   - **Mark Booked**
   - **Cancel Request**
5. Expected in Firestore:
   - `waitlist/{waitlistId}.status` changes to the selected status.
   - `updatedAt` and `updatedBy` metadata are written.
6. Permission regression:
   - Sign in as a standard admin without `canManageBookings`, or deactivate the admin record.
   - Expected: Waitlist tab is hidden/blocked and direct unauthorized reads/writes are rejected by Firestore rules.

### F) Reviews + moderation test

1. Submit a review while signed in.
2. Confirm review saved as `pending`.
3. Open admin panel → **Reviews**:
   - Approve/reject/pending transitions.
   - Edit text and save reply.
   - Toggle featured and test delete.
4. Expected: public site only shows approved reviews.

### G) Contact + admin messages test

1. Submit contact form.
2. Verify document created in `contactMessages` with `status: "new"`.
3. In admin panel → **Messages**:
   - Use New, Read, and Resolved status filter chips and confirm the list shows only matching messages.
   - Sort list.
   - Move status new → read → resolved.
   - Delete one message.
4. Expected: counts and status badges update in realtime.

### H) Admin content management test

1. Admin login using allowed email.
2. **Gallery**: create/edit/delete a style (with image).
3. **Blogs**: create/edit/delete a blog post.
4. **Schedule**:
   - Switch Day/Week.
   - Open an event and run quick actions.
5. Expected: public site reflects gallery/blog changes in realtime.

### H2) Admin booking lifecycle + slot-release test

Use this to verify the current **Bookings** and **Schedule** action rules after deploying `adminUpdateBookingStatusAndReleaseSlot`.

1. Sign in to `admin.html` with an admin account that has `canManageBookings`.
2. Create or locate test bookings with these statuses: `pending`, `confirmed`, `waitlisted`, and a terminal status (`completed` or `cancelled`).
3. In **Bookings**, verify action visibility:
   - Pending shows **Confirm** and **Cancel + Release Slot**.
   - Confirmed shows **Complete + Release Slot** and **Cancel + Release Slot**.
   - Waitlisted shows **Move to Confirmed** while complete/cancel release actions are disabled with explanatory tooltips/guidance.
   - Completed/cancelled shows no quick lifecycle action.
4. Repeat the same checks from **Schedule** by opening each booking in the schedule details panel.
5. Run **Complete + Release Slot** on a confirmed test booking.
6. Run **Cancel + Release Slot** on a pending or confirmed test booking.
7. Expected in Firestore:
   - Booking status updates to `completed` or `cancelled`.
   - Matching `bookingSlots/{slotId}` is deleted only when it belongs to that booking.
   - Booking release metadata appears when a slot is released: `releasedSlotId`, `slotReleasedAt`, `slotReleaseReason`, `slotReleaseSource`, and `slotReleasedBy`.
   - Completion/cancellation actor metadata appears, such as `completedBy` or `cancelledBy`.
   - Admin audit entries appear in `adminAuditLogs` for completion/cancellation slot-release actions.
8. Permission regression:
   - Sign in as an admin without `canManageBookings`.
   - Expected: Bookings/Schedule/Waitlist tabs are hidden/blocked and related realtime listeners do not continue loading protected data.

### I) Backend automation verification

After creating confirmed test bookings, including one roughly 2 hours away, verify on booking docs:

- `emailStatus` updates (`sent`/`failed`)
- `whatsappStatus` updates (`confirmation_sent`, `reminder_sent`, etc.)
- reminder timestamps (`reminderSentAt`, `reminderTriedAt` when applicable)

Also check logs:

```bash
firebase functions:log
```

Expected: successful execution logs for:

- `sendBookingConfirmationEmail`
- `sendBookingConfirmationWhatsApp`
- `sendUpcomingBookingWhatsAppReminders`
- `notifyWaitlistOnSlotOpen`

### J) Security tab testing procedure (all Security features)

Use this procedure to validate the full **Admin → Security** module end-to-end.

#### 0) Prerequisites

1. Deploy latest Firestore rules and functions:
   - `firebase deploy --only firestore:rules`
   - `firebase deploy --only functions`
2. Sign in as an allowed admin user in `admin.html`.
3. Keep Firestore Console open for these collections:
   - `loginActivities`
   - `securityAlerts`
   - `accountChangeHistory`
   - `activityTimeline`
   - `adminSecurityActions`
   - `users/{uid}` (for `securityRestrictions` updates)

#### 1) Open Security tab + validate realtime counters/widgets

1. In admin panel, open **Security** tab.
2. Confirm Security cards render (not empty/broken) for:
   - total/success/failed/suspicious/locked/repeated wrong/high-risk
   - online users/sessions/multi-device
   - alerts/account changes/timeline totals
3. Expected:
   - Values update automatically when new activity is logged.
   - No permission errors shown in the Security message areas.

#### 2) Generate login activity test data

1. From one or more browser sessions/devices, perform:
   - Successful login(s)
   - Failed login attempts (wrong password)
2. Include mixed providers if available (email/password, anonymous, Google).
3. Expected:
   - New docs appear in `loginActivities`.
   - Security table updates in realtime.
   - Failed attempts increase failed counters.
   - Suspicious/risk flags appear when thresholds are reached.

#### 3) Verify risk analysis and lock behavior

1. Trigger repeated failed attempts within short windows.
2. Confirm rows show:
   - `failedAttemptsIn5m` / `failedAttemptsIn15m`
   - `accountLockTriggered` / active lock state and lock-until timestamp
   - risk level/score and trust score
3. Expected:
   - Suspicious flags such as `repeated_failures`, `rapid_repeated_logins`, or lock indicators appear.
   - High-risk counters increment accordingly.

#### 4) Test sorting, filtering, search, and badge behavior

1. Test **Sort Activity** options: Newest, Oldest, Failed First, Suspicious First.
2. Apply filters one-by-one and in combination:
   - Risk, Provider, Date, From/To, Device, User type, Country, Status
3. Use search input with known email/username/booking id fragments.
4. Click **Clear All Filters**.
5. Expected:
   - Visible rows match selected criteria.
   - Risk filter badge reflects selected risk scope.
   - Clear resets controls and returns full visible list.

#### 5) Test export features (CSV + Excel)

1. With filtered results visible, click **Export CSV**.
2. Click **Export Excel**.
3. Open downloaded files and verify columns include status/risk/attempt windows/lock state and metadata.
4. Expected:
   - Files download successfully.
   - Export respects current filtered visible rows.
   - If no rows are visible, UI shows a "no logs to export" error message.

#### 6) Test per-user security response actions

From any activity row linked to a known user (`uid` present), run each action:

1. **Temp Block**
   - Enter block duration (e.g., 15 minutes) and confirm.
   - Expected:
     - Success message appears.
     - `users/{uid}.securityRestrictions.blockedUntilMs` updated.
     - `adminSecurityActions` logs action.
2. **Force Logout**
   - Confirm action.
   - Expected:
     - Success message appears.
     - Claims/refresh tokens are revoked by backend.
     - Action logged in `adminSecurityActions`.
3. **Force Password Reset**
   - Confirm action.
   - Expected:
     - `passwordResetRequired` flags set in user restrictions/claims.
     - Action logged.
4. **Clear Restrictions**
   - Confirm action.
   - Expected:
     - Restriction flags/claims reset to neutral values.
     - `clearedAt/clearedBy` recorded.

#### 7) Validate session tracking table

1. Keep one user signed in from multiple devices/tabs if possible.
2. In Security tab, use **Sort Sessions** modes:
   - Online First
   - Last Active (Newest)
   - Longest Session
   - Multi-Device First
3. Expected:
   - Session rows update in realtime.
   - Online and multi-device counters reflect active test state.

#### 8) Validate security alerts feed

1. Trigger scenarios that create alerts (repeated failures/new device/unusual country or account security changes).
2. Check `securityAlerts` collection and Security Alerts table.
3. Test **Sort Alerts** modes: Newest, Oldest, High Severity First, Open First.
4. Expected:
   - Alerts appear with correct severity/status metadata.
   - Open/high counters update.

#### 9) Validate account changes and timeline feeds

1. Perform account events (e.g., password/email change from user side).
2. Confirm `accountChangeHistory` receives entries.
3. Confirm timeline actions appear in `activityTimeline`.
4. Test sort controls:
   - Account Changes: Newest, Oldest, Critical First, Change Type
   - Timeline: Newest, Oldest, Bookings First, Reviews First, Contact First
5. Expected:
   - Both tables refresh in realtime and counts update correctly.

#### 10) Permission/security regression check

1. Sign out admin or use non-admin account.
2. Attempt to access Security data.
3. Expected:
   - Firestore rules prevent unauthorized reads for admin-only security collections.
   - No client can directly create/update/delete `loginActivities`, `securityAlerts`, `accountChangeHistory`, or `activityTimeline`.
   - Only callable backend paths write these security records.

### K) Services tab category-visibility testing (new feature)

Use this to verify the new **Admin → Services** controls and public-site sync.

1. Sign in as allowed admin and open **Services** tab in `admin.html`.
2. Confirm category cards render in two grouped lists:
   - Active Services
   - Inactive Services
3. Toggle at least two categories OFF (e.g., `barber-services`, `nail-services`) and click **Save Category Settings**.
4. Expected in Firestore:
   - `siteSettings/serviceCategories` document updates with boolean flags per category.
   - `updatedAt` and `updatedBy` fields are written.
5. Open public `index.html` and verify disabled categories are removed from:
   - Services tabs/cards
   - Booking form service dropdown
   - Gallery items/filter outputs (disabled category items not shown)
6. Re-enable those categories and save again.
7. Expected:
   - Public UI returns those categories without page-break regressions.
   - Admin success message confirms live application.

### L) Client dashboard login-history testing (new feature)

Use this to validate the user-facing **Security & Privacy** block in dashboard.

1. Log in with a normal client account and open **My Dashboard**.
2. Confirm **Security & Privacy** card renders with login-history count badge.
3. Trigger additional sign-in events (e.g., sign out/in, different browser/device if possible).
4. Expected in Firestore:
   - New entries appear in `loginActivities` for that user identity.
5. Expected in dashboard:
   - Login history list updates with date/time, status, method, device/browser, and location label.
   - Count badge increments in realtime.
6. Permission check:
   - Use a different non-admin account and confirm it cannot read another user’s entries.
   - Admin account can still review activity from Security tab.

### M) Admin role/permission delegation testing (new feature)

Use this to validate the **Admins** section and scoped access controls end-to-end.

1. Prepare at least two admin identities:
   - One `super_admin`
   - One standard `admin`
2. Sign in as super admin and open **Admins** tab.
3. Create or update a managed admin record with explicit permissions.
4. Verify Firestore changes:
   - `adminUsers/{uid}` reflects role, active status, permissions, and updated metadata
   - New entry appears in `adminAuditLogs` for create/update actions
5. Sign in as the standard admin and confirm scoped UI behavior:
   - Tabs requiring missing permissions are hidden/blocked
   - Permitted sections remain accessible and functional
6. Disable the managed admin (`active: false`) and test login again.
7. Expected:
   - Inactive admin is denied panel access
   - Error state reflects permission/inactive gating
8. Regression check:
   - Attempt direct client write to `adminUsers` from browser console/client SDK
   - Expected: write is rejected by Firestore rules

### N) Very-small-screen chip/badge visual regression

Use this after stylesheet changes or before production deploys to confirm compact labels behave well on narrow devices.

1. In browser DevTools, test public `index.html` at 490px, 390px, and 360px widths.
2. Verify **Services** tabs remain compact, readable, and tappable.
3. Verify **Gallery** service/category chips, length/size/style chips, and featured pills stay single-line with no layout clipping.
4. Trigger the booking waitlist panel and verify the **Waitlist** badge remains compact beside the copy.
5. Sign in and verify dashboard count badges and waitlist queue chips do not overflow card headings or booking rows.
6. Open `admin.html` at <=490px and verify admin status/role badges and security filter notes stay readable without horizontal page overflow.
7. Toggle light mode and repeat key chip/badge checks for contrast.
8. Expected: chips and badges stay compact, high-contrast, and either fit naturally or truncate gracefully with ellipsis instead of wrapping awkwardly.

---

## 15. Important Notes

1. Frontend Firebase config in web clients is expected; rules + auth enforce security.
2. Anonymous auth is required for guest booking/contact entry points.
3. Cloudinary uploads are unsigned; keep upload presets tightly restricted.
4. Booking/notification automation currently covers email and WhatsApp.
5. Contact HTML may include legacy attributes, but active pipeline is JS + Firestore.

---

## 16. Troubleshooting

### "Anonymous sign-in is disabled"

- Enable Anonymous provider in Firebase Authentication.

### Permission denied errors

- Validate auth state and payload schema against deployed `firestore.rules`.

### Realtime listeners not updating

- Check browser console for query/listener errors.
- Verify `window.APP_CONFIG` values.

### Notifications not sent

- Confirm functions are deployed.
- Confirm all required secrets are set.
- Check Cloud Functions logs for failed status writes.

---

**Status:** This README reflects current implementation in `public/`, `functions/`, `firebase.json`, and `firestore.rules`.
