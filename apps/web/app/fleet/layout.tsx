import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/getUserContext'
import { DashboardShell } from '@/components/DashboardShell'

const NAV_ITEMS = [
  { label: 'Overview', href: '/fleet' },
  { label: 'Vehicles', href: '/fleet/vehicles' },
  { label: 'Drivers', href: '/fleet/drivers' },
  { label: 'Expenses', href: '/fleet/expenses' },
  { label: 'Maintenance', href: '/fleet/maintenance' },
]

export default async function FleetLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext()
  if (!ctx || !ctx.accessibleSections.includes('fleet')) redirect('/unauthorized')

  return (
    <DashboardShell section="Fleet Manager" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
