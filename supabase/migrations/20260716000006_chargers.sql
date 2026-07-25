create table chargers (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  -- The identifier the physical charger authenticates to the OCPP server with.
  ocpp_charge_point_id text not null unique,
  connector_type text not null
    check (connector_type in ('CCS2', 'CHAdeMO', 'Type2', 'GBT')),
  power_kw numeric,
  status text not null default 'offline'
    check (status in ('available', 'charging', 'offline', 'reserved', 'fault', 'maintenance')),
  firmware_version text,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chargers_station_idx on chargers (station_id);
create index chargers_status_idx on chargers (status);
create index chargers_ocpp_id_idx on chargers (ocpp_charge_point_id);

create trigger set_chargers_updated_at
  before update on chargers
  for each row execute procedure set_updated_at();
