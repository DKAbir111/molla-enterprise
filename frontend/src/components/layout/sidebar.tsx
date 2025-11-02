'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/store/useTheme'
import React from 'react'
import { getMyOrganization } from '@/lib/api'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Truck,
  Calculator,
  Droplet,
  BarChart3,
  Settings,
  Building2,
} from 'lucide-react'

const navigation = [
  { name: 'dashboard', href: '/', icon: LayoutDashboard },
  { name: 'products', href: '/products', icon: Package },
  { name: 'customers', href: '/customers', icon: Users },
  { name: 'sells', href: '/sells', icon: ShoppingCart },
  { name: 'buys', href: '/buys', icon: Package },
  { name: 'accounts', href: '/accounts', icon: Calculator },
  { name: 'reports', href: '/reports', icon: BarChart3 },
  { name: 'settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const locale = pathname.split('/')[1]
  const { theme } = useTheme()
  const [orgName, setOrgName] = React.useState<string>('Business Manager')
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    getMyOrganization<any>()
      .then((org) => {
        if (!mounted || !org) return
        if (org?.name) setOrgName(org.name)
        if (org?.logoUrl) setLogoUrl(org.logoUrl)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <aside className="w-64 border-r border-[color:var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-md">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 px-4 border-b border-[color:var(--card-border)]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-7 w-7 rounded-md object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-purple-600 to-blue-600" />
          )}
          <h2 className="text-base font-semibold text-[color:var(--text)] truncate" title={orgName}>{orgName}</h2>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const href = `/${locale}${item.href}`
            const isActive = pathname === href || (item.href !== '/' && pathname.startsWith(href))
            
            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? (
                        theme === 'contrast'
                          ? 'bg-white text-black border border-black shadow'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow'
                      )
                    : 'text-[color:var(--text)]/80 hover:bg-white/10'
                )}
              >
                <item.icon className="h-5 w-5" />
                {t(item.name)}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
