'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { BottomNav } from './BottomNav'
import { getAuthToken, logout } from '@/lib/api'
import { useTheme } from '@/store/useTheme'
import { Toaster } from 'sonner'
import { useOrganizationStore } from '@/store/useOrganization'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center app-bg" role="status" aria-label="Loading">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/**
 * One Toaster for the whole app. On a phone it is lifted clear of the bottom
 * tab bar; on desktop it keeps its original bottom-right corner.
 */
function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      mobileOffset={{ bottom: 'calc(var(--nav-total) + 0.75rem)', left: '1rem', right: '1rem' }}
    />
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const { theme } = useTheme()
  const { organization, fetchOrganization } = useOrganizationStore()

  const base = `/${locale}`
  // Public routes: no auth gate, no sidebar/header. Legal pages belong here —
  // they are linked from the signup consent line, before any account exists.
  const authRoutes = new Set([
    `${base}/login`,
    `${base}/register`,
    `${base}/forgot-password`,
    `${base}/reset-password`,
    `${base}/terms`,
    `${base}/privacy`,
  ])
  const isAuthRoute = authRoutes.has(pathname)
  const isOrgRoute = pathname === `${base}/organization`
  const shouldHide = isAuthRoute || isOrgRoute

  // The token lives in a browser-only store, so it's unreadable during SSR. To
  // avoid a hydration mismatch, the first client render must match the server's:
  // both treat the user as unauthorized (loader) until `mounted` flips after
  // hydration, at which point we read the real token and re-render.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  // Computed synchronously so protected content is NEVER rendered before we know
  // the user is allowed to see it. Middleware already blocks the no-cookie case
  // before this component mounts; this covers "token present but org not yet
  // fetched / invalid". Org route needs only a token; app routes need an org.
  const token = mounted ? getAuthToken() : null
  const authorized = isAuthRoute
    ? true
    : !mounted
      ? false
      : isOrgRoute
        ? !!token
        : !!token && !!organization

  React.useEffect(() => {
    if (!mounted || isAuthRoute) return

    if (!token) {
      router.replace(`/${locale}/login`)
      return
    }

    const handleAuthError = (err: any) => {
      const status = err?.response?.status
      if (status === 401 || status === 403) {
        try { logout() } catch {}
        router.replace(`/${locale}/login`)
      } else if (!isOrgRoute) {
        router.replace(`/${locale}/organization`)
      }
    }

    if (organization === undefined) {
      fetchOrganization()
        .then((org) => {
          if (!org && !isOrgRoute) {
            router.replace(`/${locale}/organization`)
          }
        })
        .catch(handleAuthError)
      return
    }

    if (!organization && !isOrgRoute) {
      router.replace(`/${locale}/organization`)
    }
  }, [mounted, isAuthRoute, isOrgRoute, organization, fetchOrganization, router, locale, token])

  // Auth pages own their full-bleed layout (AuthShell renders its own brand
  // panel), so they must not be boxed into a centred container.
  if (isAuthRoute) {
    return (
      <>
        <AppToaster />
        {children}
      </>
    )
  }

  // Protected route, not yet cleared: show a loader, never the real content.
  // The effect above is meanwhile redirecting or fetching the org.
  if (!authorized) {
    return <FullScreenLoader />
  }

  // Onboarding (org creation) also owns its full-bleed layout.
  if (shouldHide) {
    return (
      <>
        <AppToaster />
        {children}
      </>
    )
  }

  // Mobile gets a bottom tab bar (BottomNav) and no sidebar at all; the phone
  // navigation is not a shrunken copy of the desktop one. Desktop keeps the
  // persistent sidebar and never renders the tab bar.
  return (
    <div className="flex h-screen overflow-hidden app-bg">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {/* `pb-nav` reserves the tab bar's height plus the home-indicator inset
            so the last row of content is always reachable. */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 pb-nav md:p-6">
          <AppToaster />
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
