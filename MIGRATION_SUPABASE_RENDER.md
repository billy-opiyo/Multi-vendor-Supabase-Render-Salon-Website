# Salon Shop Supabase + Render Migration Plan

This repository is the copied migration project. The original Firebase production project should remain untouched while this project is migrated and tested.

## Current status

- Git history has been separated from the Firebase production repository.
- The new GitHub remote is `Multi-vendor-Supabase-Render-Salon-Website`.
- This branch adds a parallel Supabase + Render scaffold without deleting Firebase code yet.
- Existing Firebase frontend/scripts/functions remain in place until feature parity is confirmed.

## Added scaffold

```text
public/JS/supabase-client.js            # Browser Supabase + Render API bridge
server/                                # Render Node/Express API scaffold
server/.env.example                    # Render/local backend env template
supabase/migrations/*.sql              # Initial Supabase schema draft
render.yaml                            # Render backend API service only
.env.example                           # Public config reminder/template
```

## Firebase collections mapped to Supabase tables

| Firebase collection / concept   | Supabase table           |
| ------------------------------- | ------------------------ |
| `users`                         | `profiles`               |
| `adminUsers`                    | `admin_users`            |
| `adminAuditLogs`                | `admin_audit_logs`       |
| `bookings`                      | `bookings`               |
| `bookingSlots`                  | `booking_slots`          |
| `waitlist`                      | `waitlist_entries`       |
| `reviews`                       | `reviews`                |
| `galleryStyles`                 | `gallery_styles`         |
| `blogs`                         | `blogs`                  |
| `contactMessages`               | `contact_messages`       |
| `rateLimits`                    | `rate_limits`            |
| `securityAlerts`                | `security_alerts`        |
| `loginActivities`               | `login_activities`       |
| `accountChangeHistory`          | `account_change_history` |
| `adminSecurityActions`          | `admin_security_actions` |
| `activityTimeline`              | `activity_timeline`      |
| Admin service settings document | `service_settings`       |

## Next setup steps

### 1. Create a Supabase project

Create a new Supabase project and save:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` are public-safe. Never expose `SUPABASE_SERVICE_ROLE_KEY` in `public/` files.

### 2. Apply the database schema

In Supabase Dashboard → SQL Editor, run:

```text
copy everything in this file and paste them in the sql editor +New query then click Run
supabase/migrations/20260604060000_initial_schema.sql
```

Review policies before production. The Render backend uses the service-role key for admin operations, so most admin tables intentionally have no public policies.

### 3. Create your first Supabase admin

1. In Supabase Auth, create an admin user.
2. Copy that user's `auth.users.id`.
3. Insert an admin access row:

```sql
insert into public.admin_users (auth_user_id, email, role, permissions, is_active)
values (
  'PASTE_AUTH_USER_ID_HERE',
  'admin@example.com',
  'super_admin',
  '{"canManageAdmins": true, "canManageBookings": true, "canManageContent": true, "canManageSecurity": true}'::jsonb,
  true
);
```

### 4. Configure local backend

```cmd
copy server\.env.example server\.env
```

Fill in `server/.env`, then install and run:

```cmd
npm --prefix server install
npm --prefix server start
```

Health check:

```text
http://localhost:5000/health
```

### 5. Configure frontend public values

In `public/client-config.js`, replace:

```js
url: "https://YOUR_SUPABASE_PROJECT_REF.supabase.co",
anonKey: "YOUR_SUPABASE_ANON_KEY",
```

and set the deployed Render API URL after the backend is deployed:

```js
const renderBackendUrl = "https://YOUR_RENDER_API_SERVICE.onrender.com"
```

### 6. Deploy backend API to Render

Render is used for the backend API/functions only. The static frontend should be deployed separately on Vercel.

In Render Dashboard, create a **Web Service** for the GitHub repo with:

```text
Name: salon-shop-render-api
Runtime: Node
Root Directory: server
Build Command: npm install
Start Command: npm start
Health Check Path: /health
```

Alternatively, after `render.yaml` is pushed, Render's Blueprint flow can be used because it now defines only the backend API service.

Add the backend environment variables in Render:

```text
PUBLIC_SITE_URL
CORS_ORIGINS
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
CONTACT_NOTIFICATION_EMAIL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_UPLOAD_FOLDER
```

Set `PUBLIC_SITE_URL` and `CORS_ORIGINS` to the Vercel frontend URL after Vercel deployment. During local testing, include `http://localhost:5000`, `http://localhost:3000`, and `http://127.0.0.1:5000` as allowed origins.

## Migration strategy

Do not delete Firebase code yet. Migrate one feature at a time:

1. Supabase Auth for public/admin login.
2. Contact form to Render API + Supabase.
3. Reviews read/write.
4. Gallery/blog admin CRUD.
5. Booking and waitlist flows.
6. Email/WhatsApp notifications and scheduled jobs.
7. Admin security/audit features.
8. Remove Firebase scripts/config only after all tests pass on Supabase + Render.

## Useful checks

```cmd
npm run check:js
npm --prefix server run check
git status --short
```
