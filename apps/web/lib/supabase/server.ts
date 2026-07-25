import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Used in Server Components, Server Actions, and Route Handlers.
// Still uses the anon key + the request's session cookie — RLS still
// applies. Never use the service_role key here; that belongs only in
// trusted backend code (Edge Functions, the OCPP server), never in a
// path that's reachable by an arbitrary logged-in user's request.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component with no writable cookie jar
            // (e.g. during prerendering) — safe to ignore since the
            // middleware refreshes the session on every request anyway.
          }
        },
      },
    }
  )
}
