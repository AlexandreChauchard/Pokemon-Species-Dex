-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Sets up the profiles table (User / Admin roles) for Poke Species Dex.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  username text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Security-definer helper so the admin-visibility policy below doesn't
-- recurse into itself when checking a caller's own role.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

-- Auto-create a profile (role = 'user') whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only an existing admin can promote/demote another user's role.
create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_role not in ('user', 'admin') then
    raise exception 'invalid role: %', new_role;
  end if;

  if not public.is_admin(auth.uid()) then
    raise exception 'only admins can change roles';
  end if;

  update public.profiles set role = new_role where id = target_user_id;
end;
$$;

grant execute on function public.set_user_role(uuid, text) to authenticated;

-- After you've signed up through the app once, run this to become the
-- first admin (replace the email if needed):
-- update public.profiles set role = 'admin' where email = 'alexandrechauchard@gmail.com';

-- Applied directly to the live DB on 2026-09-04: role = 'admin',
-- username = 'Tiquetou' for alexandrechauchard@gmail.com.
