'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'
import { listTransactions, listSells, normalizeOrder } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react'
import React from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function ReportsPage() {
  const t = useTranslations('reports')
  const locale = useLocale()
  const { products, customers, transactions } = useStore()

  // Derived state
  const [revenueTrend, setRevenueTrend] = React.useState<{ month: string; total: number }[]>([])
  const [categorySales, setCategorySales] = React.useState<{ name: string; value: number; color: string }[]>([])
  const [customerDistribution, setCustomerDistribution] = React.useState<{ range: string; count: number }[]>([])
  const [topProducts, setTopProducts] = React.useState<{ name: string; sales: number; revenue: number }[]>([])

  React.useEffect(() => {
    let mounted = true
    // Revenue trend: last 6 months of income transactions
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
        months.forEach(m => (sums[m.key] = 0))
          ; (txs || []).forEach((t: any) => {
            if (String(t.type) !== 'income') return
            const dt = t.date ? new Date(t.date) : null
            if (!dt) return
            const key = `${dt.getFullYear()}-${dt.getMonth()}`
            if (key in sums) sums[key] += Number(t.amount || 0)
          })
        setRevenueTrend(months.map(m => ({ month: m.label, total: sums[m.key] || 0 })))
      })
      .catch(() => setRevenueTrend([]))

    // Sells-based metrics (last 90 days)
    listSells<any[]>()
      .then((raw) => {
        if (!mounted) return
        const normalized = (raw || []).map(normalizeOrder)
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90)

        // Top products by quantity and revenue
        const qtyByProduct: Record<string, number> = {}
        const revByProduct: Record<string, number> = {}
        // Customer sell counts
        const ordersByCustomer: Record<string, number> = {}

        normalized.forEach(o => {
          const created = o.createdAt || new Date()
          if (created < cutoff) return
          ordersByCustomer[o.customerId] = (ordersByCustomer[o.customerId] || 0) + 1
          o.items.forEach(it => {
            qtyByProduct[it.productName] = (qtyByProduct[it.productName] || 0) + Number(it.quantity || 0)
            revByProduct[it.productName] = (revByProduct[it.productName] || 0) + Number(it.total || (it.quantity * it.price) || 0)
          })
        })

        // Category sales as product share (%)
        const totalQty = Object.values(qtyByProduct).reduce((s, v) => s + v, 0)
        const palette = ['#0d9488', '#14b8a6', '#10b981', '#f59e0b', '#6b7280']
        const topPairs = Object.entries(qtyByProduct).sort((a, b) => b[1] - a[1]).slice(0, 4)
        const others = Object.entries(qtyByProduct).sort((a, b) => b[1] - a[1]).slice(4)
        const othersQty = others.reduce((s, [, v]) => s + v, 0)
        const cat = [...topPairs, ...(othersQty > 0 ? [['Others', othersQty] as const] : [])]
        const catSeries = cat.map(([name, q], idx) => ({ name, value: totalQty > 0 ? Math.round((q / totalQty) * 100) : 0, color: palette[idx % palette.length] }))
        setCategorySales(catSeries)

        // Customer distribution buckets
        const buckets = { '0-5 sells': 0, '6-15 sells': 0, '16-25 sells': 0, '26+ sells': 0 }
        Object.values(ordersByCustomer).forEach(c => {
          if (c <= 5) buckets['0-5 sells']++
          else if (c <= 15) buckets['6-15 sells']++
          else if (c <= 25) buckets['16-25 sells']++
          else buckets['26+ sells']++
        })
        setCustomerDistribution(Object.entries(buckets).map(([range, count]) => ({ range, count })))

        // Top products (revenue)
        const top = Object.entries(revByProduct).map(([name, revenue]) => ({ name, revenue: Number(revenue || 0), sales: Number(qtyByProduct[name] || 0) }))
          .sort((a, b) => b.revenue - a.revenue).slice(0, 5)
        setTopProducts(top)
      })
      .catch(() => {
        setCategorySales([]); setCustomerDistribution([]); setTopProducts([])
      })

    return () => { mounted = false }
  }, [locale])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('title')}</h1>
        <Button className="flex shrink-0 items-center gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t('export')}</span>
        </Button>
      </div>

      {/* Report Options — two-up on a phone rather than four full-width cards
          stacked, which would push the charts off the first screen entirely. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('salesReport')}</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              {t('generateReport')}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('inventoryReport')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              {t('generateReport')}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('customerReport')}</CardTitle>
              <PieChart className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              {t('generateReport')}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Financial Report</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              {t('generateReport')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('revenueChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0d9488"
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Category Sales */}
        <Card>
          <CardHeader>
            <CardTitle>{t('salesByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('customerDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('topProducts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-subtle-foreground">{product.sales} {t('unitsSold')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(product.revenue, locale)}</p>
                  <p className="text-sm text-subtle-foreground">{t('revenue')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
