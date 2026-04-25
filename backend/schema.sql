-- ============================================================
-- Signal — Supabase SQL Setup
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- ============================================================
-- 2. EVENTS table
--    Stores raw ingested data from FRED, yfinance, and NewsAPI
-- ============================================================
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  source       text        not null,       -- 'FRED' | 'yfinance' | 'NewsAPI'
  category     text        not null,       -- 'macro' | 'market' | 'geopolitical'
  title        text        not null,
  content      jsonb       not null default '{}',
  magnitude    float       not null default 0,
  sector_tags  text[]      not null default '{}',
  embedding    vector(1024),               -- voyage-3, nullable until computed
  event_time   text,
  fetched_at   timestamptz not null default now()
);

create index if not exists events_source_idx      on events (source);
create index if not exists events_fetched_at_idx  on events (fetched_at desc);
create index if not exists events_sector_tags_idx on events using gin (sector_tags);
create index if not exists events_embedding_idx   on events using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ============================================================
-- 3. SIGNALS table
--    Correlated event clusters with AI-generated implications.
--    event_ids is kept as uuid[] for fast array lookups in the
--    backend — signal_events below is the FK join table for
--    relational integrity and Supabase visualizer.
-- ============================================================
create table if not exists signals (
  id              uuid primary key default gen_random_uuid(),
  event_ids       uuid[]      not null default '{}',
  sector_tags     text[]      not null default '{}',
  ai_implications jsonb       not null default '{}',
  confidence      float       not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists signals_created_at_idx on signals (created_at desc);
create index if not exists signals_confidence_idx on signals (confidence desc);

-- ============================================================
-- 4. SIGNAL_EVENTS junction table
--    Explicit FK between signals and events so Supabase can
--    draw the relationship and enforce referential integrity.
--    Populated automatically by a trigger on signals insert.
-- ============================================================
create table if not exists signal_events (
  signal_id  uuid not null references signals(id) on delete cascade,
  event_id   uuid not null references events(id)  on delete cascade,
  primary key (signal_id, event_id)
);

create index if not exists signal_events_signal_idx on signal_events (signal_id);
create index if not exists signal_events_event_idx  on signal_events (event_id);

-- Trigger: whenever a signal is inserted, expand event_ids into signal_events rows
create or replace function sync_signal_events()
returns trigger language plpgsql as $$
begin
  insert into signal_events (signal_id, event_id)
  select new.id, unnest(new.event_ids)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_sync_signal_events on signals;
create trigger trg_sync_signal_events
  after insert on signals
  for each row execute function sync_signal_events();

-- ============================================================
-- 5. BRIEFS table
--    AI-generated market intelligence brief (every 30 min)
-- ============================================================
create table if not exists briefs (
  id         uuid primary key default gen_random_uuid(),
  content    text        not null,
  created_at timestamptz not null default now()
);

create index if not exists briefs_created_at_idx on briefs (created_at desc);

-- ============================================================
-- 6. match_events RPC
--    pgvector similarity search used by the correlation engine.
--    db.rpc("match_events", {query_embedding, exclude_ids, match_count})
-- ============================================================
create or replace function match_events(
  query_embedding vector(1024),
  exclude_ids     uuid[],
  match_count     int default 3
)
returns table (
  id          uuid,
  title       text,
  sector_tags text[],
  magnitude   float
)
language sql stable as $$
  select id, title, sector_tags, magnitude
  from   events
  where  embedding is not null
    and  not (id = any(exclude_ids))
  order  by embedding <=> query_embedding
  limit  match_count;
$$;

-- ============================================================
-- 7. Row Level Security
-- ============================================================
alter table events        enable row level security;
alter table signals       enable row level security;
alter table signal_events enable row level security;
alter table briefs        enable row level security;

create policy "anon read events"         on events        for select using (true);
create policy "anon read signals"        on signals       for select using (true);
create policy "anon read signal_events"  on signal_events for select using (true);
create policy "anon read briefs"         on briefs        for select using (true);

create policy "anon write events"        on events        for insert with check (true);
create policy "anon write signals"       on signals       for insert with check (true);
create policy "anon write signal_events" on signal_events for insert with check (true);
create policy "anon write briefs"        on briefs        for insert with check (true);
create policy "anon update events"       on events        for update using (true);
