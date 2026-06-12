# Royal Braids / Salon Shop Public Frontend Documentation

Deep project documentation for the static frontend and browser-facing documentation bundle in `public/`.

This project is a production-oriented salon platform for **Royal Braids**. It combines a public marketing and booking website, a private admin console, a Supabase Auth/Postgres data layer, and a Render-hosted trusted backend. The frontend in this folder is intentionally static and framework-free so it can be served by Vercel or any static host while still delegating privileged business logic to the backend.

> Current active architecture: **Vercel static frontend + Supabase Auth/Postgres/RLS + Render Node/Express API + Cloudinary media + Resend/WhatsApp notifications**.

The archived Firebase production implementation lives in `legacy/firebase-production-archive/`. It exists for historical reference only. Do not deploy it, do not copy its rules into production, and do not reintroduce Firebase runtime dependencies into the active app unless the architecture is intentionally redesigned.

---

## 1. Audience and purpose

This README is written for:

- Developers maintaining the public website and admin console.
- Operators preparing deployment or smoke testing.
- Salon owners or project stakeholders trying to understand what the platform does.
- Future contributors migrating more workflows from static/browser code into trusted backend modules.

The goal is to explain not just which files exist, but **why they exist**, **which layer owns which responsibility**, and **how customer, admin, booking, content, security, and notification workflows move through the system**.

---

## 2. Product overview

Royal Braids is more than a brochure site. It is a digital salon operating system with these major capabilities:

1. **Public discovery** - customers can view branding, services, pricing, durations, stylists, gallery styles, blog content, reviews, location details, and contact options.
2. **Online booking** - authenticated customers can request appointments, select date/time/stylist preferences, and receive slot-safe booking or waitlist outcomes.
3. **Waitlist support** - when a preferred slot is unavailable, the platform can preserve demand through queue-aware waitlist records.
4. **Client dashboard** - clients can sign in, view appointments, manage profile preferences, save favorites, inspect login/security history, cancel/reschedule where allowed, and submit reviews.
5. **Admin operations** - staff can manage bookings, waitlist entries, schedule views, gallery content, blog posts, reviews, messages, service catalog visibility, admin users, and security actions.
6. **Automation** - backend jobs release expired slots, send upcoming booking reminders, sync waitlist slot-open notifications, and flush notification outbox entries.
7. **Security and auditability** - Supabase Auth handles identity, Supabase RLS protects browser-facing reads, Render verifies access tokens, admin permissions are stored in Postgres, and privileged actions are logged.

---

## 3. Active production stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Static hosting | Vercel | Serves `public/index.html`, `public/admin.html`, CSS, JS, images, service worker, and static docs. |
| Browser app | HTML, CSS, vanilla JavaScript | Renders the public site/admin console, reads browser-safe config, handles UI state, and calls Supabase/Render adapters. |
| Auth and database | Supabase Auth + Postgres + RLS | Owns users, sessions, tables, constraints, migrations, policies, and safe browser-readable data. |
| Trusted backend | Render Node.js/Express API | Verifies tokens, uses Supabase service-role workflows, performs privileged mutations, protects admin operations, signs Cloudinary uploads, and runs job endpoints. |
| Media | Cloudinary | Stores gallery/blog/service media and receives signed upload requests from Render. |
| Email | Resend | Sends email notifications when provider sending is enabled. |
| Messaging | WhatsApp Cloud API | Sends WhatsApp notifications when provider sending is enabled. |
| Scheduled automation | External scheduler | Calls protected Render job endpoints with `X-Job-Secret`. |

Important security boundary: **the browser never receives the Supabase service-role key, Resend key, WhatsApp token, Cloudinary API secret, or job secret**. Those belong in Render environment variables only.

---

## 4. Repository map

