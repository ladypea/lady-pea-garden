-- Lady Pea's Garden schema

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  seeds integer not null default 25,
  last_collected_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.player_flowers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  flower_name text not null,
  rarity text not null,
  emoji text not null default '🌱',
  value integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.stream_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  username text,
  message text,
  rarity text,
  flower_name text,
  emoji text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.player_flowers enable row level security;
alter table public.stream_events enable row level security;

drop policy if exists "Profiles can be read by everyone" on public.profiles;
create policy "Profiles can be read by everyone"
on public.profiles for select
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Flowers can be read by everyone" on public.player_flowers;
create policy "Flowers can be read by everyone"
on public.player_flowers for select
using (true);

drop policy if exists "Users can insert own flowers" on public.player_flowers;
create policy "Users can insert own flowers"
on public.player_flowers for insert
with check (auth.uid() = user_id);

drop policy if exists "Stream events can be read by everyone" on public.stream_events;
create policy "Stream events can be read by everyone"
on public.stream_events for select
using (true);

drop policy if exists "Logged in users can create stream events" on public.stream_events;
create policy "Logged in users can create stream events"
on public.stream_events for insert
with check (auth.uid() is not null);

-- Enable realtime for overlay events.
alter publication supabase_realtime add table public.stream_events;
