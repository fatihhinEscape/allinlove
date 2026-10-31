-- Profiles, couples, and membership.
-- A user belongs to at most one couple. A couple has at most two members.
-- The invite code closes after the second member joins.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique,
  relationship_start date,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couples_name_length check (char_length(name) between 1 and 80)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  couple_id uuid references public.couples (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 40)
);

create table if not exists public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'partner')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, user_id)
);

create index if not exists profiles_couple_id_idx on public.profiles (couple_id);
create index if not exists couple_members_couple_id_idx on public.couple_members (couple_id);

drop trigger if exists couples_set_updated_at on public.couples;
create trigger couples_set_updated_at
before update on public.couples
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists couple_members_set_updated_at on public.couple_members;
create trigger couple_members_set_updated_at
before update on public.couple_members
for each row execute function public.set_updated_at();

create or replace function public.enforce_couple_size()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'Bu çift zaten dolu';
  end if;
  return new;
end;
$$;

drop trigger if exists couple_members_enforce_size on public.couple_members;
create trigger couple_members_enforce_size
before insert on public.couple_members
for each row execute function public.enforce_couple_size();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, created_by)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(split_part(new.email, '@', 1), ''),
        'Sen'
      ),
      40
    ),
    new.id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, created_by)
select
  id,
  left(
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(email, '@', 1), ''),
      'Sen'
    ),
    40
  ),
  id
from auth.users
on conflict (id) do nothing;

create or replace function public.is_couple_member(target_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_id = target_couple
      and user_id = auth.uid()
  );
$$;

create or replace function public.create_couple(couple_name text, start_date date default null)
returns table (out_id uuid, out_name text, out_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  new_name text;
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'Giriş gerekli';
  end if;

  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'Zaten bir çifte üyesin';
  end if;

  new_name := nullif(trim(couple_name), '');
  if new_name is null then
    new_name := 'Bizim çiftimiz';
  end if;

  if char_length(new_name) > 80 then
    raise exception 'Çift adı en fazla 80 karakter olabilir';
  end if;

  loop
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.couples where couples.invite_code = new_code);
  end loop;

  insert into public.couples (name, invite_code, relationship_start, created_by)
  values (new_name, new_code, start_date, auth.uid())
  returning couples.id into new_id;

  insert into public.couple_members (couple_id, user_id, role, created_by)
  values (new_id, auth.uid(), 'owner', auth.uid());

  update public.profiles
  set couple_id = new_id
  where profiles.id = auth.uid();

  return query
  select couples.id, couples.name, couples.invite_code
  from public.couples
  where couples.id = new_id;
end;
$$;

create or replace function public.join_couple(raw_invite text)
returns table (out_id uuid, out_name text, out_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  found_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Giriş gerekli';
  end if;

  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'Zaten bir çifte üyesin';
  end if;

  normalized := upper(trim(raw_invite));
  if normalized !~ '^[A-Z0-9]{8}$' then
    raise exception 'Bu davet kodu geçersiz';
  end if;

  select couples.id
  into found_id
  from public.couples
  where couples.invite_code = normalized
  for update;

  if found_id is null then
    raise exception 'Bu davet kodu geçersiz';
  end if;

  if (select count(*) from public.couple_members where couple_id = found_id) >= 2 then
    raise exception 'Bu çift zaten dolu';
  end if;

  insert into public.couple_members (couple_id, user_id, role, created_by)
  values (found_id, auth.uid(), 'partner', auth.uid());

  update public.profiles
  set couple_id = found_id
  where profiles.id = auth.uid();

  update public.couples
  set invite_code = null
  where couples.id = found_id;

  return query
  select couples.id, couples.name, couples.invite_code
  from public.couples
  where couples.id = found_id;
end;
$$;

alter table public.couples enable row level security;
alter table public.couples force row level security;
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.couple_members enable row level security;
alter table public.couple_members force row level security;

drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples
for select to authenticated
using (public.is_couple_member(id));

drop policy if exists couples_update on public.couples;
create policy couples_update on public.couples
for update to authenticated
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or (couple_id is not null and public.is_couple_member(couple_id)));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists couple_members_select on public.couple_members;
create policy couple_members_select on public.couple_members
for select to authenticated
using (public.is_couple_member(couple_id));

revoke all on public.couples from anon, authenticated;
grant select on public.couples to authenticated;
grant update (name, relationship_start) on public.couples to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.couple_members from anon, authenticated;
grant select on public.couple_members to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.enforce_couple_size() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.is_couple_member(uuid) from public, anon;
grant execute on function public.is_couple_member(uuid) to authenticated;

revoke all on function public.create_couple(text, date) from public, anon;
grant execute on function public.create_couple(text, date) to authenticated;

revoke all on function public.join_couple(text) from public, anon;
grant execute on function public.join_couple(text) to authenticated;
