'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { api } from '@/lib/api/http'
import { useLocale } from 'next-intl'
import React from 'react'

export function RecentBuys() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [buys, setBuys] = React.useState<any[]>([])

  React.useEffect(() => {
    let mounted = true
    api.get<any[]>('/buys').then((res) => {
      if (!mounted) return
      const list = (res.data || []).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5)
      setBuys(list)
    }).catch(() => { })
    return () => { mounted = false }
  }, [])

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t('recentPurchases')}</CardTitle>
        <Link href={`/${locale}/buys`}>
          <Button variant="outline" size="sm">{t('viewAll')}</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {buys.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('noRecentPurchases')}</p>
        ) : (
          <div className="space-y-2">
            {buys.slice(0, 5).map((b) => {
              const itemsTotal = (b.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
              const discount = Number(b.discount || 0)
              const transport = Number(b.transportTotal || 0)
              const grand = Math.max(0, itemsTotal + transport - discount)
              return (
                <Link key={b.id} href={`/${locale}/buys/${b.id}`} className="block">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle p-3 transition-colors hover:bg-surface-hover">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-emerald-600 font-semibold text-white">
                        {(b.vendorName || 'V').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{b.vendorName || 'Vendor'}</p>
                        <p className="truncate text-sm text-subtle-foreground">{new Date(b.createdAt || Date.now()).toLocaleDateString(locale as any)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums text-foreground">{formatCurrency(grand, locale as any)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
