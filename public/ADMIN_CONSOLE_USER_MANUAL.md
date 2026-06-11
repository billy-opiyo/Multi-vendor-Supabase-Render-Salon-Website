# Royal Braids Admin Console User Manual

Comprehensive operating guide for `public/admin.html` on the current **Supabase + Render + Vercel** production architecture.

The old Firebase admin implementation is archived under `legacy/firebase-production-archive/` and is not the active admin runtime.

## 1. Purpose of the Admin Console

The Admin Console is the private operations dashboard for salon staff and administrators. It manages bookings, waitlists, schedule views, gallery styles, blog posts, review moderation, contact messages, service visibility, admin access, and security monitoring.

Main files:

```txt
public/admin.html
public/JS/admin.js
public/JS/supabase-browser-adapter.js
public/JS/render-api-adapter.js
```

## 2. Access, login, logout, and permissions

To enter the console, an account must meet all conditions:

1. The account exists in Supabase Auth.
2. The account signs in with an approved Supabase Auth method.
3. A matching active row exists in `public.admin_users`.
4. The admin row has a valid role: `super_admin` or `admin`.
5. The admin has permission flags needed for the selected tab.

| Permission / role | Tabs enabled |
| --- | --- |
| `canManageBookings` | Bookings, Waitlist, Schedule |
| `canManageContent` | Gallery, Blogs, Reviews, Messages, Services |
| `canManageSecurity` | Security |
| `canManageAdmins` or `super_admin` | Admins |
| `super_admin` | All tabs |

Admin permission checks are enforced by both the frontend UI and Render backend middleware.

## 3. General console behavior

- Admin tabs are shown only when the signed-in admin has access.
- Data is loaded through Supabase/RLS-approved reads and Render admin endpoints.
- Privileged mutations go through Render; the browser never uses the Supabase service-role key.
- Success/error messages appear near the relevant section.
- Destructive actions require confirmation.
- After role or permission changes, sign out/in or refresh the session if access appears stale.

## 4. Bookings tab

Use the Bookings tab to monitor and manage appointment records.

Common statuses:

```txt
pending
confirmed
completed
cancelled
waitlisted
expired
no_show
```

| Current status | Common actions |
| --- | --- |
| `pending` | Confirm, Cancel + Release Slot |
| `confirmed` | Complete + Release Slot, Cancel + Release Slot |
| `waitlisted` | Move to Confirmed, manage from Waitlist |
| terminal statuses | View only |

Protected Render endpoints handle status updates, release-slot actions, waitlist recalculation, notification outbox rows, activity timeline records, and audit logs.

## 5. Waitlist tab

Use the Waitlist tab for customers waiting on unavailable slots. Admins can review queue position, contact customers, update waitlist status, and move eligible waitlisted bookings to confirmed when the preferred slot is available.

The active database table is `public.waitlist_entries`.

## 6. Schedule tab

The Schedule tab is a day/week calendar view of booking data. It does not maintain a separate schedule table. Admins can navigate dates, inspect booking detail panels, and run lifecycle-safe actions from selected bookings.

## 7. Content tabs

### Gallery

Manage public style/gallery items, Cloudinary media, before/after images, service metadata, and featured/trending flags.

### Blogs

Create and maintain public salon content such as titles, excerpts, images, publish dates, read times, and published status.

### Reviews

Moderate reviews by approving, rejecting, editing, featuring, replying, or deleting. Public pages show approved reviews only.

### Messages

Manage contact submissions by status (`new`, `read`, `resolved`), sorting, follow-up, and deletion.

### Services

Manage what customers can view and book. Active data lives in Supabase tables such as `service_categories`, `services`, `service_variants`, and `stylists`.

## 8. Admins tab

Use Admins to manage staff access. Admin mutations are written through Render and recorded in `admin_audit_logs`.

Typical fields:

| Field | Meaning |
| --- | --- |
| Admin user | Supabase Auth user/admin identity |
| Role | `super_admin` or `admin` |
| Active | Whether the admin can access the console |
| Permissions | Booking/content/security/admin management flags |

## 9. Security tab

Use Security to monitor login activity, risk flags, security alerts, account changes, admin security actions, activity timelines, and session/online-user views where supported.

Authorized admins can trigger response actions such as temporary block, force password reset, force sign-out/session refresh guidance, or clearing restrictions. Render writes durable state to Supabase security tables.

## 10. System dependencies

Active dependencies:

- Supabase Auth and Postgres/RLS.
- Render backend API.
- Vercel static frontend hosting.
- Cloudinary for media.
- Resend and WhatsApp Cloud API for notifications when enabled.
- External scheduler for protected jobs.

Do not troubleshoot active production issues by deploying Firebase Functions or Firestore rules; those are historical artifacts in `legacy/firebase-production-archive/`.

## 11. Troubleshooting

### Cannot log in

Check Supabase Auth account existence, password/provider credentials, `public.admin_users` row, role/permissions, Render health, and `public/client-config.js` Supabase/Render URLs.

### Data does not load

Check Render `/health`, browser network calls, Supabase RLS policies, admin permissions, and whether the relevant Supabase table has records.

### Booking or waitlist action fails

Check record IDs, slot availability, `canManageBookings` permission, and Render logs for validation or transaction errors.

### Upload fails

Check Render Cloudinary env vars, admin content permission, file size/type, and Cloudinary account quota/credentials.

### Notifications do not send

Check `NOTIFICATION_DRY_RUN`, Resend/WhatsApp env vars, `notification_outbox` rows, scheduler calls, and Render job logs.

## 12. Best practices

- Use the admin UI and Render endpoints instead of direct database edits for operational workflows.
- Keep a `super_admin` recovery account available.
- Do not share admin accounts.
- Review audit/security logs after privileged changes.
- Keep server secrets out of browser/Vercel public config.
- Run `npm run test:phase9` before shipping important changes.