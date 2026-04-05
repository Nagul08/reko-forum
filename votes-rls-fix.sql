-- Votes RLS fix for upvote/un-upvote toggle
-- Run this in Supabase SQL Editor.

alter table if exists public.votes enable row level security;

-- Keep existing policies if present, but ensure these exist.

-- Authenticated users can read votes (used for counts and vote state)
drop policy if exists read_votes_authenticated on public.votes;
create policy read_votes_authenticated
on public.votes
for select
using (auth.uid() is not null);

-- Authenticated users can insert their own vote
drop policy if exists insert_own_vote on public.votes;
create policy insert_own_vote
on public.votes
for insert
with check (
  auth.uid() is not null
  and user_id = auth.uid()
);

-- Authenticated users can remove only their own vote (required for un-upvote)
drop policy if exists delete_own_vote on public.votes;
create policy delete_own_vote
on public.votes
for delete
using (user_id = auth.uid());

-- Optional: enforce one vote per user/post at DB level
create unique index if not exists votes_post_id_user_id_unique
on public.votes (post_id, user_id)
where user_id is not null;
