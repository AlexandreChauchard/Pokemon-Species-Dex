-- Adds a language column to cards. NOT NULL + DEFAULT backfills every
-- existing row to 'English' in the same statement.
alter table public.cards add column if not exists language text not null default 'English';
