# Free Scheduled Jobs Setup

This project does **not** use paid Render cron services. The Render backend exposes a protected HTTP endpoint, and a free external scheduler such as [cron-job.org](https://cron-job.org/) calls that endpoint on a schedule.

## Why this replaces Render cron jobs

- Render cron jobs can require billing/card setup.
- The backend already owns the job logic in `backend/src/jobs/`.
- External schedulers can call the backend web service over HTTPS without creating extra Render services.

## Required Render environment variable

Set a long random secret on the Render web service:

```text
JOB_SECRET=<long-random-secret>
```

Keep this value server-only. Do not put it in Vercel, `public/client-config.js`, browser JavaScript, or committed files.

## Protected job endpoint

```text
POST https://<render-service>/api/v1/jobs/:jobName/run
```

Authentication options:

```text
X-Job-Secret: <JOB_SECRET>
```

Alternative supported headers:

```text
X-Cron-Secret: <JOB_SECRET>
Authorization: Bearer <JOB_SECRET>
```

If `JOB_SECRET` is missing on Render, the endpoint returns `503 job_secret_not_configured`. If the scheduler sends the wrong or missing secret, it returns `401 job_authentication_failed`.

## cron-job.org setup

Create four jobs in cron-job.org with method `POST`, request body `{}`, and the secret header `X-Job-Secret: <JOB_SECRET>`.

Replace `https://YOUR_RENDER_BACKEND_URL` with the deployed Render web service URL, for example `https://salon-shop-render-api.onrender.com`.

| cron-job.org title                       | Schedule         | URL                                                                                 |
| ---------------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `salon-flush-notification-outbox`        | Every 5 minutes  | `https://YOUR_RENDER_BACKEND_URL/api/v1/jobs/flushNotificationOutbox/run`           |
| `salon-upcoming-booking-reminders`       | Every 15 minutes | `https://YOUR_RENDER_BACKEND_URL/api/v1/jobs/sendUpcomingBookingReminders/run`      |
| `salon-release-expired-booking-slots`    | Every 15 minutes | `https://YOUR_RENDER_BACKEND_URL/api/v1/jobs/releaseExpiredBookingSlots/run`        |
| `salon-waitlist-slot-open-notifications` | Every 15 minutes | `https://YOUR_RENDER_BACKEND_URL/api/v1/jobs/syncWaitlistSlotOpenNotifications/run` |

Recommended cron-job.org settings:

- Request method: `POST`
- Timezone: match the salon operating timezone where possible, or use UTC consistently.
- Request body: `{}`
- Header name: `X-Job-Secret`
- Header value: the same `JOB_SECRET` configured on Render.
- Save response body/logs at least during initial production validation.

## Local smoke test

After starting the backend locally with `JOB_SECRET` configured:

```cmd
curl -X POST http://localhost:4000/api/v1/jobs/flushNotificationOutbox/run ^
  -H "Content-Type: application/json" ^
  -H "X-Job-Secret: YOUR_LOCAL_JOB_SECRET" ^
  -d "{}"
```

Expected success shape:

```json
{
	"ok": true,
	"data": {
		"jobName": "flushNotificationOutbox",
		"result": {}
	}
}
```

The exact `result` depends on pending database rows and `NOTIFICATION_DRY_RUN`.

## Production validation checklist

- [ ] Render web service has `JOB_SECRET` configured.
- [ ] Render web service is redeployed after adding/changing `JOB_SECRET`.
- [ ] A request without `X-Job-Secret` is rejected.
- [ ] A request with the correct `X-Job-Secret` succeeds for at least one low-risk dry-run job.
- [ ] `NOTIFICATION_DRY_RUN=true` is used until notification providers are intentionally approved.
- [ ] cron-job.org shows successful HTTP 200 runs.
- [ ] Render backend logs show each scheduled job running without unexpected errors.
