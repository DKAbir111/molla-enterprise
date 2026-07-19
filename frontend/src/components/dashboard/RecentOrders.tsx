'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatOrderCode } from '@/lib/utils'
import { api } from '@/lib/api/http'
import { normalizeOrder } from '@/lib/api'
import { useLocale } from 'next-intl'
import React from 'react'
import Link from 'next/link'

interface RecentOrdersProps {
  // If you need to pass filtered orders, you can add a prop like:
  // orders: any[];
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function RecentOrders({ }: RecentOrdersProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [orders, setOrders] = React.useState<any[]>([])

  React.useEffect(() => {
    let mounted = true
    api.get<any[]>('/sells').then((res) => {
      if (!mounted) return
      const list = (res.data || []).map(normalizeOrder).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
      setOrders(list)
    }).catch(() => { })
    return () => { mounted = false }
  }, [])

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t('recentSells') || 'Recent Sells'}</CardTitle>
        <Link href={`/${locale}/sells`}>
          <Button variant="outline" size="sm">
            {t('viewAll')}
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('noRecentSells')}</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/${locale}/sells/${order.id}`} className="block">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle p-3 transition-colors hover:bg-surface-hover">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary font-semibold text-primary-foreground">
                      {order.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{order.customerName}</p>
                      <p className="truncate text-sm text-subtle-foreground">{`Sell ${formatOrderCode(order.id, order.createdAt)}`}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-foreground">{formatCurrency(order.total, locale)}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      order.status === 'delivered' ? "text-success" : "",
                      order.status === 'processing' ? "text-info" : "",
                      order.status === 'pending' ? "text-warning" : "",
                      order.status === 'cancelled' ? "text-danger" : ""
                    )}>
                      {t(`orderStatus.${order.status}`)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
