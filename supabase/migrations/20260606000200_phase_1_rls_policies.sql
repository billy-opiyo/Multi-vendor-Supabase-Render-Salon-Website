-- Phase 1: Initial Row Level Security policy pass.
-- These policies intentionally keep transactional booking/waitlist/notification writes behind
-- the future Render service-role backend. Browser access is limited to public reads,
-- safe submissions, user-owned reads, and admin dashboard reads.

begin;

create or replace function public.current_user_is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
      and admin_user.active = true
  );
$$;

create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
      and admin_user.active = true
      and admin_user.role = 'super_admin'
  );
$$;

create or replace function public.current_user_has_admin_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
      and admin_user.active = true
      and (
        admin_user.role = 'super_admin'
        or admin_user.permissions ->> permission_key = 'true'
      )
  );
$$;

revoke all on function public.current_user_is_active_admin() from public;
revoke all on function public.current_user_is_super_admin() from public;
revoke all on function public.current_user_has_admin_permission(text) from public;
grant execute on function public.current_user_is_active_admin() to authenticated;
grant execute on function public.current_user_is_super_admin() to authenticated;
grant execute on function public.current_user_has_admin_permission(text) to authenticated;

alter table public.client_tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_security_actions enable row level security;
alter table public.login_activities enable row level security;
alter table public.security_alerts enable row level security;
alter table public.account_change_history enable row level security;
alter table public.activity_timeline enable row level security;
alter table public.rate_limits enable row level security;
alter table public.site_settings enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.service_variants enable row level security;
alter table public.stylists enable row level security;
alter table public.booking_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.booking_status_events enable row level security;
alter table public.booking_notifications enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.gallery_items enable row level security;
alter table public.blog_posts enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.file_uploads enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.webhook_events enable row level security;

-- Tenant and identity policies.

create policy "Public can read active tenants"
on public.client_tenants
for select
to anon, authenticated
using (status = 'active');

create policy "Super admins can manage tenants"
on public.client_tenants
for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can create own customer profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'customer');

create policy "Users can update own customer profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'customer');

create policy "Active admins can read profiles"
on public.profiles
for select
to authenticated
using (public.current_user_is_active_admin());

create policy "Super admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

create policy "Users can read own tenant memberships"
on public.tenant_memberships
for select
to authenticated
using (user_id = auth.uid());

create policy "Super admins can manage tenant memberships"
on public.tenant_memberships
for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

-- Admin and security policies.

create policy "Super admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.current_user_is_super_admin());

create policy "Super admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());

create policy "Security admins can read admin audit logs"
on public.admin_audit_logs
for select
to authenticated
using (
  public.current_user_has_admin_permission('canManageSecurity')
  or public.current_user_has_admin_permission('canManageAdmins')
);

create policy "Security admins can read admin security actions"
on public.admin_security_actions
for select
to authenticated
using (public.current_user_has_admin_permission('canManageSecurity'));

create policy "Users can read own login activity"
on public.login_activities
for select
to authenticated
using (user_id = auth.uid());

create policy "Security admins can read login activity"
on public.login_activities
for select
to authenticated
using (public.current_user_has_admin_permission('canManageSecurity'));

create policy "Users can read own security alerts"
on public.security_alerts
for select
to authenticated
using (user_id = auth.uid());

create policy "Security admins can read security alerts"
on public.security_alerts
for select
to authenticated
using (public.current_user_has_admin_permission('canManageSecurity'));

create policy "Users can read own account change history"
on public.account_change_history
for select
to authenticated
using (user_id = auth.uid());

create policy "Security admins can read account change history"
on public.account_change_history
for select
to authenticated
using (public.current_user_has_admin_permission('canManageSecurity'));

create policy "Users can read own activity timeline"
on public.activity_timeline
for select
to authenticated
using (user_id = auth.uid() or actor_user_id = auth.uid());

create policy "Active admins can read activity timeline"
on public.activity_timeline
for select
to authenticated
using (public.current_user_is_active_admin());

-- rate_limits is service-role only in Phase 1. RLS is enabled with no browser policies.

-- Public content policies.

create policy "Public can read public site settings"
on public.site_settings
for select
to anon, authenticated
using (is_public = true);

create policy "Content admins can manage site settings"
on public.site_settings
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can read active service categories"
on public.service_categories
for select
to anon, authenticated
using (is_active = true);

