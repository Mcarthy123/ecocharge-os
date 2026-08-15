import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateChargerStatus } from '@/lib/actions/chargers'

const STATUS_OPTIONS = ['available', 'charging', 'offline', 'reserved', 'fault', 'maintenance']

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-accent/20 text-accent',
  charging: 'bg-blue-500/20 text-blue-400',
  offline: 'bg-neutral-800 text-neutral-400',
  reserved: 'bg-yellow-500/20 text-yellow-400',
  fault: 'bg-red-500/20 text-red-400',
  maintenance: 'bg-orange-500/20 text-orange-400',
}

export default async function ManagerChargersPage() {
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

  const { data: chargers } = await supabase
    .from('chargers')
    .select(
      'id, ocpp_charge_point_id, connector_type, power_kw, status, stations!inner(id, name, organization_id)'
    )
    .eq('stations.organization_id', membership.organization_id)
    .order('ocpp_charge_point_id', { ascending: true })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Chargers</h1>
        <p className="text-sm text-neutral-400">
          Status updates here are manual for now — automatic live status arrives with the OCPP
          backbone (Phase 1).
        </p>
      </div>

      {!chargers || chargers.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No chargers yet. These are added by the platform once a station&apos;s hardware is
          registered (Phase 1) — for now, test rows can be added directly in Supabase&apos;s
          Table Editor.
        </p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {chargers.map((charger) => {
            const station = (charger as any).stations

            return (
              <div
                key={charger.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {charger.ocpp_charge_point_id} · {station?.name ?? 'Unknown station'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {charger.connector_type}
                    {charger.power_kw ? ` · ${charger.power_kw} kW` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs ' +
                      (STATUS_STYLES[charger.status] ?? 'bg-neutral-800 text-neutral-400')
                    }
                  >
                    {charger.status}
                  </span>

                  <form action={updateChargerStatus} className="flex items-center gap-2">
                    <input type="hidden" name="chargerId" value={charger.id} />
                    <select
                      name="newStatus"
                      defaultValue={charger.status}
                      className="rounded-md border border-neutral-800 bg-base-900 px-2 py-1 text-xs outline-none focus:border-accent"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-base-800"
                    >
                      Update
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
