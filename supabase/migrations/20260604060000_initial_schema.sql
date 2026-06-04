-- Initial Supabase schema draft for the Salon Shop Firebase-to-Supabase migration.
-- Apply in a new Supabase project after reviewing collection mappings in
-- MIGRATION_SUPABASE_RENDER.md.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  legacy_firestore_id text unique,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  marketing_opt_in boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  legacy_firestore_id text unique,
  email text not null,
  display_name text,
  role text not null default 'admin' check (role in ('super_admin', 'admin')),
  permissions jsonb not null default '{"canManageAdmins": false, "canManageBookings": true, "canManageContent": true, "canManageSecurity": false}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_settings (
  id text primary key default 'default',
  booking_enabled boolean not null default true,
  waitlist_enabled boolean not null default true,
  reviews_enabled boolean not null default true,
  gallery_enabled boolean not null default true,
  blog_enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  legacy_firestore_id text unique,
  profile_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  service_name text not null,
  sub_service_name text,
  stylist_key text,
  appointment_date date,
  appointment_start_time time,
  appointment_end_time time,
  timezone text not null default 'Africa/Nairobi',
  status text not null default 'pending',
  notes text,
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  legacy_firestore_id text unique,
  slot_date date not null,
  start_time time not null,
  end_time time,
  stylist_key text,
  booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'available',
  hold_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot_date, start_time, stylist_key)
);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  legacy_firestore_id text unique,
  booking_slot_id uuid references public.booking_slots(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  preferred_date date,
  preferred_start_time time,
  preferred_end_time time,
  service_name text,
  status text not null default 'waiting',
  queue_position integer,
  notified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  legacy_firestore_id text unique,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  admin_reply text,
  status text not null default 'pending',
  featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_styles (
  id uuid primary key default gen_random_uuid(),
  legacy_firestore_id text unique,
  title text not null,
  category text,
  image_url text not null,
  public_id text,
  description text,
  featured boolean not null default false,
  featured_most_booked boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  legacy_firestore_id text unique,
  title text not null,
  slug text unique,
  excerpt text,
  body text,
  image_url text,
  category text,
  author_name text,
  status text not null default 'draft',
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  legacy_firestore_id text unique,
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new',
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  scope text not null,
  cooldown_until timestamptz,
  last_submitted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_activities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  email text,
  status text not null default 'success',
  method text,
  device_type text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  email text,
  type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_change_history (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  email text,
  change_type text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_security_actions (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  target_auth_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_timeline (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  activity_type text not null,
  entity_type text,
  entity_id text,
  title text,
  details text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_status_created_at on public.bookings(status, created_at desc);
create index if not exists idx_booking_slots_date_status on public.booking_slots(slot_date, status);
create index if not exists idx_waitlist_status_position on public.waitlist_entries(status, queue_position);
create index if not exists idx_reviews_status_created_at on public.reviews(status, created_at desc);
create index if not exists idx_contact_messages_status_created_at on public.contact_messages(status, created_at desc);
create index if not exists idx_login_activities_created_at on public.login_activities(created_at desc);
create index if not exists idx_security_alerts_status_created_at on public.security_alerts(status, created_at desc);
create index if not exists idx_activity_timeline_created_at on public.activity_timeline(created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at before update on public.admin_users for each row execute function public.set_updated_at();
drop trigger if exists set_service_settings_updated_at on public.service_settings;
create trigger set_service_settings_updated_at before update on public.service_settings for each row execute function public.set_updated_at();
drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
drop trigger if exists set_booking_slots_updated_at on public.booking_slots;
create trigger set_booking_slots_updated_at before update on public.booking_slots for each row execute function public.set_updated_at();
drop trigger if exists set_waitlist_entries_updated_at on public.waitlist_entries;
create trigger set_waitlist_entries_updated_at before update on public.waitlist_entries for each row execute function public.set_updated_at();
drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();
drop trigger if exists set_gallery_styles_updated_at on public.gallery_styles;
create trigger set_gallery_styles_updated_at before update on public.gallery_styles for each row execute function public.set_updated_at();
drop trigger if exists set_blogs_updated_at on public.blogs;
create trigger set_blogs_updated_at before update on public.blogs for each row execute function public.set_updated_at();
drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();
drop trigger if exists set_rate_limits_updated_at on public.rate_limits;
create trigger set_rate_limits_updated_at before update on public.rate_limits for each row execute function public.set_updated_at();
drop trigger if exists set_security_alerts_updated_at on public.security_alerts;
create trigger set_security_alerts_updated_at before update on public.security_alerts for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.service_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_slots enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.reviews enable row level security;
alter table public.gallery_styles enable row level security;
alter table public.blogs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rate_limits enable row level security;
alter table public.login_activities enable row level security;
alter table public.security_alerts enable row level security;
alter table public.account_change_history enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_security_actions enable row level security;
alter table public.activity_timeline enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = auth_user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

drop policy if exists "gallery_public_read" on public.gallery_styles;
create policy "gallery_public_read" on public.gallery_styles for select using (true);
drop policy if exists "blogs_public_read_published" on public.blogs;
create policy "blogs_public_read_published" on public.blogs for select using (status = 'published');
drop policy if exists "reviews_public_read_approved" on public.reviews;
create policy "reviews_public_read_approved" on public.reviews for select using (status = 'approved');
drop policy if exists "reviews_public_insert_pending" on public.reviews;
create policy "reviews_public_insert_pending" on public.reviews for insert with check (status = 'pending');
drop policy if exists "contact_public_insert" on public.contact_messages;
create policy "contact_public_insert" on public.contact_messages for insert with check (true);

insert into public.service_settings (id)
values ('default')
on conflict (id) do nothing;