```txt
.
├── backend/                         # Render backend API, domain modules, jobs, tests
├── docs/                            # Deployment, migration, sign-off, scheduled-job, and mapping docs
├── legacy/firebase-production-archive/ # Old Firebase production code/config/rules/functions
├── public/                          # Static website, admin console, docs, browser adapters, assets
├── scripts/                         # Local maintenance/test utilities
├── supabase/                        # Supabase migrations, policies, seed data, storage notes
├── tests/                           # Root unit and Playwright E2E tests
├── package.json                     # Root validation/static frontend tooling
└── render.yaml                      # Render Blueprint for backend deployment
```

The `public/` folder is the static application bundle. It is not a server and should not contain private credentials, backend-only logic, or service-role workflows.

---

## 5. Public folder structure

```txt
public/
├── index.html                         # Public customer website shell
├── admin.html                         # Private admin console shell
├── client-config.js                   # Browser-safe branding/config/catalog defaults
├── sw.js                              # Service worker for static asset caching behavior
├── 404.html                           # Static-host fallback page
├── README.md                          # This public-folder project guide
├── ADMIN_CONSOLE_USER_MANUAL.md       # Admin operator manual
├── BOOKING_WAITLIST_SCHEDULE_LOGIC.md # Booking/waitlist/schedule lifecycle guide
├── AD_VIDEO_SCRIPT.md                 # Recording/marketing script guide
├── FEATURES.txt                       # Feature inventory and ownership notes
├── CSS/
│   └── style.css                      # Theme, responsive layout, public/admin styling
├── IMG/                               # Local brand/gallery/blog image assets
└── JS/
    ├── script.js                      # Main public website behavior
    ├── admin.js                       # Admin console behavior
    ├── supabase-browser-adapter.js    # Browser Supabase/Auth/AppServices compatibility layer
    ├── render-api-adapter.js          # Browser-to-Render API helper and callable facade
    ├── apply-client-config.js         # Applies branding/config values into the DOM
    ├── splash.js                      # Splash screen loading/reveal behavior
    ├── register-sw.js                 # Service-worker registration
    └── theme-preset-preview.js        # Theme preset preview/helper behavior
```

### `index.html`

The customer-facing page. It includes the visual sections, modals, booking form containers, dashboard containers, navigation anchors, script references, and static fallback markup. JavaScript fills in dynamic content from configuration, Supabase-approved reads, and Render responses.

### `admin.html`

The private staff/admin console. It loads the same browser-safe config and shared adapters, then uses `public/JS/admin.js` to authenticate the admin, verify permissions, show allowed tabs, and call protected Render admin endpoints.

### `client-config.js`

The white-label configuration entry point. It contains values safe for browser exposure:

- Business name, slug, city, country, timezone, locale, and currency.
- Public phone/email/social/contact display values.
- Public Supabase URL and anon/publishable key.
- Public Render API base URL.
- Public Cloudinary folder names.
- Theme presets and optional theme overrides.
- Default service categories, stylists, service catalog entries, sub-services, gallery/blog/review fallback content, and related display copy.

Never place private provider tokens, service-role keys, database passwords, job secrets, or `.env` contents in this file.

### `JS/script.js`

Owns public site behavior: navigation, services rendering, gallery interactions, auth modal wiring, booking UI, dashboard panels, review/contact flows, favorites, theme switching, and calls into shared `AppServices` abstractions.

### `JS/admin.js`

Owns admin console behavior: login state, permission-scoped tabs, booking/waitlist/schedule rendering, content CRUD forms, review/message moderation, service management, admin user management, security dashboards, and operational action handlers.

### `JS/supabase-browser-adapter.js`

Creates the browser-facing Supabase/AppServices bridge. It should use only the public Supabase URL and anon key. It may read data allowed by RLS and manage Auth session state, but it must not perform service-role operations.

### `JS/render-api-adapter.js`

Creates `window.RenderApi`, a small wrapper around `fetch()` that:

