# Royal Braids Admin Console User Manual

Comprehensive operator guide for `public/admin.html`, the private staff/admin dashboard for the current **Supabase + Render + Vercel** Royal Braids platform.

The old Firebase admin implementation is archived under `legacy/firebase-production-archive/` and is not the active runtime. All production admin operations should use the Supabase-backed admin console and Render backend endpoints.

---

## 1. What the Admin Console is for

The Admin Console is the operational control center for the salon. It allows authorized staff to manage the day-to-day business without editing code or touching the database directly.

Primary responsibilities:

1. Monitor and manage bookings.
2. Convert or close waitlist entries.
3. View the daily/weekly appointment schedule.
4. Manage gallery styles and uploaded media.
5. Publish and edit blog content.
6. Moderate reviews/testimonials.
7. Read and resolve contact messages.
8. Manage service categories, services, variants, and stylists.
9. Delegate admin access safely.
10. Review security activity, alerts, restrictions, and audit trails.

Main implementation files:

```txt
public/admin.html
public/JS/admin.js
public/JS/supabase-browser-adapter.js
public/JS/render-api-adapter.js
backend/src/modules/admins/
backend/src/modules/bookings/
backend/src/modules/content/
backend/src/modules/security/
backend/src/modules/activityTimeline/
```

---

## 2. Access requirements

An account can enter the Admin Console only when all of the following are true:

1. The person has a valid Supabase Auth user account.
2. The person signs in successfully using the configured auth method.
3. A matching row exists in `public.admin_users`.
4. The admin row is active.
5. The row has a valid role: `super_admin` or `admin`.
6. The row has the required permission flag for the tab/action being used.
7. Render backend verification succeeds for protected API calls.

If any condition fails, the UI may hide tabs or show an access-denied message. Render still enforces the final authorization decision on every protected mutation.

---

## 3. Roles and permission matrix

| Role / permission | Operational meaning | Typical tabs/actions |
| --- | --- | --- |
| `super_admin` | Full system authority. Can recover access, manage all tabs, delegate admins, and handle security. | All tabs and actions. |
| `admin` | Staff/admin role. Actual access depends on permission flags. | Only allowed tabs. |
| `canManageBookings` | Can manage appointment operations. | Bookings, Waitlist, Schedule, booking lifecycle actions. |
| `canManageContent` | Can manage website-facing content. | Gallery, Blogs, Reviews, Messages, Services, site settings/content. |
| `canManageSecurity` | Can inspect and respond to security activity. | Security dashboards, alerts, restrictions, account-change logs. |
| `canManageAdmins` | Can create/update admin access where backend policy allows. | Admins tab. |

Best-practice role design:

- Keep at least one `super_admin` recovery account.
- Give ordinary staff only the flags they need.
- Avoid shared admin accounts; audit logs are less useful when multiple people share one login.
- Remove or deactivate admin access immediately when staff leave.

---

## 4. Login, logout, and session behavior

### Logging in

1. Open `public/admin.html` on the deployed site.
2. Enter the Supabase Auth credentials for an approved admin account.
3. Wait for the console to verify the session and admin row.
4. Confirm that the visible tabs match the expected role/permissions.

### Logging out

Use the logout/sign-out control in the admin UI. This clears the Supabase browser session and returns the console to a signed-out state.

### Session refresh guidance

If permissions were changed while an admin was already signed in:

- Refresh the page.
- If the old permission state remains, sign out and sign back in.
- If the problem continues, verify the `admin_users` row and Render logs.

### Security restriction responses

The backend may return security restriction codes such as:

```txt
account_temporarily_blocked
force_logout_required
password_reset_required
```

The browser Render adapter stores a temporary notice and can trigger UI/session handling. Follow on-screen instructions, then review the Security tab if you have permission.

---

## 5. General console layout

The admin console is organized into permission-scoped tabs. The exact visual design may evolve, but the concepts are stable.

Common UI patterns:

- **Counters/summary cards** show totals such as pending bookings, active waitlist entries, unread messages, alerts, or content counts.
- **Filters** narrow records by status, date, service, keyword, or visibility.
- **Tables/cards** show operational records.
- **Detail panels/modals** show full customer/content/security information.
- **Action buttons** call Render endpoints for mutations.
- **Confirmation prompts** appear before destructive or lifecycle-changing actions.
- **Toast/status messages** show success or failure.

Do not assume that hiding a button is sufficient security. The backend must authorize every protected action.

---

## 6. Bookings tab

### Purpose

