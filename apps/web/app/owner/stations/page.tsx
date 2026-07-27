import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OwnerStationsPage() {
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

  // No organization yet — send them to create one first rather than
  // showing an empty/confusing stations list.
  if (!membership) redirect('/owner/onboarding')

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name, address, status, created_at')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Stations</h1>
        <Link
          href="/owner/stations/new"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-base-950 hover:bg-accent-muted"
        >
          + Add station
        </Link>
      </div>

      {!stations || stations.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No stations yet.{' '}
          <Link href="/owner/stations/new" className="text-accent hover:underline">
            Add your first one
          </Link>
          .
        </p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {stations.map((station) => (
            <div key={station.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{station.name}</p>
                {station.address && (
                  <p className="text-xs text-neutral-500">{station.address}</p>
                )}
              </div>
              <span
                className={
                  'rounded-full px-2 py-0.5 text-xs ' +
                  (station.status === 'active'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-neutral-800 text-neutral-400')
                }
              >
                {station.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
