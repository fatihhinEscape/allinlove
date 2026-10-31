-- Partner details and shared important dates.
-- Members can read both profiles. Each person edits only their own details.
-- Any member can add, edit, or remove important dates for the couple.

create table if not exists public.partner_details (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nickname text,
  birthday date,
  favorite_food text,
  favorite_drink text,
  favorite_color text,
  favorite_music text,
  love_language text check (
    love_language is null
    or love_language in ('words', 'time', 'gifts', 'service', 'touch')
  ),
  dislikes text,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, user_id),
  constraint partner_details_nickname_length check (nickname is null or char_length(nickname) between 1 and 40),
  constraint partner_details_food_length check (favorite_food is null or char_length(favorite_food) <= 80),
  constraint partner_details_drink_length check (favorite_drink is null or char_length(favorite_drink) <= 80),
  constraint partner_details_color_length check (favorite_color is null or char_length(favorite_color) <= 40),
  constraint partner_details_music_length check (favorite_music is null or char_length(favorite_music) <= 80),
  constraint partner_details_dislikes_length check (dislikes is null or char_length(dislikes) <= 500),
  constraint partner_details_notes_length check (notes is null or char_length(notes) <= 1000)
);

create table if not exists public.important_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  occurs_on date not null,
  kind text not null default 'other' check (kind in ('anniversary', 'birthday', 'other')),
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint important_dates_title_length check (char_length(title) between 1 and 80),
  constraint important_dates_notes_length check (notes is null or char_length(notes) <= 500)
);

create index if not exists partner_details_couple_id_idx on public.partner_details (couple_id);
create index if not exists important_dates_couple_id_idx on public.important_dates (couple_id);
create index if not exists important_dates_occurs_on_idx on public.important_dates (couple_id, occurs_on);

drop trigger if exists partner_details_set_updated_at on public.partner_details;
create trigger partner_details_set_updated_at
before update on public.partner_details
for each row execute function public.set_updated_at();

drop trigger if exists important_dates_set_updated_at on public.important_dates;
create trigger important_dates_set_updated_at
before update on public.important_dates
for each row execute function public.set_updated_at();

create or replace function public.create_partner_details_for_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.partner_details (couple_id, user_id, created_by)
  values (new.couple_id, new.user_id, new.user_id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists couple_members_create_details on public.couple_members;
create trigger couple_members_create_details
after insert on public.couple_members
for each row execute function public.create_partner_details_for_member();

insert into public.partner_details (couple_id, user_id, created_by)
select couple_id, user_id, user_id
from public.couple_members
on conflict (user_id) do nothing;

alter table public.partner_details enable row level security;
alter table public.partner_details force row level security;
alter table public.important_dates enable row level security;
alter table public.important_dates force row level security;

drop policy if exists partner_details_select on public.partner_details;
create policy partner_details_select on public.partner_details
for select to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists partner_details_insert on public.partner_details;
create policy partner_details_insert on public.partner_details
for insert to authenticated
with check (user_id = auth.uid() and public.is_couple_member(couple_id));

drop policy if exists partner_details_update on public.partner_details;
create policy partner_details_update on public.partner_details
for update to authenticated
using (user_id = auth.uid() and public.is_couple_member(couple_id))
with check (user_id = auth.uid() and public.is_couple_member(couple_id));

drop policy if exists important_dates_select on public.important_dates;
create policy important_dates_select on public.important_dates
for select to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists important_dates_insert on public.important_dates;
create policy important_dates_insert on public.important_dates
for insert to authenticated
with check (created_by = auth.uid() and public.is_couple_member(couple_id));

drop policy if exists important_dates_update on public.important_dates;
create policy important_dates_update on public.important_dates
for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

drop policy if exists important_dates_delete on public.important_dates;
create policy important_dates_delete on public.important_dates
for delete to authenticated
using (public.is_couple_member(couple_id));

revoke all on public.partner_details from anon, authenticated;
grant select, insert, update on public.partner_details to authenticated;

revoke all on public.important_dates from anon, authenticated;
grant select, insert, update, delete on public.important_dates to authenticated;

revoke all on function public.create_partner_details_for_member() from public, anon, authenticated;
