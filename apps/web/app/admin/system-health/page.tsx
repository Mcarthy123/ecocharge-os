export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export default async function SystemHealthPage() { 
  const supabase = createClient()

  const [
    { count: orgCount }, 
    { count: stationCount },
    { count: activeStationCount }, 
    { data: chargers },
    { count: bookingsThisWeek },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('stations').select('*', { count: 'exact', head: true }),
    supabase
      .from('stations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase.from('chargers').select('status'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte(
        'reserved_from',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ),
  ])

  const chargerStatusCounts = (chargers ?? []).reduce<Record<string, number>>(
    (acc, c) => {
      const key = c.status ?? 'unknown'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    {}
  )

  const stats = [
    { label: 'Organizations', value: orgCount ?? 0 },
    {
      label: 'Stations',
      value: stationCount ?? 0,
      sub: `${activeStationCount ?? 0} active`,
    },
    { label: 'Chargers', value: chargers?.length ?? 0 },
    { label: 'Bookings (7d)', value: bookingsThisWeek ?? 0 },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">System health</h1>
        <p className="text-sm text-neutral-400">
          Network-wide counts across every organization.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-neutral-800 p-4"
          >
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-neutral-500">{stat.label}</p>
            {stat.sub && (
              <p className="mt-1 text-xs text-accent">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="mb-2 text-sm font-medium">Charger status breakdown</p>
        {Object.keys(chargerStatusCounts).length === 0 ? (
          <p className="text-sm text-neutral-500">No chargers yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(chargerStatusCounts).map(([status, count]) => (
              <span
                key={status}
                className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
              >
                {status}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
