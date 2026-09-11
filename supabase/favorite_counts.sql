-- Aggregate favorite counts for the admin-only favorites ranking page.
-- A SECURITY DEFINER RPC rather than an RLS policy opening up the raw
-- favorites table to admins: this only ever exposes a per-species count,
-- never who favorited what, more than the ranking page actually needs.
-- Applied directly to the live DB via Claude's Postgres connection.

create or replace function public.get_favorite_counts()
returns table(pokemon_id integer, favorite_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'only admins can view favorite counts';
  end if;

  return query
    select f.pokemon_id, count(*) as favorite_count
    from public.favorites f
    group by f.pokemon_id
    order by favorite_count desc;
end;
$$;

grant execute on function public.get_favorite_counts() to authenticated;
