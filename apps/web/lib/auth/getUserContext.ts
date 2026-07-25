import { createClient } from '@/lib/supabase/server'
import { DashboardSection, sectionForOrgRole } from './roles'

export type UserContext = {
  userId: string
  platformRole: 'platform_admin' | 'none'
  // A user can belong to multiple orgs; we surface the distinct set of
  // dashboard sections they have access to across all of them.
  accessibleSections: DashboardSection[]
}

// Loads everything a Server Component or the middleware needs to decide
// what a logged-in user is allowed to see. Returns null if not logged in.
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('platform_role').eq('id', user.id).single(),
    supabase.from('organization_members').select('role').eq('user_id', user.id),
  ])

  const platformRole = (profile?.platform_role ?? 'none') as 'platform_admin' | 'none'

  const sections = new Set<DashboardSection>()
  if (platformRole === 'platform_admin') sections.add('admin')
  for (const m of memberships ?? []) {
    sections.add(sectionForOrgRole(m.role as any))
  }

  return {
    userId: user.id,
    platformRole,
    accessibleSections: Array.from(sections),
  }
}
