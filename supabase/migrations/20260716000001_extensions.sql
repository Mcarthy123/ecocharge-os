-- Extensions required by later migrations
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- Shared trigger function: keeps `updated_at` current on any row update.
-- Used by every table below instead of depending on the moddatetime extension.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