- Resolves the configured Render API base URL.
- Adds the Supabase access token as `Authorization: Bearer <token>` when required.
- Sends JSON or form payloads to Render endpoints.
- Normalizes `data` payloads.
- Converts failed responses into useful JavaScript errors.
- Emits browser events for security restriction responses such as temporary block, forced logout, or password reset requirement.
- Provides callable-style helpers for legacy-compatible frontend flows.

---

## 6. Runtime architecture

### High-level request path

```txt
Customer/Admin browser
    |
    | 1. Loads static assets from Vercel
    v
public/index.html or public/admin.html
    |
    | 2. Reads browser-safe config from client-config.js
    v
Supabase browser adapter  <---->  Supabase Auth / RLS-approved reads
    |
    | 3. Access token attached when privileged backend help is needed
    v
Render API adapter  ------->  Render Node/Express backend
                                |
                                | 4. Server verifies JWT, uses service-role Supabase client,
                                |    writes audit/notification/activity rows, signs uploads,
                                |    and enforces admin permissions.
                                v
                             Supabase Postgres, Cloudinary, Resend, WhatsApp
```

### Browser responsibilities

The browser may:

- Render public and admin UI.
- Store harmless UI preferences such as theme mode.
- Use Supabase Auth session state.
- Read public or user-owned records allowed by RLS.
- Call Render endpoints with a user access token.
- Show validation messages and user-friendly error states.

The browser must not:

- Hold service-role credentials.
- Decide final admin authorization by itself.
- Perform direct privileged writes that bypass Render workflows.
- Trust locally edited status values for booking/waitlist lifecycle decisions.
- Expose provider secrets or scheduler secrets.

### Render backend responsibilities

Render owns workflows that must be trusted, transactional, audited, or secret-bearing:

- Token verification and request authentication.
- Admin authorization against `public.admin_users`.
- Booking creation, cancellation, rescheduling, and slot release.
- Waitlist queue updates and move-to-confirmed actions.
- Notification outbox creation and flushing.
- Cloudinary signed upload payload creation.
- Admin CRUD for services, gallery, blogs, reviews, messages, settings, admins, and security actions.
- Scheduled job endpoints protected by `X-Job-Secret`.

---

## 7. Backend module map relevant to the frontend

The static frontend talks to a modular Express backend under `backend/src/modules/`.

| Backend module | Frontend area that uses it | Main responsibility |
| --- | --- | --- |
| `auth/` | Public account, admin session checks | Authenticated user profile/session helpers such as `/api/v1/auth/me`. |
| `profiles/` | Client dashboard/profile | Profile sync, profile reads, profile updates. |
| `bookings/` | Booking form, dashboard appointments, admin bookings/waitlist/schedule | Slots, bookings, cancellation, reschedule, waitlist queue, admin lifecycle actions. |
| `content/` | Services, gallery, blogs, reviews, contact, admin content tabs | Public content reads and admin content CRUD. |
| `admins/` | Admin login and Admins tab | Current admin lookup, permission checks, admin user management. |
| `security/` | Login history, security dashboard, restrictions | Login activity, account security changes, alerts, restrictions, security dashboard. |
| `notifications/` | Admin notification controls/jobs | Notification outbox flushing and reminder triggers. |
| `jobs/` | External scheduler | Protected scheduled job runner by job name. |
| `activityTimeline/` | Admin activity views | Admin-facing activity timeline list. |

---

## 8. Important API groups

The frontend should treat endpoint paths as backend contracts. Update docs and tests when these contracts change.

### Public/customer endpoints

```txt
GET  /health
GET  /api/v1/site-settings/public
GET  /api/v1/services
GET  /api/v1/gallery
GET  /api/v1/blog-posts
GET  /api/v1/blog-posts/:slug
GET  /api/v1/reviews
POST /api/v1/reviews
POST /api/v1/contact-messages
GET  /api/v1/booking-slots
POST /api/v1/bookings
GET  /api/v1/bookings/me
POST /api/v1/bookings/:bookingId/cancel
POST /api/v1/bookings/:bookingId/reschedule
GET  /api/v1/bookings/:bookingId/waitlist-queue
GET  /api/v1/waitlist/:waitlistId/queue
POST /api/v1/profiles/sync
GET  /api/v1/profiles/me
PATCH /api/v1/profiles/me
POST /api/v1/security/login-activity
POST /api/v1/account/security-change
```

