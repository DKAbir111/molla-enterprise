'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { getAuthToken, getMyOrganization } from '@/lib/api'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()

  const base = `/${locale}`
  const hide = [
    `${base}/login`,
    `${base}/register`,
    `${base}/forgot-password`,
    `${base}/reset-password`,
    `${base}/organization`,
  ]
  const shouldHide = hide.includes(pathname)

  React.useEffect(() => {
    if (shouldHide) return
    const token = getAuthToken()
    if (!token) {
      router.replace(`/${locale}/login`)
      return
    }
    // Ensure organization exists
    getMyOrganization<any>()
      .then((org) => {
        if (!org || !org.id) router.replace(`/${locale}/organization`)
      })
      .catch(() => router.replace(`/${locale}/organization`))
  }, [shouldHide, router, locale, pathname])

  if (shouldHide) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
