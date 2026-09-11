-- Tracks which Pokémon species have a "completed" card checklist.
-- Public read (everyone sees the green status), admin-only write.

create table if not exists public.pokemon_completion (
  pokemon_id integer primary key,
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.pokemon_completion enable row level security;

create policy "pokemon_completion_select_all"
  on public.pokemon_completion for select
  using (true);

create policy "pokemon_completion_insert_admin"
  on public.pokemon_completion for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "pokemon_completion_update_admin"
  on public.pokemon_completion for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
