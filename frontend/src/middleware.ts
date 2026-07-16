import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Presence of this cookie = "has a session". It is set alongside the JWT in
// http.ts. Middleware only checks presence (it runs before any React code and
// cannot call the API); the backend still validates the token on every request,
// and AppShell confirms the org. This is what stops the dashboard from flashing
// before the client-side redirect — the gate now runs before the route renders.
const TOKEN_COOKIE = 'bm_token'

// Reachable without a session.
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
]

function splitLocale(pathname: string): { locale: string; rest: string } {
  const segments = pathname.split('/')
  const maybe = segments[1]
  if ((routing.locales as readonly string[]).includes(maybe)) {
    return { locale: maybe, rest: '/' + segments.slice(2).join('/') }
  }
  return { locale: routing.defaultLocale, rest: pathname }
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(TOKEN_COOKIE)?.value
  const { locale, rest } = splitLocale(pathname)

  const isPublic = PUBLIC_PATHS.some((p) => rest === p || rest.startsWith(p + '/'))

  // Logged out on a protected route → login, before the page renders.
  if (!token && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/login`
    url.search = ''
    // Preserve where they were headed (skip the bare dashboard root).
    if (rest !== '/') url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Logged in but sitting on the login/register page → dashboard.
  if (token && (rest === '/login' || rest === '/register')) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}`
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Otherwise hand off to next-intl for locale routing.
  return intlMiddleware(req)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
