-- Phase 1: Supabase foundation core schema
-- Target stack: Supabase Postgres/Auth/RLS + Render service-role backend + Vercel frontend.
-- Legacy Firebase files are reference-only and are not used by this migration.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.client_tenants (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null,
  name text not null,
  status text not null default 'active',
  public_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_tenants_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint client_tenants_status_check check (status in ('active', 'inactive', 'archived')),
  constraint client_tenants_public_metadata_object_check check (jsonb_typeof(public_metadata) = 'object')
);

create unique index client_tenants_slug_unique_idx on public.client_tenants (lower(slug));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  email text null,
  display_name text null,
  phone text null,
  role text not null default 'customer',
  avatar_url text null,
  security_restrictions jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('customer', 'admin', 'super_admin')),
  constraint profiles_security_restrictions_object_check check (jsonb_typeof(security_restrictions) = 'object'),
  constraint profiles_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index profiles_tenant_id_idx on public.profiles (tenant_id);
create index profiles_email_lower_idx on public.profiles (lower(email));

create table public.admin_users (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text null,
  role text not null default 'admin',
  permissions jsonb not null default '{"canManageAdmins": false, "canManageBookings": true, "canManageContent": true, "canManageSecurity": false}'::jsonb,
  active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_role_check check (role in ('super_admin', 'admin')),
  constraint admin_users_permissions_object_check check (jsonb_typeof(permissions) = 'object')
);

create unique index admin_users_user_id_unique_idx on public.admin_users (user_id);
create unique index admin_users_email_unique_idx on public.admin_users (lower(email));
create index admin_users_active_role_idx on public.admin_users (active, role);
create index admin_users_tenant_id_idx on public.admin_users (tenant_id);

create table public.admin_audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  target_user_id uuid null references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid null,
  resource_key text null,
  changes jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_logs_changes_object_check check (jsonb_typeof(changes) = 'object'),
  constraint admin_audit_logs_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index admin_audit_logs_tenant_created_idx on public.admin_audit_logs (tenant_id, created_at desc);
create index admin_audit_logs_actor_created_idx on public.admin_audit_logs (actor_user_id, created_at desc);
create index admin_audit_logs_resource_idx on public.admin_audit_logs (resource_type, resource_id);

create table public.admin_security_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  reason text null,
  expires_at timestamptz null,
  cleared_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_security_actions_action_check check (action in ('temporary_block', 'force_logout', 'force_password_reset', 'clear_restrictions')),
  constraint admin_security_actions_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index admin_security_actions_target_created_idx on public.admin_security_actions (target_user_id, created_at desc);
create index admin_security_actions_tenant_created_idx on public.admin_security_actions (tenant_id, created_at desc);

