import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// MVP simplification: an owner could belong to multiple organizations,
// but the UI here only surfaces the first one. A proper org-switcher is
// a follow-up once someone actually manages more than one business.
export default async function OwnerOverviewPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, status)')
    .eq('user_id', user!.id)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-lg font-semibold">Set up your business</h1>
        <p className="text-sm text-neutral-400">
          Create your organization to start adding stations, chargers, and staff.
        </p>
        <Link
          href="/owner/onboarding"
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-base-950 hover:bg-accent-muted"
        >
          Create your organization
        </Link>
      </div>
    )
  }

  const org = (membership as any).organizations

  const { count: stationCount } = await supabase
    .from('stations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{org.name}</h1>
        <p className="text-sm text-neutral-400">
          Status:{' '}
          <span className={org.status === 'active' ? 'text-accent' : 'text-neutral-400'}>
            {org.status.replace('_', ' ')}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Stations</p>
          <p className="mt-1 text-2xl font-semibold">{stationCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Today&apos;s revenue</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-600">— (Phase 2 cont.)</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-base-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Live chargers</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-600">— (Phase 1)</p>
        </div>
      </div>

      <Link
        href="/owner/stations"
        className="inline-block rounded-md border border-neutral-700 px-4 py-2 text-sm hover:bg-base-800"
      >
        Manage stations →
      </Link>
    </div>
  )
}
