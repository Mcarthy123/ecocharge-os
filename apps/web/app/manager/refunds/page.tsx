import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { issueRefund } from '@/lib/actions/refunds'

export default async function ManagerRefundsPage() {
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

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, reserved_from, status, driver_id, profiles(full_name), chargers!inner(ocpp_charge_point_id, stations!inner(name, organization_id))'
    )
    .eq('chargers.stations.organization_id', membership.organization_id)
    .in('status', ['confirmed', 'completed', 'no_show'])
    .order('reserved_from', { ascending: false })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Refunds</h1>
        <p className="text-sm text-neutral-400">
          Issue a refund to a driver&apos;s wallet for a completed or disputed booking.
        </p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No eligible bookings yet. Refunds can be issued for confirmed, completed, or no-show
          bookings.
        </p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {bookings.map((booking) => {
            const station = (booking as any).chargers?.stations
            const charger = (booking as any).chargers
            const driverName = (booking as any).profiles?.full_name ?? 'Unknown driver'

            return (
              <div
                key={booking.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {driverName} · {station?.name ?? 'Unknown station'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Charger {charger?.ocpp_charge_point_id} ·{' '}
                    {new Date(booking.reserved_from).toLocaleString()} · status:{' '}
                    {booking.status.replace('_', ' ')}
                  </p>
                </div>

                <form action={issueRefund} className="flex items-center gap-2">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Amount"
                    className="w-24 rounded-md border border-neutral-800 bg-base-900 px-2 py-1 text-xs outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-base-950 hover:bg-accent-muted"
                  >
                    Refund
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
