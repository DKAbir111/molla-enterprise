'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import React from 'react'
import { useOrganizationStore } from '@/store/useOrganization'
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
  { name: 'vendors', href: '/vendors', icon: Building2 },
  { name: 'sells', href: '/sells', icon: ShoppingCart },
  { name: 'buys', href: '/buys', icon: Package },
  { name: 'quickEntries', label: 'Quick Entries', href: '/quick-entries', icon: Calculator },
  { name: 'accounts', href: '/accounts', icon: Calculator },
  { name: 'reports', href: '/reports', icon: BarChart3 },
  { name: 'settings', href: '/settings', icon: Settings },
]

type SidebarProps = {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const locale = pathname.split('/')[1]
  const { organization, fetchOrganization } = useOrganizationStore()

  React.useEffect(() => {
    if (organization === undefined) {
      fetchOrganization().catch(() => { })
    }
  }, [organization, fetchOrganization])

  const orgName = organization?.name || 'Business Manager'
  const logoUrl = organization?.logoUrl || '/conix.png'

  return (
    <aside className="w-64 border-r border-border-subtle bg-surface/90 backdrop-blur-md min-h-screen">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 px-4 border-b border-border-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-md object-contain" />
          <h2 className="text-base font-semibold text-foreground truncate" title={orgName}>{orgName}</h2>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const href = `/${locale}${item.href}`
            const isActive = pathname === href || (item.href !== '/' && pathname.startsWith(href))
            const label = item.label || t(item.name)

            return (
              <Link
                key={item.name}
                href={href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'gradient-primary text-primary-foreground shadow'
                    : 'text-foreground/80 hover:bg-surface-hover'
                )}
              >
                <item.icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
