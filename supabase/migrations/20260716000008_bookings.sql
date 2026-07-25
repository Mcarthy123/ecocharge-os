create table bookings (
  id uuid primary key default gen_random_uuid(),
  charger_id uuid not null references chargers(id) on delete cascade,
  driver_id uuid not null references profiles(id),
  reserved_from timestamptz not null,
  reserved_until timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_queue', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reserved_until > reserved_from)
);

create index bookings_charger_idx on bookings (charger_id);
create index bookings_driver_idx on bookings (driver_id);
create index bookings_status_idx on bookings (status);

create trigger set_bookings_updated_at
  before update on bookings
  for each row execute procedure set_updated_at();

-- Now that bookings exists, wire up the deferred reference from sessions.
alter table charging_sessions
  add constraint charging_sessions_booking_fk
  foreign key (booking_id) references bookings(id) on delete set null;
