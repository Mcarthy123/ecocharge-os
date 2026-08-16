import { createClient } from '@/lib/supabase/server'

export default async function DriverHistoryPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, reserved_from, status, chargers(ocpp_charge_point_id, stations(name))'
    )
    .eq('driver_id', user!.id)
    .order('reserved_from', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Booking history</h1>
        <p className="text-sm text-neutral-400">All your past and current bookings.</p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-neutral-400">No bookings yet.</p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {bookings.map((b) => {
            const charger = (b as any).chargers
            const station = charger?.stations
            return (
              <div key={b.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{station?.name ?? 'Unknown station'}</p>
                  <p className="text-xs text-neutral-500">
                    Charger {charger?.ocpp_charge_point_id} ·{' '}
                    {new Date(b.reserved_from).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-neutral-400">
                  {b.status.replace('_', ' ')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
