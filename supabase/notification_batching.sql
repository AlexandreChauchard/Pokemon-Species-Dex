-- Debounced card-add notifications, only for species already marked
-- completed (adding cards to a work-in-progress checklist shouldn't spam
-- favoriters; once a species is "done", further additions are noteworthy).
-- Several adds in a short window collapse into one email via a queue table
-- flushed by a scheduled Edge Function once a species has been quiet for a
-- couple of minutes, instead of emailing on every single card.
-- Applied directly to the live DB via Claude's Postgres connection.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.pending_card_notifications (
  pokemon_id integer primary key,
  pokemon_name text not null,
  cards_added integer not null default 0,
  first_added_at timestamptz not null default now(),
  last_added_at timestamptz not null default now()
);

alter table public.pending_card_notifications enable row level security;
-- No anon/authenticated policies: rows are only ever written via
-- queue_card_notification()/clear_pending_card_notifications() below (both
-- admin-gated SECURITY DEFINER functions), and only ever read/flushed by
-- the flush-card-notifications Edge Function's service-role client, which
-- bypasses RLS regardless.

create or replace function public.queue_card_notification(
  p_pokemon_id integer,
  p_pokemon_name text,
  p_card_count integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'only admins can queue notifications';
  end if;

  insert into public.pending_card_notifications (pokemon_id, pokemon_name, cards_added, first_added_at, last_added_at)
  values (p_pokemon_id, p_pokemon_name, greatest(p_card_count, 1), now(), now())
  on conflict (pokemon_id) do update
    set cards_added = pending_card_notifications.cards_added + greatest(p_card_count, 1),
        last_added_at = now();
end;
$$;

grant execute on function public.queue_card_notification(integer, text, integer) to authenticated;

-- Called right when a species is marked completed, so any cards added
-- just before that moment don't also trigger a separate "N new cards"
-- flush email covering the same additions right after the completion one.
create or replace function public.clear_pending_card_notifications(p_pokemon_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'only admins can clear notifications';
  end if;

  delete from public.pending_card_notifications where pokemon_id = p_pokemon_id;
end;
$$;

grant execute on function public.clear_pending_card_notifications(integer) to authenticated;

-- The actual `cron.schedule(...)` call that flushes this table on a timer
-- is applied live (not committed here) since it embeds a shared secret
-- header for authenticating the pg_net -> Edge Function hop. See project
-- memory for details; the schema and functions above are the full
-- reviewable source of truth for what that job operates on.
