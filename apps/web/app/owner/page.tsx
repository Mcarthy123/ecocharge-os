export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const fmtGhs = (pesewas: number) => `GH₵${(pesewas / 100).toFixed(2)}`
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Africa/Accra',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

// MVP simplification: an owner could belong to multiple organizations,
// but the UI here only surfaces the first one. A proper org-switcher is
// a follow-up once someone actually manages more than one business.
export default async function OwnerOverviewPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, status)')
    .eq('user_id', user!.id)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-lg font-semibold">Set up your business</h1>
        <p className="text-sm text-neutral-400">
          Create your organization to start adding stations, chargers, and staff.
        </p>
        <Link
          href="/owner/onboarding"
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-base-950 hover:bg-accent-muted"
        >
          Create your organization
        </Link>
      </div>
    )
  }

  const org = (membership as any).organizations

  // Stations and chargers
  const { data: stations } = await supabase
    .from('stations')
    .select('id')
    .eq('organization_id', org.id)
  const stationIds = (stations ?? []).map((s: any) => s.id)

  let chargers: any[] = []
  if (stationIds.length) {
    const { data } = await supabase
      .from('chargers')
      .select('id, status')
      .in('station_id', stationIds)
    chargers = data ?? []
  }
  const countStatus = (...names: string[]) =>
    chargers.filter((c) => names.includes(c.status)).length
  const available = countStatus('available')
  const inUse = countStatus('in_use', 'charging')
  const offline = countStatus('offline')
  const maintenance = countStatus('maintenance')

  // Bookings (last 30 days and upcoming), including ones made in the EcoCharge app
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setUTCHours(0, 0, 0, 0) // Ghana is on GMT, so UTC days match local days
  const endOfToday = new Date(startOfToday.getTime() + 86400000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

  let bookings: any[] = []
  if (stationIds.length) {
    const { data } = await supabase
      .from('bookings')
      .select(
        'id, reserved_from, reserved_until, status, amount_pesewas, source, driver_name, profiles(full_name), chargers!inner(ocpp_charge_point_id, stations!inner(name, organization_id))'
      )
      .eq('chargers.stations.organization_id', org.id)
      .gte('reserved_from', thirtyDaysAgo.toISOString())
      .order('reserved_from', { ascending: true })
      .limit(500)
    bookings = data ?? []
  }

  const todays = bookings.filter((b) => {
    const t = new Date(b.reserved_from)
    return t >= startOfToday && t < endOfToday
  })
  const revenueToday = todays
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.amount_pesewas || 0), 0)
  const revenue30 = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.amount_pesewas || 0), 0)
  const upcoming = bookings
    .filter(
      (b) =>
        new Date(b.reserved_until) >= now &&
        ['pending', 'confirmed', 'in_queue'].includes(b.status)
    )
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{org.name}</h1>
        <p className="text-sm text-neutral-400">
          Status:{' '}
          <span className={org.status === 'active' ? 'text-accent' : 'text-neutral-400'}>
            {org.status.replace('_', ' ')}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Stations</p>
          <p className="mt-1 text-2xl font-semibold">{stationIds.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Chargers available</p>
          <p className="mt-1 text-2xl font-semibold">
            {available}/{chargers.length}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {inUse} in use · {offline} offline · {maintenance} maintenance
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Bookings today</p>
          <p className="mt-1 text-2xl font-semibold">{todays.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Today&apos;s revenue</p>
          <p className="mt-1 text-2xl font-semibold">{fmtGhs(revenueToday)}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Revenue, 30 days</p>
          <p className="mt-1 text-2xl font-semibold">{fmtGhs(revenue30)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Upcoming reservations</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500">No upcoming reservations.</p>
        ) : (
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm">
                    {b.driver_name ?? b.profiles?.full_name ?? 'Driver'} ·{' '}
                    {b.chargers?.stations?.name ?? 'Station'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {fmtWhen(b.reserved_from)} · Charger {b.chargers?.ocpp_charge_point_id}
                  </p>
                </div>
                {b.source === 'ghana' && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                    App
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/owner/stations"
        className="inline-block rounded-md border border-neutral-700 px-4 py-2 text-sm hover:bg-base-800"
      >
        Manage stations →
      </Link>
    </div>
  )
}
