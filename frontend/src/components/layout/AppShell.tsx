'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { getAuthToken, logout } from '@/lib/api'
import { useTheme } from '@/store/useTheme'
import { Toaster } from 'sonner'
import { useOrganizationStore } from '@/store/useOrganization'
import { useUI } from '@/store/useUI'
import { cn } from '@/lib/utils'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center app-bg" role="status" aria-label="Loading">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const { theme } = useTheme()
  const { organization, fetchOrganization } = useOrganizationStore()
  const { sidebarOpen, closeSidebar } = useUI()

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
        <Toaster position="bottom-right" richColors closeButton />
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
        <Toaster position="bottom-right" richColors closeButton />
        {children}
      </>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden app-bg">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-lg transition-transform duration-200 md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar onNavigate={closeSidebar} />
      </div>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Toaster position="bottom-right" richColors closeButton />
          {children}
        </main>
      </div>
    </div>
  )
}
