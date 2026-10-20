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

  // /driver (the browse page) is public. Deeper driver pages are already
  // protected by middleware.ts, so only show the dashboard frame when the
  // person actually has the driver role; everyone else just sees the page.
  if (!ctx || !ctx.accessibleSections.includes('driver')) {
    return <>{children}</>
  }

  return (
    <DashboardShell section="Driver" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
