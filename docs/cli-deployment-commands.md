# CLI Deployment Commands — Render, Supabase, and Vercel

This guide is the project-specific command reference for deploying the **Multi-vendor Supabase + Render + Vercel Salon Website** without using dashboards for normal deploy actions.

Current architecture:

- **Supabase**: database, auth, RLS, migrations, optional storage/realtime.
- **Render**: trusted backend API, service-role workflows, cron jobs, notifications, Cloudinary signing.
- **Vercel**: static public/admin frontend delivery.

> Keep dashboards available for one-time account setup, secret creation, billing, DNS, and emergency debugging. Use CLI for repeatable deploy workflows.

---

## 1. Golden rules before any deployment

### Check your current branch and changed files

```cmd
git status
```

Shows your current branch and any modified/untracked files. Run this before every deploy so you know exactly what you are about to ship.

### Install dependencies from lockfiles

```cmd
npm ci
npm ci --prefix backend
```

- `npm ci` installs root project dependencies exactly from `package-lock.json`.
- `npm ci --prefix backend` installs backend dependencies exactly from `backend/package-lock.json`.
- Use `npm ci` for deployment/testing consistency instead of `npm install`.

### Run the active project checks

```cmd
npm run test:phase9
```

Runs the active Phase 9 validation checks:

- frontend JavaScript syntax checks
- root unit/architecture tests
- backend tests

### Optional full test suite

```cmd
npm test
```

Runs all configured checks, including Playwright E2E tests. Use this before important production releases.

### Commit and push changes

```cmd
git add .
git commit -m "Deploy latest changes"
git push
```

Render Git-backed services deploy from pushed commits. If you deploy Render before pushing, Render may deploy the old code.

### Never commit local secrets

Do **not** commit files containing secrets, including:

```txt
.env
.env.local
.env.*.local
.vercel/.env.*.local
backend/.env
```

Use dashboard/CLI environment variable tools for secrets instead.

---

## 2. Render CLI

Render runs this project’s backend API and scheduled jobs from the root [`render.yaml`](../render.yaml) Blueprint.

Expected Render service names from this project:

```txt
salon-render-backend
salon-flush-notification-outbox
salon-upcoming-booking-reminders
salon-release-expired-booking-slots
salon-waitlist-slot-open-notifications
```

For normal app deploys, use the **web service**:

```txt
salon-render-backend
```

The other services are cron jobs.

### Check Render CLI installation

```cmd
render --version
```

Confirms Render CLI is installed and available on your `PATH`.

Expected example output:

```txt
render v2.20.0
```

### Log in to Render

```cmd
render login
```

Opens your browser so you can authorize the CLI. After authorization, Render stores a local CLI token.

Use this when:

- setting up Render CLI for the first time
- your CLI token expired
- you changed Render accounts

### Set or change active Render workspace

```cmd
render workspace set
```

Lets you choose which Render workspace the CLI should operate on. Pick the workspace that contains this salon project.

### List Render workspaces

```cmd
render workspaces
```

Shows the Render workspaces your account can access.

### List Render services

```cmd
render services
```

Opens an interactive list of services in the active workspace. Use this to find:

```txt
salon-render-backend
```

Copy its service ID. Render service IDs usually look like:

```txt
srv-xxxxxxxxxxxxxxxxxxxx
```

You need this ID for deploy commands.

### List services in script-friendly JSON

```cmd
render services --output json --confirm
```

Outputs services as JSON and skips confirmation prompts. This is useful for automation or when you want to copy exact service IDs.

### Validate `render.yaml`

```cmd
render blueprints validate render.yaml
```

Checks whether the root `render.yaml` is valid before deploying Blueprint changes.

Run this after editing:

- service names
- build/start commands
- cron schedules
- environment variable definitions
- root directories

### Trigger a backend deploy

```cmd
render deploys create SERVICE_ID --wait
```

Triggers a deploy for the selected service and waits until it finishes.

Replace `SERVICE_ID` with the ID for:

```txt
salon-render-backend
```

Example:

```cmd
render deploys create srv-abc123example --wait --confirm
```

Use this after pushing code to GitHub.

### Trigger a deploy for a specific commit

```cmd
render deploys create SERVICE_ID --commit COMMIT_SHA --wait
```

Deploys a specific Git commit. This is useful if you want Render to deploy a known commit instead of the latest branch state.

Get the latest commit SHA with:

```cmd
git rev-parse HEAD
```

### List deploys for a service

```cmd
render deploys list SERVICE_ID
```

Shows recent deploys for the selected service.

### Open Render service logs

```cmd
render logs SERVICE_ID
```

Streams logs for a service. Use this after a deploy to confirm the backend started correctly.

### Open an SSH shell on a Render service

```cmd
render ssh SERVICE_ID
```

Connects to a running service instance if SSH is available for that Render service/plan.

### Open an ephemeral shell

```cmd
render ssh SERVICE_ID --ephemeral
```

Starts an isolated temporary shell for debugging. Render does not run your normal start command in this ephemeral instance.

### Render environment variables

