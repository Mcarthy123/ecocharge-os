-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security: every tenant-scoped table enforces that a user
-- only sees/modifies rows in organizations they belong to, unless
-- they're a platform_admin (see is_platform_admin() from migration 4).
-- ═══════════════════════════════════════════════════════════════════

-- ── organizations ──────────────────────────────────────────────────
alter table organizations enable row level security;

create policy "members can view their organization"
on organizations for select
using (
  is_org_member(id, array['owner','manager','fleet_manager','driver'])
  or is_platform_admin()
);

create policy "platform admin manages organizations"
on organizations for all
using (is_platform_admin());

-- ── profiles ───────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "users can view and edit their own profile"
on profiles for all
using (id = auth.uid() or is_platform_admin());

-- ── organization_members ───────────────────────────────────────────
alter table organization_members enable row level security;

create policy "members can view their org's membership list"
on organization_members for select
using (
  is_org_member(organization_id, array['owner','manager','fleet_manager','driver'])
  or is_platform_admin()
);

create policy "owners manage membership"
on organization_members for insert
with check (is_org_member(organization_id, array['owner']) or is_platform_admin());

create policy "owners update/remove membership"
on organization_members for update
using (is_org_member(organization_id, array['owner']) or is_platform_admin());

create policy "owners delete membership"
on organization_members for delete
using (is_org_member(organization_id, array['owner']) or is_platform_admin());

-- ── stations ───────────────────────────────────────────────────────
alter table stations enable row level security;

create policy "org members view their stations"
on stations for select
using (
  is_org_member(organization_id, array['owner','manager','fleet_manager','driver'])
  or is_platform_admin()
  or status = 'active'   -- public can browse active stations (e.g. driver app search)
);

create policy "owners/managers modify their stations"
on stations for insert
with check (is_org_member(organization_id, array['owner','manager']) or is_platform_admin());

create policy "owners/managers update their stations"
on stations for update
using (is_org_member(organization_id, array['owner','manager']) or is_platform_admin());

create policy "owners delete their stations"
on stations for delete
using (is_org_member(organization_id, array['owner']) or is_platform_admin());

-- ── chargers (scoped via parent station's organization) ─────────────
alter table chargers enable row level security;

create policy "org members view their chargers"
on chargers for select
using (
  exists (
    select 1 from stations s
    where s.id = chargers.station_id
      and (
        is_org_member(s.organization_id, array['owner','manager','fleet_manager','driver'])
        or is_platform_admin()
        or s.status = 'active'
      )
  )
);

create policy "owners/managers modify their chargers"
on chargers for insert
with check (
  exists (
    select 1 from stations s
    where s.id = chargers.station_id
      and (is_org_member(s.organization_id, array['owner','manager']) or is_platform_admin())
  )
);

create policy "owners/managers update their chargers"
on chargers for update
using (
  exists (
    select 1 from stations s
    where s.id = chargers.station_id
      and (is_org_member(s.organization_id, array['owner','manager']) or is_platform_admin())
  )
);

-- ── bookings ───────────────────────────────────────────────────────
alter table bookings enable row level security;

create policy "drivers view their own bookings"
on bookings for select
using (
  driver_id = auth.uid()
  or is_platform_admin()
  or exists (
    select 1 from chargers c join stations s on s.id = c.station_id
    where c.id = bookings.charger_id
      and is_org_member(s.organization_id, array['owner','manager'])
  )
);

create policy "drivers create their own bookings"
on bookings for insert
with check (driver_id = auth.uid());

create policy "drivers cancel own bookings; managers update any at their stations"
on bookings for update
using (
  driver_id = auth.uid()
  or is_platform_admin()
  or exists (
    select 1 from chargers c join stations s on s.id = c.station_id
    where c.id = bookings.charger_id
      and is_org_member(s.organization_id, array['owner','manager'])
  )
);

-- ── charging_sessions ────────────────────────────────────────────────
alter table charging_sessions enable row level security;

create policy "drivers and station staff view relevant sessions"
on charging_sessions for select
using (
  driver_id = auth.uid()
  or is_platform_admin()
  or exists (
    select 1 from chargers c join stations s on s.id = c.station_id
    where c.id = charging_sessions.charger_id
      and is_org_member(s.organization_id, array['owner','manager'])
  )
);

-- Writes to charging_sessions happen via the OCPP server using the
-- Supabase service_role key, which bypasses RLS entirely — no direct
-- client-side insert/update policy is needed for that path.

-- ── wallets & transactions ───────────────────────────────────────────
alter table wallets enable row level security;
alter table transactions enable row level security;

create policy "users view their own wallet"
on wallets for select
using (user_id = auth.uid() or is_platform_admin());

create policy "users view their own transactions"
on transactions for select
using (
  is_platform_admin()
  or exists (select 1 from wallets w where w.id = transactions.wallet_id and w.user_id = auth.uid())
);

-- Wallet/transaction writes happen via Edge Functions using the
-- service_role key (after verifying Paystack webhooks), not directly
-- from the client — so no client-facing insert/update policy here.
