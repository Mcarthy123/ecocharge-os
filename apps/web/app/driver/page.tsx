export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  in_use: 'In use',
  offline: 'Offline',
  maintenance: 'Maintenance',
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-accent/20 text-accent',
  in_use: 'bg-blue-500/20 text-blue-400',
  offline: 'bg-red-500/20 text-red-400',
  maintenance: 'bg-yellow-500/20 text-yellow-400',
}

export default async function DriverBrowsePage() {
  // Public page: read-only list of chargers and their live status.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: chargers } = await supabase
    .from('chargers')
    .select('id, ocpp_charge_point_id, status, stations(id, name)')
    .order('ocpp_charge_point_id', { ascending: true })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Find a charger</h1>
        <p className="text-sm text-neutral-400">
          Live charger availability across stations.
        </p>
      </div>

      {!chargers || chargers.length === 0 ? (
        <p className="text-sm text-neutral-400">No chargers listed yet.</p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {chargers.map((charger: any) => (
            <div key={charger.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">
                  {charger.stations?.name ?? 'Unknown station'}
                </p>
                <p className="text-xs text-neutral-500">
                  Charger {charger.ocpp_charge_point_id}
                </p>
              </div>
              <span
                className={
                  'rounded-full px-2 py-0.5 text-xs ' +
                  (STATUS_STYLES[charger.status] ?? 'bg-neutral-800 text-neutral-400')
                }
              >
                {STATUS_LABELS[charger.status] ?? charger.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
