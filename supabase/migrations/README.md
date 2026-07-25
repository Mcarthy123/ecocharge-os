# EcoCharge OS — Phase 0 Migrations

Ten migrations, applied in order (the numeric prefix enforces this). Together they create:

1. `20260716000001_extensions.sql` — pgcrypto + shared `set_updated_at()` trigger function
2. `20260716000002_organizations.sql` — tenant table
3. `20260716000003_profiles.sql` — extends `auth.users`, auto-creates a profile on signup
4. `20260716000004_organization_members.sql` — tenant roles + `is_org_member()` / `is_platform_admin()` helper functions used by RLS
5. `20260716000005_stations.sql`
6. `20260716000006_chargers.sql`
7. `20260716000007_charging_sessions.sql`
8. `20260716000008_bookings.sql` — also wires the deferred FK from sessions to bookings
9. `20260716000009_wallets_transactions.sql` — auto-creates a wallet on profile creation
10. `20260716000010_row_level_security.sql` — enables RLS and adds tenant-isolation policies on every table

## How to apply

If you have the Supabase CLI linked to your project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste each file into the Supabase Dashboard's SQL Editor, in numeric order, one at a time.

## Notes / decisions worth knowing about

- **Service role bypasses RLS.** The OCPP server and payment webhook Edge Functions should use the `service_role` key, not the anon/user key, since they write `chargers`, `charging_sessions`, `wallets`, and `transactions` on behalf of the system rather than as a logged-in user. Client-side code should always use the anon key + user JWT so RLS applies.
- **`stations.status = 'active'` is publicly readable.** This is intentional — the driver-facing map/search needs to show approved stations to users who aren't members of that station's organization.
- **No client-facing write policies on `wallets`/`transactions`/`charging_sessions`.** These are written by trusted backend code after verifying a payment webhook or an OCPP message — allowing direct client writes to balances or session records would be a fraud/tampering risk.
- **`is_org_member()` and `is_platform_admin()` are `security definer`.** This lets RLS policies call them without each caller needing direct select access to `organization_members`/`profiles`, while still evaluating against `auth.uid()` of the actual requester.

## What's deliberately not here yet
Indexes and constraints for OCPP-specific tables (firmware update jobs, diagnostics logs), subscription/billing tables, and analytics rollups are later-phase additions — added once Phase 1 (OCPP backbone) and Phase 2 (Station Owner MVP) are underway, so the schema evolves alongside real usage instead of being guessed upfront.
