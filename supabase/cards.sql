-- Cards catalog: admins add entries, everyone can browse them.
-- Applied directly to the live DB via Claude's Postgres connection.

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  pokemon_id integer not null,
  pokemon_name text not null,
  image_url text not null,
  set_name text not null,
  number text not null,
  variant text not null,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists cards_pokemon_id_idx on public.cards (pokemon_id);

alter table public.cards enable row level security;

create policy "cards_select_all"
  on public.cards for select
  using (true);

create policy "cards_insert_admin"
  on public.cards for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "cards_update_admin"
  on public.cards for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "cards_delete_admin"
  on public.cards for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- Storage bucket for card images: public read, admin-only writes.
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

create policy "card_images_select_all"
  on storage.objects for select
  using (bucket_id = 'card-images');

create policy "card_images_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'card-images' and public.is_admin(auth.uid()));

create policy "card_images_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'card-images' and public.is_admin(auth.uid()))
  with check (bucket_id = 'card-images' and public.is_admin(auth.uid()));

create policy "card_images_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'card-images' and public.is_admin(auth.uid()));
