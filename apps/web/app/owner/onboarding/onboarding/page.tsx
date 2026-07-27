import { createOrganization } from '@/lib/actions/organizations'

export default function OwnerOnboardingPage() {
  return (
    <div className="max-w-sm">
      <h1 className="mb-1 text-lg font-semibold">Create your organization</h1>
      <p className="mb-4 text-sm text-neutral-400">
        This is your business — the stations you add will belong to it.
      </p>

      <form action={createOrganization} className="space-y-3">
        <input
          type="text"
          name="name"
          required
          placeholder="e.g. Accra Fast Charge Ltd"
          className="w-full rounded-md border border-neutral-800 bg-base-900 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-base-950 hover:bg-accent-muted"
        >
          Create organization
        </button>
      </form>
    </div>
  )
}