### Admin endpoints

```txt
GET    /api/v1/admin/users/me
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PATCH  /api/v1/admin/users/:adminUserId

GET    /api/v1/admin/bookings
POST   /api/v1/admin/bookings/:bookingId/status
POST   /api/v1/admin/bookings/:bookingId/release-slot
GET    /api/v1/admin/waitlist
POST   /api/v1/admin/waitlist/:waitlistId/status
POST   /api/v1/admin/waitlist/:waitlistId/move-to-confirmed

GET    /api/v1/admin/site-settings
PUT    /api/v1/admin/site-settings
GET    /api/v1/admin/service-categories
POST   /api/v1/admin/service-categories
PATCH  /api/v1/admin/service-categories/:id
DELETE /api/v1/admin/service-categories/:id
GET    /api/v1/admin/services
POST   /api/v1/admin/services
PATCH  /api/v1/admin/services/:id
DELETE /api/v1/admin/services/:id
GET    /api/v1/admin/service-variants
POST   /api/v1/admin/service-variants
PATCH  /api/v1/admin/service-variants/:id
DELETE /api/v1/admin/service-variants/:id
GET    /api/v1/admin/stylists
POST   /api/v1/admin/stylists
PATCH  /api/v1/admin/stylists/:id
DELETE /api/v1/admin/stylists/:id

GET    /api/v1/admin/gallery
POST   /api/v1/admin/gallery
PATCH  /api/v1/admin/gallery/:itemId
DELETE /api/v1/admin/gallery/:itemId
GET    /api/v1/admin/blog-posts
POST   /api/v1/admin/blog-posts
PATCH  /api/v1/admin/blog-posts/:postId
DELETE /api/v1/admin/blog-posts/:postId
GET    /api/v1/admin/reviews
POST   /api/v1/admin/reviews/:reviewId/moderate
PATCH  /api/v1/admin/reviews/:reviewId
DELETE /api/v1/admin/reviews/:reviewId
GET    /api/v1/admin/contact-messages
POST   /api/v1/admin/contact-messages/:messageId/status
DELETE /api/v1/admin/contact-messages/:messageId

GET    /api/v1/admin/security/login-activities
GET    /api/v1/admin/security/alerts
PATCH  /api/v1/admin/security/alerts/:alertId
GET    /api/v1/admin/security/account-change-history
GET    /api/v1/admin/security/actions
POST   /api/v1/admin/security/users/:userId/restrict
GET    /api/v1/admin/security/dashboard
GET    /api/v1/admin/activity-timeline
POST   /api/v1/uploads/cloudinary/sign
```

### Scheduled job endpoint pattern

```txt
POST /api/v1/jobs/:jobName/run
Header: X-Job-Secret: <JOB_SECRET>
```

Known job names include:

- `releaseExpiredBookingSlots`
- `sendUpcomingBookingReminders`
- `syncWaitlistSlotOpenNotifications`
- `flushNotificationOutbox`

---

## 9. Core data model overview

The active production schema is Supabase Postgres. The exact definitions live in `supabase/migrations/`; this section explains the purpose of important tables from the frontend perspective.

