create table charging_sessions (
  id uuid primary key default gen_random_uuid(),
  charger_id uuid not null references chargers(id) on delete cascade,
  driver_id uuid references profiles(id),
  booking_id uuid,                -- fk added after bookings table exists
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  energy_kwh numeric,
  cost numeric,
  status text not null default 'active'
    check (status in ('active', 'completed', 'faulted')),
  created_at timestamptz not null default now()
);

create index charging_sessions_charger_idx on charging_sessions (charger_id);
create index charging_sessions_driver_idx on charging_sessions (driver_id);
