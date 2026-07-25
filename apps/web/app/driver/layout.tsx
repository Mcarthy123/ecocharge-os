import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/getUserContext'
import { DashboardShell } from '@/components/DashboardShell'

const NAV_ITEMS = [
  { label: 'Book a charger', href: '/driver' },
  { label: 'Wallet', href: '/driver/wallet' },
  { label: 'History', href: '/driver/history' },
  { label: 'My vehicle', href: '/driver/vehicle' },
  { label: 'Rewards', href: '/driver/rewards' },
]

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext()
  if (!ctx || !ctx.accessibleSections.includes('driver')) redirect('/unauthorized')

  return (
    <DashboardShell section="Driver" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
