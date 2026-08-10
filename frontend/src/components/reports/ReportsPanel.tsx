'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'
import { listTransactions, listSells, normalizeOrder } from '@/lib/api'
import { listBuys } from '@/lib/api/buy-api'
import { DateFilter } from '@/components/shared/DateFilter'
import { DailyReport } from '@/components/reports/DailyReport'
import { useOrganizationStore } from '@/store/useOrganization'
import type { DateRange } from '@/lib/date-range'
import { isWithinRange, formatDayKey } from '@/lib/date-range'
import { exportTablePdf, plainAmount, plainNumber } from '@/lib/pdf'
import { listProducts } from '@/lib/api/product-api'
import { listCustomers } from '@/lib/api/customer-api'
import { normalizeProduct, normalizeCustomer } from '@/lib/api'
import { toast } from 'sonner'
import { useLocale } from 'next-intl'
import { FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react'
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

/**
 * The reporting half of the finance screen: date-scoped charts, the per-day
 * sales/purchase breakdown, and the PDF exports.
 *
 * This was its own /reports route. It overlapped Accounts heavily — both showed
 * revenue over time from slightly different inputs — so the two are one screen
 * with two tabs now, and /reports redirects here.
 */
export function ReportsPanel() {
  const t = useTranslations('reports')
  const locale = useLocale()
  const { products, customers, transactions } = useStore()

  // Derived state
  const [revenueTrend, setRevenueTrend] = React.useState<{ month: string; total: number }[]>([])
  const [categorySales, setCategorySales] = React.useState<{ name: string; value: number; color: string }[]>([])
  const [customerDistribution, setCustomerDistribution] = React.useState<{ range: string; count: number }[]>([])
  const [topProducts, setTopProducts] = React.useState<{ name: string; sales: number; revenue: number }[]>([])
  const [range, setRange] = React.useState<DateRange>({})
  const [allSells, setAllSells] = React.useState<any[]>([])
  const [allBuys, setAllBuys] = React.useState<any[]>([])
  const { organization } = useOrganizationStore()
  const [allProducts, setAllProducts] = React.useState<any[]>([])
  const [allCustomers, setAllCustomers] = React.useState<any[]>([])
  const [busyReport, setBusyReport] = React.useState<string | null>(null)

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
        setAllSells(normalized)
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

    listBuys<any[]>()
      .then((res) => { if (mounted) setAllBuys(res || []) })
      .catch(() => { if (mounted) setAllBuys([]) })

    // The inventory and customer reports need these; the page never loaded
    // them before, so those two cards had nothing to export even in principle.
    listProducts<any[]>()
      .then((res) => { if (mounted) setAllProducts((res || []).map(normalizeProduct)) })
      .catch(() => { if (mounted) setAllProducts([]) })
    listCustomers<any[]>()
      .then((res) => { if (mounted) setAllCustomers((res || []).map(normalizeCustomer)) })
      .catch(() => { if (mounted) setAllCustomers([]) })

    return () => { mounted = false }
  }, [locale])


  const orgName = organization?.name || 'Business Manager'
  const rangeLabel = range.start && range.end
    ? `${formatDayKey(range.start, 'en-US')} - ${formatDayKey(range.end, 'en-US')}`
    : 'All time'
  const stamp = range.start && range.end ? `${range.start}_${range.end}` : 'all-time'

  /** Line items + transport - discount. The same definition the rest of the app uses. */
  const grand = (o: any) => {
    const items = (o?.items || []).reduce((s: number, it: any) => s + Number(it?.total || 0), 0)
    return Math.max(0, items + Number(o?.transportTotal || 0) - Number(o?.discount || 0))
  }

  const runReport = async (key: string, build: () => Parameters<typeof exportTablePdf>[0] | null) => {
    setBusyReport(key)
    try {
      const spec = build()
      if (!spec || spec.body.length === 0) {
        toast.error(t('noDataForRange'))
        return
      }
      await exportTablePdf(spec)
    } catch {
      toast.error(t('pdfFailed'))
    } finally {
      setBusyReport(null)
    }
  }

  // Every report below is scoped to the date filter above and emits Latin text
  // and digits, because jsPDF's built-in fonts have no Bengali glyphs.
  const generateSalesReport = () => runReport('sales', () => {
    const rows = allSells
      .filter((o) => String(o?.status) !== 'cancelled' && isWithinRange(o?.createdAt, range))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const total = rows.reduce((s, o) => s + grand(o), 0)
    const paid = rows.reduce((s, o) => s + Number(o?.paidAmount || 0), 0)
    return {
      title: orgName,
      subtitle: 'Sales report',
      meta: rangeLabel,
      head: ['Date', 'Order', 'Customer', 'Total', 'Paid', 'Due'],
      body: rows.map((o) => {
        const g = grand(o)
        const p = Number(o?.paidAmount || 0)
        return [
          formatDayKey(new Date(o.createdAt).toISOString().slice(0, 10), 'en-US'),
          String(o.id).slice(0, 8),
          o.customerName || '-',
          plainAmount(g),
          plainAmount(p),
          plainAmount(Math.max(0, g - p)),
        ]
      }),
      foot: ['Total', '', '', plainAmount(total), plainAmount(paid), plainAmount(Math.max(0, total - paid))],
      align: { 3: 'right' as const, 4: 'right' as const, 5: 'right' as const },
      filename: `sales-report-${stamp}`,
    }
  })

  const generateInventoryReport = () => runReport('inventory', () => {
    const rows = allProducts
    const value = rows.reduce((s, p) => s + Number(p.price || 0) * Number(p.stock || 0), 0)
    return {
      title: orgName,
      subtitle: 'Inventory report',
      // Stock is a live figure, not a historical one, so this report ignores
      // the date filter by design.
      meta: 'Current stock on hand',
      head: ['Product', 'Unit', 'Stock', 'Unit price', 'Stock value', 'Status'],
      body: rows.map((p) => [
        p.name || '-',
        p.unit || '-',
        plainNumber(Number(p.stock || 0)),
        plainAmount(Number(p.price || 0)),
        plainAmount(Number(p.price || 0) * Number(p.stock || 0)),
        p.active === false ? 'Inactive' : 'Active',
      ]),
      foot: ['Total', '', '', '', plainAmount(value), ''],
      align: { 2: 'right' as const, 3: 'right' as const, 4: 'right' as const },
      filename: `inventory-report-${stamp}`,
      orientation: 'landscape' as const,
    }
  })

  const generateCustomerReport = () => runReport('customer', () => {
    const rows = [...allCustomers].sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
    const spent = rows.reduce((s, c) => s + Number(c.totalSpent || 0), 0)
    const orders = rows.reduce((s, c) => s + Number(c.totalOrders || 0), 0)
    return {
      title: orgName,
      subtitle: 'Customer report',
      meta: 'All customers, ranked by total spend',
      head: ['Customer', 'Phone', 'Address', 'Orders', 'Total spent'],
      body: rows.map((c) => [
        c.name || '-',
        c.phone || '-',
        c.address || '-',
        plainNumber(Number(c.totalOrders || 0)),
        plainAmount(Number(c.totalSpent || 0)),
      ]),
      foot: ['Total', '', '', plainNumber(orders), plainAmount(spent)],
      align: { 3: 'right' as const, 4: 'right' as const },
      filename: `customer-report-${stamp}`,
    }
  })

  const generateFinancialReport = () => runReport('financial', () => {
    const sells = allSells.filter((o) => String(o?.status) !== 'cancelled' && isWithinRange(o?.createdAt, range))
    const buys = allBuys.filter((b) => isWithinRange(b?.createdAt, range))
    const salesTotal = sells.reduce((s, o) => s + grand(o), 0)
    const salesPaid = sells.reduce((s, o) => s + Number(o?.paidAmount || 0), 0)
    const purchaseTotal = buys.reduce((s, b) => s + grand(b), 0)
    const purchasePaid = buys.reduce((s, b) => s + Number(b?.paidAmount || 0), 0)
    const transport = sells.reduce((s, o) => s + Number(o?.transportTotal || 0), 0)

    return {
      title: orgName,
      subtitle: 'Financial report',
      meta: rangeLabel,
      head: ['Line', 'Count', 'Amount'],
      body: [
        ['Sales (invoiced)', plainNumber(sells.length), plainAmount(salesTotal)],
        ['  of which transport', '', plainAmount(transport)],
        ['Received from customers', '', plainAmount(salesPaid)],
        ['Receivable (outstanding)', '', plainAmount(Math.max(0, salesTotal - salesPaid))],
        ['Purchases (invoiced)', plainNumber(buys.length), plainAmount(purchaseTotal)],
        ['Paid to vendors', '', plainAmount(purchasePaid)],
        ['Payable (outstanding)', '', plainAmount(Math.max(0, purchaseTotal - purchasePaid))],
      ],
      foot: ['Net (sales - purchases)', '', plainAmount(salesTotal - purchaseTotal)],
      align: { 1: 'right' as const, 2: 'right' as const },
      filename: `financial-report-${stamp}`,
      orientation: 'portrait' as const,
    }
  })

  return (
    <div className="space-y-6">
      <DateFilter value={range} onChange={(v) => setRange({ start: v.start, end: v.end })} />

      <DailyReport
        sells={allSells}
        buys={allBuys}
        range={range}
        locale={locale as string}
        organizationName={organization?.name}
      />

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
            <Button variant="outline" size="sm" className="w-full" onClick={generateSalesReport} disabled={busyReport === 'sales'}>
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
            <Button variant="outline" size="sm" className="w-full" onClick={generateInventoryReport} disabled={busyReport === 'inventory'}>
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
            <Button variant="outline" size="sm" className="w-full" onClick={generateCustomerReport} disabled={busyReport === 'customer'}>
              {t('generateReport')}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('financialReport')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" onClick={generateFinancialReport} disabled={busyReport === 'financial'}>
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
