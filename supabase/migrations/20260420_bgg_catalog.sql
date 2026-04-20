-- Ajout des colonnes BGG (toutes nullable → non-breaking pour jeux existants)
alter table games
  add column if not exists bgg_id      integer unique,
  add column if not exists publisher   text,
  add column if not exists bgg_rating  numeric(4,2),
  add column if not exists bgg_rank    integer;

-- Extension de la contrainte scoring_family
alter table games drop constraint if exists games_scoring_family_check;
alter table games add constraint games_scoring_family_check
  check (scoring_family in (
    'standard','positional','elimination','cooperative',
    'contract_tricks','incremental','custom'
  ));

-- Index sur bgg_id pour les upserts performants
create index if not exists games_bgg_id_idx on games (bgg_id);