create table public.login_activities (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  email text null,
  login_method text not null default 'unknown',
  status text not null,
  device_type text not null default 'unknown',
  ip_address inet null,
  user_agent text null,
  country text null,
  risk_level text not null default 'low',
  risk_score integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint login_activities_login_method_check check (login_method in ('google', 'email/password', 'anonymous', 'unknown')),
  constraint login_activities_status_check check (status in ('success', 'failure')),
  constraint login_activities_device_type_check check (device_type in ('mobile', 'desktop', 'tablet', 'unknown')),
  constraint login_activities_risk_level_check check (risk_level in ('low', 'medium', 'high')),
  constraint login_activities_risk_score_check check (risk_score between 0 and 100),
  constraint login_activities_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index login_activities_user_created_idx on public.login_activities (user_id, created_at desc);
create index login_activities_email_created_idx on public.login_activities (lower(email), created_at desc);
create index login_activities_status_created_idx on public.login_activities (status, created_at desc);

create table public.security_alerts (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  alert_type text not null,
  severity text not null,
  status text not null default 'open',
  title text not null,
  message text null,
  metadata jsonb not null default '{}'::jsonb,
  acknowledged_at timestamptz null,
  resolved_at timestamptz null,
  resolved_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint security_alerts_alert_type_check check (alert_type in ('multiple_failed_login_attempts', 'new_device_detected', 'login_unusual_country', 'rapid_repeated_logins', 'account_deleted', 'account_deactivated', 'password_changed', 'email_changed', 'phone_changed', 'profile_updated')),
  constraint security_alerts_severity_check check (severity in ('low', 'medium', 'high')),
  constraint security_alerts_status_check check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  constraint security_alerts_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index security_alerts_tenant_status_created_idx on public.security_alerts (tenant_id, status, created_at desc);
create index security_alerts_user_created_idx on public.security_alerts (user_id, created_at desc);
create index security_alerts_severity_created_idx on public.security_alerts (severity, created_at desc);

create table public.account_change_history (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  change_type text not null,
  old_value jsonb null,
  new_value jsonb null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint account_change_history_change_type_check check (change_type in ('account_deleted', 'account_deactivated', 'password_changed', 'email_changed', 'phone_changed', 'profile_updated')),
  constraint account_change_history_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index account_change_history_user_created_idx on public.account_change_history (user_id, created_at desc);

create table public.activity_timeline (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  activity_type text not null,
  title text not null,
  description text null,
  entity_type text null,
  entity_id uuid null,
  entity_key text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_timeline_activity_type_check check (activity_type in ('booking_created', 'booking_canceled', 'booking_status_changed', 'waitlist_updated', 'review_posted', 'review_edited', 'contact_submitted', 'admin_action', 'security_event')),
  constraint activity_timeline_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index activity_timeline_tenant_created_idx on public.activity_timeline (tenant_id, created_at desc);
create index activity_timeline_user_created_idx on public.activity_timeline (user_id, created_at desc);
create index activity_timeline_entity_idx on public.activity_timeline (entity_type, entity_id);

create table public.rate_limits (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  subject_type text not null,
  subject_key text not null,
  action text not null,
  attempts integer not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rate_limits_subject_type_check check (subject_type in ('user', 'email', 'ip', 'anonymous')),
  constraint rate_limits_action_check check (action in ('review', 'contact', 'booking', 'login', 'api')),
  constraint rate_limits_attempts_check check (attempts >= 0),
  constraint rate_limits_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index rate_limits_identity_unique_idx on public.rate_limits (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), subject_type, subject_key, action);
create index rate_limits_locked_until_idx on public.rate_limits (locked_until) where locked_until is not null;

create table public.site_settings (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  business_name text not null,
  team_name text null,
  contact_notification_email text null,
  public_email text null,
  public_phone text null,
  address text null,
  timezone text not null default 'Africa/Nairobi',
  utc_offset_hours integer null,
  cloudinary_folder text null,
  social_links jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_social_links_object_check check (jsonb_typeof(social_links) = 'object'),
  constraint site_settings_theme_object_check check (jsonb_typeof(theme) = 'object')
);

create unique index site_settings_one_per_tenant_idx on public.site_settings (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table public.service_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_categories_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint service_categories_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index service_categories_tenant_slug_unique_idx on public.service_categories (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug));
create index service_categories_public_idx on public.service_categories (tenant_id, is_active, sort_order);

create table public.services (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  category_id uuid null references public.service_categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text null,
  base_price numeric(10, 2) null,
  duration_minutes integer null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint services_base_price_check check (base_price is null or base_price >= 0),
  constraint services_duration_minutes_check check (duration_minutes is null or duration_minutes > 0),
  constraint services_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index services_tenant_slug_unique_idx on public.services (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug));
create index services_public_idx on public.services (tenant_id, is_active, sort_order);
create index services_category_idx on public.services (category_id);

create table public.service_variants (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  description text null,
  price_delta numeric(10, 2) not null default 0,
  duration_delta_minutes integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_variants_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index service_variants_service_public_idx on public.service_variants (service_id, is_active, sort_order);

create table public.stylists (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  display_name text not null,
  stylist_key text not null,
  bio text null,
  specialties text[] not null default '{}'::text[],
  avatar_url text null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stylists_stylist_key_format_check check (stylist_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint stylists_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index stylists_tenant_key_unique_idx on public.stylists (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(stylist_key));
create index stylists_public_idx on public.stylists (tenant_id, is_active, sort_order);

create table public.booking_slots (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  slot_date date not null,
  slot_time text not null,
  starts_at timestamptz not null,
  ends_at timestamptz null,
  stylist_id uuid null references public.stylists(id) on delete set null,
  stylist_key text not null,
  taken boolean not null default false,
  booking_id uuid null,
  user_id uuid null references auth.users(id) on delete set null,
  release_reason text null,
  released_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_slots_time_not_blank_check check (length(trim(slot_time)) > 0),
  constraint booking_slots_stylist_key_format_check check (stylist_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint booking_slots_ends_after_starts_check check (ends_at is null or ends_at > starts_at),
  constraint booking_slots_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index booking_slots_identity_unique_idx on public.booking_slots (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), slot_date, slot_time, lower(stylist_key));
create unique index booking_slots_booking_id_unique_idx on public.booking_slots (booking_id) where booking_id is not null;
create index booking_slots_availability_idx on public.booking_slots (tenant_id, starts_at, taken);
create index booking_slots_user_idx on public.booking_slots (user_id);

create table public.bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  slot_id uuid null references public.booking_slots(id) on delete set null,
  waitlist_id uuid null,
  first_name text not null,
  last_name text null,
  email text not null,
  phone text null,
  service text not null,
  service_id uuid null references public.services(id) on delete set null,
  stylist text null,
  stylist_id uuid null references public.stylists(id) on delete set null,
  appointment_date date not null,
  appointment_time text not null,
  starts_at timestamptz not null,
  status text not null default 'pending',
  notes text null,
  inspiration_image_url text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz null,
  completed_at timestamptz null,
  expired_at timestamptz null,
  no_show_at timestamptz null,
  constraint bookings_status_check check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'waitlisted', 'expired', 'no_show')),
  constraint bookings_appointment_time_not_blank_check check (length(trim(appointment_time)) > 0),
  constraint bookings_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index bookings_one_active_booking_per_slot_idx on public.bookings (slot_id) where slot_id is not null and status in ('pending', 'confirmed');
create index bookings_tenant_status_starts_idx on public.bookings (tenant_id, status, starts_at);
create index bookings_user_created_idx on public.bookings (user_id, created_at desc);
create index bookings_email_created_idx on public.bookings (lower(email), created_at desc);
create index bookings_slot_idx on public.bookings (slot_id);

create table public.waitlist_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  booking_id uuid null references public.bookings(id) on delete set null,
  preferred_slot_id uuid null references public.booking_slots(id) on delete set null,
  preferred_date date not null,
  preferred_time text not null,
  service text not null,
  service_id uuid null references public.services(id) on delete set null,
  stylist text null,
  stylist_id uuid null references public.stylists(id) on delete set null,
  status text not null default 'waiting',
  queue_position integer null,
  queue_size integer null,
  notification_channel text null,
  notified_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint waitlist_entries_status_check check (status in ('waiting', 'notified', 'contacted', 'booked', 'cancelled', 'notification_failed')),
  constraint waitlist_entries_preferred_time_not_blank_check check (length(trim(preferred_time)) > 0),
  constraint waitlist_entries_queue_position_check check (queue_position is null or queue_position > 0),
  constraint waitlist_entries_queue_size_check check (queue_size is null or queue_size >= 0),
  constraint waitlist_entries_notification_channel_check check (notification_channel is null or notification_channel in ('email', 'whatsapp', 'sms', 'internal')),
  constraint waitlist_entries_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index waitlist_entries_booking_unique_idx on public.waitlist_entries (booking_id) where booking_id is not null;
create index waitlist_entries_queue_idx on public.waitlist_entries (tenant_id, preferred_date, preferred_time, status, created_at, id);
create index waitlist_entries_user_created_idx on public.waitlist_entries (user_id, created_at desc);
create index waitlist_entries_preferred_slot_idx on public.waitlist_entries (preferred_slot_id, status, created_at);

alter table public.bookings
  add constraint bookings_waitlist_id_fkey foreign key (waitlist_id) references public.waitlist_entries(id) on delete set null;

alter table public.booking_slots
  add constraint booking_slots_booking_id_fkey foreign key (booking_id) references public.bookings(id) on delete set null;

create table public.booking_status_events (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status text null,
  to_status text not null,
  changed_by uuid null references auth.users(id) on delete set null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint booking_status_events_from_status_check check (from_status is null or from_status in ('pending', 'confirmed', 'completed', 'cancelled', 'waitlisted', 'expired', 'no_show')),
  constraint booking_status_events_to_status_check check (to_status in ('pending', 'confirmed', 'completed', 'cancelled', 'waitlisted', 'expired', 'no_show')),
  constraint booking_status_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index booking_status_events_booking_created_idx on public.booking_status_events (booking_id, created_at desc);
create index booking_status_events_tenant_created_idx on public.booking_status_events (tenant_id, created_at desc);

create table public.booking_notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  booking_id uuid null references public.bookings(id) on delete cascade,
  waitlist_id uuid null references public.waitlist_entries(id) on delete cascade,
  channel text not null,
  notification_type text not null,
  status text not null default 'pending',
  provider_message_id text null,
  sent_at timestamptz null,
  failed_at timestamptz null,
  failure_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_notifications_channel_check check (channel in ('email', 'whatsapp', 'sms', 'internal')),
  constraint booking_notifications_status_check check (status in ('pending', 'queued', 'sent', 'failed', 'skipped', 'retrying')),
  constraint booking_notifications_domain_link_check check (booking_id is not null or waitlist_id is not null),
  constraint booking_notifications_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index booking_notifications_booking_created_idx on public.booking_notifications (booking_id, created_at desc);
create index booking_notifications_waitlist_created_idx on public.booking_notifications (waitlist_id, created_at desc);
create index booking_notifications_status_idx on public.booking_notifications (status, created_at);

create table public.notification_outbox (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  aggregate_type text not null,
  aggregate_id uuid null,
  recipient_user_id uuid null references auth.users(id) on delete set null,
  recipient_email text null,
  recipient_phone text null,
  channel text not null,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz null,
  locked_by text null,
  sent_at timestamptz null,
  failed_at timestamptz null,
  failure_reason text null,
  idempotency_key text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_outbox_aggregate_type_check check (aggregate_type in ('booking', 'waitlist', 'review', 'contact_message', 'security', 'system')),
  constraint notification_outbox_channel_check check (channel in ('email', 'whatsapp', 'sms', 'internal')),
  constraint notification_outbox_status_check check (status in ('pending', 'processing', 'sent', 'failed', 'skipped', 'retrying')),
  constraint notification_outbox_attempts_check check (attempts >= 0),
  constraint notification_outbox_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint notification_outbox_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index notification_outbox_idempotency_unique_idx on public.notification_outbox (idempotency_key) where idempotency_key is not null;
create index notification_outbox_pending_idx on public.notification_outbox (status, available_at, created_at) where status in ('pending', 'retrying');
create index notification_outbox_aggregate_idx on public.notification_outbox (aggregate_type, aggregate_id);

create table public.gallery_items (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  title text not null,
  description text null,
  image_url text not null,
  thumbnail_url text null,
  cloudinary_public_id text null,
  status text not null default 'draft',
  visibility text not null default 'public',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_items_status_check check (status in ('draft', 'published', 'archived')),
  constraint gallery_items_visibility_check check (visibility in ('public', 'private')),
  constraint gallery_items_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index gallery_items_public_idx on public.gallery_items (tenant_id, status, visibility, sort_order);

create table public.blog_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  author_user_id uuid null references auth.users(id) on delete set null,
  slug text not null,
  title text not null,
  excerpt text null,
  body text null,
  cover_image_url text null,
  status text not null default 'draft',
  published_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_status_check check (status in ('draft', 'published', 'archived')),
  constraint blog_posts_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index blog_posts_tenant_slug_unique_idx on public.blog_posts (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug));
create index blog_posts_public_idx on public.blog_posts (tenant_id, status, published_at desc);

create table public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  booking_id uuid null references public.bookings(id) on delete set null,
  customer_name text not null,
  rating integer not null,
  service text null,
  service_id uuid null references public.services(id) on delete set null,
  review_text text not null,
  status text not null default 'pending',
  moderation_notes text null,
  moderated_by uuid null references auth.users(id) on delete set null,
  moderated_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_check check (rating between 1 and 5),
  constraint reviews_status_check check (status in ('pending', 'approved', 'rejected', 'archived')),
  constraint reviews_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index reviews_public_idx on public.reviews (tenant_id, status, created_at desc);
create index reviews_user_created_idx on public.reviews (user_id, created_at desc);
create index reviews_booking_idx on public.reviews (booking_id);

create table public.contact_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  first_name text not null,
  last_name text null,
  email text not null,
  phone text null,
  subject text null,
  message text not null,
  status text not null default 'new',
  assigned_to uuid null references auth.users(id) on delete set null,
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_status_check check (status in ('new', 'in_progress', 'resolved', 'archived', 'spam')),
  constraint contact_messages_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index contact_messages_tenant_status_created_idx on public.contact_messages (tenant_id, status, created_at desc);
create index contact_messages_user_created_idx on public.contact_messages (user_id, created_at desc);
create index contact_messages_email_created_idx on public.contact_messages (lower(email), created_at desc);

create table public.file_uploads (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid null references public.client_tenants(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  provider text not null default 'cloudinary',
  bucket text null,
  object_path text null,
  public_url text null,
  content_type text null,
  size_bytes bigint null,
  status text not null default 'signed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint file_uploads_provider_check check (provider in ('cloudinary', 'supabase_storage', 'external')),
  constraint file_uploads_status_check check (status in ('signed', 'uploaded', 'attached', 'deleted', 'failed')),
  constraint file_uploads_size_bytes_check check (size_bytes is null or size_bytes >= 0),
  constraint file_uploads_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index file_uploads_user_created_idx on public.file_uploads (user_id, created_at desc);
create index file_uploads_tenant_status_created_idx on public.file_uploads (tenant_id, status, created_at desc);

create table public.tenant_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.client_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'customer',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_memberships_role_check check (role in ('owner', 'manager', 'staff', 'customer')),
  constraint tenant_memberships_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index tenant_memberships_tenant_user_unique_idx on public.tenant_memberships (tenant_id, user_id);
create index tenant_memberships_user_active_idx on public.tenant_memberships (user_id, active);

create table public.webhook_events (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null,
  event_type text not null,
  external_id text null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  processed_at timestamptz null,
  failure_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_events_status_check check (status in ('received', 'processed', 'failed', 'ignored')),
  constraint webhook_events_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint webhook_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create unique index webhook_events_provider_external_unique_idx on public.webhook_events (provider, external_id) where external_id is not null;
create index webhook_events_status_created_idx on public.webhook_events (status, created_at);

create trigger set_client_tenants_updated_at before update on public.client_tenants for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_admin_users_updated_at before update on public.admin_users for each row execute function public.set_updated_at();
create trigger set_security_alerts_updated_at before update on public.security_alerts for each row execute function public.set_updated_at();
create trigger set_rate_limits_updated_at before update on public.rate_limits for each row execute function public.set_updated_at();
create trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger set_service_categories_updated_at before update on public.service_categories for each row execute function public.set_updated_at();
create trigger set_services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger set_service_variants_updated_at before update on public.service_variants for each row execute function public.set_updated_at();
create trigger set_stylists_updated_at before update on public.stylists for each row execute function public.set_updated_at();
create trigger set_booking_slots_updated_at before update on public.booking_slots for each row execute function public.set_updated_at();
create trigger set_bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger set_waitlist_entries_updated_at before update on public.waitlist_entries for each row execute function public.set_updated_at();
create trigger set_booking_notifications_updated_at before update on public.booking_notifications for each row execute function public.set_updated_at();
create trigger set_notification_outbox_updated_at before update on public.notification_outbox for each row execute function public.set_updated_at();
create trigger set_gallery_items_updated_at before update on public.gallery_items for each row execute function public.set_updated_at();
create trigger set_blog_posts_updated_at before update on public.blog_posts for each row execute function public.set_updated_at();
create trigger set_reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();
create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();
create trigger set_file_uploads_updated_at before update on public.file_uploads for each row execute function public.set_updated_at();
create trigger set_tenant_memberships_updated_at before update on public.tenant_memberships for each row execute function public.set_updated_at();
create trigger set_webhook_events_updated_at before update on public.webhook_events for each row execute function public.set_updated_at();

commit;