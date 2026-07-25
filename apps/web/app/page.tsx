import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/getUserContext'

// Root route has no UI of its own — it just routes a visitor to the
// right place: their dashboard if they're logged in and have exactly
// one accessible section, a section picker if they have several
// (e.g. an owner who's also a driver), or /login otherwise.
export default async function HomePage() {
  const ctx = await getUserContext()

  if (!ctx) redirect('/login')
  if (ctx.accessibleSections.length === 1) redirect(`/${ctx.accessibleSections[0]}`)
  if (ctx.accessibleSections.length === 0) redirect('/unauthorized')

  // Multiple sections available — for now, default to the first; a
  // proper section-switcher UI is a follow-up once there's a real user
  // with more than one role to design it against.
  redirect(`/${ctx.accessibleSections[0]}`)
}