Render secrets are configured per service/environment. Required backend variables are documented in [`docs/deployment.md`](./deployment.md).

Critical rule:

```txt
SUPABASE_SERVICE_ROLE_KEY belongs only on Render/server-side environments.
Never expose it in Vercel public variables or browser JavaScript.
```

### Render deployment flow for this project

```cmd
npm ci
npm ci --prefix backend
npm run test:phase9
git status
git add .
git commit -m "Deploy latest backend changes"
git push
render blueprints validate render.yaml
render deploys create SERVICE_ID --wait
```

Notes:

- Replace `SERVICE_ID` with the ID for `salon-render-backend`.
- Your `render.yaml` has `autoDeploy: true`, so Render may deploy automatically after `git push`.
- Use the CLI deploy command when you want to manually trigger or wait/watch a deploy from your terminal.

---

## 3. Vercel CLI

Vercel serves the frontend. This project currently uses the static frontend under [`public/`](../public/).

Browser/frontend config must only contain public values:

- Supabase URL
- Supabase anon key
- Render backend API base URL

Never put server secrets in public Vercel variables.

### Check Vercel CLI installation

```cmd
vercel --version
```

Confirms Vercel CLI is installed.

### Log in to Vercel

```cmd
vercel login
```

Starts Vercel CLI authentication. Use the same account/team that owns the frontend project.

### Link this local folder to a Vercel project

```cmd
vercel link
```

Connects the current local directory to an existing Vercel project or creates a new one.

When Vercel asks whether to pull environment variables after linking, choose:

```txt
Y
```

Choose **Yes** if you linked the correct Vercel project. This downloads environment variables for local CLI use. It does not delete dashboard variables.

Choose **No** only if:

- you linked the wrong project
- you do not want local copies of env variables on this machine

### Pull Vercel environment variables locally

```cmd
vercel env pull .env.local
```

Downloads Vercel environment variables into `.env.local` for local builds/development.

Do not commit `.env.local`.

### Run Vercel local development

```cmd
vercel dev
```

Runs the project locally using Vercel’s development environment and pulled env variables.

### Create a preview deployment

```cmd
vercel deploy
```

Creates a preview deployment. Use this to test frontend changes before production.

### Create a production deployment

```cmd
vercel deploy --prod
```

Deploys the frontend to production.

### Deploy from prebuilt output

```cmd
vercel build
vercel deploy --prebuilt --prod
```

Builds locally first, then deploys that exact prebuilt output to production. This is useful when you want build failures to happen locally before uploading.

### List Vercel projects

```cmd
vercel projects ls
```

Shows projects available to your Vercel account/team.

### List Vercel deployments

```cmd
vercel ls
```

Shows recent deployments.

### View Vercel logs

```cmd
vercel logs DEPLOYMENT_URL
```

Shows logs for a deployment URL.

Example:

```cmd
vercel logs https://your-site.vercel.app
```

### Manage Vercel environment variables

List variables:

```cmd
vercel env ls
```

Add a variable:

```cmd
vercel env add VARIABLE_NAME
```

Remove a variable:

```cmd
vercel env rm VARIABLE_NAME
```

Pull variables locally again:

```cmd
vercel env pull .env.local
```

Use Vercel variables only for public frontend values unless the value is used only by Vercel server-side functions. For this static frontend, assume values are public if they reach browser code.

### Vercel deployment flow for this project

```cmd
npm ci
npm run test:phase9
git status
git add .
git commit -m "Deploy latest frontend changes"
git push
vercel deploy --prod
```

Notes:

- Vercel CLI can deploy local files directly.
- Still commit and push so GitHub matches what is deployed.
- If backend API URL changed, update the public frontend config before deploying.

---

## 4. Supabase CLI

Supabase owns database schema, migrations, auth configuration, RLS, and optional storage.

This project keeps migrations in:

```txt
supabase/migrations/
```

Development seed data lives in:

```txt
supabase/seed/phase_1_development_seed.sql
```

### Check Supabase CLI installation

```cmd
supabase --version
```

Confirms Supabase CLI is available.

If it is not installed globally, you can often run it through `npx`:

```cmd
npx supabase --version
```

### Log in to Supabase

```cmd
supabase login
```

Authenticates the CLI with your Supabase account.

### List Supabase projects

```cmd
supabase projects list
```

Shows Supabase projects available to your account. Use this to find the project ref.

Project refs look like:

```txt
abcdefghijklmnopqrst
```

### Link local repo to remote Supabase project

```cmd
supabase link --project-ref PROJECT_REF
```

Connects this local `supabase/` folder to a remote Supabase project.

Replace `PROJECT_REF` with your Supabase project reference.

### Check local Supabase status

```cmd
supabase status
```

Shows local Supabase service URLs and keys when the local Supabase stack is running.

### Start local Supabase

```cmd
supabase start
```

Starts local Supabase services using Docker. Use this for local database/auth testing.

### Stop local Supabase

```cmd
supabase stop
```

Stops local Supabase services.

### Reset local database

```cmd
supabase db reset
```

Drops and recreates the local database, reapplies migrations, and runs configured seed files.

Use this for local development only. Do not run destructive reset commands against production.