The Bookings tab is used to manage appointment records from creation through completion, cancellation, or other terminal status.

### Common booking statuses

| Status | Meaning | Operator notes |
| --- | --- | --- |
| `pending` | Booking exists but is not yet confirmed. | Review details, confirm if acceptable, or cancel/release if invalid. |
| `confirmed` | Appointment is accepted and active. | Customer should be expected at the scheduled time. |
| `completed` | Appointment was fulfilled. | Usually terminal. Used for reporting/history. |
| `cancelled` | Booking was cancelled. | Slot should be released or already released depending on workflow. |
| `waitlisted` | Booking is tied to an active waitlist entry. | Manage from Waitlist tab when slot opens. |
| `expired` | Pending slot/booking expired automatically. | Usually produced by scheduled job or expiry workflow. |
| `no_show` | Customer missed a confirmed appointment. | Use according to salon policy. |

### Typical booking workflow: confirm a pending booking

1. Open **Bookings**.
2. Filter to `pending` if needed.
3. Open the booking details.
4. Verify customer name, contact, service, stylist, date, time, notes, and any uploaded reference image.
5. Click the confirm/status action.
6. Wait for success confirmation.
7. Confirm that the booking status changed and any activity/notification records were created.

### Typical workflow: cancel and release a slot

1. Open the booking record.
2. Confirm cancellation reason according to salon policy.
3. Use the cancel/release-slot action rather than manually editing the database.
4. Render updates the booking status, releases the slot, may update waitlist state, and writes activity/audit/notification records.
5. Check Waitlist if a newly opened slot should be offered to a waiting customer.

### Typical workflow: mark completed

1. Confirm the service was delivered.
2. Mark booking as `completed`.
3. Review whether a follow-up review request or notification outbox row is expected.

### Operational cautions

- Do not manually change booking statuses in Supabase unless doing controlled recovery.
- Avoid deleting bookings; status changes preserve history and auditability.
- Always verify date/time/stylist before confirming a booking.
- If a booking action fails, do not repeatedly click. Check the error and reload the record.

---

## 7. Waitlist tab

### Purpose

The Waitlist tab tracks customers who want a slot that is currently unavailable. It helps staff preserve demand and fill cancellations.

Active data table: `public.waitlist_entries`.

### Key waitlist concepts

| Concept | Meaning |
| --- | --- |
| Preferred slot | Date/time/stylist/service combination the customer wants. |
| Queue position | Customer's order within an equivalent preferred slot group. |
| Queue size | Total active waiting entries in that group. |
| Active waiting status | Entry still occupies a queue position. |
| Converted status | Entry was moved into a confirmed booking. |
| Cancelled/closed status | Entry no longer occupies a queue position. |

### Typical workflow: review waitlist demand

1. Open **Waitlist**.
2. Filter by active/waiting status.
3. Sort by preferred date/time or queue position.
4. Review customer contact details and notes.
5. Check whether related slots have opened.

### Typical workflow: move waitlisted booking to confirmed

1. Confirm that the preferred slot is available.
2. Select the waitlist entry.
3. Use **Move to Confirmed**.
4. Render re-checks availability before changing state.
5. Confirm the booking status becomes `confirmed` and the waitlist entry no longer occupies active queue space.

### Typical workflow: close/cancel waitlist entry

1. Confirm customer no longer wants the appointment or the request is invalid.
2. Update waitlist status through the UI.
3. Verify queue positions are recalculated for remaining active entries.

### Cautions

- Never promise a slot before the backend confirms conversion.
- Queue position is meaningful only among equivalent preferred slot groups.
- If queue positions look wrong, reload first, then check backend logs and waitlist status values.

---

## 8. Schedule tab

### Purpose

The Schedule tab gives staff a calendar-like view of appointment demand. It is generated from booking data; it does not own a separate schedule table.

### What staff can do

- View day or week appointment layout.
- Inspect booking detail from a calendar item.
- Identify gaps, conflicts, and high-demand periods.
- Navigate dates.
- Run safe lifecycle actions through booking detail controls where available.

### Operational notes

- If a booking is missing from schedule, check its status and appointment date/time.
- If duplicate bookings appear, check slot locks and booking status history.
- Treat Schedule as a view over booking records, not a separate source of truth.

---

## 9. Gallery tab

### Purpose

Gallery content helps customers discover styles and builds trust before booking. Admins can manage images, categories, tags, and featured/trending flags.

### Common fields

