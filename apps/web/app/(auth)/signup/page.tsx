'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Signs up a new user with email/password. A profile + wallet row is
// created automatically by the on_auth_user_created DB trigger — no
// need to insert those from the client. Organization membership (which
// role, which org) is assigned separately, e.g. via an invite flow or
// by a platform admin approving a new station owner — not at signup
// time, since a bare signup has no org yet.
export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-sm text-sm text-neutral-300">
          Check your email to confirm your account, then log in.
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="text-sm text-neutral-400">
            You&apos;ll get access to a dashboard once you&apos;re linked to a station, fleet,
            or admin role.
          </p>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-base-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-base-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-base-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-base-950 hover:bg-accent-muted disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </main>
  )
}
