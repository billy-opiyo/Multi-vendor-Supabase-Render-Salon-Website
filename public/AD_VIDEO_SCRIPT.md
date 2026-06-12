# Royal Braids / Salon Shop - Ad Video and Demo Script Guide

Production-ready recording guide for showcasing the current **Supabase + Render + Vercel** Royal Braids salon platform.

This document is deeper than a simple narration script. It includes pre-production guidance, privacy rules, shot planning, full demo narration, short social scripts, technical architecture narration, admin-operations narration, and editing notes.

---

## 1. Video goal

Show Royal Braids as a complete digital salon platform for:

- Customer discovery.
- Online appointment booking.
- Waitlist and schedule management.
- Client self-service dashboard.
- Public content and trust-building.
- Staff/admin operations.
- Security, auditability, and automation.
- Modern production architecture.

The viewer should understand that this is not only a salon homepage. It is a working business system with customer, staff, admin, backend, database, media, and notification workflows.

---

## 2. Target audiences

### Salon owner / business audience

Focus on outcomes:

- More professional customer experience.
- Easier booking and follow-up.
- Better staff visibility.
- Less manual scheduling confusion.
- Content updates without code changes.
- Stronger security and admin control.

### Customer audience

Focus on convenience:

- Browse styles and services.
- Book from phone or desktop.
- Join waitlist when a slot is full.
- Manage appointments in dashboard.
- Contact salon easily.

### Technical/client handoff audience

Focus on architecture:

- Static frontend on Vercel.
- Supabase Auth/Postgres/RLS.
- Render backend for trusted workflows.
- Cloudinary media.
- Notification outbox and scheduled jobs.

---

## 3. Privacy and demo-data rules

Before recording:

- Use demo accounts only.
- Use demo customer names, phone numbers, emails, and bookings.
- Do not show production Supabase dashboard, Render dashboard, provider dashboards, or `.env` files unless carefully redacted.
- Do not show service-role keys, JWTs, API keys, provider tokens, job secrets, or database passwords.
- Do not show real customer phone numbers, emails, addresses, messages, reviews, IP addresses, or login history.
- Blur browser address/query strings if they contain tokens.
- Disable browser password manager popups.
- Close unrelated tabs and notifications.
- Use a clean desktop wallpaper and browser profile.

Safe demo examples:

```txt
Customer: Amina Demo
Email: amina.demo@example.com
Phone: +254 700 000 000
Admin: Royal Admin Demo
Service: Knotless Braids
Stylist: Fatima Hassan
```

---

## 4. Recording setup checklist

- Open the live Vercel site or local static server for `public/index.html`.
- Open `public/admin.html` in a separate tab/window.
- Confirm Render `/health` is working.
- Confirm demo login credentials work.
- Confirm demo admin has appropriate permissions.
- Confirm booking form has safe demo services/stylists.
- Prepare sample gallery/blog/review content.
- Set browser zoom to 90%-100% depending on screen size.
- Record desktop first, then mobile responsive view.
- Use 1080p or higher recording resolution.
- Record voice-over separately if possible for cleaner audio.

---

## 5. Suggested visual style

Use a premium, polished presentation:

- Slow cursor movement.
- Smooth scrolling.
- Short pauses on important UI states.
- Zoom-ins for labels, buttons, and status changes.
- Gold/black/premium visual overlays matching Royal Braids branding.
- Captions for every major feature.
- Simple architecture icons for Supabase, Render, Vercel, Cloudinary, email, and WhatsApp.

Avoid:

- Rapid clicking.
- Long waits on loading screens.
- Showing browser console unless the video is technical.
- Displaying raw JSON errors in a marketing video.

---

## 6. Full showcase script: 4-6 minutes

### Scene 1 - Opening hook

- **Estimated time:** 0:00-0:20
- **Visuals:** Splash screen, Royal Braids logo, homepage hero, smooth reveal.
- **Text overlay:** `Royal Braids - A Complete Digital Salon Platform`

**Voice-over:**

> Welcome to Royal Braids, a premium salon experience brought online through a complete digital platform for beauty discovery, bookings, client care, staff operations, and business management.

**Purpose:** Establish that the product is polished, brand-ready, and more than a basic website.

---

### Scene 2 - Homepage and brand experience

- **Estimated time:** 0:20-0:45
- **Visuals:** Hero section, navigation, calls to action, contact/location snippets, mobile menu preview.
- **Text overlay:** `Elegant brand experience • Desktop and mobile ready`

**Voice-over:**

> The public website gives customers a professional first impression with responsive design, premium salon branding, clear navigation, location and contact details, and direct calls to book or explore services.

**Shot notes:** Show desktop hero, then quickly resize or cut to mobile menu.

---

### Scene 3 - Services catalog

- **Estimated time:** 0:45-1:15
- **Visuals:** Services section, category tabs, service cards, prices, durations, service booking buttons.
- **Text overlay:** `Service categories • Pricing • Duration • Bookable options`

**Voice-over:**

