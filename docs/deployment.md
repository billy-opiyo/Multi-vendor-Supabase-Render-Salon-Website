# Deployment Notes

This project targets the Phase 9 **Supabase + Render + Vercel** architecture:

- **Supabase** owns Postgres, Auth, RLS, migrations, optional storage, and realtime.
- **Render** runs the trusted backend API, service-role workflows, scheduled jobs, notification delivery, and Cloudinary signing.
- **Vercel** serves the public/admin frontend with only public configuration values.

Firebase files in the repository are reference-only until final archive/removal. They are not active deployment targets.

For the formal post-Phase 9 production go/no-go process, use [`docs/production-signoff.md`](./production-signoff.md).

## Local validation before deployment

Run the active checks from the repository root:

```bash
npm ci
npm ci --prefix backend
npm run test:phase9
```

Run browser E2E checks when Chromium is installed:

```bash
npx playwright install chromium
npm run test:e2e
```

`npm test` combines syntax checks, root unit/architecture tests, backend tests, and Playwright E2E tests.

## Supabase deployment

Apply migrations from `supabase/migrations/` to the target Supabase project before deploying or smoke-testing Render endpoints that read/write application tables:

```bash
supabase db push
```

If the Supabase CLI is unavailable, apply SQL files through the Supabase Dashboard SQL editor in timestamp order:

1. `supabase/migrations/20260606000100_phase_1_core_schema.sql`
2. `supabase/migrations/20260606000200_phase_1_rls_policies.sql`

Optional development seed data lives in `supabase/seed/phase_1_development_seed.sql`. Apply it only to non-production projects unless the seed rows have been reviewed for production suitability.

Supabase checklist:

- [ ] Migrations are applied successfully.
- [ ] RLS is enabled for all public application tables.
- [ ] Supabase Auth providers and redirect URLs include the Vercel domain/custom domain.
- [ ] At least one bootstrap `super_admin` row exists in `public.admin_users` for the initial admin account.
- [ ] Storage policy decisions are confirmed if Supabase Storage is introduced later. Current media signing is Cloudinary through Render.

## Backend on Render

The root `render.yaml` file defines the backend web service and cron jobs as a Render Blueprint.

### Web service

| Setting        | Value       |
| -------------- | ----------- |
| Service type   | Web service |
| Runtime        | Node        |
| Root directory | `backend`   |
| Build command  | `npm ci`    |
| Start command  | `npm start` |
| Health check   | `/health`   |

Render injects `PORT` automatically. Locally, the backend defaults to `4000` through `backend/src/config/env.js`.

### Cron services

`render.yaml` also defines these scheduled jobs:

| Render service name                      | Command                             | Schedule         |
| ---------------------------------------- | ----------------------------------- | ---------------- |
| `salon-flush-notification-outbox`        | `npm run job:notifications`         | Every 5 minutes  |
| `salon-upcoming-booking-reminders`       | `npm run job:reminders`             | Hourly           |
| `salon-release-expired-booking-slots`    | `npm run job:release-expired-slots` | Every 30 minutes |
| `salon-waitlist-slot-open-notifications` | `npm run job:waitlist-slot-open`    | Every 15 minutes |

### Required Render environment variables