| Table | Purpose |
| --- | --- |
| `profiles` | Customer profile metadata linked to Supabase Auth users. |
| `admin_users` | Admin authorization, roles, active state, and permission flags. |
| `bookings` | Appointment lifecycle records, customer/service/stylist/date/time/status data. |
| `booking_slots` | Slot-lock records used to prevent double booking and support release/expiry workflows. |
| `waitlist_entries` | Queue-aware records for customers waiting on unavailable slots. |
| `service_categories` | Admin-managed service category definitions and visibility controls. |
| `services` | Bookable/displayable services, descriptions, pricing, duration, sort order, and visibility. |
| `service_variants` | Sub-services or variants attached to a parent service. |
| `stylists` | Staff/stylist options used by booking and display flows. |
| `gallery_items` | Public gallery/style cards, Cloudinary media metadata, tags, feature flags. |
| `blog_posts` | Public article cards/pages with publish metadata. |
| `reviews` | Customer testimonials/reviews with moderation state. |
| `contact_messages` | Public contact form submissions and admin follow-up status. |
| `notification_outbox` | Durable queue of notification intents for email/WhatsApp sending. |
| `security_alerts` | Security issues requiring admin visibility or action. |
| `login_activities` | Login/session activity records for dashboard/security views. |
| `account_change_history` | Account-related security change records. |
| `admin_audit_logs` | Audit trail for privileged admin changes. |
| `activity_timeline` | Operational timeline records used by admin dashboards. |

Legacy Firestore-to-Supabase mapping is documented in `docs/firebase-to-supabase-mapping.md`.

---

## 10. Main customer flows

### 10.1 Public discovery flow

1. Visitor opens the Vercel-hosted site.
2. `client-config.js` provides brand, contact, service, stylist, and fallback content.
3. `apply-client-config.js` applies configured business values to the DOM.
4. `script.js` renders service cards, gallery filters, blog/review/contact sections, and interactive navigation.
5. Where configured and available, the page fetches public content from Render/Supabase-backed endpoints.
6. If the backend is unavailable, safe fallback content from the static config can keep the page useful.

### 10.2 Account/authentication flow

1. Customer opens the auth modal or a protected dashboard/booking action.
2. Browser uses Supabase Auth through the Supabase browser adapter.
3. Supabase returns a session/access token for authenticated users.
4. The frontend stores only normal browser session state managed by Supabase libraries.
5. Render calls include `Authorization: Bearer <access token>` when a protected workflow is needed.

### 10.3 Booking flow

1. Customer selects service, variant if applicable, date, time, stylist, and notes/images if supported.
2. Browser validates required fields for immediate feedback.
3. Browser sends a booking request to Render.
4. Render verifies the access token, validates input, checks service/stylist/slot availability, and attempts transactional slot reservation.
5. If the slot is available, Render writes `booking_slots`, `bookings`, activity, and notification outbox records.
6. If the slot is unavailable and waitlist is supported, Render creates or returns waitlist information.
7. Browser shows a clear confirmed, pending, waitlisted, or failed state.

### 10.4 Client dashboard flow

1. Signed-in customer opens dashboard.
2. Browser loads profile, appointments, favorites, reviews, preferences, login history, and security data through allowed Supabase reads or Render endpoints.
3. Customer profile changes go through profile endpoints.
4. Appointment cancel/reschedule actions go through Render so slot and waitlist side effects remain consistent.

### 10.5 Public contact/review flow

1. Customer submits contact form or review form.
2. Browser validates required fields and authentication requirements.
3. Render records the message/review in Supabase.
4. Reviews remain hidden until approved if moderation is required.
5. Contact/review notification intents may be written to `notification_outbox`.

---

## 11. Main admin flows

### 11.1 Admin login

1. Admin signs in with Supabase Auth.
2. Admin page calls Render/admin lookup or reads allowed admin profile data.
3. Backend confirms an active row exists in `admin_users`.
4. Role and permission flags determine which tabs are shown.
5. Backend authorization still validates each protected mutation.

### 11.2 Booking operations

Admins can filter and inspect bookings, then perform status/lifecycle actions such as confirm, complete, cancel, mark no-show, release slot, or move a waitlisted booking to confirmed. These operations are routed through Render because one visible action may update several tables: `bookings`, `booking_slots`, `waitlist_entries`, notification outbox, timeline, and audit logs.

### 11.3 Content operations