> Customers can browse service categories, compare prices and durations, understand what each service includes, and move directly from discovery to booking. The catalog is configurable for different salon services, stylists, and packages.

**Shot notes:** Show a few categories such as Braids, Hair, Nails, Makeup, and Bridal/Event Packages.

---

### Scene 4 - Gallery and style discovery

- **Estimated time:** 1:15-1:45
- **Visuals:** Gallery filters, featured rail, before/after item, lightbox, favorites if available.
- **Text overlay:** `Gallery • Filters • Before/after • Cloudinary media`

**Voice-over:**

> The gallery helps customers discover their next look with style filters, featured images, before-and-after inspiration, and media workflows backed by Cloudinary through secure Render signing.

**Shot notes:** Use approved demo images only.

---

### Scene 5 - Online booking

- **Estimated time:** 1:45-2:25
- **Visuals:** Booking form, selected service/date/time/stylist, submit flow, confirmation or waitlist message.
- **Text overlay:** `Slot-safe online booking • Render transaction workflow`

**Voice-over:**

> Booking is handled through the trusted Render backend. Customers choose a service, time, and stylist, while backend transaction logic checks availability and protects the salon from double booking.

**Shot notes:** Use a demo booking. If showing a confirmation, avoid real customer data.

---

### Scene 6 - Waitlist fallback

- **Estimated time:** 2:25-2:50
- **Visuals:** Waitlist prompt or queue information, dashboard waitlist status if available.
- **Text overlay:** `Unavailable slot? Keep the customer in the queue`

**Voice-over:**

> When a preferred slot is no longer available, the system can preserve customer demand through a waitlist, including queue position information and backend-managed conversion when a slot opens.

**Shot notes:** If live waitlist demo is difficult, use an overlay graphic or prepared test record.

---

### Scene 7 - Client account and dashboard

- **Estimated time:** 2:50-3:25
- **Visuals:** Auth modal, dashboard tabs, appointments, profile, favorites, login history/security activity.
- **Text overlay:** `Supabase Auth • Client dashboard • Self-service`

**Voice-over:**

> Clients can sign in securely with Supabase Auth, view appointments, manage profile details, save favorite styles, review activity, and use self-service actions like cancellation or rescheduling where salon policy allows.

**Shot notes:** Use demo customer account.

---

### Scene 8 - Reviews, blog, and contact

- **Estimated time:** 3:25-3:55
- **Visuals:** Reviews section, blog cards, contact form, location/contact information.
- **Text overlay:** `Reviews • Blog • Contact messages`

**Voice-over:**

> Royal Braids also supports trust-building content: moderated reviews, salon blog posts, and contact messages that flow into the backend and admin console for follow-up.

---

### Scene 9 - Admin console access

- **Estimated time:** 3:55-4:20
- **Visuals:** Admin login, permission-scoped tabs, dashboard overview.
- **Text overlay:** `Private admin console • Role-based access`

**Voice-over:**

> Behind the customer experience is a private admin console protected by Supabase Auth and database-backed permissions, so staff only see and manage the sections they are allowed to access.

**Shot notes:** Blur or use demo admin account.

---

### Scene 10 - Booking operations, waitlist, and schedule

- **Estimated time:** 4:20-5:00
- **Visuals:** Bookings tab, status filters, waitlist queue, schedule day/week views.
- **Text overlay:** `Bookings • Waitlist • Schedule • Lifecycle-safe actions`

**Voice-over:**

> Staff can monitor appointment activity, confirm or cancel bookings, release slots, convert waitlisted customers, and view daily or weekly schedules. These actions run through protected backend workflows so slot, notification, activity, and audit records stay consistent.

---

### Scene 11 - Content, services, admins, and security

- **Estimated time:** 5:00-5:35
- **Visuals:** Gallery, Blogs, Reviews, Messages, Services, Admins, Security tabs.
- **Text overlay:** `Content management • Admin delegation • Security monitoring`

**Voice-over:**

> The same console lets authorized staff manage gallery styles, blog posts, reviews, contact messages, services, admin users, audit trails, login activity, alerts, and account restrictions.

---

### Scene 12 - Architecture close

- **Estimated time:** 5:35-6:00
- **Visuals:** Architecture diagram/icons: Vercel, Supabase, Render, Cloudinary, Resend, WhatsApp.
- **Text overlay:** `Vercel • Supabase • Render • Cloudinary • Resend • WhatsApp`

**Voice-over:**

> The platform is built on a modern production stack: Vercel for fast static delivery, Supabase for Auth and Postgres, Render for trusted backend workflows, Cloudinary for media, and email and WhatsApp integrations for customer communication.

**Closing overlay:** `Royal Braids - Beauty, bookings, and business operations in one platform.`

---

## 7. 60-second social script

**Format:** Vertical or square, fast cuts, captions required.

**Voice-over:**

