-- Q64 online + social schema.
-- Safe to run more than once (idempotent). Paste into Supabase -> SQL Editor -> Run.
-- Adds: profile photo/quote, friends, direct messages, in-game chat, posts+likes+comments,
--       notifications, scheduled matches, and clock columns on games. Plus RLS + realtime.

-- ---------------------------------------------------------------------------
-- 0. profiles: photo, quote (username/rating already exist)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists quote text;
alter table public.profiles add column if not exists last_seen timestamptz default now();

-- Let any signed-in player READ other players' public profile info (name/photo/rating).
drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles readable by authenticated" on public.profiles
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 1. games: per-side clocks (like the offline board)
-- ---------------------------------------------------------------------------
alter table public.games add column if not exists white_ms integer;
alter table public.games add column if not exists black_ms integer;

-- ---------------------------------------------------------------------------
-- 2. friendships (friend requests + accepted friends)
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',   -- pending | accepted
  created_at timestamptz default now(),
  unique (requester_id, addressee_id)
);
alter table public.friendships enable row level security;
drop policy if exists "friendship visible to both" on public.friendships;
create policy "friendship visible to both" on public.friendships
  for select to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "send friend request" on public.friendships;
create policy "send friend request" on public.friendships
  for insert to authenticated with check (auth.uid() = requester_id);
drop policy if exists "respond to friend request" on public.friendships;
create policy "respond to friend request" on public.friendships
  for update to authenticated using (auth.uid() = addressee_id or auth.uid() = requester_id);
drop policy if exists "remove friend" on public.friendships;
create policy "remove friend" on public.friendships
  for delete to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ---------------------------------------------------------------------------
-- 3. dm_messages (private chat between friends)
-- ---------------------------------------------------------------------------
create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references auth.users(id) on delete cascade,
  to_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists dm_pair_idx on public.dm_messages (from_id, to_id, created_at);
alter table public.dm_messages enable row level security;
drop policy if exists "dm visible to participants" on public.dm_messages;
create policy "dm visible to participants" on public.dm_messages
  for select to authenticated using (auth.uid() = from_id or auth.uid() = to_id);
drop policy if exists "dm send" on public.dm_messages;
create policy "dm send" on public.dm_messages
  for insert to authenticated with check (auth.uid() = from_id);
drop policy if exists "dm mark read" on public.dm_messages;
create policy "dm mark read" on public.dm_messages
  for update to authenticated using (auth.uid() = to_id);

-- ---------------------------------------------------------------------------
-- 4. game_chat (talk to your opponent during an online match)
-- ---------------------------------------------------------------------------
create table if not exists public.game_chat (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  from_id uuid not null references auth.users(id) on delete cascade,
  from_name text,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists game_chat_idx on public.game_chat (game_id, created_at);
alter table public.game_chat enable row level security;
drop policy if exists "game chat read" on public.game_chat;
create policy "game chat read" on public.game_chat
  for select to authenticated using (true);
drop policy if exists "game chat send" on public.game_chat;
create policy "game chat send" on public.game_chat
  for insert to authenticated with check (auth.uid() = from_id);

-- ---------------------------------------------------------------------------
-- 5. posts + likes + comments (the social feed)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  author_avatar text,
  body text,
  image_url text,               -- compressed data URL for small images
  created_at timestamptz default now()
);
create index if not exists posts_time_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);
alter table public.posts enable row level security;
drop policy if exists "posts readable" on public.posts;
create policy "posts readable" on public.posts for select to authenticated using (true);
drop policy if exists "create post" on public.posts;
create policy "create post" on public.posts for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "delete own post" on public.posts;
create policy "delete own post" on public.posts for delete to authenticated using (auth.uid() = author_id);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);
alter table public.post_likes enable row level security;
drop policy if exists "likes readable" on public.post_likes;
create policy "likes readable" on public.post_likes for select to authenticated using (true);
drop policy if exists "like" on public.post_likes;
create policy "like" on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "unlike" on public.post_likes;
create policy "unlike" on public.post_likes for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  author_avatar text,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists comments_post_idx on public.post_comments (post_id, created_at);
alter table public.post_comments enable row level security;
drop policy if exists "comments readable" on public.post_comments;
create policy "comments readable" on public.post_comments for select to authenticated using (true);
drop policy if exists "comment" on public.post_comments;
create policy "comment" on public.post_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "delete own comment" on public.post_comments;
create policy "delete own comment" on public.post_comments for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. notifications (friend requests, challenges, comments, schedules...)
--    Any signed-in player may create a notification FOR another player.
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- the recipient
  type text not null,          -- friend_request | friend_accept | challenge | comment | like | schedule | dm
  title text,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);
create index if not exists notif_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "my notifications" on public.notifications;
create policy "my notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "create notification" on public.notifications;
create policy "create notification" on public.notifications
  for insert to authenticated with check (true);
drop policy if exists "update my notification" on public.notifications;
create policy "update my notification" on public.notifications
  for update to authenticated using (auth.uid() = user_id);
drop policy if exists "delete my notification" on public.notifications;
create policy "delete my notification" on public.notifications
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. scheduled_matches (agree a time to play)
-- ---------------------------------------------------------------------------
create table if not exists public.scheduled_matches (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references auth.users(id) on delete cascade,
  from_name text,
  to_id uuid not null references auth.users(id) on delete cascade,
  to_name text,
  at timestamptz not null,
  minutes integer default 10,
  color text default 'w',
  status text not null default 'pending',  -- pending | accepted | declined | cancelled
  game_id uuid,
  created_at timestamptz default now()
);
create index if not exists sched_people_idx on public.scheduled_matches (from_id, to_id, at);
alter table public.scheduled_matches enable row level security;
drop policy if exists "schedule visible to both" on public.scheduled_matches;
create policy "schedule visible to both" on public.scheduled_matches
  for select to authenticated using (auth.uid() = from_id or auth.uid() = to_id);
drop policy if exists "create schedule" on public.scheduled_matches;
create policy "create schedule" on public.scheduled_matches
  for insert to authenticated with check (auth.uid() = from_id);
drop policy if exists "update schedule" on public.scheduled_matches;
create policy "update schedule" on public.scheduled_matches
  for update to authenticated using (auth.uid() = from_id or auth.uid() = to_id);

-- ---------------------------------------------------------------------------
-- 8. realtime: broadcast row changes to clients
-- ---------------------------------------------------------------------------
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.dm_messages'; exception when duplicate_object then null; when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.game_chat'; exception when duplicate_object then null; when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.notifications'; exception when duplicate_object then null; when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.scheduled_matches'; exception when duplicate_object then null; when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.friendships'; exception when duplicate_object then null; when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.posts'; exception when duplicate_object then null; when others then null; end;
end $$;
