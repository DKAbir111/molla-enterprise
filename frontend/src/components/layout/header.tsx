'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Languages, Bell, User, LogOut, TriangleAlert, Clock, CircleDollarSign, Receipt } from 'lucide-react'
import { logout } from '@/lib/api'
import React from 'react'
import { getAlerts, snoozeAlert } from '@/lib/api/alerts-api'
import { getAuthToken } from '@/lib/api/http'
import { formatCurrency } from '@/lib/utils'

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

  const segments = pathname.split('/')
  const routeKey = segments[2] ? segments[2] as any : 'dashboard'
  const pageTitle = tNav(routeKey as any)

  const [notifOpen, setNotifOpen] = React.useState(false)
  const [alerts, setAlerts] = React.useState<any | null>(null)
  const prevScoreRef = React.useRef<number>(0)
  const audioRef = React.useRef<AudioContext | null>(null)

  const applyIncoming = React.useCallback((data: any) => {
    setAlerts((prev: any) => {
      const score = (data?.lowStock?.count || 0) + (data?.pendingOrders?.agingCount || 0) + (data?.receivables?.count || 0) + (data?.payables?.count || 0)
      if (score > prevScoreRef.current) {
        playNotificationSound()
      }
      prevScoreRef.current = score
      return data
    })
  }, [])

  // Optimistic item removal after snooze
  const removeItem = React.useCallback((type: 'lowStock'|'pendingOrder'|'receivable'|'payable', id: string) => {
    setAlerts((prev: any) => {
      if (!prev) return prev
      const next = { ...prev }
      if (type === 'lowStock') next.lowStock = { ...next.lowStock, count: Math.max(0, (next.lowStock?.count || 0) - 1), items: (next.lowStock?.items || []).filter((x: any) => x.id !== id) }
      if (type === 'pendingOrder') next.pendingOrders = { ...next.pendingOrders, agingCount: Math.max(0, (next.pendingOrders?.agingCount || 0) - 1), count: Math.max(0, (next.pendingOrders?.count || 0) - 1), items: (next.pendingOrders?.items || []).filter((x: any) => x.id !== id) }
      if (type === 'receivable') next.receivables = { ...next.receivables, count: Math.max(0, (next.receivables?.count || 0) - 1), items: (next.receivables?.items || []).filter((x: any) => x.id !== id) }
      if (type === 'payable') next.payables = { ...next.payables, count: Math.max(0, (next.payables?.count || 0) - 1), items: (next.payables?.items || []).filter((x: any) => x.id !== id) }
      return next
    })
  }, [])

  const refreshAlerts = React.useCallback(async () => {
    try {
      const data = await getAlerts(5)
      applyIncoming(data)
    } catch { }
  }, [applyIncoming])

  React.useEffect(() => {
    refreshAlerts()
    const t = setInterval(refreshAlerts, 120000)
    return () => clearInterval(t)
  }, [refreshAlerts])

  React.useEffect(() => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const token = getAuthToken()
      const url = `${base.replace(/\/$/, '')}/alerts/stream?limit=5${token ? `&token=${encodeURIComponent(token)}` : ''}`
      const es = new EventSource(url)
      es.onmessage = (ev) => {
        try { applyIncoming(JSON.parse(ev.data)) } catch { }
      }
      return () => es.close()
    } catch { }
  }, [applyIncoming])

  const badgeCount = React.useMemo(() => {
    if (!alerts) return 0
    return (alerts.lowStock?.count || 0) + (alerts.pendingOrders?.agingCount || 0) + (alerts.receivables?.count || 0) + (alerts.payables?.count || 0)
  }, [alerts])

  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (notifOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [notifOpen])

  function playNotificationSound() {
    try {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AC || !audioRef.current) {
        audioRef.current = new AC()
      }
      const ctx = audioRef.current
      if (ctx.state === 'suspended') ctx.resume().catch(() => { })
      const now = ctx.currentTime
      const g = ctx.createGain()
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(880, now)
      o.connect(g)
      o.start(now)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
      o.stop(now + 0.3)
    } catch { }
  }

  const NotificationItem = ({ icon, title, count, items, link, color, type }: any) => (
    <div className="group p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{count}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-2 text-xs text-gray-600">
            <span className="truncate mr-2">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium whitespace-nowrap">{item.value}</span>
              {item.id && (
                <>
                  <button
                    className="text-[11px] text-blue-600 hover:underline"
                    onClick={async () => { try { await snoozeAlert({ type, refId: item.id, days: 7 }); removeItem(type, item.id) } catch {} }}
                  >Snooze 7d</button>
                  <button
                    className="text-[11px] text-gray-500 hover:underline"
                    onClick={async () => { try { await snoozeAlert({ type, refId: item.id, forever: true }); removeItem(type, item.id) } catch {} }}
                  >Don't remind</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <a href={link} className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">View all →</a>
    </div>
  )

  return (
    <header className="relative z-[100] h-16 px-6 flex items-center justify-between border-b border-[color:var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[color:var(--text)]">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={toggleLocale} className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          {locale === 'en' ? 'বাংলা' : 'English'}
        </Button>

        <div className="relative" ref={containerRef}>
          <Button variant="ghost" size="sm" onClick={() => setNotifOpen(!notifOpen)} className="relative">
            <Bell className="h-4 w-4" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4">{badgeCount > 9 ? '9+' : badgeCount}</span>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl z-[9999]">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-semibold text-gray-900">Notifications</div>
              </div>
              <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                {!alerts && <div className="text-xs text-gray-500 text-center py-4">Loading...</div>}

                {alerts && (
                  <>
                    {alerts.lowStock?.count > 0 && (
                      <NotificationItem
                        icon={<TriangleAlert className="h-4 w-4 text-amber-500" />}
                        title="Low Stock"
                        count={alerts.lowStock.count}
                        type="lowStock"
                        items={alerts.lowStock.items.map((p: any) => ({ id: p.id, label: p.name, value: `${p.stock} left` }))}
                        link={`/${locale}/products`}
                        color="bg-amber-50 text-amber-700"
                      />
                    )}

                    {alerts.pendingOrders?.agingCount > 0 && (
                      <NotificationItem
                        icon={<Clock className="h-4 w-4 text-blue-500" />}
                        title="Aging Orders"
                        count={alerts.pendingOrders.agingCount}
                        type="pendingOrder"
                        items={alerts.pendingOrders.items.map((o: any) => ({ id: o.id, label: `#${o.id.slice(0, 6)} - ${o.customerName}`, value: `${o.ageHours}h` }))}
                        link={`/${locale}/sells`}
                        color="bg-blue-50 text-blue-700"
                      />
                    )}

                    {alerts.receivables?.count > 0 && (
                      <NotificationItem
                        icon={<CircleDollarSign className="h-4 w-4 text-emerald-500" />}
                        title="Receivables"
                        count={alerts.receivables.count}
                        type="receivable"
                        items={alerts.receivables.items.map((r: any) => ({ id: r.id, label: r.customerName, value: formatCurrency(Number(r.due || 0), String(locale)) }))}
                        link={`/${locale}/sells`}
                        color="bg-emerald-50 text-emerald-700"
                      />
                    )}

                    {alerts.payables?.count > 0 && (
                      <NotificationItem
                        icon={<Receipt className="h-4 w-4 text-rose-500" />}
                        title="Payables"
                        count={alerts.payables.count}
                        type="payable"
                        items={alerts.payables.items.map((r: any) => ({ id: r.id, label: r.vendorName, value: formatCurrency(Number(r.due || 0), String(locale)) }))}
                        link={`/${locale}/buys`}
                        color="bg-rose-50 text-rose-700"
                      />
                    )}

                    {badgeCount === 0 && (
                      <div className="text-xs text-gray-500 text-center py-8">All clear! 🎉</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/organization`)}>
          <User className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { logout(); router.replace(`/${locale}/login`) }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