### Create a new migration

```cmd
supabase migration new migration_name
```

Creates a new timestamped SQL migration file in `supabase/migrations/`.

Example:

```cmd
supabase migration new add_booking_cancellation_reason
```

### Apply local migrations to linked remote project

```cmd
supabase db push
```

Applies unapplied local migrations from `supabase/migrations/` to the linked remote Supabase project.

Use this when you intentionally want to update the remote database schema.

Before production use:

- review every migration file
- back up important data
- confirm you are linked to the correct project

### Pull remote schema changes into local migrations

```cmd
supabase db pull
```

Pulls schema differences from the linked remote database into a local migration.

Use this if schema changes were made in the Supabase dashboard and you want to capture them in source control.

### Compare local schema changes

```cmd
supabase db diff
```

Shows schema differences. Useful before creating or reviewing migrations.

### List migration status

```cmd
supabase migration list
```

Shows which migrations exist locally and which are applied remotely.

### Generate TypeScript types from Supabase

```cmd
supabase gen types typescript --linked > supabase/database.types.ts
```

Generates TypeScript database types from the linked Supabase project. Use this if the project introduces TypeScript frontend/backend type sharing later.

### Deploy Supabase Edge Functions

```cmd
supabase functions deploy FUNCTION_NAME
```

Deploys a Supabase Edge Function.

This project currently uses Render for trusted backend workflows, so only use this if Supabase Edge Functions are added later.

### Set Supabase secrets for Edge Functions

```cmd
supabase secrets set SECRET_NAME=secret_value
```

Sets secrets for Supabase Edge Functions. This is not the same as Render backend environment variables.

### Supabase deployment flow for this project

```cmd
supabase login
supabase link --project-ref PROJECT_REF
supabase migration list
supabase db push
```

Notes:

- Run `supabase db push` before deploying backend code that depends on new database tables/functions/policies.
- Do not apply development seed data to production unless it has been reviewed for production suitability.
- Admin bootstrap still requires a controlled trusted SQL/admin step after Supabase Auth users exist.

---

## 5. Full deployment flow for this project

Use this when you changed database schema, backend code, and frontend files.

### Step 1 — Validate locally

```cmd
npm ci
npm ci --prefix backend
npm run test:phase9
```

Installs dependencies and runs active checks.

### Step 2 — Commit and push

```cmd
git status
git add .
git commit -m "Deploy latest changes"
git push
```

Keeps GitHub, Render, and your local folder aligned.

### Step 3 — Apply Supabase migrations, if schema changed

```cmd
supabase migration list
supabase db push
```

Skip this step if there are no new database migrations.

### Step 4 — Deploy Render backend

```cmd
render blueprints validate render.yaml
render deploys create SERVICE_ID --wait
```

Replace `SERVICE_ID` with the ID for `salon-render-backend`.

### Step 5 — Deploy Vercel frontend

```cmd
vercel deploy --prod
```

Deploys the public/admin frontend to production.

---

## 6. Quick copy-paste command blocks

### Backend-only change

```cmd
npm ci --prefix backend
npm run test:backend
git status
git add .
git commit -m "Deploy backend changes"
git push
render deploys create SERVICE_ID --wait
```

### Frontend-only change

```cmd
npm ci
npm run test:phase9
git status
git add .
git commit -m "Deploy frontend changes"
git push
vercel deploy --prod
```

### Database migration change

```cmd
supabase migration new migration_name
REM Edit the generated SQL file in supabase/migrations/
npm run test:phase9
git status
git add .
git commit -m "Add database migration"
git push
supabase migration list
supabase db push
render deploys create SERVICE_ID --wait
```

### Everything changed

```cmd
npm ci
npm ci --prefix backend
npm run test:phase9
git status
git add .
git commit -m "Deploy latest changes"
git push
supabase migration list
supabase db push
render blueprints validate render.yaml
render deploys create SERVICE_ID --wait
vercel deploy --prod
```

---

## 7. Common troubleshooting commands

### Confirm CLIs are installed

```cmd
render --version
vercel --version
supabase --version
```

### Confirm Git remote

```cmd
git remote -v
```

Shows which GitHub repo Render/Vercel should be deploying from.

### Confirm latest commit

```cmd
git log -1 --oneline
```

Shows the latest local commit.

### Confirm pushed branch status

```cmd
git status
```

If Git says your branch is ahead of origin, run:

```cmd
git push
```

### Check Render backend health endpoint

```cmd
curl https://YOUR_RENDER_SERVICE_URL/health
```

Confirms the deployed backend responds.

### Check Vercel frontend URL

```cmd
vercel ls
```

Shows recent Vercel deployments and URLs.

---

## 8. Secret placement rules

### Safe for browser/public frontend

These values can be public:

```txt
Supabase project URL
Supabase anon key
Render public backend API URL
```

### Server-only secrets

Keep these on Render or other server-only environments:

```txt
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
CLOUDINARY_API_SECRET
JOB_SECRET
```

### Final reminder

If a value appears in browser JavaScript, users can see it. Only expose public keys and public URLs in the frontend.
