-- Admin RLS policies for delete privileges on posts and replies
-- Paste this into Supabase SQL Editor and run.

-- Ensure RLS is enabled
alter table if exists public.posts enable row level security;
alter table if exists public.replies enable row level security;

-- Optional helper: admin check from JWT app metadata
-- auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'

-- Admin-only delete on posts
drop policy if exists admin_delete_posts on public.posts;
create policy admin_delete_posts
on public.posts
for delete
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

-- Admin-only delete on replies
drop policy if exists admin_delete_replies on public.replies;
create policy admin_delete_replies
on public.replies
for delete
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

-- Optional verification queries:
-- select * from pg_policies where schemaname = 'public' and tablename in ('posts', 'replies');
-- select id, raw_app_meta_data from auth.users where id = 'YOUR_USER_UUID';
