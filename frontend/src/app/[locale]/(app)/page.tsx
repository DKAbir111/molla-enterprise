'use client'

import { useTranslations } from 'next-intl'
import { DateFilter } from '@/components/dashboard/DateFilter'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { useLocale } from 'next-intl'
import { TrendingUp, ShoppingCart, Users, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import React from 'react'
import { getDashboardOverview } from '@/lib/api'

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

  React.useEffect(() => {
    let mounted = true
    getDashboardOverview().then((data) => {
      if (mounted) setOverview(data)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  // Chart data
  const revenueData = [
    { name: 'Jan', revenue: 450000 },
    { name: 'Feb', revenue: 520000 },
    { name: 'Mar', revenue: 480000 },
    { name: 'Apr', revenue: 610000 },
    { name: 'May', revenue: 580000 },
    { name: 'Jun', revenue: 690000 },
  ]

  const productData = [
    { name: 'বালু', sales: 2500 },
    { name: 'পাথর', sales: 1800 },
    { name: 'সিমেন্ট', sales: 3200 },
    { name: 'রড', sales: 950 },
  ]

  const stats = [
    {
      title: t('totalRevenue'),
      value: formatCurrency(overview.totalRevenue, locale),
      icon: TrendingUp,
      change: '+12.5%',
      positive: true,
    },
    {
      title: t('activeOrders'),
      value: overview.activeOrders.toString(),
      icon: ShoppingCart,
      change: '+8.2%',
      positive: true,
    },
    {
      title: t('customers'),
      value: overview.customers.toString(),
      icon: Users,
      change: '+3.1%',
      positive: true,
    },
    {
      title: t('stockedProductPrice'),
      value: showStockedProductPrice ? formatCurrency(overview.stockedProductValue, locale) : '*****',
      icon: TrendingUp,
      change: '+0.5%',
      positive: true,
      toggle: () => setShowStockedProductPrice(!showStockedProductPrice),
      toggleIcon: showStockedProductPrice ? EyeOff : Eye,
    },
    {
      title: t('totalExpenses'),
      value: formatCurrency(overview.totalExpenses, locale),
      icon: TrendingUp,
      change: '+7.0%',
      positive: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <DateFilter />
      </div>

      {/* Stats Grid */}
      <DashboardStatsGrid stats={stats} />

      {/* Charts */}
      <DashboardCharts revenueData={revenueData} productData={productData} />

      {/* Recent Orders */}
      <RecentOrders />
    </div>
  )
}

// Avoid static generation issues during build
export const dynamic = 'force-dynamic'
