-- Provision the one-time setup registry as the database owner.
-- No client roles can read or write this table, even when authenticated.
create table if not exists public.cbc_admin_setup (
  id text primary key,
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
alter table public.cbc_admin_setup enable row level security;
revoke all on public.cbc_admin_setup from public, anon, authenticated;
grant all on public.cbc_admin_setup to service_role;
