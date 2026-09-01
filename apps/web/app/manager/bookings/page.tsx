import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateBookingStatus, setBookingAmount, generatePaymentLink } from '@/lib/actions/bookings'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-accent/20 text-accent',
  in_queue: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-neutral-800 text-neutral-400',
  completed: 'bg-neutral-800 text-neutral-400',
  no_show: 'bg-red-500/20 text-red-400',
}

const PAYMENT_STYLES: Record<string, string> = {
  paid: 'bg-accent/20 text-accent',
  unpaid: 'bg-neutral-800 text-neutral-400',
  failed: 'bg-red-500/20 text-red-400',
}

export default async function ManagerBookingsPage() {
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
      'id, reserved_from, reserved_until, status, amount_pesewas, payment_status, payment_link, payment_reference, driver_id, profiles(full_name), chargers!inner(id, ocpp_charge_point_id, stations!inner(id, name, organization_id))'
    )
    .eq('chargers.stations.organization_id', membership.organization_id)
    .order('reserved_from', { ascending: false })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Bookings queue</h1>
        <p className="text-sm text-neutral-400">
          Approve, cancel, or mark bookings complete for your stations.
        </p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No bookings yet. These appear once drivers reserve a charger (Phase 10) — for now,
          test rows can be added directly in Supabase&apos;s Table Editor.
        </p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {bookings.map((booking) => {
            const station = (booking as any).chargers?.stations
            const charger = (booking as any).chargers
            const driverName = (booking as any).profiles?.full_name ?? 'Unknown driver'
            const paymentStatus = booking.payment_status ?? 'unpaid'

            return (
              <div
                key={booking.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {driverName} · {station?.name ?? 'Unknown station'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Charger {charger?.ocpp_charge_point_id} ·{' '}
                    {new Date(booking.reserved_from).toLocaleString()} –{' '}
                    {new Date(booking.reserved_until).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {booking.amount_pesewas != null
                      ? `GH₵${(booking.amount_pesewas / 100).toFixed(2)}`
                      : 'No amount set'}
                  </p>
                                    {booking.payment_link && (<a href={booking.payment_link} target="_blank" className="text-xs text-accent underline break-all">{booking.payment_link}</a>)}
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs ' +
                      (STATUS_STYLES[booking.status] ?? 'bg-neutral-800 text-neutral-400')
                    }
                  >
                    {booking.status.replace('_', ' ')}
                  </span>
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs ' +
                      (PAYMENT_STYLES[paymentStatus] ?? 'bg-neutral-800 text-neutral-400')
                    }
                  >
                    {paymentStatus}
                  </span>

                  <form action={setBookingAmount} className="flex items-center gap-1">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input
                      type="number"
                      name="amountGhs"
                      step="0.01"
                      min="0"
                      placeholder="GH₵"
                      defaultValue={
                        booking.amount_pesewas != null
                          ? (booking.amount_pesewas / 100).toFixed(2)
                          : ''
                      }
                      className="w-20 rounded-md border border-neutral-800 bg-base-900 px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-700 px-2 py-1 text-xs hover:bg-base-800"
                    >
                      Set
                    </button>
                  </form>

                  {booking.amount_pesewas != null && paymentStatus !== 'paid' && (
                    <form action={generatePaymentLink} className="flex items-center gap-1">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="amountPesewas" value={booking.amount_pesewas} />
                      <input
                        type="email"
                        name="driverEmail"
                        placeholder="driver@email.com"
                        required
                        className="w-36 rounded-md border border-neutral-800 bg-base-900 px-2 py-1 text-xs outline-none focus:border-accent"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-700 px-2 py-1 text-xs hover:bg-base-800"
                      >
                        {booking.payment_link ? 'Regenerate link' : 'Generate link'}
                      </button>
                    </form>
                  )}

                  {(booking.status === 'pending' || booking.status === 'in_queue') && (
                    <>
                      <form action={updateBookingStatus}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="newStatus" value="confirmed" />
                        <button
                          type="submit"
                          className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-base-950 hover:bg-accent-muted"
                        >
                          Confirm
                        </button>
                      </form>
                      <form action={updateBookingStatus}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="newStatus" value="cancelled" />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-base-800"
                        >
                          Cancel
                        </button>
                      </form>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <>
                      <form action={updateBookingStatus}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="newStatus" value="completed" />
                        <button
                          type="submit"
                          className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-base-950 hover:bg-accent-muted"
                        >
                          Mark complete
                        </button>
                      </form>
                      <form action={updateBookingStatus}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="newStatus" value="no_show" />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-base-800"
                        >
                          No-show
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
