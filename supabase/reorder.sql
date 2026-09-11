-- Manual sort order for cards, scoped by (pokemon_id, language) groups on
-- the Pokemon detail page. NULL means "use created_at order" (existing
-- rows keep their current implicit order until an admin drags something).
alter table public.cards add column if not exists sort_order integer;

create index if not exists cards_pokemon_language_sort_idx
  on public.cards (pokemon_id, language, sort_order);
