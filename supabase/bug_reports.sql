-- Bug/feedback reports submitted through the site-wide report widget.
-- Deliberately has NO RLS policies for anon/authenticated: the only way in
-- is the "submit-bug-report" Edge Function, which validates everything
-- server-side and writes using the service role (which bypasses RLS).
-- Applied directly to the live DB via Claude's Postgres connection.

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null check (report_type in ('bug', 'missing_card', 'wrong_image')),
  email text not null,
  subject text not null,
  message text not null,
  screenshot_path text,
  page_url text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- Used by the Edge Function to rate-limit repeat submissions.
create index if not exists bug_reports_rate_limit_idx
  on public.bug_reports (created_at desc);

alter table public.bug_reports enable row level security;

-- Private bucket, only the Edge Function's service-role client ever reads
-- or writes it. file_size_limit / allowed_mime_types are enforced by the
-- Storage engine itself, not RLS, so they hold even for service-role writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-reports',
  'bug-reports',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
