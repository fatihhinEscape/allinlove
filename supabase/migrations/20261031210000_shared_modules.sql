-- Shared life modules: games, watch list, study, books, memories,
-- trips, live location, and the assistant's private notes.

create extension if not exists vector with schema extensions;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  platform text,
  status text not null default 'wishlist' check (status in ('wishlist', 'playing', 'finished')),
  score smallint check (score is null or score between 1 and 10),
  play_minutes integer check (play_minutes is null or play_minutes >= 0),
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_title_length check (char_length(title) between 1 and 80)
);

create table if not exists public.game_duos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  game_id uuid references public.games (id) on delete cascade,
  kind text,
  player_a_label text,
  hero_a text,
  lane_a text,
  player_b_label text,
  hero_b text,
  lane_b text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watch_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  media_type text not null check (media_type in ('film', 'series')),
  status text not null default 'planned' check (status in ('planned', 'watching', 'watched')),
  release_year integer,
  runtime_label text,
  studio text,
  season_number integer,
  episode_number integer,
  score_a smallint check (score_a is null or score_a between 1 and 10),
  score_b smallint check (score_b is null or score_b between 1 and 10),
  comment text,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint watch_items_title_length check (char_length(title) between 1 and 160)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  topic text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  studied_on date not null default current_date,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  target_count integer not null default 1 check (target_count > 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  author text,
  status text not null default 'planned' check (status in ('planned', 'reading', 'finished')),
  pages_read integer not null default 0 check (pages_read >= 0),
  page_count integer check (page_count is null or page_count > 0),
  score_a smallint check (score_a is null or score_a between 1 and 10),
  score_b smallint check (score_b is null or score_b between 1 and 10),
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  quote text,
  note text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  happened_on date not null default current_date,
  body text,
  tags text[] not null default '{}',
  mood text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_media (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  memory_id uuid not null references public.memories (id) on delete cascade,
  storage_path text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  place text,
  starts_on date,
  ends_on date,
  budget_amount integer check (budget_amount is null or budget_amount >= 0),
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_date date,
  plan text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_places (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  latitude double precision,
  longitude double precision,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_checklist (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  label text not null,
  done boolean not null default false,
  kind text not null default 'todo' check (kind in ('todo', 'packing')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  latitude double precision,
  longitude double precision,
  sharing_enabled boolean not null default false,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  period_key text not null,
  body text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, period_key)
);

create table if not exists public.ai_sharing_settings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  module text not null check (module in ('profile', 'games', 'watch', 'study', 'books', 'memories', 'trips')),
  enabled boolean not null default true,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, module)
);

create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  module text not null,
  source_type text not null,
  source_id uuid not null,
  content text not null,
  embedding extensions.vector(1536),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_couple_id_idx on public.games (couple_id);
create index if not exists game_duos_couple_id_idx on public.game_duos (couple_id);
create index if not exists watch_items_couple_id_idx on public.watch_items (couple_id);
create index if not exists memories_happened_on_idx on public.memories (couple_id, happened_on);
create index if not exists embeddings_couple_idx on public.embeddings (couple_id, module);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'games', 'game_duos', 'watch_items', 'study_sessions', 'study_goals',
    'books', 'book_notes', 'memories', 'memory_media', 'trips', 'trip_days',
    'trip_places', 'trip_checklist', 'locations', 'ai_conversations',
    'ai_messages', 'ai_suggestions', 'ai_sharing_settings', 'embeddings'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'games', 'game_duos', 'watch_items', 'study_sessions', 'study_goals',
    'books', 'book_notes', 'memories', 'memory_media', 'trips', 'trip_days',
    'trip_places', 'trip_checklist', 'ai_conversations', 'ai_messages',
    'ai_suggestions', 'ai_sharing_settings', 'embeddings'
  ]
  loop
    execute format('drop policy if exists %I_all on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_select on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_insert on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_update on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_delete on public.%I', table_name, table_name);
    execute format(
      'create policy %I_select on public.%I for select to authenticated using (public.is_couple_member(couple_id))',
      table_name, table_name
    );
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated with check (public.is_couple_member(couple_id) and created_by = auth.uid())',
      table_name, table_name
    );
    execute format(
      'create policy %I_update on public.%I for update to authenticated using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id))',
      table_name, table_name
    );
    execute format(
      'create policy %I_delete on public.%I for delete to authenticated using (public.is_couple_member(couple_id))',
      table_name, table_name
    );
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations
for select to authenticated
using (
  user_id = auth.uid()
  or (sharing_enabled and public.is_couple_member(couple_id))
);

drop policy if exists locations_insert on public.locations;
create policy locations_insert on public.locations
for insert to authenticated
with check (user_id = auth.uid() and public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists locations_update on public.locations;
create policy locations_update on public.locations
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.is_couple_member(couple_id));

drop policy if exists locations_delete on public.locations;
create policy locations_delete on public.locations
for delete to authenticated
using (user_id = auth.uid());

revoke all on public.locations from anon, authenticated;
grant select, insert, update, delete on public.locations to authenticated;

create or replace function public.match_couple_embeddings(
  query_embedding extensions.vector(1536),
  match_count integer
)
returns table (source_type text, source_id uuid, content text, similarity double precision)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select embeddings.source_type, embeddings.source_id, embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from public.embeddings
  where embeddings.embedding is not null
    and public.is_couple_member(embeddings.couple_id)
    and exists (
      select 1
      from public.ai_sharing_settings
      where ai_sharing_settings.couple_id = embeddings.couple_id
        and ai_sharing_settings.module = embeddings.module
        and ai_sharing_settings.enabled
    )
  order by embeddings.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

revoke all on function public.match_couple_embeddings(extensions.vector, integer) from public, anon;
grant execute on function public.match_couple_embeddings(extensions.vector, integer) to authenticated;

insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

drop policy if exists memories_storage_select on storage.objects;
create policy memories_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'memories'
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists memories_storage_insert on storage.objects;
create policy memories_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'memories'
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists memories_storage_delete on storage.objects;
create policy memories_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'memories'
  and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);

do $$
begin
  alter publication supabase_realtime add table public.locations;
exception
  when duplicate_object then null;
end $$;