Admins with content permissions can manage site settings, services, variants, stylists, gallery items, blog posts, reviews, and contact messages. Public visibility should be controlled by publish/active/approved flags rather than deleting content prematurely.

### 11.4 Security operations

Admins with security permissions can monitor login activity, alerts, account changes, admin actions, and user restrictions. Security restriction responses may be surfaced to the browser adapter and can trigger sign-out guidance or forced-session handling.

---

## 12. Admin permission model

Admin access is centralized in `public.admin_users`.

| Role/permission | Meaning |
| --- | --- |
| `super_admin` | Full access to all tabs and privileged workflows. Keep at least one recovery super admin. |
| `admin` | Staff/admin role whose capabilities depend on permission flags. |
| `canManageBookings` | Bookings, waitlist, schedule, booking lifecycle actions. |
| `canManageContent` | Gallery, blog, reviews, messages, services, site content. |
| `canManageSecurity` | Security dashboards, alerts, restrictions, account-security action views. |
| `canManageAdmins` | Admin user creation/updates/delegation where backend policy allows. |

Frontend tab hiding is a usability feature only. Render backend middleware and services are the source of truth.

---

## 13. Configuration and white-labeling

For a new salon/client, start with `public/client-config.js`.

Common safe edits:

- `businessName`, `businessSlug`, logo text, city, country, timezone, locale, currency.
- Public phone numbers, emails, WhatsApp link, address, and hours.
- Brand logo image paths and theme preset.
- Service categories, service list, service variants/sub-services, stylists, and display labels.
- Fallback gallery, review, and blog content.
- Public Supabase URL/anon key and public Render API URL for the target environment.

Do not edit random strings in `index.html` or `admin.html` when a config value already exists. Keeping tenant/business details in `client-config.js` makes future client onboarding easier.

---

## 14. Local setup

Install root and backend dependencies:

```bash
npm ci
npm ci --prefix backend
```

Run JavaScript/static validation:

```bash
npm run check:js
```

Run root unit tests:

```bash
npm run test:unit
```

Run backend tests:

```bash
npm run test:backend
```

Run phase validation that excludes browser E2E:

```bash
npm run test:phase9
```

Run full validation including E2E when Playwright browsers are installed:

```bash
npx playwright install chromium
npm test
```

Run backend locally:

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

Expected local health endpoint:

```txt
GET http://localhost:4000/health
```

For static frontend testing, use the repository's static test server script where appropriate:

```bash
npm run serve:test
```

---

## 15. Deployment overview

Detailed deployment instructions live in:

- `docs/deployment.md`
- `docs/cli-deployment-commands.md`
- `docs/production-signoff.md`
- `docs/scheduled-jobs.md`

High-level deployment sequence:

1. Apply Supabase migrations from `supabase/migrations/`.
2. Confirm RLS policies, seed/bootstrap data, and first admin access.
3. Configure Supabase Auth redirect URLs for local and production frontend origins.
4. Configure Render environment variables for Supabase service-role access and provider secrets.
5. Deploy the Render backend using `render.yaml` or Render dashboard settings.
6. Verify `GET /health` on the Render service.
7. Configure external scheduler calls to `POST /api/v1/jobs/:jobName/run` with `X-Job-Secret`.
8. Configure `public/client-config.js` for production public Supabase and Render values.
9. Deploy `public/` to Vercel.
10. Run smoke checks: public page, auth, booking, admin login, content reads, Render health, and scheduled-job dry run where safe.

---

## 16. Security rules for maintainers

- Treat `public/` as fully visible to the internet.
- Do not commit private `.env` files or paste secrets into docs.
- Only public Supabase anon/publishable config belongs in browser code.
- The Supabase service-role key belongs on Render only.
- Provider credentials for Cloudinary, Resend, WhatsApp, and schedulers belong on Render only.
- Use RLS for browser-safe reads and Render for privileged writes.
- Keep admin permissions in `admin_users`; do not hard-code staff emails as the only authorization control.
- Use audit logs for privileged actions.
- Prefer soft status changes over destructive deletion for operational records.
- Keep notifications in dry-run until provider configuration and consent requirements are validated.

