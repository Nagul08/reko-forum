-- Reports admin migration for the in-app Reports dashboard
-- Run this in Supabase SQL Editor.

alter table if exists public.reports enable row level security;

-- Ensure expected columns exist for dashboard features.
alter table public.reports
  add column if not exists reason text;

alter table public.reports
  add column if not exists status text not null default 'open'
  check (status in ('open', 'reviewed', 'resolved'));

-- Optional helper index for status filtering/sorting.
create index if not exists reports_status_created_at_idx
on public.reports (status, created_at desc);

-- Preserve open reporting from authenticated users.
drop policy if exists insert_report_authenticated on public.reports;
create policy insert_report_authenticated
on public.reports
for insert
with check (auth.uid() is not null);

-- Admin-only read/update/delete for moderation dashboard.
drop policy if exists admin_read_reports on public.reports;
create policy admin_read_reports
on public.reports
for select
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

drop policy if exists admin_update_reports on public.reports;
create policy admin_update_reports
on public.reports
for update
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
)
with check (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

drop policy if exists admin_delete_reports on public.reports;
create policy admin_delete_reports
on public.reports
for delete
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

-- Optional verification:
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name = 'reports';
--
-- select * from pg_policies
-- where schemaname = 'public' and tablename = 'reports';