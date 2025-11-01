
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Languages, Bell, User, LogOut } from 'lucide-react'
import { logout } from '@/lib/api'
import React from 'react'
// Page-level controls (search, filters, add buttons) are rendered in pages,
// not in the header, to maximize page space flexibility.

export function Header() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations()

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'bn' : 'en'
    const path = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(path)
  }

  const tNav = useTranslations('nav')

  // page title from route
  const segments = pathname.split('/')
  const routeKey = segments[2] ? segments[2] as any : 'dashboard'
  const pageTitle = tNav(routeKey as any)

  // No logo in navbar as requested

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-[color:var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[color:var(--text)]">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLocale}
          className="flex items-center gap-2"
        >
          <Languages className="h-4 w-4" />
          {locale === 'en' ? 'বাংলা' : 'English'}
        </Button>
        
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/organization`)}
          title="Organization"
        >
          <User className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { logout(); router.replace(`/${locale}/login`) }}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
