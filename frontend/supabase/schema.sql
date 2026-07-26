-- Waitlist signups. Run once in the Supabase SQL editor.
create table if not exists public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  source     text not null default 'tutorials',
  created_at timestamptz not null default now()
);

-- The API writes with the service-role key (bypasses RLS). Locking the table
-- down with RLS and no public policies means the anon key can't read the list.
alter table public.waitlist enable row level security;

-- Explicit grants: some projects miss the default privileges, which surfaces
-- as "42501 permission denied for table waitlist" on insert.
grant usage on schema public to service_role;
grant all on table public.waitlist to service_role;
