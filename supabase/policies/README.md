# RLS Policy Notes — Phase 1

This folder documents the intended policy boundaries for the initial Supabase rewrite foundation.

The active first-pass RLS SQL lives in:

```text
supabase/migrations/20260606000200_phase_1_rls_policies.sql
```

## Policy groups

### Public-readable content

Public visitors may read only approved/active/published rows:

- `client_tenants` where `status = 'active'`
- `site_settings` where `is_public = true`
- `service_categories` where `is_active = true`
- `services` where `is_active = true`
- `service_variants` where the variant and parent service are active
- `stylists` where `is_active = true`
- `gallery_items` where `status = 'published'` and `visibility = 'public'`
- `blog_posts` where `status = 'published'`
- `reviews` where `status = 'approved'`
- future available `booking_slots` where `taken = false`

### User-owned private data

Authenticated users may read their own rows for:

- `profiles`
- `tenant_memberships`
- `bookings`
- `booking_slots`
- `waitlist_entries`
- `booking_status_events`
- `booking_notifications`
- `reviews`
- `contact_messages`
- `login_activities`
- `security_alerts`
- `account_change_history`
- `activity_timeline`
- `file_uploads`

### Public/authenticated submissions

Phase 1 allows conservative direct inserts only for low-risk content forms:

- `reviews` with `status = 'pending'`
- `contact_messages` with `status = 'new'`

Booking and waitlist lifecycle writes are intentionally not exposed directly through browser policies in Phase 1. They should go through Render workflows in later phases.

### Admin-managed data

Admin policy checks are centralized through helper functions:

- `public.current_user_is_active_admin()`
- `public.current_user_is_super_admin()`
- `public.current_user_has_admin_permission(permission_key text)`

Supported permission keys mirror the Phase 0 inventory:

```text
canManageAdmins
canManageBookings
canManageContent
canManageSecurity
```

### Service-role-only data

These tables have RLS enabled but no browser policies in Phase 1:

- `rate_limits`
- `notification_outbox`
- `webhook_events`

They are reserved for Render service-role workflows.

## Follow-up testing required

Phase 9 should add automated Supabase/RLS tests for:

- public anonymous read boundaries
- authenticated user ownership boundaries
- admin permission checks
- service-role-only table protection
- direct booking/write denial from browser roles