create policy "Content admins can manage service categories"
on public.service_categories
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can read active services"
on public.services
for select
to anon, authenticated
using (is_active = true);

create policy "Content admins can manage services"
on public.services
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can read active service variants"
on public.service_variants
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.services service
    where service.id = service_variants.service_id
      and service.is_active = true
  )
);

create policy "Content admins can manage service variants"
on public.service_variants
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can read active stylists"
on public.stylists
for select
to anon, authenticated
using (is_active = true);

create policy "Content admins can manage stylists"
on public.stylists
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can read published gallery items"
on public.gallery_items
for select
to anon, authenticated
using (status = 'published' and visibility = 'public');

create policy "Content admins can manage gallery items"
on public.gallery_items
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can read published blog posts"
on public.blog_posts
for select
to anon, authenticated
using (status = 'published' and (published_at is null or published_at <= now()));

create policy "Content admins can manage blog posts"
on public.blog_posts
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can read approved reviews"
on public.reviews
for select
to anon, authenticated
using (status = 'approved');

create policy "Users can read own reviews"
on public.reviews
for select
to authenticated
using (user_id = auth.uid());

create policy "Public can submit pending reviews"
on public.reviews
for insert
to anon
with check (status = 'pending' and user_id is null);

create policy "Authenticated users can submit own pending reviews"
on public.reviews
for insert
to authenticated
with check (status = 'pending' and (user_id is null or user_id = auth.uid()));

create policy "Content admins can manage reviews"
on public.reviews
for all
to authenticated
using (public.current_user_has_admin_permission('canManageContent'))
with check (public.current_user_has_admin_permission('canManageContent'));

create policy "Public can submit contact messages"
on public.contact_messages
for insert
to anon
with check (status = 'new' and user_id is null);

create policy "Authenticated users can submit contact messages"
on public.contact_messages
for insert
to authenticated
with check (status = 'new' and (user_id is null or user_id = auth.uid()));

create policy "Users can read own contact messages"
on public.contact_messages
for select
to authenticated
using (user_id = auth.uid());

create policy "Content admins can read contact messages"
on public.contact_messages
for select
to authenticated
using (public.current_user_has_admin_permission('canManageContent'));

-- Booking, waitlist, and notification policies.

create policy "Public can read available future booking slots"
on public.booking_slots
for select
to anon, authenticated
using (taken = false and starts_at >= now());

create policy "Users can read own booking slots"
on public.booking_slots
for select
to authenticated
using (user_id = auth.uid());

create policy "Booking admins can read booking slots"
on public.booking_slots
for select
to authenticated
using (public.current_user_has_admin_permission('canManageBookings'));

create policy "Users can read own bookings"
on public.bookings
for select
to authenticated
using (user_id = auth.uid());

create policy "Booking admins can read bookings"
on public.bookings
for select
to authenticated
using (public.current_user_has_admin_permission('canManageBookings'));

create policy "Users can read own waitlist entries"
on public.waitlist_entries
for select
to authenticated
using (user_id = auth.uid());

create policy "Booking admins can read waitlist entries"
on public.waitlist_entries
for select
to authenticated
using (public.current_user_has_admin_permission('canManageBookings'));

create policy "Users can read own booking status events"
on public.booking_status_events
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings booking
    where booking.id = booking_status_events.booking_id
      and booking.user_id = auth.uid()
  )
);

create policy "Booking admins can read booking status events"
on public.booking_status_events
for select
to authenticated
using (public.current_user_has_admin_permission('canManageBookings'));

create policy "Users can read own booking notifications"
on public.booking_notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings booking
    where booking.id = booking_notifications.booking_id
      and booking.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.waitlist_entries waitlist_entry
    where waitlist_entry.id = booking_notifications.waitlist_id
      and waitlist_entry.user_id = auth.uid()
  )
);

create policy "Booking admins can read booking notifications"
on public.booking_notifications
for select
to authenticated
using (public.current_user_has_admin_permission('canManageBookings'));

-- notification_outbox is service-role only in Phase 1.

-- File uploads, webhooks, and internal tables.

create policy "Users can read own file uploads"
on public.file_uploads
for select
to authenticated
using (user_id = auth.uid());

create policy "Content admins can read file uploads"
on public.file_uploads
for select
to authenticated
using (public.current_user_has_admin_permission('canManageContent'));

-- webhook_events is service-role only in Phase 1.

commit;