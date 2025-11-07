'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Languages, Bell, User, LogOut, TriangleAlert, Clock, CircleDollarSign, Receipt, Trash2 } from 'lucide-react'
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
  const removeItem = React.useCallback((type: 'lowStock' | 'pendingOrder' | 'receivable' | 'payable', id: string) => {
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
                    onClick={async () => { try { await snoozeAlert({ type, refId: item.id, days: 7 }); removeItem(type, item.id) } catch { } }}
                  >Snooze 7d</button>
                  <button
                    className="text-[11px] text-gray-500 hover:underline"
                    onClick={async () => { try { await snoozeAlert({ type, refId: item.id, forever: true }); removeItem(type, item.id) } catch { } }}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-2xl z-[9999] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-base">Notifications</h3>
                  {badgeCount > 0 && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {badgeCount} active
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[32rem] overflow-y-auto p-3 space-y-2">
                {!alerts && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-gray-500 mt-3">Loading notifications...</p>
                  </div>
                )}

                {alerts && (
                  <>
                    {/* Low Stock Items */}
                    {alerts.lowStock?.items.map((p: any) => (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-amber-50 flex-shrink-0">
                              <TriangleAlert className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{p.name}</h3>
                              <p className="text-xs text-gray-600">Running low on inventory</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-amber-600 ml-2 flex-shrink-0">{p.stock} left</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Clock className="h-3 w-3" />
                            Snooze 7d
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Trash2 className="h-3 w-3" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Pending Orders */}
                    {alerts.pendingOrders?.items.map((o: any) => (
                      <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-blue-50 flex-shrink-0">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">Order #{o.id.slice(0, 6)}</h3>
                              <p className="text-xs text-gray-600 truncate">{o.customerName}</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-blue-600 ml-2 flex-shrink-0">{o.ageHours}h</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Clock className="h-3 w-3" />
                            Snooze 7d
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Trash2 className="h-3 w-3" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Receivables */}
                    {alerts.receivables?.items.map((r: any) => (
                      <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-emerald-50 flex-shrink-0">
                              <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{r.customerName}</h3>
                              <p className="text-xs text-gray-600">Outstanding receivable</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-emerald-600 ml-2 flex-shrink-0">
                            {formatCurrency(Number(r.due || 0), String(locale))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Clock className="h-3 w-3" />
                            Snooze 7d
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Trash2 className="h-3 w-3" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Payables */}
                    {alerts.payables?.items.map((r: any) => (
                      <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-rose-50 flex-shrink-0">
                              <Receipt className="h-4 w-4 text-rose-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{r.vendorName}</h3>
                              <p className="text-xs text-gray-600">Outstanding payable</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-rose-600 ml-2 flex-shrink-0">
                            {formatCurrency(Number(r.due || 0), String(locale))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Clock className="h-3 w-3" />
                            Snooze 7d
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <Trash2 className="h-3 w-3" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}

                    {badgeCount === 0 && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-4">
                          <span className="text-3xl">✓</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">All Caught Up!</p>
                        <p className="text-xs text-gray-500 mt-1">No pending notifications</p>
                      </div>
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
