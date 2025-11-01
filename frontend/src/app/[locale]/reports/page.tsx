'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react'
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
  const { orders, products, customers, transactions } = useStore()

  // Revenue trend data
  const revenueTrend = [
    { month: 'Jan', total: 420000 },
    { month: 'Feb', total: 480000 },
    { month: 'Mar', total: 520000 },
    { month: 'Apr', total: 610000 },
    { month: 'May', total: 580000 },
    { month: 'Jun', total: 690000 },
  ]

  // Product category sales
  const categorySales = [
    { name: 'বালু', value: 45, color: '#8b5cf6' },
    { name: 'পাথর', value: 20, color: '#3b82f6' },
    { name: 'সিমেন্ট', value: 15, color: '#10b981' },
    { name: 'রড', value: 12, color: '#f59e0b' },
    { name: 'অন্যান্য', value: 8, color: '#6b7280' },
  ]

  // Customer distribution
  const customerDistribution = [
    { range: '0-5 orders', count: 12 },
    { range: '6-15 orders', count: 18 },
    { range: '16-25 orders', count: 8 },
    { range: '26+ orders', count: 5 },
  ]

  // Top selling products
  const topProducts = products
    .map(p => ({
      name: p.name,
      sales: Math.floor(Math.random() * 1000) + 100,
      revenue: Math.floor(Math.random() * 500000) + 100000,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {t('export')}
        </Button>
      </div>

      {/* Report Options */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('salesReport')}</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
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
              <BarChart3 className="h-4 w-4 text-blue-600" />
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
              <PieChart className="h-4 w-4 text-green-600" />
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
              <TrendingUp className="h-4 w-4 text-orange-600" />
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
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#8b5cf6"
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
            <CardTitle>Sales by Category</CardTitle>
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
            <CardTitle>Customer Distribution</CardTitle>
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
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(product.revenue, locale)}</p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
