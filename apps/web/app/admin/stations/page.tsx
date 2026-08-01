import { createClient } from '@/lib/supabase/server'
import { updateStationStatus } from '@/lib/actions/admin'

const STATUS_STYLES: Record<string, string> = {
  pending_approval: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-accent/20 text-accent',
  inactive: 'bg-neutral-800 text-neutral-400',
  suspended: 'bg-red-500/20 text-red-400',
}

export default async function AdminStationsPage() {
  const supabase = createClient()

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name, address, status, created_at, organizations(name)')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Stations</h1>
        <p className="text-sm text-neutral-400">
          Review and approve stations submitted by station owners.
        </p>
      </div>

      {!stations || stations.length === 0 ? (
        <p className="text-sm text-neutral-400">No stations have been submitted yet.</p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {stations.map((station) => {
            const orgName = (station as any).organizations?.name ?? 'Unknown organization'

            return (
              <div
                key={station.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{station.name}</p>
                  <p className="text-xs text-neutral-500">
                    {orgName}
                    {station.address ? ` · ${station.address}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs ' +
                      (STATUS_STYLES[station.status] ?? 'bg-neutral-800 text-neutral-400')
                    }
                  >
                    {station.status.replace('_', ' ')}
                  </span>

                  {station.status === 'pending_approval' && (
                    <>
                      <form action={updateStationStatus}>
                        <input type="hidden" name="stationId" value={station.id} />
                        <input type="hidden" name="newStatus" value="active" />
                        <button
                          type="submit"
                          className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-base-950 hover:bg-accent-muted"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={updateStationStatus}>
                        <input type="hidden" name="stationId" value={station.id} />
                        <input type="hidden" name="newStatus" value="suspended" />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-base-800"
                        >
                          Reject
                        </button>
                      </form>
                    </>
                  )}

                  {station.status === 'active' && (
                    <form action={updateStationStatus}>
                      <input type="hidden" name="stationId" value={station.id} />
                      <input type="hidden" name="newStatus" value="suspended" />
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-base-800"
                      >
                        Suspend
                      </button>
                    </form>
                  )}

                  {station.status === 'suspended' && (
                    <form action={updateStationStatus}>
                      <input type="hidden" name="stationId" value={station.id} />
                      <input type="hidden" name="newStatus" value="active" />
                      <button
                        type="submit"
                        className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-base-950 hover:bg-accent-muted"
                      >
                        Reactivate
                      </button>
                    </form>
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
