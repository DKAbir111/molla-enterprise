'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface DashboardChartsProps {
  revenueData: { name: string; revenue: number }[];
  productData: { name: string; sales: number }[];
}

// Compact axis labels: 1200 -> 1.2k. Full precision is left to the tooltip.
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })

const axisTick = { fill: 'var(--subtle-foreground)', fontSize: 12 }

// Tooltip styling has to be inline — Recharts renders it outside our class tree.
const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--foreground)',
  fontSize: 12,
}

function ChartEmpty({ icon: Icon, message }: { icon: typeof TrendingUp; message: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-hover">
        <Icon className="h-5 w-5 text-subtle-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function DashboardCharts({ revenueData, productData }: DashboardChartsProps) {
  const t = useTranslations('dashboard')

  const hasRevenue = revenueData?.some((d) => Number(d.revenue) > 0)
  const hasProducts = productData?.some((d) => Number(d.sales) > 0)
  const period = revenueData?.at(-1)?.name

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">{t('revenueOverview')}</CardTitle>
              <CardDescription>{t('revenueSubtitle')}</CardDescription>
            </div>
            {period && (
              <span className="shrink-0 rounded-full border border-border-subtle bg-surface-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {period}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasRevenue ? (
            <ChartEmpty icon={TrendingUp} message="No revenue recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* Recessive grid: horizontal only, no competing verticals. */}
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) => compact.format(Number(v))}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: 'var(--border)' }}
                  formatter={(v: any) => [`BDT ${full.format(Number(v))}`, t('revenueOverview')]}
                />
                {/* linear, not monotone: a spline through sparse points invents a
                    curve — with one data point it renders a bell that implies
                    months of data that do not exist. */}
                <Area
                  type="linear"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-lg">{t('productSales')}</CardTitle>
            <CardDescription>{t('productSubtitle')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!hasProducts ? (
            <ChartEmpty icon={BarChart3} message="No product sales yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  allowDecimals={false}
                  tickFormatter={(v) => compact.format(Number(v))}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'var(--surface-hover)' }}
                  formatter={(v: any) => [full.format(Number(v)), t('productSales')]}
                />
                {/* maxBarSize keeps a single category from expanding into one
                    solid block across the whole plot. Rounded data-end on top. */}
                <Bar
                  dataKey="sales"
                  fill="var(--primary)"
                  maxBarSize={48}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
