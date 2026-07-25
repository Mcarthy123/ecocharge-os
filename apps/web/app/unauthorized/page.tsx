export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold">You don&apos;t have access to this yet</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        Your account isn&apos;t linked to a station, fleet, or admin role. If this seems wrong,
        check with whoever invited you.
      </p>
    </main>
  )
}
