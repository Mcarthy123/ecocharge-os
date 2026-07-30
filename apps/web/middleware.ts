import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { sectionForPath } from '@/lib/auth/roles'

// Runs on every request. Two jobs:
//   1. Refresh the Supabase auth session (required by @supabase/ssr so
//      Server Components always see an up-to-date session cookie).
//   2. Guard /admin, /owner, /manager, /fleet, /driver — redirect to
//      /login if not authenticated, or to /unauthorized if the user
//      has no role granting access to that section.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const section = sectionForPath(request.nextUrl.pathname)

  if (section) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Lightweight check here: does the user have platform_admin, or any
    // organization_members row that maps to this section? We re-check
    // more precisely (which org, which specific role) inside each
    // section's own layout — this pass just keeps obviously-unauthorized
    // users out before any dashboard code runs.
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_role')
      .eq('id', user.id)
      .single()

    const isPlatformAdmin = profile?.platform_role === 'platform_admin'

    if (section === 'admin' && !isPlatformAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (section !== 'admin' && !isPlatformAdmin) {
      const roleColumnBySection: Record<string, string[]> = {
        owner: ['owner'],
        manager: ['manager'],
        fleet: ['fleet_manager'],
        driver: ['driver'],
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .in('role', roleColumnBySection[section])
        .limit(1)

      if (!membership || membership.length === 0) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    // Run on everything except static assets and Next internals.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
