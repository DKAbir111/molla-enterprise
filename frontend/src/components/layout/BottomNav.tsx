'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
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
  Languages,
  LogOut,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/api'
import { useOrganizationStore } from '@/store/useOrganization'

/* ----------------------------------------------------------------------------
   The five destinations that earn a permanent tab. Five is the ceiling: past
   that the targets drop under the 44px minimum on a 360px-wide phone. Reorder
   this array to change the bar — everything else derives from it.
   -------------------------------------------------------------------------- */
const PRIMARY_TABS = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'sells', href: '/sells', icon: ShoppingCart },
  { key: 'products', href: '/products', icon: Package },
  { key: 'customers', href: '/customers', icon: Users },
] as const

/* Everything else lives one tap deep, behind "More". Icons match the desktop
   sidebar so the two navigations read as the same app. */
const MORE_LINKS = [
  { key: 'buys', href: '/buys', icon: Truck },
  { key: 'receivables', href: '/receivables', icon: HandCoins },
  { key: 'vendors', href: '/vendors', icon: Building2 },
  { key: 'payables', href: '/payables', icon: Wallet },
  { key: 'quickEntries', href: '/quick-entries', icon: Receipt },
  { key: 'accounts', href: '/accounts', icon: Wallet },
  { key: 'settings', href: '/settings', icon: Settings },
] as const

/** True when `pathname` is the tab's route or a detail page beneath it. */
function isRouteActive(pathname: string, href: string, base: string) {
  const full = `${base}${href === '/' ? '' : href}`
  if (href === '/') return pathname === base || pathname === `${base}/`
  return pathname === full || pathname.startsWith(`${full}/`)
}

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('nav')
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const { organization } = useOrganizationStore()

  const base = `/${locale}`
  const moreActive = MORE_LINKS.some((l) => isRouteActive(pathname, l.href, base))

  // A route change means the sheet has served its purpose.
  React.useEffect(() => { setSheetOpen(false) }, [pathname])

  // While the sheet is up the page behind it must not scroll, and Escape must
  // dismiss it — both are things a native sheet does for free.
  React.useEffect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [sheetOpen])

  const switchLocale = () => {
    const next = locale === 'en' ? 'bn' : 'en'
    router.push(pathname.replace(`/${locale}`, `/${next}`))
  }

  return (
    <>
      {sheetOpen && (
        <MoreSheet
          base={base}
          pathname={pathname}
          orgName={organization?.name}
          onClose={() => setSheetOpen(false)}
          onSwitchLocale={switchLocale}
          onLogout={() => { logout(); router.replace(`${base}/login`) }}
          nextLocaleLabel={locale === 'en' ? 'বাংলা' : 'English'}
        />
      )}

      <nav
        aria-label="Primary"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 md:hidden',
          'border-t border-border-subtle bg-surface/85 backdrop-blur-xl',
          // The bar's own height, then the home-indicator inset below it, so
          // the icons never sit under the iOS gesture pill.
          'pb-safe'
        )}
      >
        <ul className="flex h-16 items-stretch">
          {PRIMARY_TABS.map((tab) => {
            const active = isRouteActive(pathname, tab.href, base)
            return (
              <li key={tab.key} className="flex-1">
                <Link
                  href={`${base}${tab.href === '/' ? '' : tab.href}`}
                  aria-current={active ? 'page' : undefined}
                  className="tap flex h-full flex-col items-center justify-center gap-1"
                >
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200',
                      active ? 'bg-primary-subtle' : 'bg-transparent'
                    )}
                  >
                    <tab.icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        active ? 'text-primary' : 'text-subtle-foreground'
                      )}
                      strokeWidth={active ? 2.4 : 2}
                    />
                  </span>
                  <span
                    className={cn(
                      'text-[10px] leading-none transition-colors',
                      active ? 'font-semibold text-primary' : 'font-medium text-subtle-foreground'
                    )}
                  >
                    {t(tab.key)}
                  </span>
                </Link>
              </li>
            )
          })}

          <li className="flex-1">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              aria-haspopup="dialog"
              className="tap flex h-full w-full flex-col items-center justify-center gap-1"
            >
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200',
                  moreActive || sheetOpen ? 'bg-primary-subtle' : 'bg-transparent'
                )}
              >
                <MoreHorizontal
                  className={cn(
                    'h-5 w-5 transition-colors',
                    moreActive || sheetOpen ? 'text-primary' : 'text-subtle-foreground'
                  )}
                  strokeWidth={moreActive || sheetOpen ? 2.4 : 2}
                />
              </span>
              <span
                className={cn(
                  'text-[10px] leading-none transition-colors',
                  moreActive || sheetOpen
                    ? 'font-semibold text-primary'
                    : 'font-medium text-subtle-foreground'
                )}
              >
                {t('more')}
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}