- Title/name.
- Description.
- Service/category association.
- Image URL or Cloudinary asset metadata.
- Before/after images where supported.
- Tags or braid/style filters.
- Featured/trending flags.
- Visibility/published state.
- Sort order.

### Typical workflow: add a gallery item

1. Prepare demo-safe or approved salon image.
2. Upload image through the UI.
3. Render signs the Cloudinary upload request.
4. Fill in title, service/category, tags, and visibility.
5. Save item.
6. Open the public site and verify it appears under the correct filters.

### Media best practices

- Avoid uploading customer images without permission.
- Use optimized image sizes where possible.
- Use meaningful alt/title text for accessibility and SEO.
- Remove private metadata before uploading production images.

---

## 10. Blogs tab

### Purpose

Blogs support salon education, SEO, promotions, style guidance, and announcements.

### Common fields

- Title.
- Slug or read-more URL.
- Excerpt/summary.
- Body/content if full post support is enabled.
- Cover image.
- Publish date.
- Read time.
- Published/draft state.
- Tags/categories.

### Publishing checklist

1. Confirm title and excerpt are clear.
2. Confirm image is approved and displays correctly.
3. Confirm published state and publish date.
4. Preview public blog card/page.
5. Check mobile layout.
6. Avoid publishing placeholder content in production.

---

## 11. Reviews tab

### Purpose

Reviews are customer testimonials that may require moderation before becoming public.

### Common actions

- Approve review.
- Reject review.
- Edit obvious formatting issues where policy allows.
- Feature/unfeature review.
- Reply to review.
- Delete only when necessary.

### Moderation guidance

- Approve authentic, appropriate reviews.
- Reject spam, abusive content, private information, or irrelevant submissions.
- Do not alter customer sentiment in a misleading way.
- Prefer status moderation over hard deletion for auditability.

Public pages should show approved reviews only.

---

## 12. Messages tab

### Purpose

Messages are contact form submissions from customers or prospects.

Common statuses:

```txt
new
read
resolved
```

### Typical workflow: resolve a message

1. Open **Messages**.
2. Filter to `new`.
3. Read the customer request and contact details.
4. Follow up by phone, email, WhatsApp, or internal process.
5. Mark as `read` or `resolved`.
6. Delete only spam or records that should not be retained.

### Privacy caution

Contact messages may include personal information. Do not copy them into public tickets, screenshots, videos, or documentation.

---

## 13. Services tab

### Purpose

Services determine what customers can browse and book. This area may include categories, services, variants/sub-services, stylists, pricing, duration, visibility, and sort order.

Related tables may include:

```txt
service_categories
services
service_variants
stylists
```

### Service management workflow

1. Create or update service category if needed.
2. Create or update the main service.
3. Add variants/sub-services for specific options.
4. Assign price, duration, category, and visibility.
5. Add stylist options where applicable.
6. Save through the admin UI.
7. Verify the public Services section and booking dropdowns.

### Best practices

- Use inactive/hidden state instead of deleting commonly referenced services.
- Keep prices and durations consistent across service cards and variants.
- Use sort order to control display rather than relying on database insertion order.
- Test booking dropdowns after changing service/category identifiers.

---

## 14. Admins tab

### Purpose

The Admins tab controls staff access. Admin changes are sensitive and should be limited to `super_admin` or users with `canManageAdmins` where backend policy permits.

### Typical admin fields

| Field | Meaning |
| --- | --- |
| User ID/Auth identity | Supabase Auth user linked to admin access. |
| Display name | Human-readable staff/admin name. |
| Role | `super_admin` or `admin`. |
| Active | Whether the admin can currently access the console. |
| Permissions | Booking/content/security/admin management flags. |

### Workflow: add an admin

1. Confirm the staff member has or will receive a Supabase Auth account.
2. Open **Admins**.
3. Create the admin row with the correct user identity.
4. Assign the least-privilege role and permission flags.
5. Save.
6. Ask the staff member to sign in and verify visible tabs.
7. Review audit log entry if available.

### Workflow: remove admin access

1. Open the admin user record.
2. Set `active` to false or remove permission flags according to policy.
3. Save.
4. If urgent, use security actions to force logout/restriction where supported.
5. Review audit/security logs.

### Cautions

- Do not create multiple shared admin accounts.
- Do not make every staff member `super_admin`.
- Keep a written recovery plan for super admin loss.

---

## 15. Security tab

### Purpose

The Security tab helps authorized admins monitor and respond to suspicious or sensitive account activity.

Data may include:

- Login activities.
- Security alerts.
- Account change history.
- Admin security actions.
- Activity timeline events.
- User restriction state.

