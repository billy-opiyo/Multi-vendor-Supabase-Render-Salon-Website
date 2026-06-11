# Client Automation Start Guide

Use this project as a reusable salon/business template for new clients on the current **Supabase + Render + Vercel** production architecture.

The old Firebase client setup is archived under `legacy/firebase-production-archive/` and is no longer the active setup path.

## Main file edited per client

```txt
public/client-config.js
```

This browser-safe file contains branding, contacts, theme presets, public Supabase config, the public Render API URL, service data, stylists, media folders, and feature flags.

> Do **not** put private keys or provider secrets in `public/client-config.js`.
> Server-side secrets belong on Render environment variables.

## Fastest new-client flow

Interactive mode:

```bash
node scripts/new-client.js
```

Or pass values directly:

```bash
node scripts/new-client.js --name "Glam House Spa" --slug glam-house-spa --phone "+254700000000" --email "info@glamhouse.co.ke"
```

The generator updates values in `public/client-config.js`, including:

```js
const businessName = "Glam House Spa"
const businessSlug = "glam-house-spa"
const phonePrimary = "+254700000000"
const phonePrimaryHref = "tel:+254700000000"
const whatsappUrl = "https://wa.me/254700000000"
const emailPrimary = "info@glamhouse.co.ke"
const emailBookings = "bookings@glamhouse.co.ke"
const contactNotificationEmail = "info@glamhouse.co.ke"
```

## Public platform config

At the top of `public/client-config.js`:

```js
const supabaseConfig = {
  url: "https://your-project-ref.supabase.co",
  anonKey: "sb_publishable_or_anon_key",
}

const renderApiConfig = {
  apiBaseUrl: "https://your-render-service.onrender.com",
}
```

Only use public browser-safe values here. Never expose `SUPABASE_SERVICE_ROLE_KEY`, Resend keys, WhatsApp tokens, `CLOUDINARY_API_SECRET`, or `JOB_SECRET`.

## Render backend environment variables

Set these on Render, not in browser config:

```txt
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
FRONTEND_ORIGIN=https://your-vercel-site.vercel.app
NOTIFICATION_DRY_RUN=true
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_GRAPH_API_VERSION=v21.0
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_FOLDER=client-slug/uploads
JOB_SECRET=...
UPCOMING_REMINDER_LEAD_TIME_MINUTES=120
UPCOMING_REMINDER_WINDOW_MINUTES=15
EXPIRED_SLOT_GRACE_MINUTES=120
```

See `docs/deployment.md` for the full deployment checklist.

## Supabase setup per client

1. Create/select Supabase project.
2. Apply migrations from `supabase/migrations/`.
3. Confirm RLS is enabled.
4. Configure Auth providers and redirect URLs for the Vercel domain.
5. Bootstrap the first `public.admin_users` `super_admin` row using a trusted SQL/admin process.
6. Apply reviewed seed data only when appropriate.

## Vercel setup per client

1. Serve the static frontend from `public/` or an equivalent static output directory.
2. Ensure `public/client-config.js` contains the client Supabase public URL/anon key and Render API URL.
3. Do not expose server-only secrets in Vercel public variables.
4. Deploy and verify `/`, `/admin.html`, `/client-config.js`, and key JS assets return HTTP 200.

## External scheduler setup

Use cron-job.org or another scheduler to call protected Render job endpoints:

```txt
POST https://<render-service>/api/v1/jobs/flushNotificationOutbox/run
POST https://<render-service>/api/v1/jobs/sendUpcomingBookingReminders/run
POST https://<render-service>/api/v1/jobs/releaseExpiredBookingSlots/run
POST https://<render-service>/api/v1/jobs/syncWaitlistSlotOpenNotifications/run
X-Job-Secret: <JOB_SECRET>
```

See `docs/scheduled-jobs.md`.

## Final client checklist

1. Run `node scripts/new-client.js`.
2. Update `public/client-config.js` fully for branding, contacts, Supabase, Render, services, stylists, SEO, media, and social links.
3. Add client images inside `public/IMG/`.
4. Configure Render env vars and deploy backend.
5. Apply Supabase migrations and bootstrap first admin.
6. Configure external scheduled jobs.
7. Deploy Vercel frontend.
8. Run production smoke checks from `docs/production-signoff.md`.

## Quick validation commands

```bash
node --check public/client-config.js
node --check scripts/new-client.js
npm run check:js
npm run test:phase9
```