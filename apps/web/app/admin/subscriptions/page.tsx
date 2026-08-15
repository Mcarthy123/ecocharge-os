import { createClient } from '@/lib/supabase/server'
import { updateOrganizationPlan } from '@/lib/actions/admin'

const PLAN_OPTIONS = ['starter', 'professional', 'enterprise']

const PLAN_STYLES: Record<string, string> = {
  starter: 'bg-neutral-800 text-neutral-300',
  professional: 'bg-blue-500/20 text-blue-400',
  enterprise: 'bg-accent/20 text-accent',
}

export default async function AdminSubscriptionsPage() {
  const supabase = createClient()

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, plan, status')
    .order('plan', { ascending: true })

  const counts = (organizations ?? []).reduce<Record<string, number>>((acc, org) => {
    acc[org.plan] = (acc[org.plan] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Subscriptions</h1>
        <p className="text-sm text-neutral-400">
          Billing isn&apos;t wired up yet (Phase 6) — this shows and lets you change each
          organization&apos;s plan tier directly.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-md">
        {PLAN_OPTIONS.map((plan) => (
          <div key={plan} className="rounded-lg border border-neutral-800 bg-base-900 p-3">
            <p className="text-xs capitalize text-neutral-500">{plan}</p>
            <p className="mt-1 text-xl font-semibold">{counts[plan] ?? 0}</p>
          </div>
        ))}
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
                <p className="text-xs text-neutral-500">Status: {org.status}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={
                    'rounded-full px-2 py-0.5 text-xs capitalize ' +
                    (PLAN_STYLES[org.plan] ?? 'bg-neutral-800 text-neutral-300')
                  }
                >
                  {org.plan}
                </span>

                <form action={updateOrganizationPlan} className="flex items-center gap-2">
                  <input type="hidden" name="organizationId" value={org.id} />
                  <select
                    name="newPlan"
                    defaultValue={org.plan}
                    className="rounded-md border border-neutral-800 bg-base-900 px-2 py-1 text-xs capitalize outline-none focus:border-accent"
                  >
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
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
          ))}
        </div>
      )}
    </div>
  )
}
