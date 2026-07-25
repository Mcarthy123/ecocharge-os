create table stations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  operating_hours jsonb,          -- { "mon": {"open":"08:00","close":"20:00"}, ... }
  amenities text[],
  photos text[],                  -- Supabase Storage object paths
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stations_org_idx on stations (organization_id);
create index stations_status_idx on stations (status);

create trigger set_stations_updated_at
  before update on stations
  for each row execute procedure set_updated_at();
