-- Phase 1 development seed data.
-- Run after migrations when creating a local/staging Supabase database.
-- This file avoids auth.users-dependent rows so it can be applied before real users exist.

begin;

insert into public.client_tenants (id, slug, name, status, public_metadata)
values (
  '00000000-0000-4000-8000-000000000001',
  'royal-braids',
  'Royal Braids',
  'active',
  '{"seeded": true, "phase": "phase_1_supabase_foundation"}'::jsonb
)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  status = excluded.status,
  public_metadata = excluded.public_metadata;

insert into public.site_settings (
  id,
  tenant_id,
  business_name,
  team_name,
  contact_notification_email,
  public_email,
  public_phone,
  address,
  timezone,
  utc_offset_hours,
  cloudinary_folder,
  social_links,
  theme,
  is_public
)
values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  'Royal Braids',
  'Royal Braids Team',
  'billyopiyo597@gmail.com',
  'hello@royalbraids.example',
  '+254700000000',
  'Nairobi, Kenya',
  'Africa/Nairobi',
  3,
  'royal-braids/uploads',
  '{"instagram": "", "facebook": "", "tiktok": ""}'::jsonb,
  '{"preset": "royal-braids", "primaryColor": "#7c3aed"}'::jsonb,
  true
)
on conflict (id) do update set
  business_name = excluded.business_name,
  team_name = excluded.team_name,
  contact_notification_email = excluded.contact_notification_email,
  public_email = excluded.public_email,
  public_phone = excluded.public_phone,
  address = excluded.address,
  timezone = excluded.timezone,
  utc_offset_hours = excluded.utc_offset_hours,
  cloudinary_folder = excluded.cloudinary_folder,
  social_links = excluded.social_links,
  theme = excluded.theme,
  is_public = excluded.is_public;

insert into public.service_categories (id, tenant_id, name, slug, description, sort_order, is_active)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Braids', 'braids', 'Protective braid styles and salon braid services.', 10, true),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'Natural Hair', 'natural-hair', 'Care, styling, and treatment services for natural hair.', 20, true),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Maintenance', 'maintenance', 'Refresh, touch-up, and protective style maintenance.', 30, true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.services (id, tenant_id, category_id, name, slug, description, base_price, duration_minutes, is_active, sort_order)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'Box Braids', 'box-braids', 'Classic box braids with neat parting and long-lasting finish.', 4500.00, 240, true, 10),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'Knotless Braids', 'knotless-braids', 'Lightweight knotless braids with a natural look and feel.', 5500.00, 300, true, 20),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000202', 'Natural Hair Treatment', 'natural-hair-treatment', 'Wash, deep condition, detangle, and style preparation.', 2500.00, 120, true, 30),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000203', 'Braid Refresh', 'braid-refresh', 'Clean-up and refresh for existing braid styles.', 1800.00, 90, true, 40)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  base_price = excluded.base_price,
  duration_minutes = excluded.duration_minutes,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.service_variants (id, tenant_id, service_id, name, description, price_delta, duration_delta_minutes, is_active, sort_order)
values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000301', 'Waist Length', 'Longer box braids finishing around waist length.', 1500.00, 60, true, 10),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000302', 'Small Size', 'Smaller knotless braid size with more detailed parting.', 2000.00, 90, true, 20)
on conflict (id) do update set
  service_id = excluded.service_id,
  name = excluded.name,
  description = excluded.description,
  price_delta = excluded.price_delta,
  duration_delta_minutes = excluded.duration_delta_minutes,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.stylists (id, tenant_id, display_name, stylist_key, bio, specialties, is_active, sort_order)
values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001', 'Any Available Stylist', 'any', 'Book with the next available Royal Braids stylist.', '{"braids", "natural-hair"}'::text[], true, 0),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000001', 'Senior Braider', 'senior-braider', 'Experienced stylist for detailed braid installations.', '{"box-braids", "knotless-braids"}'::text[], true, 10)
on conflict (id) do update set
  display_name = excluded.display_name,
  stylist_key = excluded.stylist_key,
  bio = excluded.bio,
  specialties = excluded.specialties,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.gallery_items (id, tenant_id, title, description, image_url, thumbnail_url, status, visibility, sort_order)
values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', 'Knotless braid inspiration', 'Placeholder gallery record for local development.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_400/sample.jpg', 'published', 'public', 10)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  thumbnail_url = excluded.thumbnail_url,
  status = excluded.status,
  visibility = excluded.visibility,
  sort_order = excluded.sort_order;

insert into public.blog_posts (id, tenant_id, slug, title, excerpt, body, status, published_at)
values (
  '00000000-0000-4000-8000-000000000701',
  '00000000-0000-4000-8000-000000000001',
  'welcome-to-royal-braids',
  'Welcome to Royal Braids',
  'Starter content for the rebuilt Supabase/Vercel salon site.',
  'This is development seed content. Replace it from the admin content workflow in later phases.',
  'published',
  now()
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.reviews (id, tenant_id, customer_name, rating, service, review_text, status)
values (
  '00000000-0000-4000-8000-000000000801',
  '00000000-0000-4000-8000-000000000001',
  'Sample Customer',
  5,
  'Knotless Braids',
  'Development seed review for public review rendering.',
  'approved'
)
on conflict (id) do update set
  customer_name = excluded.customer_name,
  rating = excluded.rating,
  service = excluded.service,
  review_text = excluded.review_text,
  status = excluded.status;

-- Create a small set of future open slots for local UI/API development.
insert into public.booking_slots (id, tenant_id, slot_date, slot_time, starts_at, ends_at, stylist_id, stylist_key, taken)
values
  (
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000001',
    (current_date + interval '1 day')::date,
    '09:00',
    ((current_date + interval '1 day')::date + time '09:00') at time zone 'Africa/Nairobi',
    ((current_date + interval '1 day')::date + time '11:00') at time zone 'Africa/Nairobi',
    '00000000-0000-4000-8000-000000000501',
    'any',
    false
  ),
  (
    '00000000-0000-4000-8000-000000000902',
    '00000000-0000-4000-8000-000000000001',
    (current_date + interval '1 day')::date,
    '13:00',
    ((current_date + interval '1 day')::date + time '13:00') at time zone 'Africa/Nairobi',
    ((current_date + interval '1 day')::date + time '15:00') at time zone 'Africa/Nairobi',
    '00000000-0000-4000-8000-000000000502',
    'senior-braider',
    false
  ),
  (
    '00000000-0000-4000-8000-000000000903',
    '00000000-0000-4000-8000-000000000001',
    (current_date + interval '2 days')::date,
    '10:00',
    ((current_date + interval '2 days')::date + time '10:00') at time zone 'Africa/Nairobi',
    ((current_date + interval '2 days')::date + time '12:00') at time zone 'Africa/Nairobi',
    '00000000-0000-4000-8000-000000000501',
    'any',
    false
  )
on conflict (id) do update set
  slot_date = excluded.slot_date,
  slot_time = excluded.slot_time,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  stylist_id = excluded.stylist_id,
  stylist_key = excluded.stylist_key,
  taken = excluded.taken;

commit;