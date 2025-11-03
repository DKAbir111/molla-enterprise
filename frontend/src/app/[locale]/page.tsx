'use client'

import { useTranslations } from 'next-intl'
import { DateFilter } from '@/components/dashboard/DateFilter'
import { Greeting } from '@/components/dashboard/Greeting'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { RecentBuys } from '@/components/dashboard/RecentBuys'
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid'
import nextDynamic from 'next/dynamic'
const Charts = nextDynamic(() => import('@/components/dashboard/DashboardCharts').then(m => m.DashboardCharts), { ssr: false })
import { useLocale } from 'next-intl'
import { TrendingUp, ShoppingCart, Users, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import React from 'react'
import { getDashboardData } from '@/lib/api'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [showStockedProductPrice, setShowStockedProductPrice] = React.useState(false)

  const [overview, setOverview] = React.useState({
    totalRevenue: 0,
    totalExpenses: 0,
    activeOrders: 0,
    customers: 0,
    stockedProductValue: 0,
  })

  const [range, setRange] = React.useState<{ start?: string; end?: string }>({})

  React.useEffect(() => {
    let mounted = true
    getDashboardData({ months: 6, productDays: 90, startDate: range.start, endDate: range.end })
      .then((data) => {
        if (!mounted) return
        setOverview(data.overview)
        setRevenueData(data.revenueSeries)
        setProductData(data.productSales)
      })
      .catch(() => { setRevenueData([]); setProductData([]) })
    return () => { mounted = false }
  }, [locale, range.start, range.end])

  // Chart data from API
  const [revenueData, setRevenueData] = React.useState<{ name: string; revenue: number }[]>([])
  const [productData, setProductData] = React.useState<{ name: string; sales: number }[]>([])

  const last = revenueData.at(-1)?.revenue ?? 0
  const prev = revenueData.length > 1 ? revenueData.at(-2)!.revenue : 0
  const revChangePct = prev > 0 ? (((last - prev) / prev) * 100) : 0
  const revPositive = last >= prev

  const stats = [
    {
      title: t('totalRevenue'),
      value: formatCurrency(overview.totalRevenue, locale),
      icon: TrendingUp,
      change: prev > 0 ? `${revPositive ? '+' : ''}${revChangePct.toFixed(1)}%` : undefined,
      positive: prev > 0 ? revPositive : undefined,
    },
    {
      title: 'Transport Revenue',
      value: formatCurrency((overview as any).transportRevenue || 0, locale),
      icon: TrendingUp,
    },
    {
      title: 'Money Received',
      value: formatCurrency((overview as any).moneyReceived || 0, locale),
      icon: TrendingUp,
    },
    {
      title: 'Money Due',
      value: formatCurrency((overview as any).moneyDue || 0, locale),
      icon: TrendingUp,
    },
    {
      title: t('activeOrders'),
      value: overview.activeOrders.toString(),
      icon: ShoppingCart,
      // change omitted until real calc added
    },
    {
      title: t('customers'),
      value: overview.customers.toString(),
      icon: Users,
      // change omitted until real calc added
    },
    {
      title: t('stockedProductPrice'),
      value: showStockedProductPrice ? formatCurrency(overview.stockedProductValue, locale) : '*****',
      icon: TrendingUp,
      // change omitted until real calc added
      toggle: () => setShowStockedProductPrice(!showStockedProductPrice),
      toggleIcon: showStockedProductPrice ? EyeOff : Eye,
    },
    {
      title: t('totalExpenses'),
      value: formatCurrency(overview.totalExpenses, locale),
      icon: TrendingUp,
      // change omitted until real calc added
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Greeting />
        <DateFilter value={range} onChange={(v) => setRange({ start: v.start, end: v.end })} />
      </div>

      {/* Stats Grid */}
      <DashboardStatsGrid stats={stats} />

      {/* Charts */}
      <Charts revenueData={revenueData} productData={productData} />

      {/* Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentOrders />
        <RecentBuys />
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
