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
  Truck,
  Receipt,
  Wallet,
  HandCoins,
  Settings,
  Building2,
} from 'lucide-react'

/* ----------------------------------------------------------------------------
   Navigation, grouped by what the user is actually doing rather than as one
   flat list of ten links. Dashboard leads on its own; everything after it sits
   under a section label, which is what lets the eye jump straight to the right
   part of the app instead of reading every entry.

   `label` is a key under the `nav.groups` namespace. A group without one (the
   first) renders its items with no heading.
   -------------------------------------------------------------------------- */
const NAV_GROUPS = [
  {
    label: null,
    items: [{ key: 'dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'catalog',
    items: [{ key: 'products', href: '/products', icon: Package }],
  },
  {
    label: 'sales',
    items: [
      { key: 'sells', href: '/sells', icon: ShoppingCart },
      { key: 'customers', href: '/customers', icon: Users },
      { key: 'receivables', href: '/receivables', icon: HandCoins },
    ],
  },
  {
    label: 'purchasing',
    items: [
      { key: 'buys', href: '/buys', icon: Truck },
      { key: 'vendors', href: '/vendors', icon: Building2 },
      { key: 'payables', href: '/payables', icon: Wallet },
    ],
  },
  {
    label: 'finance',
    items: [
      { key: 'quickEntries', href: '/quick-entries', icon: Receipt },
      { key: 'accounts', href: '/accounts', icon: Wallet },
    ],
  },
  {
    label: 'system',
    items: [{ key: 'settings', href: '/settings', icon: Settings }],
  },
] as const

/**
 * True when `pathname` is the item's route or a page nested beneath it.
 * The trailing-slash check matters: a plain `startsWith` would light up
 * /products for a hypothetical /products-archive.
 */
function isRouteActive(pathname: string, href: string, base: string) {
  if (href === '/') return pathname === base || pathname === `${base}/`
  const full = `${base}${href}`
  return pathname === full || pathname.startsWith(`${full}/`)
}

type SidebarProps = {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const locale = pathname.split('/')[1]
  const base = `/${locale}`
  const { organization, fetchOrganization } = useOrganizationStore()

  React.useEffect(() => {
    if (organization === undefined) {
      fetchOrganization().catch(() => { })
    }
  }, [organization, fetchOrganization])

  const orgName = organization?.name || 'Business Manager'
  const logoUrl = organization?.logoUrl || '/conix.png'

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border-subtle bg-surface">
      {/* Brand lockup, held apart from the nav by its own rule. */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <span
          className="truncate text-[15px] font-bold tracking-tight text-foreground"
          title={orgName}
        >
          {orgName}
        </span>
      </div>

      {/* Scrolls independently once the groups outgrow a short viewport. */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-4">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label ?? 'primary'} className={cn(groupIndex > 0 && 'mt-6')}>
            {group.label && (
              <h2 className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
                {t(`groups.${group.label}` as any)}
              </h2>
            )}

            <ul className="space-y-1">
              {group.items.map((item) => {
                const href = `${base}${item.href === '/' ? '' : item.href}`
                const active = isRouteActive(pathname, item.href, base)

                return (
                  <li key={item.key}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors',
                        active
                          ? 'gradient-primary font-semibold text-primary-foreground shadow-sm'
                          : 'font-medium text-foreground/85 hover:bg-surface-hover hover:text-foreground'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0',
                          active ? 'text-primary-foreground' : 'text-subtle-foreground'
                        )}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                      <span className="truncate">{t(item.key)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