### Common security actions

- Mark alert reviewed/resolved.
- Restrict or temporarily block a user.
- Trigger password reset guidance.
- Force logout/session refresh guidance.
- Clear restrictions after review.

### Incident response workflow

1. Open **Security**.
2. Review alert severity, affected user, timestamp, and context.
3. Compare with login activity and account change history.
4. Choose a measured action: monitor, contact user, restrict account, or escalate.
5. Add notes if supported.
6. Mark the alert status appropriately.
7. Re-check related activity after the action.

### Security best practices

- Avoid over-sharing screenshots containing emails, phone numbers, IPs, or tokens.
- Use restrictions carefully; accidental blocks create customer support issues.
- Review admin audit logs after permission changes.
- Rotate credentials/provider secrets if compromise is suspected.

---

## 16. Notification and automation awareness

The Admin Console may create actions that result in notification outbox rows. Actual sending is handled by Render jobs/providers.

Notification-related concepts:

- `notification_outbox` stores pending/sent/failed notification intents.
- Resend handles email when enabled.
- WhatsApp Cloud API handles WhatsApp when enabled.
- `NOTIFICATION_DRY_RUN` may prevent real sends while still recording intents.
- External scheduler calls protected job endpoints for flushing and reminders.

If a customer says they did not receive a message, check outbox status, provider configuration, dry-run state, and Render job logs.

---

## 17. Recommended daily operating cadence

Opening checklist:

- Check today's Schedule.
- Review pending bookings.
- Review active waitlist entries for soonest dates.
- Check new contact messages.
- Check high-severity security alerts.

During the day:

- Confirm or cancel pending bookings promptly.
- Keep statuses accurate as appointments are completed or missed.
- Monitor cancellations and offer open slots to waitlisted customers.

Closing checklist:

- Mark completed/no-show appointments.
- Resolve messages handled during the day.
- Review failed notification/job indicators if visible.
- Check admin/security alerts before signing out.

Weekly checklist:

- Review services/prices for accuracy.
- Add or refresh gallery/blog content.
- Moderate pending reviews.
- Review admin users and permissions.
- Confirm scheduler jobs are running.

---

## 18. Troubleshooting playbook

### Cannot log in

Check:

1. Supabase Auth account exists.
2. Credentials/provider are correct.
3. Browser is using the correct Supabase project config.
4. `admin_users` row exists and is active.
5. Role/permission flags are correct.
6. Render `/health` works.
7. Browser network tab shows successful auth/admin calls.

### Admin tabs are missing

Check:

1. Permission flags in `admin_users`.
2. Whether user is `super_admin`.
3. Session refresh/sign-out/sign-in.
4. Render admin profile response.
5. Frontend console errors.

### Booking action fails

Check:

1. `canManageBookings` permission.
2. Booking ID exists.
3. Target status is allowed.
4. Slot is available if confirming/rescheduling/converting.
5. Render logs for validation or transaction error.

### Waitlist conversion fails

Check:

1. Waitlist entry is active/eligible.
2. Preferred slot is still open.
3. Related booking still exists.
4. Queue status has not changed in another session.

### Content does not appear publicly

Check:

1. Published/active/approved state.
2. Category/service visibility.
3. Public endpoint response.
4. Browser cache/service worker.
5. Image URL is reachable.

### Upload fails

Check:

1. `canManageContent` permission.
2. Cloudinary env vars on Render.
3. File type/size.
4. Cloudinary quota or folder restrictions.
5. Network request to `/api/v1/uploads/cloudinary/sign`.

### Security action fails

Check:

1. `canManageSecurity` permission.
2. Target user ID is correct.
3. Restriction payload is valid.
4. Render logs and security module validation.

---

## 19. What not to do from the Admin Console

- Do not use production customer data in demos or videos.
- Do not manually edit booking, slot, waitlist, admin, or security records unless performing controlled recovery.
- Do not share admin accounts.
- Do not give broad permissions when narrow permissions are enough.
- Do not expose service-role keys or provider secrets in browser config.
- Do not deploy or troubleshoot production by using archived Firebase functions/rules.

---

## 20. Escalation guidance

Escalate to a developer or system administrator when:

- Render `/health` is down.
- Supabase Auth is unavailable.
- Booking transactions repeatedly fail.
- Slot conflicts/double booking are suspected.
- Notification jobs fail repeatedly.
- Admin access is lost for all super admins.
- Security alerts indicate possible credential compromise.
- Database recovery or manual correction is required.