| Variable                           | Required                       | Notes                                                                                                                                                    |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                         | Yes                            | Set to `production` on Render.                                                                                                                           |
| `SUPABASE_URL`                     | Yes                            | Supabase project URL, for example `https://your-project-ref.supabase.co`.                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`        | Yes                            | Server-only key. Never expose this in Vercel or browser JavaScript.                                                                                      |
| `SUPABASE_ANON_KEY`                | Optional                       | Public anon key if a server workflow needs anon-context behavior.                                                                                        |
| `FRONTEND_ORIGIN`                  | Yes for web service            | Comma-separated allowed browser origins, for example `https://your-site.vercel.app,https://yourdomain.com`.                                              |
| `NOTIFICATION_DRY_RUN`             | Recommended                    | Use `true` until provider credentials and templates are verified.                                                                                        |
| `RESEND_API_KEY`                   | Needed for real email sends    | Leave blank only when dry-running/skipping email sends.                                                                                                  |
| `RESEND_FROM_EMAIL`                | Needed for real email sends    | Verified sender/domain in Resend.                                                                                                                        |
| `WHATSAPP_ACCESS_TOKEN`            | Needed for real WhatsApp sends | WhatsApp Cloud API token.                                                                                                                                |
| `WHATSAPP_PHONE_NUMBER_ID`         | Needed for real WhatsApp sends | WhatsApp Cloud API phone number ID.                                                                                                                      |
| `WHATSAPP_GRAPH_API_VERSION`       | Yes                            | Defaults to `v21.0` in config/Blueprint.                                                                                                                 |
| `CLOUDINARY_CLOUD_NAME`            | Needed for signed uploads      | Server-side Cloudinary setting.                                                                                                                          |
| `CLOUDINARY_API_KEY`               | Needed for signed uploads      | Server-side Cloudinary setting.                                                                                                                          |
| `CLOUDINARY_API_SECRET`            | Needed for signed uploads      | Server-only secret.                                                                                                                                      |
| `CLOUDINARY_UPLOAD_FOLDER`         | Recommended                    | Default Cloudinary folder path, for example `royal-braids/gallery`. Cloudinary creates it on first upload. This is separate from any upload preset name. |
| `JOB_SECRET`                       | Optional                       | Reserved for protected job endpoints/scripts if enabled.                                                                                                 |
| `UPCOMING_REMINDER_WINDOW_MINUTES` | Yes                            | Defaults to `1440` in Blueprint.                                                                                                                         |
| `EXPIRED_SLOT_GRACE_MINUTES`       | Yes                            | Defaults to `60` in Blueprint.                                                                                                                           |

## Local backend development

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

The local backend should expose:

```text
GET http://localhost:4000/health
```

## Vercel frontend deployment

The current frontend is the static app under `public/`. Configure Vercel to serve that directory or preserve an equivalent static output directory if a build step is introduced later.

Browser code must use only public values:

| Public config       | Where it is consumed                                       | Notes                                    |
| ------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Supabase URL        | `public/client-config.js` → `APP_CONFIG.supabase.url`      | Public project URL.                      |
| Supabase anon key   | `public/client-config.js` → `APP_CONFIG.supabase.anonKey`  | Public anon key only.                    |
| Render API base URL | `public/client-config.js` → `APP_CONFIG.render.apiBaseUrl` | Public HTTPS URL for the Render backend. |

If a future build pipeline generates `public/client-config.js` from Vercel variables, use public variable names such as:

| Variable                                      | Notes                           |
| --------------------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` or equivalent      | Public Supabase URL.            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or equivalent | Public anon key only.           |
| `NEXT_PUBLIC_RENDER_API_URL` or equivalent    | Public Render backend base URL. |

Do **not** put `SUPABASE_SERVICE_ROLE_KEY`, provider secrets, webhook secrets, Resend keys, WhatsApp tokens, or Cloudinary signing secrets in Vercel public variables.

## Deployment smoke checks

After deployment:

1. Confirm `GET https://<render-service>/health` returns `ok: true` and `supabaseConfigured: true`.
2. Confirm CORS allows the deployed Vercel origin and rejects unexpected browser origins.
3. Confirm public frontend pages load without Firebase SDK script requests.
4. Confirm authenticated requests include a Supabase access token as `Authorization: Bearer <token>`.
5. Confirm admin-only endpoints require an active `admin_users` row with the required permission.
6. Confirm public booking/contact/review submissions use Render endpoints or Supabase/RLS-approved public flows.
7. Run provider checks with `NOTIFICATION_DRY_RUN=true` first, then enable real Resend/WhatsApp sends after verifying templates and recipients.
8. Confirm Render cron job logs show successful runs for notification outbox, reminders, expired slot release, and waitlist slot-open notifications.

Use the full sign-off checklist in [`docs/production-signoff.md`](./production-signoff.md) to capture launch evidence, migration decisions, notification mode, Firebase cleanup decisions, and final go/no-go approval.
