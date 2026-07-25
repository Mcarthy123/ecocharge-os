create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'starter'
    check (plan in ('starter', 'professional', 'enterprise')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_status_idx on organizations (status);

create trigger set_organizations_updated_at
  before update on organizations
  for each row execute procedure set_updated_at();