---

## 17. Testing and QA expectations

Before shipping frontend or docs-affecting behavior changes:

```bash
npm run check:js
npm run test:unit
npm run test:backend
```

Before production release:

```bash
npm test
```

Manual QA checklist:

- Public homepage loads without console errors.
- Mobile navigation opens/closes correctly.
- Theme toggle/preset behavior works.
- Services render from config or backend data.
- Gallery filters and lightbox behavior work.
- Auth modal opens and reports errors clearly.
- Booking form validates required fields.
- Render API URL is configured and reachable.
- Signed-in customer can view dashboard data.
- Admin login rejects non-admin users.
- Admin tabs match permission flags.
- Booking status actions update visible records.
- Content moderation affects public visibility.
- Security restriction errors are displayed and handled.

---

## 18. Troubleshooting guide

### Public site loads but dynamic data is missing

Check:

1. Browser console for script errors.
2. `public/client-config.js` has the correct Render API base URL.
3. Render `/health` is reachable.
4. Supabase URL/anon key are valid for the intended project.
5. RLS policies allow the intended public read.
6. Backend CORS allows the frontend origin.

### Login works but admin console is blocked

Check:

1. Supabase Auth user exists in the same project configured by the frontend.
2. `admin_users` contains an active row for the Auth user.
3. Role is `super_admin` or `admin`.
4. Required permission flag exists for the desired tab.
5. Render admin middleware can verify the Supabase JWT.

### Booking fails

Check:

1. Customer is authenticated if endpoint requires auth.
2. Selected service/stylist/date/time values match backend expectations.
3. Slot is still available.
4. Render logs show validation or transaction errors.
5. Supabase service-role key is configured on Render.
6. Database constraints/migrations are present.

### Upload fails

Check:

1. Admin has content permission.
2. Render Cloudinary environment variables are configured.
3. File type and size are allowed by UI/backend rules.
4. Cloudinary account quota and folder settings are valid.

### Notifications do not send

Check:

1. `NOTIFICATION_DRY_RUN` state.
2. Resend/WhatsApp provider variables.
3. `notification_outbox` rows and statuses.
4. Scheduler requests include `X-Job-Secret`.
5. Render job logs for provider errors.

---

## 19. Documentation map

| File | Use it for |
| --- | --- |
| `public/README.md` | Public-folder architecture and project orientation. |
| `public/ADMIN_CONSOLE_USER_MANUAL.md` | Staff/admin operating procedures. |
| `public/BOOKING_WAITLIST_SCHEDULE_LOGIC.md` | Booking, waitlist, schedule lifecycle and technical rules. |
| `public/AD_VIDEO_SCRIPT.md` | Demo/marketing video planning and narration. |
| `public/FEATURES.txt` | Feature inventory and ownership catalog. |
| `docs/deployment.md` | Production deployment checklist. |
| `docs/cli-deployment-commands.md` | CLI command reference for deployment tasks. |
| `docs/firebase-to-supabase-mapping.md` | Historical mapping from Firebase collections/functions to Supabase/Render. |
| `docs/scheduled-jobs.md` | Scheduler and job endpoint setup. |
| `docs/production-signoff.md` | Production-readiness sign-off checklist. |

---

## 20. Maintenance principles

1. Keep `public/` static and secret-free.
2. Keep business identity/configuration in `client-config.js` where possible.
3. Keep privileged state transitions in Render modules, not ad hoc browser code.
4. Keep Supabase migrations as the source of database truth.
5. Keep RLS aligned with any new browser reads.
6. Keep admin permissions explicit and audited.
7. Keep docs updated when endpoint paths, status values, tables, or deployment steps change.
8. Keep the Firebase archive isolated as historical reference.
