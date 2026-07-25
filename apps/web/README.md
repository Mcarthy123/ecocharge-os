# EcoCharge OS — Web App Shell

Next.js 14 (App Router) shell with Supabase auth and role-based routing. Built to sit on top of the Phase 0 schema/migrations — needs those applied to a Supabase project first.

## Setup

```bash
cd apps/web
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## How the routing guard works

Two layers, deliberately redundant:

1. **`middleware.ts`** — runs on every request before any page code executes. Refreshes the Supabase session cookie and does a lightweight check: is there a logged-in user, and do they have *some* role that maps to the section they're requesting (`/admin`, `/owner`, `/manager`, `/fleet`, `/driver`)? If not, redirect to `/login` or `/unauthorized`.
2. **Each section's `layout.tsx`** (e.g. `app/owner/layout.tsx`) — re-checks precisely via `getUserContext()`, which hits Postgres directly through RLS-protected queries. This is the real security boundary; middleware is a fast filter that avoids rendering dashboard code for obviously-unauthorized requests, not a substitute for row-level security.

`lib/auth/roles.ts` is the single place that maps `organization_members.role` → dashboard section (`owner` → `/owner`, `fleet_manager` → `/fleet`, etc.) and lists which URL prefixes are role-guarded. Add a new role or section there first, then create its `app/<section>/` folder.

## What's a placeholder right now

Every dashboard page (`/admin`, `/owner`, `/manager`, `/fleet`, `/driver`) is a one-line stand-in. The real content for each (live charger grids, booking tables, wallet views, etc.) comes from later roadmap phases — this shell's job is just to prove that auth, RLS, and role routing hold together end to end before building on top of it.

## Visual design note

Styling here is intentionally minimal (dark background, single green accent, plain Tailwind utilities) — enough to be usable and on-brand, not the final polished dashboard design. A dedicated design pass makes more sense once each section has real content to design around (Tesla/Rivian/Stripe-inspired dark mode with glassmorphism, per the original brief) rather than styling empty placeholder pages twice.

## Multi-role users
`app/page.tsx` currently sends a user with more than one accessible section (e.g. someone who's both a station owner and a driver) to the first one alphabetically. A proper section-switcher is worth building once you have a real user in that situation to design it against.
