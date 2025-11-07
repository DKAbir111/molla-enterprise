
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Languages, Bell, User, LogOut, TriangleAlert, Clock, CircleDollarSign, Receipt, RefreshCcw } from 'lucide-react'
import { logout } from '@/lib/api'
import React from 'react'
import { getAlerts } from '@/lib/api/alerts-api'
import { getAuthToken } from '@/lib/api/http'
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
  const prevSigRef = React.useRef<string>('')
  const prevScoreRef = React.useRef<number>(0)
  const interactedRef = React.useRef<boolean>(false)
  const audioRef = React.useRef<AudioContext | null>(null)

  const applyIncoming = React.useCallback((data: any) => {
    setAlerts((prev: any) => {
      const newSig = JSON.stringify({
        ls: data?.lowStock?.count || 0,
        po: data?.pendingOrders?.count || 0,
        ag: data?.pendingOrders?.agingCount || 0,
        rc: data?.receivables?.count || 0,
        pc: data?.payables?.count || 0,
      })
      const oldSig = prevSigRef.current
      const score = (data?.lowStock?.count || 0) + (data?.pendingOrders?.agingCount || 0) + (data?.receivables?.count || 0) + (data?.payables?.count || 0)
      // Beep on meaningful increases
      if (oldSig && newSig !== oldSig && score > (prevScoreRef.current || 0)) {
        playNotificationSound()
      }
      prevSigRef.current = newSig
      prevScoreRef.current = score
      return data
    })
  }, [])

  const refreshAlerts = React.useCallback(async () => {
    try {
      setNotifLoading(true)
      const data = await getAlerts(5)
      applyIncoming(data)
    } catch {
      // ignore
    } finally {
      setNotifLoading(false)
    }
  }, [applyIncoming])

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

  // Initial signature (no sound) and background refresh every 2 minutes
  React.useEffect(() => {
    refreshAlerts()
    const t = setInterval(refreshAlerts, 120000)
    return () => clearInterval(t)
  }, [refreshAlerts])

  // Server-Sent Events stream for near real-time updates (falls back to polling)
  React.useEffect(() => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const token = getAuthToken()
      const url = `${base.replace(/\/$/, '')}/alerts/stream?limit=5${token ? `&token=${encodeURIComponent(token)}` : ''}`
      const es = new EventSource(url)
      es.onmessage = (ev) => {
        try { const payload = JSON.parse(ev.data); applyIncoming(payload) } catch {}
      }
      es.onerror = () => { /* EventSource will auto-reconnect */ }
      return () => { es.close() }
    } catch {
      // ignore
    }
  }, [applyIncoming])

  // Mark that user interacted for audio permission heuristics
  React.useEffect(() => {
    const onAny = () => { interactedRef.current = true; ensureAudio() }
    window.addEventListener('pointerdown', onAny, { once: false })
    return () => window.removeEventListener('pointerdown', onAny as any)
  }, [])

  // Close dropdown on outside click
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!notifOpen) return
      const el = containerRef.current
      if (el && !el.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [notifOpen])

  // Notification chime (two short tones) using a persistent AudioContext
  function ensureAudio() {
    try {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      if (!audioRef.current) audioRef.current = new AC()
      if (audioRef.current.state === 'suspended') {
        audioRef.current.resume().catch(() => {})
      }
      return audioRef.current
    } catch { return null }
  }

  function playNotificationSound() {
    try {
      if (!interactedRef.current) return
      const ctx = ensureAudio()
      if (!ctx) return
      const now = ctx.currentTime
      const g = ctx.createGain()
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
      // A5 then D6
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.setValueAtTime(880, now)
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(1174.66, now + 0.12)
      o1.connect(g); o2.connect(g)
      o1.start(now)
      o2.start(now + 0.12)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
      o1.stop(now + 0.35)
      o2.stop(now + 0.5)
    } catch {}
  }

  return (
    <header className="relative z-[100] h-16 px-6 flex items-center justify-between border-b border-[color:var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-md">
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
        
        <div className="relative" ref={containerRef}>
          <Button variant="ghost" size="sm" onClick={() => { interactedRef.current = true; setNotifOpen((v) => !v) }} aria-label="Notifications" className="relative">
            <Bell className="h-4 w-4" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">{badgeCount > 9 ? '9+' : badgeCount}</span>
            )}
          </Button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-200 bg-white/95 backdrop-blur shadow-2xl z-[9999] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="font-semibold text-[color:var(--text)]">Notifications</div>
                <button onClick={refreshAlerts} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50">
                  <RefreshCcw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
              <div className="relative">
                <div className="absolute -top-2 right-8 h-3 w-3 rotate-45 bg-white border-l border-t border-gray-200 z-[10000]" />
              </div>
              <div className="max-h-96 overflow-y-auto p-3 space-y-3">
                {notifLoading && <div className="text-xs text-gray-500 px-2 py-1">Loading...</div>}
                {!notifLoading && alerts && (
                  <>
                    {/* Low stock */}
                    {alerts.lowStock?.count > 0 && (
                      <div className="p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <TriangleAlert className="h-4 w-4 text-amber-600" />
                          Low Stock ({alerts.lowStock.count})
                        </div>
                        <ul className="mt-2 text-xs text-gray-600 space-y-1">
                          {alerts.lowStock.items.map((p: any) => (
                            <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="font-medium">{p.stock}</span></li>
                          ))}
                        </ul>
                        <a href={`/${locale}/products`} className="text-xs text-blue-600 underline mt-2 inline-block">View products</a>
                      </div>
                    )}

                    {/* Pending orders */}
                    {alerts.pendingOrders?.count > 0 && (
                      <div className="p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Pending Orders ({alerts.pendingOrders.count})
                        </div>
                        {alerts.pendingOrders.agingCount > 0 && (
                          <div className="text-xs text-amber-700 mt-1">Aging: {alerts.pendingOrders.agingCount}</div>
                        )}
                        <ul className="mt-2 text-xs text-gray-600 space-y-1">
                          {alerts.pendingOrders.items.map((o: any) => (
                            <li key={o.id} className="flex justify-between"><span>#{o.id.slice(0,6).toUpperCase()} — {o.customerName}</span><span className="font-medium">{o.ageHours}h</span></li>
                          ))}
                        </ul>
                        <a href={`/${locale}/sells`} className="text-xs text-blue-600 underline mt-2 inline-block">View sells</a>
                      </div>
                    )}

                    {/* Receivables */}
                    {alerts.receivables?.count > 0 && (
                      <div className="p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                          Receivables ({alerts.receivables.count})
                        </div>
                        <ul className="mt-2 text-xs text-gray-600 space-y-1">
                          {alerts.receivables.items.map((r: any) => (
                            <li key={r.id} className="flex justify-between"><span>#{r.id.slice(0,6).toUpperCase()} — {r.customerName}</span><span className="font-medium">{formatCurrency(Number(r.due || 0), String(locale))}</span></li>
                          ))}
                        </ul>
                        <a href={`/${locale}/sells`} className="text-xs text-blue-600 underline mt-2 inline-block">View sells</a>
                      </div>
                    )}

                    {/* Payables */}
                    {alerts.payables?.count > 0 && (
                      <div className="p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Receipt className="h-4 w-4 text-rose-600" />
                          Payables ({alerts.payables.count})
                        </div>
                        <ul className="mt-2 text-xs text-gray-600 space-y-1">
                          {alerts.payables.items.map((r: any) => (
                            <li key={r.id} className="flex justify-between"><span>#{r.id.slice(0,6).toUpperCase()} — {r.vendorName}</span><span className="font-medium">{formatCurrency(Number(r.due || 0), String(locale))}</span></li>
                          ))}
                        </ul>
                        <a href={`/${locale}/buys`} className="text-xs text-blue-600 underline mt-2 inline-block">View buys</a>
                      </div>
                    )}

                    {(!alerts.lowStock?.count && !alerts.pendingOrders?.count && !alerts.receivables?.count && !alerts.payables?.count) && (
                      <div className="text-xs text-gray-500 px-3 py-3">No notifications</div>
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
