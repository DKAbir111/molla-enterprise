'use client'

import { useTranslations } from 'next-intl'
import { DateFilter } from '@/components/dashboard/DateFilter'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid'
import nextDynamic from 'next/dynamic'
const Charts = nextDynamic(() => import('@/components/dashboard/DashboardCharts').then(m => m.DashboardCharts), { ssr: false })
import { useLocale } from 'next-intl'
import { TrendingUp, ShoppingCart, Users, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import React from 'react'
import { getDashboardOverview, listTransactions, listOrders } from '@/lib/api'
import { normalizeOrder } from '@/lib/api'

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

    listTransactions<any[]>()
      .then((txs) => {
        if (!mounted) return
        const now = new Date()
        const months: { key: string; label: string }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString(locale as any, { month: 'short' }) })
        }
        const sums: Record<string, number> = {}
        months.forEach(m => (sums[m.key] = 0));
        (txs || []).forEach((t: any) => {
          const dt = t.date ? new Date(t.date) : null
          if (!dt || String(t.type) !== 'income') return
          const key = `${dt.getFullYear()}-${dt.getMonth()}`
          if (key in sums) sums[key] += Number(t.amount || 0)
        })
        setRevenueData(months.map(m => ({ name: m.label, revenue: sums[m.key] || 0 })))
      })
      .catch(() => setRevenueData([]))

    listOrders<any[]>()
      .then((raw) => {
        if (!mounted) return
        const orders = (raw || []).map(normalizeOrder)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 90)
        const totals: Record<string, number> = {}
        orders.forEach((o) => {
          const created = o.createdAt || new Date()
          if (created < cutoff) return
          o.items.forEach((it) => {
            totals[it.productName] = (totals[it.productName] || 0) + Number(it.quantity || 0)
          })
        })
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4)
        setProductData(sorted.map(([name, qty]) => ({ name, sales: qty })))
      })
      .catch(() => setProductData([]))

    return () => { mounted = false }
  }, [locale])

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <DateFilter />
      </div>

      {/* Stats Grid */}
      <DashboardStatsGrid stats={stats} />

      {/* Charts */}
      <Charts revenueData={revenueData} productData={productData} />

      {/* Recent Orders */}
      <RecentOrders />
    </div>
  )
}

// Avoid static generation issues during build
export const dynamic = 'force-dynamic'
