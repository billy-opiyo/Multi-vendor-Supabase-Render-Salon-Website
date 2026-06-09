-- Enable Supabase Realtime for admin-console data.
-- The browser currently consumes these records through the Render REST adapter,
-- but adding the tables to the realtime publication prepares the database for
-- true postgres_changes subscriptions and allows fast live dashboard updates.

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'admin_users',
    'admin_audit_logs',
    'login_activities',
    'security_alerts',
    'account_change_history',
    'activity_timeline',
    'site_settings',
    'service_categories',
    'services',
    'service_variants',
    'stylists',
    'booking_slots',
    'bookings',
    'waitlist_entries',
    'booking_status_events',
    'booking_notifications',
    'gallery_items',
    'blog_posts',
    'reviews',
    'contact_messages',
    'file_uploads'
  ];
begin
  foreach table_name in array realtime_tables loop
    execute format('alter table if exists public.%I replica identity full', table_name);

    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      begin
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      exception
        when duplicate_object then
          null;
        when undefined_table then
          raise notice 'Skipping realtime publication for missing table public.%', table_name;
      end;
    else
      raise notice 'Publication supabase_realtime does not exist yet; skipping public.%', table_name;
    end if;
  end loop;
end $$;