-- A user can belong to more than one organization (e.g. manage stations
-- for two different businesses), each with its own role.
create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null
    check (role in ('owner', 'manager', 'fleet_manager', 'driver')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_idx on organization_members (user_id);
create index organization_members_org_idx on organization_members (organization_id);

-- Helper used throughout RLS policies: does the current user have one of
-- the given roles in the given organization?
create or replace function is_org_member(org_id uuid, allowed_roles text[])
returns boolean as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$ language sql security definer stable;

create or replace function is_platform_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and platform_role = 'platform_admin'
  );
$$ language sql security definer stable;
