# Poke Species Dex

A Pokemon TCG collection tracker. Browse all 1025 species, then drill into
any one of them to see every card printed for it, organized by language,
with per-card completion tracking and an admin catalog tool.

## Stack

- Vite + React + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Storage, Edge Functions) for data, accounts, and
  the bug report pipeline
- Species data and sprites from [PokeAPI](https://pokeapi.co)
- Card data lookups (bulk import) from [TCGdex](https://tcgdex.dev)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL and anon key
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## Project structure

- `src/pages` route-level components
- `src/components` shared UI
- `src/lib` API clients (Supabase, PokeAPI, TCGdex, cards, bug reports)
- `src/auth` authentication context and the admin route guard
- `supabase/*.sql` database schema, applied directly to the project
- `supabase/functions` Edge Functions (the bug/feedback report handler)

## Features

- Species browser with search and a completion filter
- Per-species card checklist grouped by language, with admin add/edit/delete
  and drag-and-drop reordering
- Bulk card import from TCGdex with a review-before-import step
- Completion tracking and a cards-per-species ranking page
- Site-wide bug/missing-card/wrong-image report widget, emailed to the site
  owner via a Supabase Edge Function
