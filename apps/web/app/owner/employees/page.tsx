import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { inviteEmployee } from '@/lib/actions/employees'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Station Manager',
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
}

export default async function EmployeesPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: ownerMembership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  if (!ownerMembership) redirect('/owner/onboarding')

  const { data: members } = await supabase
    .from('organization_members')
    .select('id, role, user_id, profiles(full_name)')
    .eq('organization_id', ownerMembership.organization_id)
    .order('role', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Employees</h1>
        <p className="text-sm text-neutral-400">
          Add staff to help manage your stations. They need an EcoCharge OS account already —
          ask them to sign up first if they don&apos;t have one.
        </p>
      </div>

      <div className="max-w-sm rounded-lg border border-neutral-800 bg-base-900 p-4">
        <h2 className="mb-3 text-sm font-medium">Add staff by email</h2>
        <form action={inviteEmployee} className="space-y-2">
          <input
            type="hidden"
            name="organizationId"
            value={ownerMembership.organization_id}
          />
          <input
            type="email"
            name="email"
            required
            placeholder="staff@example.com"
            className="w-full rounded-md border border-neutral-800 bg-base-950 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            name="role"
            defaultValue="manager"
            className="w-full rounded-md border border-neutral-800 bg-base-950 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="manager">Station Manager</option>
            <option value="fleet_manager">Fleet Manager</option>
            <option value="driver">Driver</option>
          </select>
          <button
            type="submit"
            className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-base-950 hover:bg-accent-muted"
          >
            Add
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Current team</h2>
        {!members || members.length === 0 ? (
          <p className="text-sm text-neutral-500">No one here yet.</p>
        ) : (
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3">
                <span className="text-sm">
                  {(member as any).profiles?.full_name ?? 'Unnamed user'}
                </span>
                <span className="rounded-full bg-base-800 px-2 py-0.5 text-xs text-neutral-300">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
