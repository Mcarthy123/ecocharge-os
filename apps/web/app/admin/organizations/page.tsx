import { createClient } from '@/lib/supabase/server'
import { updateOrganizationStatus } from '@/lib/actions/admin'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-accent/20 text-accent',
  suspended: 'bg-red-500/20 text-red-400',
}

export default async function AdminOrganizationsPage() {
  const supabase = createClient()

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, status, plan, created_at')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Organizations</h1>
        <p className="text-sm text-neutral-400">
          Review and approve businesses that have signed up as station owners.
        </p>
      </div>

      {!organizations || organizations.length === 0 ? (
        <p className="text-sm text-neutral-400">No organizations yet.</p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{org.name}</p>
                <p className="text-xs text-neutral-500">Plan: {org.plan}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={
                    'rounded-full px-2 py-0.5 text-xs ' +
                    (STATUS_STYLES[org.status] ?? 'bg-neutral-800 text-neutral-400')
                  }
                >
                  {org.status}
                </span>

                {org.status === 'pending' && (
                  <>
                    <form action={updateOrganizationStatus}>
                      <input type="hidden" name="organizationId" value={org.id} />
                      <input type="hidden" name="newStatus" value="approved" />
                      <button
                        type="submit"
                        className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-base-950 hover:bg-accent-muted"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={updateOrganizationStatus}>
                      <input type="hidden" name="organizationId" value={org.id} />
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

                {org.status === 'approved' && (
                  <form action={updateOrganizationStatus}>
                    <input type="hidden" name="organizationId" value={org.id} />
                    <input type="hidden" name="newStatus" value="suspended" />
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-base-800"
                    >
                      Suspend
                    </button>
                  </form>
                )}

                {org.status === 'suspended' && (
                  <form action={updateOrganizationStatus}>
                    <input type="hidden" name="organizationId" value={org.id} />
                    <input type="hidden" name="newStatus" value="approved" />
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
          ))}
        </div>
      )}
    </div>
  )
}