> Meet Royal Braids - a complete salon website and management platform. Customers can explore services, browse the gallery, book appointments, join waitlists, sign in, and manage their dashboard. Staff get a private admin console for bookings, schedules, waitlists, gallery styles, blogs, reviews, messages, services, admins, and security. Built with Supabase, Render, Vercel, Cloudinary, email, and WhatsApp automation, Royal Braids turns a salon website into a full digital business system.

**Suggested overlay sequence:**

```txt
Royal Braids
Premium Salon Website
Online Booking
Waitlist + Schedule
Client Dashboard
Admin Console
Content Management
Security Monitoring
Supabase + Render + Vercel
Email + WhatsApp Automation
```

---

## 8. 30-second short ad script

**Voice-over:**

> Royal Braids brings the salon experience online. Customers can browse services, explore styles, book appointments, join a waitlist, and manage their account. Staff can manage bookings, schedules, content, reviews, messages, admins, and security from one private console. Powered by Supabase, Render, and Vercel - it is a complete digital platform for a modern salon.

**Shot order:**

1. Hero/logo.
2. Services.
3. Gallery.
4. Booking form.
5. Client dashboard.
6. Admin bookings/schedule.
7. Security/architecture close.

---

## 9. Technical architecture demo script: 2-3 minutes

Use this version for developers, project handoff, or client technical review.

**Voice-over:**

> This platform uses a static frontend served from Vercel and a trusted backend hosted on Render. The browser loads public configuration from `client-config.js`, authenticates users with Supabase Auth, and uses a Render API adapter to call protected backend workflows with the Supabase access token. Supabase owns Postgres tables, RLS policies, migrations, Auth users, and sessions. Render owns service-role workflows such as booking transactions, waitlist conversion, admin authorization, notification outbox jobs, security actions, and Cloudinary signing. This keeps secrets out of the browser while still allowing the static website and admin console to operate as a full production salon system.

**Suggested visuals:**

- Show `public/index.html` and `public/admin.html` as static shells.
- Show `client-config.js` as browser-safe config only; do not zoom into real keys.
- Show a simple architecture diagram.
- Show Render health endpoint.
- Show Supabase tables only with demo data or blurred rows.
- Show a booking flow moving through frontend -> Render -> Supabase.

---

## 10. Admin operations demo script: 2-4 minutes

**Voice-over:**

> The admin console gives salon staff a controlled operating dashboard. After signing in with Supabase Auth, the console checks the admin user row and displays only the tabs allowed by that role. Booking managers can confirm, cancel, release, and complete appointments. Waitlist tools help convert customers when slots open. The Schedule tab gives day and week visibility. Content managers can update gallery images, blog posts, reviews, messages, and services. Security managers can review login activity, alerts, account changes, and restrictions. Every sensitive workflow is handled by Render so changes can be validated, audited, and kept consistent with the database.

**Suggested visuals:**

1. Admin login.
2. Permission-scoped tabs.
3. Booking action.
4. Waitlist conversion.
5. Schedule view.
6. Content update.
7. Security dashboard.

---

## 11. Shot list by feature

| Feature              | Visual shot                            | Must mention                                            |
| -------------------- | -------------------------------------- | ------------------------------------------------------- |
| Branding             | Splash + hero                          | Premium salon experience.                               |
| Navigation           | Desktop + mobile menu                  | Responsive design.                                      |
| Services             | Category tabs/cards                    | Prices, durations, configurable catalog.                |
| Gallery              | Filters/lightbox                       | Style discovery and Cloudinary media.                   |
| Booking              | Form + confirmation                    | Render backend prevents unsafe double booking.          |
| Waitlist             | Queue view/prompt                      | Demand captured when slots are full.                    |
| Auth                 | Login/register modal                   | Supabase Auth.                                          |
| Dashboard            | Appointments/profile/favorites         | Client self-service.                                    |
| Reviews/blog/contact | Public sections                        | Trust and communication.                                |
| Admin bookings       | Bookings tab/status actions            | Staff operations.                                       |
| Admin schedule       | Day/week schedule                      | Operational visibility.                                 |
| Admin content        | Gallery/blog/reviews/messages/services | No-code content updates.                                |
| Admin security       | Alerts/logs/restrictions               | Monitoring and account protection.                      |
| Architecture         | Stack icons                            | Vercel, Supabase, Render, Cloudinary, Resend, WhatsApp. |

---

## 12. Editing notes

- Add captions for every voice-over line.
- Use lower thirds for technical terms: `Supabase Auth`, `Render API`, `Row Level Security`, `Notification Outbox`.
- Use arrows/labels for architecture diagrams.
- Add short zooms on important buttons but avoid showing private details.
- Cut loading delays; show the successful state.
- Use background music quietly under voice-over.
- End with a call to action or project title card.

---

## 13. Final pre-publish checklist

- No secrets visible.
- No real customer data visible.
- No private emails/phones unless approved public business contact.
- No `.env`, JWT, service-role key, provider token, or job secret visible.
- Browser tabs and bookmarks are clean.
- Captions match narration.
- Mobile and desktop shots are included.
- Admin demo uses a demo admin account.
- Architecture claims match the active Supabase + Render + Vercel implementation.
