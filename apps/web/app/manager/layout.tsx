import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/getUserContext'
import { DashboardShell } from '@/components/DashboardShell'

const NAV_ITEMS = [
  { label: 'Bookings', href: '/manager' },
  { label: 'Queue', href: '/manager/queue' },
  { label: 'Chargers', href: '/manager/chargers' },
  { label: 'Refunds', href: '/manager/refunds' },
  { label: 'Reports', href: '/manager/reports' },
]

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext()
  if (!ctx || !ctx.accessibleSections.includes('manager')) redirect('/unauthorized')

  return (
    <DashboardShell section="Station Manager" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