/* ----------------------------------------------------------------------------
   The "More" sheet — secondary destinations plus the account actions that used
   to crowd the desktop header (language, organization, sign out).
   -------------------------------------------------------------------------- */
function MoreSheet({
  base,
  pathname,
  orgName,
  onClose,
  onSwitchLocale,
  onLogout,
  nextLocaleLabel,
}: {
  base: string
  pathname: string
  orgName?: string
  onClose: () => void
  onSwitchLocale: () => void
  onLogout: () => void
  nextLocaleLabel: string
}) {
  const t = useTranslations('nav')

  return (
    // Above the header, which sits at z-100.
    <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label={t('more')}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <div className="animate-sheet-up absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border-subtle bg-surface shadow-2xl">
        {/* Grab handle — the affordance that says "this is a sheet". */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="truncate text-base font-semibold text-foreground">
            {orgName || t('more')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap -mr-2 flex h-10 w-10 items-center justify-center rounded-full text-subtle-foreground hover:bg-surface-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {MORE_LINKS.map((link) => {
              const active = isRouteActive(pathname, link.href, base)
              return (
                <Link
                  key={link.key}
                  href={`${base}${link.href}`}
                  onClick={onClose}
                  className={cn(
                    'tap flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center',
                    active
                      ? 'border-primary/40 bg-primary-subtle'
                      : 'border-border-subtle bg-surface-muted'
                  )}
                >
                  <link.icon
                    className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')}
                  />
                  <span
                    className={cn(
                      'text-xs leading-tight',
                      active ? 'font-semibold text-primary' : 'font-medium text-foreground'
                    )}
                  >
                    {t(link.key)}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="mt-4 space-y-1 border-t border-border-subtle pt-3">
            <SheetRow icon={Languages} label={t('language')} value={nextLocaleLabel} onClick={onSwitchLocale} />
            <SheetRow
              icon={Building2}
              label={t('organization')}
              href={`${base}/organization`}
              onNavigate={onClose}
            />
            <SheetRow icon={LogOut} label={t('logout')} onClick={onLogout} danger />
          </div>
        </div>

        {/* Clears the home indicator on gesture-nav phones. */}
        <div className="pb-safe" />
      </div>
    </div>
  )
}

function SheetRow({
  icon: Icon,
  label,
  value,
  href,
  onClick,
  onNavigate,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: string
  href?: string
  onClick?: () => void
  onNavigate?: () => void
  danger?: boolean
}) {
  const body = (
    <>
      <Icon className={cn('h-5 w-5 shrink-0', danger ? 'text-danger' : 'text-muted-foreground')} />
      <span className={cn('flex-1 text-left text-sm font-medium', danger ? 'text-danger' : 'text-foreground')}>
        {label}
      </span>
      {value && <span className="text-sm text-subtle-foreground">{value}</span>}
    </>
  )

  const className =
    'tap-sm flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-hover'

  if (href) {
    return (
      <Link href={href} onClick={onNavigate} className={className}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  )
}
