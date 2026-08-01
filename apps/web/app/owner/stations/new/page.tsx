import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createStation } from '@/lib/actions/stations'

export default async function NewStationPage() {
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

  return (
    <div className="max-w-sm">
      <h1 className="mb-4 text-lg font-semibold">Add a station</h1>

      <form action={createStation} className="space-y-3">
        <input type="hidden" name="organizationId" value={membership.organization_id} />

        <input
          type="text"
          name="name"
          required
          placeholder="Station name"
          className="w-full rounded-md border border-neutral-800 bg-base-900 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="text"
          name="address"
          placeholder="Address (optional)"
          className="w-full rounded-md border border-neutral-800 bg-base-900 px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <button
          type="submit"
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-base-950 hover:bg-accent-muted"
        >
          Add station
        </button>
      </form>

      <p className="mt-3 text-xs text-neutral-500">
        New stations start as &quot;pending approval&quot; until a platform admin reviews them.
      </p>
    </div>
  )
}
