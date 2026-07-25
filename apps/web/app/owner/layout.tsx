import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/getUserContext'
import { DashboardShell } from '@/components/DashboardShell'

const NAV_ITEMS = [
  { label: 'Overview', href: '/owner' },
  { label: 'Stations', href: '/owner/stations' },
  { label: 'Bookings', href: '/owner/bookings' },
  { label: 'Wallet', href: '/owner/wallet' },
  { label: 'Employees', href: '/owner/employees' },
  { label: 'Reports', href: '/owner/reports' },
]

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext()
  if (!ctx || !ctx.accessibleSections.includes('owner')) redirect('/unauthorized')

  return (
    <DashboardShell section="Station Owner" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
