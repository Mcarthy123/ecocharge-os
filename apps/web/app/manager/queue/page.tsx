export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ManagerQueuePage() {
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
    .in('status', ['confirmed', 'charging'])
    .order('reserved_from', { ascending: true })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Queue</h1>
        <p className="text-sm text-neutral-400">Live bookings awaiting or in progress.</p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing in the queue right now.</p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {bookings.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">
                  {b.profiles?.full_name ?? 'Unknown driver'} ·{' '}
                  {b.chargers?.stations?.name ?? 'Unknown station'}
                </p>
                <p className="text-xs text-neutral-500">
                  Charger {b.chargers?.ocpp_charge_point_id} ·{' '}
                  {new Date(b.reserved_from).toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-medium capitalize text-accent">
                {b.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

