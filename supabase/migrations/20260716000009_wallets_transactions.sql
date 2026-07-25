create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  balance numeric not null default 0,
  currency text not null default 'GHS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_wallets_updated_at
  before update on wallets
  for each row execute procedure set_updated_at();

create table transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  amount numeric not null,
  type text not null
    check (type in ('topup', 'charge_payment', 'refund', 'payout')),
  reference text,                 -- Paystack transaction reference
  created_at timestamptz not null default now()
);

create index transactions_wallet_idx on transactions (wallet_id);
create index transactions_reference_idx on transactions (reference);

-- Auto-create a GHS wallet whenever a profile is created.
create or replace function handle_new_profile_wallet()
returns trigger as $$
begin
  insert into public.wallets (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_wallet
  after insert on profiles
  for each row execute procedure handle_new_profile_wallet();
