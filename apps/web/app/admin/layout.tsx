import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/getUserContext'
import { DashboardShell } from '@/components/DashboardShell'

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Stations', href: '/admin/stations' },
  { label: 'Organizations', href: '/admin/organizations' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
  { label: 'System health', href: '/admin/system-health' },
]

// Middleware already keeps non-admins out at the network edge; this
// check is the precise, source-of-truth gate that actually decides
// what renders — middleware is a fast filter, not the security boundary.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext()
  if (!ctx || ctx.platformRole !== 'platform_admin') redirect('/unauthorized')

  return (
    <DashboardShell section="Platform Admin" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
