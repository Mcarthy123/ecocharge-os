'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function DashboardShell({
  section,
  navItems,
  children,
}: {
  section: string
  navItems: { label: string; href: string }[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? ''

  // Close the phone menu whenever the page changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // The most specific nav item that matches the current page is the active one
  const activeHref = navItems
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  const nav = (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            'block rounded-md px-2 py-2 text-sm hover:bg-base-800 hover:text-neutral-100 ' +
            (item.href === activeHref ? 'bg-base-800 text-neutral-100' : 'text-neutral-300')
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )

  const brand = (
    <div className="flex items-center gap-2 px-2">
      <div className="h-2 w-2 rounded-full bg-accent" />
      <span className="text-sm font-semibold tracking-wide">EcoCharge OS</span>
    </div>
  )

  return (
    <div className="min-h-screen md:flex">
      {/* Laptop and tablet: fixed sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-neutral-900 bg-base-900 p-4 md:block">
        <div className="mb-6">{brand}</div>
        <p className="mb-3 px-2 text-xs uppercase tracking-wide text-neutral-500">{section}</p>
        {nav}
      </aside>

      {/* Phone: top bar with a menu button */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-900 bg-base-900 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          {brand}
          <span className="text-xs text-neutral-500">· {section}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200"
        >
          Menu
        </button>
      </header>

      {/* Phone: slide-in menu */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80%] overflow-y-auto border-r border-neutral-900 bg-base-900 p-4">
            <div className="mb-6 flex items-center justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-300"
              >
                Close
              </button>
            </div>
            <p className="mb-3 px-2 text-xs uppercase tracking-wide text-neutral-500">{section}</p>
            {nav}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
