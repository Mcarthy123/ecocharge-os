export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const fmtGhs = (pesewas: number) => `GH₵${(pesewas / 100).toFixed(2)}`
const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export default async function OwnerReportsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/owner/onboarding')

  const now = new Date()
  const since = new Date(now.getTime() - 30 * 86400000)

  const { data } = await supabase
    .from('bookings')
    .select(
      'id, reserved_from, status, amount_pesewas, source, chargers!inner(stations!inner(name, organization_id))'
    )
    .eq('chargers.stations.organization_id', membership.organization_id)
    .gte('reserved_from', since.toISOString())
    .lte('reserved_from', now.toISOString())
    .limit(1000)
  const rows: any[] = data ?? []

  const completed = rows.filter((b) => b.status === 'completed')
  const revenue = completed.reduce((sum, b) => sum + (b.amount_pesewas || 0), 0)
  const cancelled = rows.filter((b) => b.status === 'cancelled').length
  const noShows = rows.filter((b) => b.status === 'no_show').length
  const fromApp = rows.filter((b) => b.source === 'ghana').length

  const byStation = new Map<string, { revenue: number; sessions: number }>()
  for (const b of completed) {
    const name = b.chargers?.stations?.name ?? 'Station'
    const cur = byStation.get(name) ?? { revenue: 0, sessions: 0 }
    cur.revenue += b.amount_pesewas || 0
    cur.sessions += 1
    byStation.set(name, cur)
  }
  const stationRows = Array.from(byStation.entries()).sort((a, b) => b[1].revenue - a[1].revenue)

  const perDay = new Map<string, number>()
  for (const b of completed) {
    const k = dayKey(new Date(b.reserved_from))
    perDay.set(k, (perDay.get(k) || 0) + (b.amount_pesewas || 0))
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const k = dayKey(new Date(now.getTime() - i * 86400000))
    return { day: k, value: perDay.get(k) || 0 }
  })
  const maxDay = Math.max(1, ...days.map((d) => d.value))

  const cards: [string, string][] = [
    ['Revenue, 30 days', fmtGhs(revenue)],
    ['Completed sessions', String(completed.length)],
    ['Cancelled', String(cancelled)],
    ['No-shows', String(noShows)],
    ['Booked in the app', String(fromApp)],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-sm text-neutral-400">
          Last 30 days. Revenue counts completed bookings only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-neutral-800 bg-base-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Revenue by station</h2>
        {stationRows.length === 0 ? (
          <p className="text-sm text-neutral-500">No completed sessions yet.</p>
        ) : (
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {stationRows.map(([name, v]) => (
              <div key={name} className="flex items-center justify-between p-3 text-sm">
                <span>{name}</span>
                <span className="text-neutral-400">
                  {v.sessions} sessions · {fmtGhs(v.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Revenue, last 14 days</h2>
        <div className="space-y-2 rounded-lg border border-neutral-800 p-3">
          {days.map((d) => (
            <div key={d.day} className="flex items-center gap-3 text-xs">
              <span className="w-20 shrink-0 text-neutral-500">{d.day.slice(5)}</span>
              <div className="h-2 flex-1 rounded bg-neutral-900">
                <div
                  className="h-2 rounded bg-accent"
                  style={{ width: `${(d.value / maxDay) * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-neutral-400">{fmtGhs(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
