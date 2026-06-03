# Royal Braids Admin Console User Manual

Comprehensive operating guide for `public/admin.html`.

This manual explains how to use every Admin Console tab, what each control does, what data is affected, and the recommended operating procedures for bookings, waitlists, content, service visibility, admin users, and security monitoring.

---

## Table of Contents

1. [Purpose of the Admin Console](#1-purpose-of-the-admin-console)
2. [Access, Login, Logout, and Permissions](#2-access-login-logout-and-permissions)
3. [General Console Navigation and Shared Behavior](#3-general-console-navigation-and-shared-behavior)
4. [Bookings Tab](#4-bookings-tab)
5. [Waitlist Tab](#5-waitlist-tab)
6. [Schedule Tab](#6-schedule-tab)
7. [Gallery Tab](#7-gallery-tab)
8. [Blogs Tab](#8-blogs-tab)
9. [Reviews Tab](#9-reviews-tab)
10. [Messages Tab](#10-messages-tab)
11. [Services Tab](#11-services-tab)
12. [Admins Tab](#12-admins-tab)
13. [Security Tab](#13-security-tab)
14. [Confirmation Modal and Destructive Actions](#14-confirmation-modal-and-destructive-actions)
15. [Realtime Data Sources and System Dependencies](#15-realtime-data-sources-and-system-dependencies)
16. [Recommended Daily Operating Procedures](#16-recommended-daily-operating-procedures)
17. [Troubleshooting Guide](#17-troubleshooting-guide)
18. [Best Practices and Safety Rules](#18-best-practices-and-safety-rules)

---

## 1. Purpose of the Admin Console

The Royal Braids Admin Console is the private operations dashboard for salon staff and administrators. It is used to manage:

- Client bookings and booking statuses
- Waitlist requests for unavailable appointment slots
- Calendar/schedule review
- Gallery styles shown on the public website
- Blog posts shown on the public website
- Review moderation and testimonial visibility
- Contact messages submitted by clients
- Service category visibility across the public website and booking form
- Admin user access and delegation
- Security events, login activity, sessions, account restrictions, and user behavior timeline

The console runs from:

```txt
public/admin.html
```

The main runtime logic is implemented in:

```txt
public/JS/admin.js
```

---

## 2. Access, Login, Logout, and Permissions

### 2.1 Opening the Admin Console

Open the admin page in the browser:

```txt
admin.html
```

The page header shows:

- **Admin Console**
- **Content, Bookings & Security Management**
- A **Back to Homepage** button

Use **Back to Homepage** to return to the public website. If you came from the homepage, the console attempts to return using browser history; otherwise it opens `index.html`.

### 2.2 Login Requirements

To enter the console, an account must meet all of these conditions:

1. The account must exist in Firebase Authentication.
2. The account must sign in using email/password.
3. A matching `adminUsers/{uid}` access record must exist in Firestore.
4. The admin access record must have `active: true`.
5. The admin access record must have a valid role:
   - `super_admin`
   - `admin`

If any of these checks fail, the console shows an authorization error and keeps the admin panel locked.

### 2.3 Logging In

1. Enter **Admin Email**.
2. Enter **Password**.
3. Optional: click the eye icon to show/hide the password.
4. Click **Log In**.
5. Wait for the success message.

After successful login:

- The login form is hidden.
- The admin panel appears.
- The top user state changes to `Logged in as: email@example.com (Role)`.
- The **Log Out** button becomes visible.
- Realtime listeners start loading data for the sections your permissions allow.

### 2.4 Logging Out

1. Click **Log Out**.
2. The console signs out the current admin.
3. The panel is hidden and realtime listeners are stopped.
4. Login credentials are cleared from the form.

The admin session uses session persistence. Closing the browser/session may require logging in again.

### 2.5 Permission-Based Tab Visibility

Tabs are shown or hidden based on the signed-in admin's role and permissions.

| Permission / Role | Tabs Enabled |
| --- | --- |
| `canManageBookings` | Bookings, Waitlist, Schedule |
| `canManageContent` | Gallery, Blogs, Reviews, Messages, Services |
| `canManageSecurity` | Security |
| `super_admin` role | All tabs, including Admins |

Important notes:

- A `super_admin` automatically has every permission.
- The **Admins** tab is available only to users with the `super_admin` role in the current implementation.
- A standard admin may have permission flags stored on their profile, but they will only see the tabs allowed by those flags.
- If an admin is made inactive, they cannot access the panel on the next authorization check.

---

## 3. General Console Navigation and Shared Behavior

### 3.1 Admin Tabs

The console contains these tabs:

1. **Bookings**
2. **Waitlist**
3. **Schedule**
4. **Gallery**
5. **Blogs**
6. **Reviews**
7. **Messages**
8. **Services**
9. **Admins**
10. **Security**

Click a tab to switch sections. Only one section is active at a time.

### 3.2 Realtime Updates

Most admin sections update in realtime from Firestore. If a client submits a booking, review, contact message, or waitlist request while the admin page is open, it should appear automatically.

### 3.3 Toast and Inline Messages

The console displays success/error messages near the section where the action occurred. Success and error messages auto-dismiss after a short period.

Examples:

- `✅ Booking updated to confirmed.`
- `✅ Gallery style created successfully.`
- `❌ Failed to save blog: ...`

### 3.4 Loading State

When an action is in progress, the clicked button may temporarily show text such as:

- `Saving...`
- `Updating...`
- `Applying...`
- `Signing In...`

Avoid clicking repeatedly while a button is loading.

### 3.5 Destructive Actions

Actions that delete data or disable access use a confirmation dialog. See [Confirmation Modal and Destructive Actions](#14-confirmation-modal-and-destructive-actions).

---

## 4. Bookings Tab

The **Bookings** tab is used to monitor and manage client appointment bookings.

Required permission: `canManageBookings` or `super_admin`.

### 4.1 Booking Statistics

At the top of the tab, the dashboard shows counters:

- **Total** - all loaded bookings
- **Pending** - bookings awaiting admin action
- **Confirmed** - accepted/active bookings
- **Waitlisted** - waitlisted booking records linked to active waitlist entries
- **Completed** - finished appointments
- **Cancelled** - cancelled appointments

### 4.2 Booking Filters

Filter buttons allow you to change which bookings appear in the list:

- **All Bookings** - shows all loaded bookings
- **Pending** - shows bookings awaiting admin action
- **Confirmed** - shows only confirmed bookings
- **Completed** - shows finished appointment records
- **Cancelled** - shows cancelled appointment records
- **Waitlisted Only** - shows active waitlisted bookings separately from confirmed bookings

Use **Waitlisted Only** when you want to focus on clients who are waiting for an unavailable slot.

### 4.3 Booking Card Information

Each booking card can show:

- Client/customer name
- Booking ID
- Status badge
- Waitlist badge and queue position, if applicable
- Service
- Stylist
- Date
- Time
- Email
- Phone
- WhatsApp notification status
- Reminder sent timestamp
- Special request / notes
- Inspiration image link and thumbnail, if provided

### 4.4 Booking Statuses

The console normalizes booking statuses into:

- `pending`
- `confirmed`
- `completed`
- `cancelled`
- `waitlisted`

### 4.5 Booking Actions

Each booking card shows lifecycle-safe action buttons based on the booking's current status. The console now avoids showing actions that could desynchronize slot locks or linked waitlist records.

| Current status | Available booking-card actions |
| --- | --- |
| `pending` | **Confirm**, **Cancel + Release Slot** |
| `confirmed` | **Complete + Release Slot**, **Cancel + Release Slot** |
| `waitlisted` | **Move to Confirmed**; complete/cancel release buttons are disabled with guidance |
| `completed` / `cancelled` | No quick lifecycle actions |

Important behavior:

- Slot-release actions are handled by the protected backend callable function `adminUpdateBookingStatusAndReleaseSlot`.
- The backend verifies the admin has booking-management permission before applying the action.
- The backend checks that the slot lock belongs to the booking before deleting `bookingSlots/{slotId}`.
- Completion/cancellation slot-release actions are recorded in admin audit logs.

#### Confirm

Sets a pending booking status to `confirmed`.

Use this when:

- The salon accepts the booking.
- The appointment is ready to be treated as active.

#### Move to Confirmed

Shown for waitlisted bookings.

This action attempts to convert a waitlisted booking into a confirmed booking and lock the preferred slot through the backend callable function.

Important behavior:

- It locks the slot only if the preferred slot is available.
- If the slot is still occupied, the console shows an error.
- If the slot is occupied, cancel/release the existing booking first, then try again.

#### Complete + Release Slot

Completes a confirmed booking and releases its slot lock through the backend callable function.

Important behavior:

- Only confirmed bookings can be completed and released from this workflow.
- Waitlisted bookings must be moved to confirmed first.
- The booking status becomes `completed`.
- `completedAt`, `completedBy`, `adminActionUpdatedBy`, and update metadata are written.
- If the booking has a valid `slotId`, the matching `bookingSlots/{slotId}` document is deleted.
- Slot-release metadata can include `releasedSlotId`, `slotReleasedAt`, `slotReleaseReason`, `slotReleaseSource`, and `slotReleasedBy`.
- Releasing a slot can trigger backend waitlist notification automation for clients waiting for that slot.

Use this after the appointment has been fulfilled and the slot should no longer stay locked as an active booking.

#### Cancel + Release Slot

Cancels a pending or confirmed booking and releases its slot lock through the backend callable function.

Important behavior:

- The booking status becomes `cancelled`.
- `cancelledAt`, `cancelledBy`, `adminActionUpdatedBy`, and update metadata are written.
- If the booking has a valid `slotId`, the matching `bookingSlots/{slotId}` document is deleted.
- Slot-release metadata can include `releasedSlotId`, `slotReleasedAt`, `slotReleaseReason`, `slotReleaseSource`, and `slotReleasedBy`.
- Releasing a slot can trigger backend waitlist notification automation for clients waiting for that slot.
- Waitlisted bookings cannot be cancelled/released from the Bookings or Schedule card actions. Cancel waitlist requests from the **Waitlist** tab so the linked waitlist entry stays synchronized.

Use this when:

- A client cancels.
- The salon cannot honor the appointment.
- You need to free the slot for another client or waitlisted request.

### 4.6 Recommended Booking Workflow

1. Open **Bookings**.
2. Review new **Pending** bookings.
3. Check date, time, stylist, service, phone/email, and notes.
4. If the salon can serve the booking, click **Confirm**.
5. If the client cancels or the booking is invalid, click **Cancel + Release Slot**.
6. After a confirmed appointment is served, click **Complete + Release Slot**.
7. For waitlisted bookings, use **Move to Confirmed** before completing, or manage cancellation from the **Waitlist** tab.
8. Use **Waitlisted Only** for requests that need slot availability follow-up.

---

## 5. Waitlist Tab

The **Waitlist** tab is used to manage clients who requested a slot that was unavailable.

Required permission: `canManageBookings` or `super_admin`.

### 5.1 Waitlist Statistics

The tab shows counters for:

- **Total** - all waitlist requests
- **Waiting** - clients still waiting
- **Contacted** - clients marked `contacted` or `notified`
- **Booked** - closed as booked
- **Cancelled** - cancelled requests

### 5.2 Waitlist Sort Options

Use **Sort Waitlist** to organize the queue:

- **Newest first** - newest/most recently updated first
- **Oldest first** - earliest joined first
- **Appointment date/time** - earliest requested appointment time first
- **Waiting first** - active waiting clients first, followed by notification failures/contacted/booked/cancelled
- **Name (A-Z)** - alphabetical by client name

### 5.3 Waitlist Statuses

Waitlist statuses include:

- `waiting` - client is waiting for the slot
- `notified` - automation has notified the client
- `contacted` - admin has contacted the client
- `booked` - request has been closed as booked/status-complete
- `cancelled` - request cancelled
- `notification_failed` - automatic notification failed

Active queue statuses are:

- `waiting`
- `notified`
- `contacted`
- `notification_failed`

Only active queue statuses receive queue position labels.

### 5.4 Waitlist Queue Position

The console groups waitlist requests by preferred slot and calculates queue position.

Queue position can display as:

- `1st in queue`
- `2nd in queue`
- `3rd in queue`
- `4th in queue`, etc.

If multiple clients want the same slot, the earliest active request becomes first in queue.

### 5.5 Waitlist Card Information

Each card can show:

- Client name
- Waitlist ID
- Linked Booking ID, if a waitlisted booking exists
- Status badge
- Waitlist place/queue position
- Requested service
- Requested stylist
- Preferred date
- Preferred time
- Slot ID
- Email link
- Phone link
- Joined timestamp
- Updated timestamp
- Notified timestamp
- Notification channel
- Notes
- Inspiration image link

### 5.6 Waitlist Actions

#### Move to Confirmed (Locks Slot)

Converts the linked waitlisted booking into a confirmed booking and locks the preferred slot.

Use this only when:

- The preferred slot is available.
- The client has accepted the opening.
- A linked waitlisted booking exists.

If the preferred slot is still occupied, this action fails and tells you to release the existing booking first.

#### Set Waiting

Sets the waitlist request back to `waiting`.

Use this when:

- A client remains interested.
- A status was changed accidentally.

#### Mark Contacted

Sets the waitlist request to `contacted` and records contact metadata.

Use this after manually calling, emailing, or messaging the client.

#### Mark Booked / Close Waitlist

Sets the waitlist request to `booked`.

Important: this is a **status-only update**. It does **not** lock a booking slot.

Use this only when:

- The booking was handled elsewhere.
- You intentionally want to close the waitlist request without using the slot-locking conversion.

For a real confirmed booking with slot locking, use **Move to Confirmed (Locks Slot)** instead.

#### Cancel Request

Sets the waitlist request to `cancelled` and records cancellation metadata.

Use this when:

- The client no longer wants the slot.
- The request is invalid.

### 5.7 Recommended Waitlist Workflow

1. Open **Waitlist**.
2. Sort by **Waiting first** or **Appointment date/time**.
3. Review the first queued client for a newly opened slot.
4. Contact the client.
5. Click **Mark Contacted**.
6. If the client accepts and the slot is available, click **Move to Confirmed (Locks Slot)**.
7. If the client declines, click **Cancel Request** or set the next appropriate status.
8. Continue down the queue in order.

---

## 6. Schedule Tab

The **Schedule** tab provides a calendar-style view of bookings.

Required permission: `canManageBookings` or `super_admin`.

### 6.1 Schedule Navigation Controls

Controls at the top include:

- **Previous** arrow - moves backward by one day in Day view or one week in Week view
- **Today** - returns to the current date
- **Next** arrow - moves forward by one day in Day view or one week in Week view
- **Day** - shows one day
- **Week** - shows a seven-day week view; this is the default view

The range label shows the active date or week range.

### 6.2 Status Legend

The schedule legend explains color/status indicators:

- Pending
- Confirmed
- Waitlisted
- Completed
- Cancelled

### 6.3 Calendar Event Grouping

Bookings are grouped by day and time bucket:

- Morning
- Afternoon
- Evening
- Late Night

Each event shows:

- Time
- Client name
- Service

### 6.4 Selecting a Booking

Click a calendar event to open details below the schedule grid.

If bookings exist in the visible date range, the console automatically selects the first visible booking when no booking is selected.

### 6.5 Schedule Details Panel

The detail card shows:

- Client name
- Booking ID
- Status
- Service
- Stylist
- Date
- Time
- Email
- Phone
- Special request
- Inspiration image link, if provided

### 6.6 Schedule Quick Actions

The details panel includes:

- **Previous Booking** - selects the previous visible booking
- **Next Booking** - selects the next visible booking
- Lifecycle-safe booking actions based on status:
  - Pending bookings: **Confirm**, **Cancel + Release Slot**
  - Confirmed bookings: **Complete + Release Slot**, **Cancel + Release Slot**
  - Waitlisted bookings: **Move to Confirmed** only; release actions are disabled until the booking is confirmed or handled from Waitlist
  - Completed/cancelled bookings: no quick lifecycle action

These status actions affect the same booking records as the **Bookings** tab.

### 6.7 Recommended Schedule Workflow

1. Open **Schedule** at the start of the day.
2. Click **Today**.
3. Choose **Day** for today’s appointments or **Week** for weekly planning.
4. Review each booking by clicking events.
5. Use quick actions to confirm pending bookings, complete confirmed bookings with slot release, or cancel/release pending/confirmed bookings as needed.
6. For waitlisted bookings, move them to confirmed first or manage cancellation from the **Waitlist** tab.

---

## 7. Gallery Tab

The **Gallery** tab manages style/gallery items displayed on the public website.

Required permission: `canManageContent` or `super_admin`.

### 7.1 Gallery Service Categories

At the top of the form, choose the service category for the style:

- Braids
- Hair
- Beauty Spa
- Nails
- Makeup
- Barber
- Massage
- Eyebrows & Lash
- Bridal / Event Packages

The selected category controls which form fields are shown and how featured labels are named.

### 7.2 Common Gallery Fields

All gallery entries use these fields:

| Field | Required | Description |
| --- | --- | --- |
| Style Name | Yes | Public-facing style name, e.g. `Boho Knotless Braids` |
| Style Type | Yes | Style/type label, e.g. `Knotless`, `Silk Press`, `Bridal Glam` |
| Service Name | Yes | Service this gallery item belongs to |
| Time Taken | Yes | Estimated or actual time, e.g. `4 hours` |
| Price Range | No | Optional public price label, e.g. `KSh 4,000 - 6,000` |
| Stylist Name | Yes | Stylist who did the work |
| After / Final Style Image | Required for new entries; optional while editing | Main public image |
| Before Image | No | Optional before image for before/after display |
| Trending checkbox | No | Marks item as trending for its category |
| Most Booked checkbox | No | Marks item as most booked for its category |

### 7.3 Braids-Specific Fields

When the category is **Braids**, these fields are required:

- **Length**: Short, Medium, or Long
- **Size**: Small, Medium, or Large
- **Hair Length/Type Used**: e.g. `20-inch human blend`

### 7.4 Hair-Specific Fields

When the category is **Hair**, these fields appear:

- **Hair Service Type**
- **Technique / Finish**
- **Client Hair Length/Volume**
- **Products / Color Mix Used**

Hair service type options include:

- Hair Styling
- Hair Cutting
- Hair Coloring
- Hair Relaxing
- Hair Treatment
- Wig Installation
- Weaving/Extensions
- Hair Washing & Blow Dry

Rules:

- Hair entries require **Hair Service Type**.
- Hair entries require **Technique / Finish**.
- For Hair Coloring, Hair Relaxing, and Hair Treatment, **Products / Color Mix Used** is required.
- For Hair Cutting, product/color mix may be hidden/not required.

### 7.5 Non-Braids / Non-Hair Categories

For Beauty Spa, Nails, Makeup, Barber, Massage, Eyebrows & Lash, and Bridal/Event Packages:

- Braids-only fields are hidden.
- Hair-only fields are hidden.
- Common fields still apply.

### 7.6 Live Preview

The **Live Preview** panel updates as you type and select images.

It previews:

- Style name
- Service/category/type information
- Stylist and time taken
- Featured tags
- Price tag
- Main image preview
- Before & After badge if a before image is selected

### 7.7 Publish Checklist

The checklist tracks required publishing readiness:

- Style name entered
- Style type entered
- Stylist name entered
- Time taken entered
- Final image selected

The progress meter helps staff complete the required information before saving. On edit, an existing image may already be present; selecting a new image is optional.

### 7.8 Creating a New Gallery Style

1. Open **Gallery**.
2. Select the correct service category.
3. Fill in all required common fields.
4. Fill in category-specific required fields.
5. Select an **After / Final Style Image**.
6. Optionally select a **Before Image**.
7. Optionally mark **Trending** or **Most Booked**.
8. Review the live preview and checklist.
9. Click **Save Gallery Style**.

Images are uploaded through a signed Cloudinary upload flow.

### 7.9 Editing a Gallery Style

1. Find the item in **Existing Gallery Styles**.
2. Click **Edit**.
3. The form changes to **Edit Gallery Style**.
4. Existing values are loaded into the form.
5. Change text, category, flags, or upload replacement images.
6. If you do not choose a new image, the existing image remains.
7. Click **Update Gallery Style**.
8. To exit editing without saving, click **Cancel Edit**.

### 7.10 Deleting a Gallery Style

1. Click **Delete** on the item.
2. Confirm deletion in the modal.
3. The gallery style is permanently removed from Firestore.

Deleting a gallery item does not automatically remove images from Cloudinary.

### 7.11 Opening the Live Gallery

Click **Open Live Gallery** to view the public website gallery section in a new tab.

---

## 8. Blogs Tab

The **Blogs** tab manages blog/news/content cards displayed on the public site.

Required permission: `canManageContent` or `super_admin`.

### 8.1 Blog Form Fields

| Field | Required | Description |
| --- | --- | --- |
| Blog Title | Yes | Public blog title |
| Short Description | Yes | 1-2 sentence excerpt shown on the site |
| Read Time | Yes | Example: `5 min read` |
| Publish Date | Yes | Date shown for the post |
| Read More URL | Yes | External or internal URL opened by the public blog card |
| Blog Image | Required for new posts; optional while editing | Main blog card image |

### 8.2 Creating a New Blog Post

1. Open **Blogs**.
2. Fill in title, description, read time, publish date, and URL.
3. Choose a blog image.
4. Click **Save Blog**.

### 8.3 Editing a Blog Post

1. In **Existing Blogs**, click **Edit**.
2. The form changes to **Edit Blog**.
3. Existing values are loaded.
4. Update fields as needed.
5. Select a new image only if you want to replace the existing image.
6. Click **Update Blog**.
7. Click **Cancel Edit** to leave edit mode without saving.

### 8.4 Deleting a Blog Post

1. Click **Delete** on the blog item.
2. Confirm deletion.
3. The blog document is permanently deleted.

### 8.5 Existing Blogs List

Each blog item can show:

- Image or `No Image` placeholder
- Title
- Publish date
- Read time
- Excerpt
- **Open Article** link
- **Edit** and **Delete** actions

### 8.6 Blog Scroll Controls

If many blog posts exist, use:

- **Prev**
- **Next**

These scroll the admin blog list.

### 8.7 Opening the Live Blog

Click **Open Live Blog** to view the public blog section in a new tab.

---

## 9. Reviews Tab

The **Reviews** tab moderates client reviews before they appear publicly.

Required permission: `canManageContent` or `super_admin`.

### 9.1 Review Statistics

Counters show:

- **Total**
- **Pending**
- **Approved**
- **Rejected**

### 9.2 Review Sort Options

Use **Sort Reviews**:

- **Featured** - featured reviews first, then recent activity
- **Newest** - newest/most recently updated first
- **Highest Rated** - highest rating first, then featured/recent

### 9.3 Content / Profanity Filter

The **Basic Profanity / Content Check** area lets admins maintain a comma-separated blocked-term list.

Default examples include common profanity and spam terms.

How to update it:

1. Enter blocked terms separated by commas.
2. Click **Save Filter List**.

Important behavior:

- The list is stored in the browser's local storage for the admin browser.
- When you click **Approve**, the review text is checked against this list.
- If blocked terms are found, approval is blocked until the text is edited.

### 9.4 Review Card Information

Each review card may show:

- Client name
- Review ID
- Review source
- Status badge
- Star rating
- Service
- Featured state
- Verified booking state
- Reports count
- Approved by
- Approved at
- Review text
- Editable review text textarea
- Review photo, if submitted
- Admin reply textarea for low/negative ratings

### 9.5 Review Actions

#### Save Edit

Updates the review text.

Rules:

- Review text must be at least 10 characters.
- Saving an edit resets the review status to `pending`.

Use this when:

- You need to remove blocked words.
- You need to correct formatting or obvious issues.

#### Save Reply

Saves an admin reply for negative/low-rated feedback.

This appears only for reviews with rating 3 or below.

#### Set Pending

Moves the review back to `pending`.

#### Approve

Marks the review as `approved`.

Important behavior:

- The blocked-term list is checked before approval.
- If flagged words exist, approval is stopped.
- Approved reviews are eligible to appear publicly.
- `approvedBy` and `approvedAt` metadata are recorded.

#### Reject

Marks the review as `rejected`.

Use this for spam, inappropriate content, or invalid feedback.

#### Feature / Unfeature

Toggles whether the review is featured.

Use this for standout testimonials you want prioritized in the public review display.

#### Delete

Permanently deletes the review after confirmation.

### 9.6 Recommended Review Moderation Workflow

1. Open **Reviews**.
2. Sort by **Newest** or **Featured**.
3. Review all pending submissions.
4. Check rating, service, text, reports, and verified booking status.
5. For acceptable reviews, click **Approve**.
6. For inappropriate reviews, click **Reject** or **Delete**.
7. For negative but legitimate feedback, write an admin reply and save it.
8. Feature only the strongest approved testimonials.

### 9.7 Opening Live Reviews

Click **Open Live Reviews** to view the public testimonials section in a new tab.

---

## 10. Messages Tab

The **Messages** tab manages contact form submissions.

Required permission: `canManageContent` or `super_admin`.

### 10.1 Message Statistics

Counters show:

- **Total**
- **New**
- **Read**
- **Resolved**

### 10.2 Message Sort Options

Use **Sort Messages**:

- **Newely Added** - newest/most recently updated first. This is the current UI label and should be read as "Newly Added".
- **Old** - oldest first
- **New Status First** - `new`, then `read`, then `resolved`
- **Unresolved First** - unresolved messages before resolved messages
- **Name (A-Z)** - alphabetical by sender name

### 10.3 Message Status Filters

The Messages tab includes status filter buttons for:

- **New**
- **Read**
- **Resolved**

Use these filters when you want to focus on one part of the contact inbox. The selected filter is highlighted and marked with `aria-pressed="true"` for accessibility. Clicking the active filter again clears the filter and returns to all messages.

If no messages match the selected status, the list shows an empty-state message such as `No Resolved messages match this filter right now.`

### 10.4 Message Statuses

Messages use these statuses:

- `new`
- `read`
- `resolved`

### 10.5 Message Card Information

Each message can show:

- Sender name
- Message ID
- Status badge
- Email mail link
- Subject
- Sent timestamp
- Updated timestamp
- Message content

### 10.6 Message Actions

#### Mark New

Sets status to `new`.

Use this when a message needs fresh attention.

#### Mark Read

Sets status to `read`.

Use this after staff have seen the message but have not finished handling it.

#### Resolve

Sets status to `resolved`.

Use this after the client issue or request has been handled.

#### Delete

Permanently deletes the contact message after confirmation.

### 10.7 Recommended Message Workflow

1. Open **Messages**.
2. Use the **New** filter or sort by **New Status First** / **Unresolved First**.
3. Read new messages.
4. Contact the client using the email link if needed.
5. Mark as **Read** while in progress.
6. Use the **Read** filter for messages currently being handled.
7. Mark as **Resolved** after handling.
8. Use the **Resolved** filter to audit recently completed messages.
9. Delete only spam or messages that no longer need to be retained.

---

## 11. Services Tab

The **Services** tab controls which service categories are visible on the public website and booking form.

Required permission: `canManageContent` or `super_admin`.

### 11.1 What Service Visibility Controls Affect

When saved, service category settings affect the public website live:

- Public Services section tabs/cards
- Booking form service dropdown options
- Public gallery/filter results for disabled categories

Important: disabling a category does **not** delete gallery items, bookings, or service records. It only hides that category from public-facing flows that respect the setting.

### 11.2 Managed Categories

The Services tab manages these categories:

- Braids Services
- Hair Services
- Beauty Spa Services
- Nail Services
- Makeup Services
- Barber Services
- Massage & Wellness
- Eyebrow & Lash Services
- Bridal / Event Packages

### 11.3 Active and Inactive Groups

The tab displays categories in two groups:

- **Active Services** - visible on the live website and booking form
- **Inactive Services** - hidden from public view until re-enabled

The summary shows:

- Active count
- Inactive count

### 11.4 Changing Category Visibility

1. Open **Services**.
2. Toggle categories ON/OFF.
3. Review the Active/Inactive grouping.
4. Click **Save Category Settings**.

The setting is saved to:

```txt
siteSettings/serviceCategories
```

with:

- `categories`
- `updatedAt`
- `updatedBy`

### 11.5 Recommended Services Workflow

Use this tab when:

- The salon temporarily stops offering a service category.
- A service category is not ready for public booking.
- Seasonal service categories need to be hidden or restored.

After saving, open the public website to confirm the category is hidden or visible as expected.

---

## 12. Admins Tab

The **Admins** tab manages admin access records and delegated permissions.

Required role: `super_admin`.

### 12.1 Admin Statistics

Counters show:

- **Total Admins**
- **Active**
- **Super Admin**
- **Standard Admin**

### 12.2 Creating Admin Access

Use **Create Admin Access** to grant a Firebase Authentication user access to the Admin Console.

Fields:

| Field | Required | Description |
| --- | --- | --- |
| Admin Email | Yes | Must already exist in Firebase Authentication |
| Display Name | No | Friendly staff/admin name |
| Role | Yes | `Admin` or `Super Admin` |
| Account Active | Yes | Controls whether this user may enter the console |
| Permissions | Depends on role | Controls visible tabs for standard admins |

Steps:

1. Confirm the person already has a Firebase Authentication account.
2. Open **Admins**.
3. Enter the admin email.
4. Optionally enter display name.
5. Select role.
6. Set account active/inactive.
7. Select permissions.
8. Click **Create Admin**.

### 12.3 Admin Roles

#### Super Admin

Super Admins have all permissions and can manage other admins.

When `Super Admin` is selected:

- All permission checkboxes are automatically enabled.
- Permission checkboxes are locked/disabled.

#### Admin

Standard Admins receive only selected permissions.

Common examples:

- Front desk operations: `Manage Bookings`
- Content manager: `Manage Content`
- Security officer: `Manage Security`

### 12.4 Permission Flags

| Permission | Effect |
| --- | --- |
| Manage Admins | Stored on the admin profile; current UI still restricts the Admins tab to `super_admin` role |
| Manage Bookings | Enables Bookings, Waitlist, Schedule |
| Manage Content | Enables Gallery, Blogs, Reviews, Messages, Services |
| Manage Security | Enables Security |

### 12.5 Editing Admin Access

1. Find the admin in **Existing Admin Access Records**.
2. Click **Edit**.
3. The form changes to **Update Admin Access**.
4. Update role, status, display name, or permissions.
5. Click **Update Admin**.
6. Click **Cancel Edit** to leave edit mode.

Existing admin record cards can show:

- Display name, email, and UID
- Active/inactive status badge
- Role badge
- Permission summary for admin, booking, content, and security access
- **Edit** action
- **Enabled** / **Disabled** account access toggle, when the current Super Admin is allowed to change it

### 12.6 Searching and Filtering Admins

Use:

- **Search Admins** - search by name, email, or UID
- **Role Filter** - All Roles, Super Admin, Admin
- **Status Filter** - All Statuses, Active, Inactive

### 12.7 Enabling or Disabling Admin Access

Each admin record has an enabled/disabled toggle.

Rules:

- Only Super Admins can enable/disable admin accounts.
- A Super Admin cannot disable their own account from the toggle.
- Toggles that cannot be changed are disabled and may show a tooltip explaining why.
- Disabling an admin prevents that account from accessing the panel.
- There is no ordinary delete button; disable access instead of deleting records.

### 12.8 Audit and Security Notes

Admin mutations are handled through callable backend functions, not direct client writes.

Related backend actions include:

- Create admin access
- Update admin access
- List admin users

Delegation changes are expected to be recorded in admin audit logs by the backend.

---

## 13. Security Tab

The **Security** tab monitors login activity, sessions, alerts, account history, and user behavior timeline. It also provides incident-response actions for linked user accounts.

Required permission: `canManageSecurity` or `super_admin`.

### 13.1 Privacy Notice

The security view shows only security-relevant metadata:

- Masked IP
- City/country or location label
- Device/browser
- Login status
- Risk and suspicious event metadata

The system does **not** store or display:

- Passwords
- Exact IP addresses
- Exact GPS coordinates

### 13.2 Main Security Counters

The top counters show:

- **Total Logins**
- **Success**
- **Failed**
- **Suspicious**
- **Locked Accounts**
- **Repeated Wrong Passwords**
- **High Risk Logins**
- **Online Users**

Use these counters for quick situational awareness.

### 13.3 Daily KPI Widgets

The second counter group focuses on the current day:

- **Total Logins Today**
- **Active Users Now**
- **Failed Login Attempts**
- **New Registrations**
- **Returning Customers**
- **Anonymous Users Count**
- **Google Sign-in Count**
- **Email Sign-in Count**

Widgets may visually warn when activity exceeds internal thresholds.

### 13.4 Session and Event Counters

Additional counters show:

- **Online Sessions**
- **Multi-Device Users**
- **Security Alerts**
- **Open Alerts**
- **High Severity Alerts**
- **Account Changes**
- **Tracked Sessions**
- **Timeline Events**

### 13.5 Login Activity Controls

Use these controls to narrow the login activity table.

#### Sort Activity

- Newest
- Oldest
- Failed First
- Suspicious First

#### Sign-in Provider

- All Providers
- Google
- Email/Password
- Anonymous
- Unknown

#### Risk Filter

- All Risks
- High
- Medium
- Low

When a specific risk filter is selected, a filter badge appears above the table.

#### Date Filters

- **Date** - exact date
- **From** - start date
- **To** - end date

#### Device Filter

- All Devices
- Desktop
- Mobile
- Tablet
- Unknown

#### User Filter

- All Users
- Known Users
- Anonymous

#### Country Filter

Type a country or location fragment, e.g. `Kenya`.

#### Login Status Filter

- All Statuses
- Successful Logins
- Failed Logins

#### Search

Search by:

- Email
- Username/display name
- UID
- Log ID / booking-related ID if present in the log metadata

Note: the visible search placeholder is **Email, Username, or Booking ID**, but the runtime search also checks UID and log/activity IDs where those values are present.

#### Clear All Filters

Resets all filters to defaults and refreshes the visible table.

### 13.6 Exporting Security Logs

The Security tab can export currently visible/filtered login rows.

Buttons:

- **Export CSV**
- **Export Excel**

Exports include columns such as:

- Timestamp
- User
- Email
- UID
- Method
- Device
- Browser
- Country
- Location
- Status
- Risk Level
- Risk Score
- Trust Score
- Failed Attempts in 5 minutes
- Failed Attempts in 15 minutes
- Lock Active
- ID

Important:

- Export respects the current filters.
- Export uses the currently visible login activity rows after sort, risk, provider, date, device, user, country, status, and search filters are applied.
- If no rows are visible, the console shows an error instead of downloading a file.

### 13.7 Login Activity Table

The table includes:

- User
- Method
- Device/browser
- Location
- Masked IP
- Status
- Failed attempts in 5-minute and 15-minute windows
- Lock status
- Risk level and score
- Trust score
- Risk reasons
- Suspicious flags
- Security action controls
- Timestamp

Risk levels are:

- `low`
- `medium`
- `high`

Login statuses are:

- `success`
- `failure`

Suspicious flags can include repeated failures, rapid login patterns, or other backend-detected anomalies.

### 13.8 Per-User Security Actions

Security actions appear only when a login activity row is linked to a known user UID.

Rows without a linked UID show a no-linked-account message instead of incident-response buttons.

#### Temp Block

Temporarily blocks the account.

Flow:

1. Click **Temp Block**.
2. Enter block duration in minutes.
3. Valid range: 5 to 10080 minutes.
4. Default prompt value: 60 minutes.
5. Confirm the action.

Use this for suspicious short-term behavior while investigating.

#### Force Logout

Forces the user out of active sessions.

Use this when:

- The account may be compromised.
- You need the user to re-authenticate.

#### Force Password Reset

Forces the user to reset their password and ends current sessions.

Use this when:

- There is a suspected credential compromise.
- The user reports suspicious access.

#### Clear Restrictions

Clears active restrictions for the account.

Use this when:

- A temporary block is no longer needed.
- A forced password reset or logout restriction should be removed.

### 13.9 Session Tracking Table

The sessions table monitors active and recent user sessions.

Sort options:

- **Online First**
- **Last Active (Newest)**
- **Longest Session**
- **Multi-Device First**

Columns include:

- User
- Device/browser
- Online/offline status
- Last active time
- Session duration
- Device count / multi-device indicator

Important behavior:

- A session is treated as online only if its heartbeat is recent.
- The console considers sessions stale after about 2 minutes without heartbeat activity.

### 13.10 Security Alerts Table

Security alerts come from backend/system detection.

Sort options:

- Newest
- Oldest
- High Severity First
- Open First

Each alert can show:

- Alert message
- User
- Severity
- Status
- Time

Severity levels:

- `low`
- `medium`
- `high`

Alert statuses:

- `open`
- `investigating`
- `resolved`

### 13.11 Account Change History Table

This table shows account-level security/history events.

Sort options:

- Newest
- Oldest
- Critical First
- Change Type

Critical types include changes such as:

- Password changed
- Email changed
- Account deleted
- Account deactivated

Each row shows:

- Change label
- User
- Details
- Time

### 13.12 Activity Timeline Table

The timeline table tracks broader user behavior and system activity.

Sort options:

- Newest
- Oldest
- Bookings First
- Reviews First
- Contact First

Recognized event types include:

- Booking Created
- Booking Canceled
- Review Posted
- Review Edited
- Contact Submitted
- Activity

Each row shows:

- Time
- Event type
- User
- Summary

### 13.13 Recommended Security Response Workflow

1. Open **Security**.
2. Review top counters for spikes in failed/suspicious/high-risk logins.
3. Sort login activity by **Suspicious First** or **Failed First**.
4. Filter by risk, provider, device, country, status, or date.
5. Inspect failed attempt windows, lock state, risk score, trust score, and suspicious flags.
6. For known compromised accounts, use **Temp Block**, **Force Logout**, or **Force Password Reset**.
7. Export filtered logs if an incident report is needed.
8. Review sessions for multi-device anomalies.
9. Review alerts, account change history, and timeline events for context.
10. Clear restrictions only after confirming the account is safe.

---

## 14. Confirmation Modal and Destructive Actions

The console uses a confirmation modal for important or irreversible actions.

The modal contains:

- A message explaining the action
- **Cancel**
- **Confirm** or a specific confirm label, such as **Delete Blog**

You can cancel by:

- Clicking **Cancel**
- Clicking outside the dialog
- Pressing `Escape`

Actions that use confirmation include:

- Deleting gallery styles
- Deleting blog posts
- Deleting reviews
- Deleting contact messages
- Enabling/disabling admin accounts
- Security incident-response actions

Always read the confirmation message before continuing.

---

## 15. Realtime Data Sources and System Dependencies

### 15.1 Main Firestore Collections Used by Admin Console

| Admin Area | Firestore / Query Source |
| --- | --- |
| Admin access check | `adminUsers/{uid}` |
| Bookings | `bookings` |
| Booking slot release | `bookingSlots/{slotId}` |
| Waitlist | `waitlist` |
| Gallery | `galleryStyles` |
| Blogs | `blogs` |
| Reviews | `reviews` |
| Messages | `contactMessages` |
| Services visibility | `siteSettings/serviceCategories` |
| Admin user listing | callable admin user functions / `adminUsers` records |
| Login activity | `loginActivities` |
| User sessions | collection group query on `sessions` |
| Users for security widgets | `users` |
| Security alerts | `securityAlerts` |
| Account history | `accountChangeHistory` |
| Activity timeline | `activityTimeline` |

### 15.2 Backend Callable Functions Used by Admin Console

The Admin Console relies on backend callable functions for protected actions, including:

- Signed Cloudinary upload setup
- Admin security account restrictions
- Admin user creation/update/listing
- Moving waitlisted bookings to confirmed with slot locking
- Completing or cancelling bookings while safely releasing slot locks

If these functions are not deployed or configured, related UI actions may fail.

### 15.3 Image Upload Dependency

Gallery and blog image uploads use Cloudinary through a signed upload flow.

If uploads fail, check:

- Cloud Functions deployment
- Cloudinary secrets/configuration
- Network connectivity
- Browser console errors

### 15.4 Firestore Rules Dependency

Admin reads and writes depend on Firestore security rules.

If a permission error appears:

- Confirm the admin is logged in.
- Confirm the admin access record is active.
- Confirm required permission flags are present.
- Confirm latest Firestore rules are deployed.
- Sign out and sign back in after rule or role changes.

---

## 16. Recommended Daily Operating Procedures

### 16.1 Opening Procedure

1. Log in to the Admin Console.
2. Open **Bookings** and review pending bookings.
3. Open **Schedule** and check today’s appointments.
4. Open **Waitlist** and check urgent slot requests.
5. Open **Messages** and review new contact messages.
6. Open **Reviews** and moderate pending reviews.
7. Open **Security** and check failed/suspicious login activity.

### 16.2 Booking Operations Procedure

1. Confirm valid pending bookings.
2. Cancel invalid bookings and release slots.
3. Complete bookings after service delivery.
4. Use Schedule for day/week operational visibility.
5. Use Waitlist to fill released slots.

### 16.3 Content Publishing Procedure

1. Add or update gallery styles with complete metadata and clear images.
2. Add or update blog posts with working read-more URLs.
3. Review public site links using **Open Live Gallery** and **Open Live Blog**.
4. Moderate reviews before public visibility.

### 16.4 Security Monitoring Procedure

1. Review daily failed login count.
2. Filter high-risk activity.
3. Investigate repeated wrong passwords and active locks.
4. Review multi-device sessions.
5. Apply account restrictions only when necessary.
6. Export logs for serious incidents.

---

## 17. Troubleshooting Guide

### 17.1 Cannot Log In

Check:

- Email/password are correct.
- Firebase Auth Email/Password provider is enabled.
- User exists in Firebase Authentication.
- User has an `adminUsers/{uid}` record.
- Admin record is active.
- Firebase config exists in `client-config.js` / `APP_CONFIG`.

### 17.2 Logged In but Some Tabs Are Missing

This is usually permission-based.

Ask a Super Admin to check your admin access record:

- Bookings/Schedule/Waitlist require `canManageBookings`.
- Gallery/Blogs/Reviews/Messages/Services require `canManageContent`.
- Security requires `canManageSecurity`.
- Admins requires `super_admin` role.

### 17.3 Permission Denied Errors

Try:

1. Sign out.
2. Refresh the page.
3. Sign in again.
4. Confirm Firestore rules are deployed.
5. Confirm the admin access record and permissions.

For session tracking permission errors after rule changes, sign out and back in, then refresh the page.

### 17.4 Realtime Data Not Updating

Check:

- Browser console for listener errors.
- Internet connection.
- Firestore rules.
- Whether the relevant collection has documents.
- Whether the admin has permission to the tab.

### 17.5 Image Upload Fails

Check:

- Cloud Functions are deployed.
- Cloudinary secrets are configured.
- The file is a valid image.
- Network requests to Cloudinary are not blocked.

### 17.6 Waitlisted Booking Cannot Move to Confirmed

Likely cause: preferred slot is still occupied.

Fix:

1. Find the booking currently occupying that slot.
2. If appropriate, use **Cancel + Release Slot**.
3. Return to Waitlist.
4. Try **Move to Confirmed (Locks Slot)** again.

### 17.7 Review Cannot Be Approved

Likely cause: blocked terms found in review text.

Fix:

1. Review the blocked-term list.
2. Edit the review text if appropriate.
3. Save the edit; status returns to pending.
4. Approve again.

### 17.8 Public Site Does Not Reflect Service Visibility Changes

Try:

1. Confirm **Save Category Settings** was clicked.
2. Refresh the public website.
3. Check Firestore document `siteSettings/serviceCategories`.
4. Confirm public runtime has no console errors.

### 17.9 Admin Access Changes Do Not Take Effect Immediately

Ask the affected admin to:

1. Log out.
2. Refresh the admin page.
3. Log back in.

---

## 18. Best Practices and Safety Rules

### 18.1 Booking Safety

- Use **Confirm** only when the salon can honor the appointment.
- Use **Complete + Release Slot** only after the service is finished and the booking is confirmed.
- Use **Cancel + Release Slot** carefully because it frees the slot and may notify waitlisted clients.
- Do not complete or cancel waitlisted bookings from booking/schedule cards; move them to confirmed first or cancel the linked waitlist request from the **Waitlist** tab.
- Do not use **Mark Booked / Close Waitlist** as a substitute for slot locking.

### 18.2 Waitlist Fairness

- Prioritize clients by queue position for the same slot.
- Contact the first queued client before moving to the next.
- Record manual contact by clicking **Mark Contacted**.

### 18.3 Content Quality

- Use clear, high-quality gallery and blog images.
- Use accurate service categories.
- Keep style names, timings, and prices consistent.
- Avoid deleting content unless you are certain it should be removed.

### 18.4 Review Moderation

- Approve genuine, useful reviews.
- Reject spam or abusive content.
- Respond professionally to negative feedback.
- Feature only strong testimonials.

### 18.5 Admin Access Control

- Give staff the minimum permissions they need.
- Keep Super Admin access limited to trusted owners/managers.
- Disable admin accounts immediately when staff leave.
- Do not share admin credentials.

### 18.6 Security Response

- Investigate before applying restrictions when possible.
- Use temporary blocks for short-term protection.
- Use force password reset for suspected account compromise.
- Export logs for serious incidents.
- Clear restrictions only after confirming the account is safe.

---

**Manual status:** This guide was reviewed against the current Admin Console structure and behavior implemented in `public/admin.html` and `public/JS/admin.js`.