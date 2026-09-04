export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ManagerReportsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .in('role', ['manager', 'owner'])
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/unauthorized')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, status, amount_pesewas, reserved_from, chargers!inner(stations!inner(organization_id))'
    )
    .eq('chargers.stations.organization_id', membership.organization_id)
    .gte('reserved_from', thirtyDaysAgo.toISOString())

  const total = bookings?.length ?? 0
  const completed = bookings?.filter((b) => b.status === 'completed') ?? []
  const cancelled = bookings?.filter((b) => b.status === 'cancelled').length ?? 0
  const noShow = bookings?.filter((b) => b.status === 'no_show').length ?? 0

  const revenuePesewas = completed.reduce((sum, b) => sum + (b.amount_pesewas ?? 0), 0)
  const revenueGhs = (revenuePesewas / 100).toFixed(2)

  const missingAmount = completed.filter((b) => b.amount_pesewas == null).length

  const stats = [
    { label: 'Total bookings (30d)', value: total },
    { label: 'Completed', value: completed.length },
    { label: 'Cancelled', value: cancelled },
    { label: 'No-shows', value: noShow },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-sm text-neutral-400">Last 30 days across your stations.</p>
      </div>

      <div className="rounded-lg border border-neutral-800 p-4">
        <p className="text-xs text-neutral-500">Revenue (completed bookings, 30d)</p>
        <p className="text-2xl font-semibold">GH₵{revenueGhs}</p>
        {missingAmount > 0 && (
          <p className="text-xs text-yellow-500 mt-1">
            {missingAmount} completed booking{missingAmount > 1 ? 's' : ''} missing an amount —
            revenue may be understated.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-800 p-4">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
