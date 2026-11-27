export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-accent/20 text-accent',
  in_queue: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-neutral-800 text-neutral-400',
  completed: 'bg-neutral-800 text-neutral-400',
  no_show: 'bg-red-500/20 text-red-400',
}

const fmtGhs = (pesewas: number) => `GH₵${(pesewas / 100).toFixed(2)}`
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Africa/Accra',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export default async function OwnerBookingsPage() {
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

  const { data } = await supabase
    .from('bookings')
    .select(
      'id, reserved_from, reserved_until, status, amount_pesewas, source, driver_name, driver_vehicle, external_reference, profiles(full_name), chargers!inner(ocpp_charge_point_id, stations!inner(name, organization_id))'
    )
    .eq('chargers.stations.organization_id', membership.organization_id)
    .order('reserved_from', { ascending: false })
    .limit(100)
  const bookings: any[] = data ?? []

  const count = (...names: string[]) => bookings.filter((b) => names.includes(b.status)).length
  const summary: [string, number][] = [
    ['Open', count('pending', 'confirmed', 'in_queue')],
    ['Completed', count('completed')],
    ['Cancelled', count('cancelled')],
    ['No-shows', count('no_show')],
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Bookings</h1>
        <p className="text-sm text-neutral-400">
          Latest bookings across your stations, including ones made in the EcoCharge app.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-neutral-800 bg-base-900 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-neutral-400">No bookings yet.</p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-medium">
                  {b.driver_name ?? b.profiles?.full_name ?? 'Driver'} ·{' '}
                  {b.chargers?.stations?.name ?? 'Station'}
                </p>
                <p className="text-xs text-neutral-500">
                  Charger {b.chargers?.ocpp_charge_point_id} · {fmtWhen(b.reserved_from)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {b.amount_pesewas != null ? fmtGhs(b.amount_pesewas) : 'No amount'}
                  {b.source === 'ghana' && b.external_reference
                    ? ` · App ref ${b.external_reference}`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={
                    'rounded-full px-2 py-0.5 text-xs ' +
                    (STATUS_STYLES[b.status] ?? 'bg-neutral-800 text-neutral-400')
                  }
                >
                  {String(b.status).replace('_', ' ')}
                </span>
                {b.source === 'ghana' && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                    App
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
