-- Favorite Pokemon (max 10 per user) and profile pictures, so a user can
-- get notified by email when a new card is added for a species they care
-- about. Applied directly to the live DB via Claude's Postgres connection.

alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pokemon_id integer not null,
  pokemon_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, pokemon_id)
);

create index if not exists favorites_pokemon_id_idx on public.favorites (pokemon_id);

alter table public.favorites enable row level security;

create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- Cap at 10 favorites per user, enforced server-side, not just in the UI.
create or replace function public.enforce_favorites_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.favorites where user_id = new.user_id) >= 10 then
    raise exception 'You can only favorite up to 10 Pokemon.';
  end if;
  return new;
end;
$$;

drop trigger if exists favorites_limit_check on public.favorites;
create trigger favorites_limit_check
  before insert on public.favorites
  for each row execute function public.enforce_favorites_limit();

-- Lets a user update only their own username/avatar, never their role,
-- without needing a broad (and harder to secure) UPDATE policy on profiles.
create or replace function public.update_own_profile(new_username text, new_avatar_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set username = coalesce(new_username, username),
      avatar_url = coalesce(new_avatar_url, avatar_url)
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_profile(text, text) to authenticated;

-- Storage bucket for avatars: public read, each user can only write inside
-- their own folder (path convention: "<user_id>/<filename>").
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "avatars_select_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
