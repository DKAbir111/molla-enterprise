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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Purchases</CardTitle>
        <Link href={`/${locale}/buys`}>
          <Button variant="outline" size="sm">{t('viewAll')}</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {buys.slice(0, 5).map((b) => {
            const itemsTotal = (b.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
            const discount = Number(b.discount || 0)
            const transport = Number(b.transportTotal || 0)
            const grand = Math.max(0, itemsTotal + transport - discount)
            return (
              <Link key={b.id} href={`/${locale}/buys/${b.id}`} className="block">
                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-linear-to-r from-blue-600 to-emerald-600 flex items-center justify-center text-white font-semibold">
                      {(b.vendorName || 'V').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{b.vendorName || 'Vendor'}</p>
                      <p className="text-sm text-gray-500">{new Date(b.createdAt || Date.now()).toLocaleDateString(locale as any)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(grand, locale as any)}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
