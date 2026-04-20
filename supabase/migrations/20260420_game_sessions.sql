create table if not exists game_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  game_id      uuid not null references games(id) on delete cascade,
  status       text not null default 'active'
                 check (status in ('active', 'finished')),
  created_at   timestamptz not null default now(),
  ended_at     timestamptz
);

create table if not exists game_session_players (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references game_sessions(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  order_index  integer not null check (order_index >= 0),
  unique (session_id, order_index)
);

create table if not exists game_session_rounds (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references game_sessions(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  results      jsonb not null,
  created_at   timestamptz not null default now(),
  unique (session_id, round_number)
);

create table if not exists game_session_final_scores (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references game_sessions(id) on delete cascade,
  player_id    uuid not null references game_session_players(id) on delete cascade,
  display_name text not null,
  total        numeric not null,
  rank         integer not null check (rank > 0)
);

create index if not exists game_sessions_user_id_idx on game_sessions (user_id);
create index if not exists game_sessions_game_id_idx on game_sessions (game_id);
create index if not exists game_session_players_session_id_idx on game_session_players (session_id);
create index if not exists game_session_rounds_session_id_idx on game_session_rounds (session_id);
create index if not exists game_session_final_scores_session_id_idx on game_session_final_scores (session_id);

alter table game_sessions enable row level security;
alter table game_session_players enable row level security;
alter table game_session_rounds enable row level security;
alter table game_session_final_scores enable row level security;

create policy "Sessions owned by user" on game_sessions
  for all to authenticated using (auth.uid() = user_id);

create policy "Players readable via session owner" on game_session_players
  for all to authenticated using (
    exists (select 1 from game_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  );

create policy "Rounds readable via session owner" on game_session_rounds
  for all to authenticated using (
    exists (select 1 from game_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  );

create policy "Final scores readable via session owner" on game_session_final_scores
  for all to authenticated using (
    exists (select 1 from game_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  );
