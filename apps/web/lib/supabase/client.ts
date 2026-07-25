import { createBrowserClient } from '@supabase/ssr'

// Used in Client Components. Relies on the anon key + the user's own
// session — RLS applies fully here, which is what we want for anything
// running in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
