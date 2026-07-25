// Central definition of roles and which dashboard section each one maps
// to. Both middleware.ts and lib/auth/getUserContext.ts import from here
// so the mapping only lives in one place.

export type PlatformRole = 'platform_admin' | 'none'
export type OrgRole = 'owner' | 'manager' | 'fleet_manager' | 'driver'

export const DASHBOARD_SECTIONS = [
  'admin',
  'owner',
  'manager',
  'fleet',
  'driver',
] as const
export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number]

// Which dashboard section(s) a given role is allowed into.
const ORG_ROLE_TO_SECTION: Record<OrgRole, DashboardSection> = {
  owner: 'owner',
  manager: 'manager',
  fleet_manager: 'fleet',
  driver: 'driver',
}

export function sectionForOrgRole(role: OrgRole): DashboardSection {
  return ORG_ROLE_TO_SECTION[role]
}

// The section a path like /owner/stations/123 belongs to, or null if
// the path isn't under any role-guarded dashboard section (e.g. /login).
export function sectionForPath(pathname: string): DashboardSection | null {
  const match = DASHBOARD_SECTIONS.find(
    (section) => pathname === `/${section}` || pathname.startsWith(`/${section}/`)
  )
  return match ?? null
}
