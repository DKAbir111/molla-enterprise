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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('recentSells') || 'Recent Sells'}</CardTitle>
        <Link href={`/${locale}/sells`}>
          <Button variant="outline" size="sm">
            {t('viewAll')}
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.slice(0, 5).map((order) => (
            <Link key={order.id} href={`/${locale}/sells/${order.id}`} className="block">
              <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-linear-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {order.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{`Sell ${formatOrderCode(order.id, order.createdAt)}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(order.total, locale)}</p>
                  <p className={cn(
                    "text-sm",
                    order.status === 'delivered' ? "text-green-600" : "",
                    order.status === 'processing' ? "text-blue-600" : "",
                    order.status === 'pending' ? "text-yellow-600" : "",
                    order.status === 'cancelled' ? "text-red-600" : ""
                  )}>
                    {t(`orderStatus.${order.status}`)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
