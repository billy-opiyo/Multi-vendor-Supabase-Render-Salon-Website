# Deployment Notes

This project targets a clean **Supabase + Render + Vercel** architecture:

- **Supabase** owns Postgres, Auth, RLS, migrations, optional storage, and realtime.
- **Render** runs the trusted backend API with service-role access and future workers/cron jobs.
- **Vercel** serves the public/admin frontend with only public configuration values.

## Backend on Render

The root `render.yaml` file defines the backend web service as a Render Blueprint.

| Setting        | Value       |
| -------------- | ----------- |
| Service type   | Web service |
| Runtime        | Node        |
| Root directory | `backend`   |
| Build command  | `npm ci`    |
| Start command  | `npm start` |
| Health check   | `/health`   |

Render injects `PORT` automatically. The backend reads it through `backend/src/config/env.js` and defaults to `4000` locally.

### Required Render environment variables

| Variable                    | Required         | Notes                                                                                                        |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                  | Yes              | Set to `production` on Render.                                                                               |
| `SUPABASE_URL`              | Yes              | Supabase project URL, for example `https://your-project-ref.supabase.co`.                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes              | Server-only key. Never expose this in Vercel or browser JavaScript.                                          |
| `SUPABASE_ANON_KEY`         | Optional for now | Public anon key if a server workflow needs anon-context behavior.                                            |
| `FRONTEND_ORIGIN`           | Yes              | Comma-separated allowed origins for CORS, for example `https://your-site.vercel.app,https://yourdomain.com`. |

## Local backend development

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The local backend should expose:

```text
GET http://localhost:4000/health
```

## Supabase deployment

Apply migrations from `supabase/migrations/` to the target Supabase project before relying on backend Phase 3 endpoints:

```bash
supabase db push
```

If the Supabase CLI is not installed locally, apply the SQL migrations through the Supabase dashboard SQL editor in timestamp order.

## Vercel frontend configuration

Vercel/browser code must use only public values:

| Variable                                      | Notes                                   |
| --------------------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` or equivalent      | Public Supabase URL.                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or equivalent | Public anon key only.                   |
| `NEXT_PUBLIC_RENDER_API_URL` or equivalent    | Public base URL for the Render backend. |

Do **not** put `SUPABASE_SERVICE_ROLE_KEY`, provider secrets, webhook secrets, or Cloudinary signing secrets in Vercel public variables.

## Deployment smoke checks

After deployment:

1. Confirm `GET /health` returns `ok: true` and `supabaseConfigured: true`.
2. Confirm CORS allows the deployed Vercel origin and rejects unexpected browser origins.
3. Confirm authenticated requests include a Supabase access token as `Authorization: Bearer <token>`.
4. Confirm admin-only endpoints require an active `admin_users` row with the required permission.
