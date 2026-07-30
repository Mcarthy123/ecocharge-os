'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push(searchParams.get('next') ?? '/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Log in to EcoCharge OS</h1>
        <p className="text-sm text-neutral-400">Manage your stations, fleet, or account.</p>
      </div>

      <div className="space-y-2">
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
        {loading ? 'Logging in…' : 'Log in'}
      </button>

      <p className="text-center text-sm text-neutral-400">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-accent hover:underline">
          Sign up
        </a>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
