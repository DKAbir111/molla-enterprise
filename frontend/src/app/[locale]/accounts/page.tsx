'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { TrendingUp, TrendingDown, DollarSign, Calculator, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { listTransactions as fetchTransactions } from '@/lib/api'
import { normalizeTransaction } from '@/lib/api'

export default function AccountsPage() {
  const t = useTranslations('accounts')
  const locale = useLocale()
  const { transactions, addTransaction } = useStore()

  // Load from API
  useEffect(() => {
    let mounted = true
    if (transactions.length === 0) {
      fetchTransactions<any[]>()
        .then((res) => {
          if (!mounted) return
          ;(res || []).map(normalizeTransaction).forEach(addTransaction)
        })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [transactions.length, addTransaction])

  // Calculate financial stats (live from transactions)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalIncome - totalExpenses

  // Prepare chart data (last 6 months)
  const now = new Date()
  const months: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString(locale as any, { month: 'short' }) })
  }
  const sumsIncome: Record<string, number> = {}
  const sumsExpense: Record<string, number> = {}
  months.forEach(m => { sumsIncome[m.key] = 0; sumsExpense[m.key] = 0 })
  transactions.forEach((tx) => {
    const d = tx.date instanceof Date ? tx.date : new Date(tx.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!(key in sumsIncome)) return
    if (tx.type === 'income') sumsIncome[key] += tx.amount
    else if (tx.type === 'expense') sumsExpense[key] += tx.amount
  })
  const monthlyData = months.map(m => ({ month: m.label, income: sumsIncome[m.key] || 0, expense: sumsExpense[m.key] || 0 }))

  // Expense categories (last 90 days)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const catTotals: Record<string, number> = {}
  transactions.forEach((tx) => {
    const d = tx.date instanceof Date ? tx.date : new Date(tx.date)
    if (tx.type !== 'expense' || d < cutoff) return
    const cat = tx.category || 'Others'
    catTotals[cat] = (catTotals[cat] || 0) + tx.amount
  })
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
  const topCats = sortedCats.slice(0, 4)
  const othersValue = sortedCats.slice(4).reduce((sum, [, v]) => sum + v, 0)
  const pieBase = [...topCats, ...(othersValue > 0 ? [['Others', othersValue] as const] : [])]
  const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#6b7280']
  const expenseCategories = pieBase.map(([name, value], idx) => ({ name, value, color: palette[idx % palette.length] }))

  // Compute change vs previous month for KPI cards
  const lastKey = months.at(-1)?.key
  const prevKey = months.length > 1 ? months.at(-2)!.key : undefined
  const lastIncome = lastKey ? sumsIncome[lastKey] : 0
  const prevIncome = prevKey ? sumsIncome[prevKey!] : 0
  const lastExpense = lastKey ? sumsExpense[lastKey] : 0
  const prevExpense = prevKey ? sumsExpense[prevKey!] : 0
  const lastProfit = lastIncome - lastExpense
  const prevProfit = prevIncome - prevExpense
  const pct = (cur: number, prev: number) => prev > 0 ? (((cur - prev) / prev) * 100) : 0
  const incomePct = pct(lastIncome, prevIncome)
  const expensePct = pct(lastExpense, prevExpense)
  const profitPct = pct(lastProfit, prevProfit)

  // Empty state when no transactions
  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">ℹ️</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle') || 'No transactions yet'}</h3>
            <p className="text-gray-600">{t('emptyDescription') || 'As you add orders and record payments/expenses, analytics will appear here.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('totalIncome')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome, locale)}
            </div>
            {prevIncome > 0 && (
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>{`${incomePct >= 0 ? '+' : ''}${incomePct.toFixed(1)}%`} {t('fromLastMonth')}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('totalExpenses')}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses, locale)}
            </div>
            {prevExpense > 0 && (
              <div className="flex items-center text-xs text-red-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>{`${expensePct >= 0 ? '+' : ''}${expensePct.toFixed(1)}%`} {t('fromLastMonth')}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('netProfit')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(netProfit, locale)}
            </div>
            {prevProfit > 0 && (
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>{`${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(1)}%`} {t('fromLastMonth')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('incomeVsExpenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('expenseBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('transactions')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 10).map((transaction, idx) => (
                <TableRow key={`${transaction.id}-${idx}`}>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(transaction.date, locale)}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {t(transaction.type)}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
