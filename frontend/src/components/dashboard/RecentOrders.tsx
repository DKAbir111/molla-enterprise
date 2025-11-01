'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getRecentOrders } from '@/lib/api'
import { useLocale } from 'next-intl'
import React from 'react'

interface RecentOrdersProps {
  // If you need to pass filtered orders, you can add a prop like:
  // orders: typeof mockOrders;
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function RecentOrders({}: RecentOrdersProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [orders, setOrders] = React.useState<any[]>([])

  React.useEffect(() => {
    let mounted = true
    getRecentOrders(5).then((o) => { if (mounted) setOrders(o) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('recentOrders')}</CardTitle>
        <Button variant="outline" size="sm">
          {t('viewAll')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {order.customerName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
