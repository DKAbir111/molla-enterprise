'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { getAuthToken, getMyOrganization, logout } from '@/lib/api'
import { useTheme } from '@/store/useTheme'
import { Toaster } from 'sonner'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const { theme } = useTheme()

  const base = `/${locale}`
  const authRoutes = new Set([
    `${base}/login`,
    `${base}/register`,
    `${base}/forgot-password`,
    `${base}/reset-password`,
  ])
  const isAuthRoute = authRoutes.has(pathname)
  const isOrgRoute = pathname === `${base}/organization`
  const shouldHide = isAuthRoute || isOrgRoute

  React.useEffect(() => {
    // Auth pages: never enforce auth or org check
    if (isAuthRoute) return

    // For all other pages (including organization), require a valid token
    const token = getAuthToken()
    if (!token) {
      router.replace(`/${locale}/login`)
      return
    }
    // If we are already on organization page, skip org check (user is here to create it)
    if (isOrgRoute) return

    // Ensure organization exists for the rest of the app
    getMyOrganization<any>()
      .then((org) => {
        if (!org || !org.id) router.replace(`/${locale}/organization`)
      })
      .catch((err) => {
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          try { logout() } catch {}
          router.replace(`/${locale}/login`)
        } else {
          router.replace(`/${locale}/organization`)
        }
      })
  }, [isAuthRoute, isOrgRoute, shouldHide, router, locale, pathname])

  if (shouldHide) {
    return (
      <div className="min-h-screen flex items-center justify-center app-bg p-6">
        <Toaster position="bottom-right" richColors closeButton />
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden app-bg">
      <Sidebar />
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
