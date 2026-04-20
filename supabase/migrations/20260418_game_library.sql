create extension if not exists pg_trgm;

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  min_players integer not null check (min_players > 0),
  max_players integer not null check (max_players >= min_players),
  cover_url text,
  category text not null,
  scoring_family text not null check (scoring_family in ('standard', 'positional', 'elimination', 'cooperative')),
  rules_indexed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists games_title_idx on games using gin (title gin_trgm_ops);

create table if not exists user_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  added_at timestamptz not null default now(),
  last_played_at timestamptz,
  play_count integer not null default 0 check (play_count >= 0),
  unique (user_id, game_id)
);

create index if not exists user_games_user_id_idx on user_games (user_id);

alter table games enable row level security;
alter table user_games enable row level security;

create policy "Games readable by all authenticated" on games
  for select to authenticated using (true);

create policy "User games owned by user" on user_games
  for all to authenticated using (auth.uid() = user_id);
