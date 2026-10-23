begin;

create table if not exists public.app_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(btrim(email)) between 5 and 254),
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now()
);

create unique index if not exists app_waitlist_email_platform_idx
  on public.app_waitlist (lower(btrim(email)), platform);

alter table public.app_waitlist enable row level security;
revoke all on public.app_waitlist from public, anon, authenticated;

commit;
