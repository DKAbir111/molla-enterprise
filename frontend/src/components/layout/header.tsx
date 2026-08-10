'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Languages, Bell, User, LogOut, TriangleAlert, Clock, CircleDollarSign, Receipt, Trash2 } from 'lucide-react'
import { logout } from '@/lib/api'
import React from 'react'
import { getAlerts, snoozeAlert } from '@/lib/api/alerts-api'
import { toast } from 'sonner'
import { getAuthToken } from '@/lib/api/http'
import { formatCurrency } from '@/lib/utils'

export function Header() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  // const t = useTranslations()

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'bn' : 'en'
    const path = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(path)
  }

  const tNav = useTranslations('nav')
  const tn = useTranslations('notifications')

  const segments = pathname.split('/')
  const routeKey = segments[2] ? segments[2] as any : 'dashboard'
  const staticTitles: Record<string, string> = {
    'quick-entries': 'Quick Entries',
  }
  let pageTitle: string
  if (staticTitles[routeKey]) {
    pageTitle = staticTitles[routeKey]
  } else {
    try {
      pageTitle = tNav(routeKey as any)
    } catch {
      pageTitle = 'Dashboard'
    }
  }

  const [notifOpen, setNotifOpen] = React.useState(false)
  const [alerts, setAlerts] = React.useState<any | null>(null)
  const prevScoreRef = React.useRef<number>(0)
  const audioRef = React.useRef<AudioContext | null>(null)

  const applyIncoming = React.useCallback((data: any) => {
    setAlerts(() => {
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
      const envBase = process.env.NEXT_PUBLIC_API_URL
      const base = envBase ?? (typeof window !== 'undefined' ? window.location.origin : undefined)
      if (!base) return
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
      // If the browser doesn't support AudioContext, bail out.
      if (!AC) return
      // Create the AudioContext if we don't have one yet.
      if (!audioRef.current) {
        audioRef.current = new AC()
      }
      const ctx = audioRef.current
      // Safety: ensure ctx is non-null before accessing properties.
      if (!ctx) return
      // resume() may not exist in some environments; guard it.
      if ((ctx as any).state === 'suspended') {
        (ctx as any).resume?.().catch(() => { })
      }
      const now = (ctx as any).currentTime ?? 0
      const g = (ctx as any).createGain()
      g.connect((ctx as any).destination)
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
      const o = (ctx as any).createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(880, now)
      o.connect(g)
      o.start(now)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
      o.stop(now + 0.3)
    } catch { }
  }


  return (
    // `pt-safe` keeps the title clear of the status bar when the app is
    // launched from the home screen and draws under it (viewport-fit=cover).
    <header className="relative z-100 shrink-0 border-b border-border-subtle bg-surface/90 pt-safe backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:h-16 md:px-6">
        {/* Large, left-weighted title — the iOS/Material app-bar convention.
            Navigation itself lives in the bottom tab bar on mobile. */}
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-lg">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Language, profile and sign-out live in the "More" sheet on mobile,
              so the app bar stays down to a single control. */}
          <Button variant="ghost" size="sm" onClick={toggleLocale} className="hidden items-center gap-2 md:flex">
            <Languages className="h-4 w-4" />
            {locale === 'en' ? 'বাংলা' : 'English'}
          </Button>

          <div className="relative" ref={containerRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label={tn('title')}
            aria-expanded={notifOpen}
            /* 44px square on touch so the bell clears the minimum target size. */
            className="tap relative h-11 w-11 px-0 transition-colors hover:bg-surface-hover md:h-9 md:w-9"
          >
            <Bell className="h-5 w-5 md:h-4 md:w-4" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </Button>

          {notifOpen && (
            /* A fixed 24rem panel runs off the side of a 360px phone, so the
               width tracks the viewport until there is room for the full card. */
            <div className="absolute right-0 z-9999 mt-2 w-[calc(100vw-1.5rem)] max-w-96 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-2xl md:w-96">
              {/* Header */}
              <div className="px-5 py-4 border-b border-border-subtle bg-surface-muted">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-base">{tn('title')}</h3>
                  {badgeCount > 0 && (
                    <span className="text-xs font-medium text-subtle-foreground bg-surface-hover px-2.5 py-1 rounded-full">
                      {badgeCount} {tn('active')}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] space-y-2 overflow-y-auto overscroll-contain p-3 md:max-h-128">
                {!alerts && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-subtle-foreground mt-3">{tn('loading')}</p>
                  </div>
                )}

                {alerts && (
                  <>
                    {/* Low Stock Items */}
                    {alerts.lowStock?.items.map((p: any) => (
                      <div key={p.id} className="bg-surface border border-border-subtle rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-warning-subtle shrink-0">
                              <TriangleAlert className="h-4 w-4 text-warning" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">{p.name}</h3>
                              <p className="text-xs text-muted-foreground">{tn('lowStock')}</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-warning ml-2 shrink-0">{p.stock} {tn('left')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('lowStock', p.id)
                              snoozeAlert({ type: 'lowStock', refId: p.id, days: 7 })
                                .then(() => toast.success(tn('snoozed')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('snoozeFailed')) })
                            }}
                          >
                            <Clock className="h-3 w-3" />
                            {tn('snooze7d')}
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('lowStock', p.id)
                              snoozeAlert({ type: 'lowStock', refId: p.id, forever: true })
                                .then(() => toast.success(tn('wontRemind')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('muteFailed')) })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            {tn('dismiss')}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Pending Orders */}
                    {alerts.pendingOrders?.items.map((o: any) => (
                      <div key={o.id} className="bg-surface border border-border-subtle rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-info-subtle shrink-0">
                              <Clock className="h-4 w-4 text-info" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">{tn('order')} #{o.id.slice(0, 6)}</h3>
                              <p className="text-xs text-muted-foreground truncate">{o.customerName}</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-info ml-2 shrink-0">{o.ageHours}h</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('pendingOrder', o.id)
                              snoozeAlert({ type: 'pendingOrder', refId: o.id, days: 7 })
                                .then(() => toast.success(tn('snoozed')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('snoozeFailed')) })
                            }}
                          >
                            <Clock className="h-3 w-3" />
                            {tn('snooze7d')}
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('pendingOrder', o.id)
                              snoozeAlert({ type: 'pendingOrder', refId: o.id, forever: true })
                                .then(() => toast.success(tn('wontRemind')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('muteFailed')) })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            {tn('dismiss')}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Receivables */}
                    {alerts.receivables?.items.map((r: any) => (
                      <div key={r.id} className="bg-surface border border-border-subtle rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-success-subtle shrink-0">
                              <CircleDollarSign className="h-4 w-4 text-success" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">{r.customerName}</h3>
                              <p className="text-xs text-muted-foreground">{tn('outstandingReceivable')}</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-success ml-2 shrink-0">
                            {formatCurrency(Number(r.due || 0), String(locale))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('receivable', r.id)
                              snoozeAlert({ type: 'receivable', refId: r.id, days: 7 })
                                .then(() => toast.success(tn('snoozed')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('snoozeFailed')) })
                            }}
                          >
                            <Clock className="h-3 w-3" />
                            {tn('snooze7d')}
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('receivable', r.id)
                              snoozeAlert({ type: 'receivable', refId: r.id, forever: true })
                                .then(() => toast.success(tn('wontRemind')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('muteFailed')) })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            {tn('dismiss')}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Payables */}
                    {alerts.payables?.items.map((r: any) => (
                      <div key={r.id} className="bg-surface border border-border-subtle rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-lg bg-danger-subtle shrink-0">
                              <Receipt className="h-4 w-4 text-danger" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm truncate">{r.vendorName}</h3>
                              <p className="text-xs text-muted-foreground">{tn('outstandingPayable')}</p>
                            </div>
                          </div>
                          <span className="font-bold text-base text-danger ml-2 shrink-0">
                            {formatCurrency(Number(r.due || 0), String(locale))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('payable', r.id)
                              snoozeAlert({ type: 'payable', refId: r.id, days: 7 })
                                .then(() => toast.success(tn('snoozed')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('snoozeFailed')) })
                            }}
                          >
                            <Clock className="h-3 w-3" />
                            {tn('snooze7d')}
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-surface-hover transition-colors"
                            onClick={() => {
                              const snapshot = JSON.stringify(alerts)
                              removeItem('payable', r.id)
                              snoozeAlert({ type: 'payable', refId: r.id, forever: true })
                                .then(() => toast.success(tn('wontRemind')))
                                .catch(() => { try { setAlerts(JSON.parse(snapshot)) } catch { }; toast.error(tn('muteFailed')) })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            {tn('dismiss')}
                          </button>
                        </div>
                      </div>
                    ))}

                    {badgeCount === 0 && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-success-subtle flex items-center justify-center mb-4">
                          <span className="text-3xl">✓</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{tn('allCaughtUp')}</p>
                        <p className="text-xs text-subtle-foreground mt-1">{tn('noPending')}</p>
                      </div>
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
            aria-label={tn('organization')}
            className="hidden md:inline-flex"
            onClick={() => router.push(`/${locale}/organization`)}
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={tn('signOut')}
            className="hidden md:inline-flex"
            onClick={() => { logout(); router.replace(`/${locale}/login`) }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
