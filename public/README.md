# Royal Braids (Salon Shop)

Production-ready **Supabase + Render + Vercel** salon platform for **Royal Braids**.

## Current production stack

- **Vercel** serves the static public website and admin console from `public/`.
- **Supabase** owns Auth, Postgres data, Row Level Security, migrations, and approved realtime/browser reads.
- **Render** runs the trusted backend API, service-role workflows, booking/waitlist transactions, notification outbox jobs, Cloudinary signing, admin-only operations, and protected scheduled-job endpoints.
- **Cloudinary** stores uploaded media.
- **Resend** and **WhatsApp Cloud API** are used by Render when real notification sending is enabled.
- **External scheduler** calls protected Render job endpoints.

The previous Firebase production implementation is archived at:

```txt
legacy/firebase-production-archive/
```

It is historical reference only and is not part of active deployment or validation.

## Project summary

This project provides:

1. Public salon website with branded splash screen, services, gallery, booking, reviews, blog, contact, auth, and client dashboard.
2. Online booking with slot-locking, waitlist support, reschedule/cancel flows, and customer self-service.
3. Admin console for bookings, schedule, waitlist, gallery, blogs, reviews, contact messages, service visibility, security monitoring, and admin delegation.
4. Supabase Auth and database-backed admin permissions.
5. Render API workflows for privileged operations that should not run in the browser.
6. Production deployment through Supabase + Render + Vercel.

## Project structure

```txt
.
├── backend/                         # Render backend API, services, jobs, tests
├── docs/                            # Current deployment, migration, sign-off, and mapping docs
├── legacy/firebase-production-archive/ # Old Firebase production code/config/rules/functions
├── public/                          # Vercel static public/admin frontend
├── scripts/                         # Active local utilities
├── supabase/                        # Supabase migrations, policies, seed, storage notes
├── tests/                           # Active root unit and Playwright tests
├── package.json                     # Root validation/static frontend tooling
└── render.yaml                      # Render backend Blueprint
```

## Runtime architecture

### Public website

Main files:

```txt
public/index.html
public/client-config.js
public/JS/script.js
public/JS/supabase-browser-adapter.js
public/JS/render-api-adapter.js
```

The public website loads browser-safe config, uses Supabase Auth for sessions, uses Supabase/RLS-approved reads where safe, and calls Render endpoints for privileged booking, waitlist, contact, review, profile, upload, and security flows.

### Admin console

Main files:

```txt
public/admin.html
public/JS/admin.js
public/JS/supabase-browser-adapter.js
public/JS/render-api-adapter.js
```

The admin console signs admins in through Supabase Auth, authorizes access with `public.admin_users`, and calls Render admin endpoints for privileged operations.

### Backend API on Render

Main files:

```txt
backend/src/server.js
backend/src/app.js
backend/src/modules/
backend/src/jobs/
backend/src/integrations/
```

Render owns token verification, service-role database workflows, admin authorization, booking/waitlist transaction orchestration, notification jobs, provider integrations, Cloudinary signing, and protected scheduled job endpoints.

### Supabase

Main files:

```txt
supabase/migrations/
supabase/seed/
supabase/policies/
supabase/storage/
```

Supabase owns Auth users/sessions, Postgres tables, RLS policies, constraints, migrations, and optional future Storage buckets.

## Key features

- Branded splash screen and responsive public site.
- Services catalog with category visibility controls.
- Gallery filters, featured rails, before/after images, and favorites.
- Slot-safe online booking with waitlist fallback.
- Client authentication and dashboard.
- Reviews, blog, and contact flows.
- Admin bookings, waitlist, schedule, content, messages, services, admins, and security dashboards.
- Notification outbox for email and WhatsApp delivery.
- External scheduled jobs for reminders, outbox flushing, expired slot release, and waitlist slot-open notifications.

## Active data model

The current production schema is Supabase Postgres. Important tables include `profiles`, `admin_users`, `bookings`, `booking_slots`, `waitlist_entries`, `reviews`, `contact_messages`, `gallery_items`, `blog_posts`, `notification_outbox`, `security_alerts`, `activity_timeline`, and related audit/content tables.

Legacy Firestore collection mapping is documented in `docs/firebase-to-supabase-mapping.md`.

## Security model

- Browser code only uses public Supabase URL/anon key and public Render API URL.
- Supabase service-role key is stored only on Render.
- RLS protects browser-facing data access.
- Render middleware verifies Supabase access tokens.
- Admin permissions are centralized through `admin_users` and backend middleware.
- Provider secrets stay in Render environment variables.
- The archived `legacy/firebase-production-archive/firestore.rules` file is not production authorization.

## Local setup

Install dependencies:

```bash
npm ci
npm ci --prefix backend
```

Run active validation:

```bash
npm run check:js
npm run test:unit
npm run test:backend
npm run test:phase9
```

Run browser E2E when Chromium is installed:

```bash
npx playwright install chromium
npm run test:e2e
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

## Deployment

See `docs/deployment.md` and `docs/cli-deployment-commands.md`.

High-level order:

1. Apply Supabase migrations.
2. Configure Supabase Auth redirects and bootstrap first admin.
3. Configure Render env vars and deploy backend.
4. Configure external scheduled jobs with `X-Job-Secret`.
5. Configure `public/client-config.js` with production Supabase/Render public values.
6. Deploy frontend to Vercel.
7. Run smoke checks and sign off with `docs/production-signoff.md`.

## Testing and QA

```bash
npm test
```

`npm test` runs JavaScript syntax checks, root unit/architecture tests, backend tests, and Playwright E2E tests.

Historical Firebase emulator/rules/functions tests are archived and not part of active validation.

## Important notes

- Do not add Firebase runtime dependencies back into active code.
- Do not deploy from `legacy/firebase-production-archive/`.
- Do not expose server-only secrets in `public/client-config.js` or Vercel public variables.
- Keep notifications in dry-run until Resend/WhatsApp provider checks are intentionally approved for real sending.
- Production data migration from Firebase was signed off as Path B: launch as a new Supabase dataset unless that decision changes later.