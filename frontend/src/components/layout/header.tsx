
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Languages, Bell, User, LogOut } from 'lucide-react'
import { logout } from '@/lib/api'
import React from 'react'
import { getAlerts } from '@/lib/api/alerts-api'
import { formatCurrency } from '@/lib/utils'
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

  // notifications dropdown state
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [notifLoading, setNotifLoading] = React.useState(false)
  const [alerts, setAlerts] = React.useState<any | null>(null)

  const refreshAlerts = React.useCallback(async () => {
    try {
      setNotifLoading(true)
      const data = await getAlerts(5)
      setAlerts(data)
    } catch {
      // ignore
    } finally {
      setNotifLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let timer: any
    if (notifOpen) {
      refreshAlerts()
      timer = setInterval(refreshAlerts, 60000)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [notifOpen, refreshAlerts])

  const badgeCount = React.useMemo(() => {
    if (!alerts) return 0
    return [alerts.lowStock?.count, alerts.pendingOrders?.agingCount, alerts.receivables?.count, alerts.payables?.count]
      .filter((n: any) => !!n)
      .reduce((a: number, b: number) => a + Number(b || 0), 0)
  }, [alerts])

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
        
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications" className="relative">
            <Bell className="h-4 w-4" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">{badgeCount > 9 ? '9+' : badgeCount}</span>
            )}
          </Button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white shadow-xl z-50">
              <div className="px-4 py-2 border-b font-semibold">Notifications</div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-3">
                {notifLoading && <div className="text-xs text-gray-500 px-2 py-1">Loading...</div>}
                {!notifLoading && alerts && (
                  <>
                    {/* Low stock */}
                    {alerts.lowStock?.count > 0 && (
                      <div className="p-2 rounded border">
                        <div className="text-sm font-medium">Low Stock ({alerts.lowStock.count})</div>
                        <ul className="mt-1 text-xs text-gray-600 list-disc pl-5">
                          {alerts.lowStock.items.map((p: any) => (
                            <li key={p.id}>{p.name} — {p.stock}</li>
                          ))}
                        </ul>
                        <a href={`/${locale}/products`} className="text-xs text-blue-600 underline mt-1 inline-block">View products</a>
                      </div>
                    )}

                    {/* Pending orders */}
                    {alerts.pendingOrders?.count > 0 && (
                      <div className="p-2 rounded border">
                        <div className="text-sm font-medium">Pending Orders ({alerts.pendingOrders.count})</div>
                        {alerts.pendingOrders.agingCount > 0 && (
                          <div className="text-xs text-yellow-700 mt-1">Aging: {alerts.pendingOrders.agingCount}</div>
                        )}
                        <ul className="mt-1 text-xs text-gray-600 list-disc pl-5">
                          {alerts.pendingOrders.items.map((o: any) => (
                            <li key={o.id}>#{o.id.slice(0,6).toUpperCase()} — {o.customerName} • {o.ageHours}h</li>
                          ))}
                        </ul>
                        <a href={`/${locale}/sells`} className="text-xs text-blue-600 underline mt-1 inline-block">View sells</a>
                      </div>
                    )}

                    {/* Receivables */}
                    {alerts.receivables?.count > 0 && (
                      <div className="p-2 rounded border">
                        <div className="text-sm font-medium">Receivables ({alerts.receivables.count})</div>
                        <ul className="mt-1 text-xs text-gray-600 list-disc pl-5">
                          {alerts.receivables.items.map((r: any) => (
                            <li key={r.id}>#{r.id.slice(0,6).toUpperCase()} — {r.customerName} • Due {formatCurrency(Number(r.due || 0), String(locale))}</li>
                          ))}
                        </ul>
                        <a href={`/${locale}/sells`} className="text-xs text-blue-600 underline mt-1 inline-block">View sells</a>
                      </div>
                    )}

                    {/* Payables */}
                    {alerts.payables?.count > 0 && (
                      <div className="p-2 rounded border">
                        <div className="text-sm font-medium">Payables ({alerts.payables.count})</div>
                        <ul className="mt-1 text-xs text-gray-600 list-disc pl-5">
                          {alerts.payables.items.map((r: any) => (
                            <li key={r.id}>#{r.id.slice(0,6).toUpperCase()} — {r.vendorName} • Due {formatCurrency(Number(r.due || 0), String(locale))}</li>
                          ))}
                        </ul>
                        <a href={`/${locale}/buys`} className="text-xs text-blue-600 underline mt-1 inline-block">View buys</a>
                      </div>
                    )}

                    {(!alerts.lowStock?.count && !alerts.pendingOrders?.count && !alerts.receivables?.count && !alerts.payables?.count) && (
                      <div className="text-xs text-gray-500 px-2 py-1">No notifications</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
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
