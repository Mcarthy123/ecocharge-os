import Link from 'next/link'

export function DashboardShell({
  section,
  navItems,
  children,
}: {
  section: string
  navItems: { label: string; href: string }[]
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-neutral-900 bg-base-900 p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-sm font-semibold tracking-wide">EcoCharge OS</span>
        </div>
        <p className="mb-3 px-2 text-xs uppercase tracking-wide text-neutral-500">{section}</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-2 py-1.5 text-sm text-neutral-300 hover:bg-base-800 hover:text-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
