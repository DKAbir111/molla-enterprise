'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
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
import { getAccountsSummary } from '@/lib/api'
import { createTransaction } from '@/lib/api/transaction-api'
import { toast } from 'sonner'

type AccountsSummary = {
  totals: { income: number; expenses: number; net: number }
  monthly: { month: string; income: number; expense: number }[]
  recent: { id: string; type: 'income' | 'expense'; description: string; amount: number; date: string }[]
}

const EMPTY_SUMMARY: AccountsSummary = { totals: { income: 0, expenses: 0, net: 0 }, monthly: [], recent: [] }

export default function AccountsPage() {
  const t = useTranslations('accounts')
  const locale = useLocale()
  const [summary, setSummary] = useState<AccountsSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [quickOpen, setQuickOpen] = useState(false)
  const [savingQuick, setSavingQuick] = useState(false)
  const createDefaultQuickForm = () => ({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [quickForm, setQuickForm] = useState(() => createDefaultQuickForm())

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAccountsSummary<AccountsSummary>()
      setSummary(data)
    } catch {
      setSummary(EMPTY_SUMMARY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const resetQuickForm = () => setQuickForm(createDefaultQuickForm())

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingQuick) return
    try {
      const description = quickForm.description.trim()
      const category = (quickForm.category || '').trim() || (quickForm.type === 'income' ? 'Other Income' : 'Other Expense')
      const amount = Number(quickForm.amount)
      if (!description) throw new Error('Description is required')
      if (!amount || amount <= 0) throw new Error('Enter a valid amount')
      setSavingQuick(true)
      await createTransaction({
        description,
        type: quickForm.type,
        amount,
        category,
        date: quickForm.date,
      })
      toast.success('Quick entry added')
      resetQuickForm()
      setQuickOpen(false)
      loadSummary()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save entry')
    } finally {
      setSavingQuick(false)
    }
  }

  // Build a combined list from manual transactions + derived sells/buys
  const combined = summary.recent || []

  // Calculate financial stats (from combined)
  const totalIncome = summary.totals.income || 0
  const totalExpenses = summary.totals.expenses || 0
  const netProfit = totalIncome - totalExpenses

  // Prepare chart data (last 6 months)
  const monthlyData = (summary.monthly || []).map(m => ({ month: new Date(m.month + '-01').toLocaleString(locale as any, { month: 'short' }), income: m.income, expense: m.expense }))

  // Expense categories (last 90 days)
  // We no longer compute categories (no manual categories).
  const pieBase: [string, number][] = [['Purchases', totalExpenses]]
  const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#6b7280']
  const expenseCategories = pieBase.map(([name, value], idx) => ({ name, value, color: palette[idx % palette.length] }))

  // Compute change vs previous month for KPI cards
  const monthlyRaw = summary.monthly || []
  const last = monthlyRaw.at(-1)
  const prev = monthlyRaw.length > 1 ? monthlyRaw.at(-2) : undefined
  const lastIncome = last?.income || 0
  const prevIncome = prev?.income || 0
  const lastExpense = last?.expense || 0
  const prevExpense = prev?.expense || 0
  const lastProfit = lastIncome - lastExpense
  const prevProfit = prevIncome - prevExpense
  const pct = (cur: number, prev: number) => prev > 0 ? (((cur - prev) / prev) * 100) : 0
  const incomePct = pct(lastIncome, prevIncome)
  const expensePct = pct(lastExpense, prevExpense)
  const profitPct = pct(lastProfit, prevProfit)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-2">Loading financial insights...</p>
        </div>
      </div>
    )
  }

  const quickEntryDialog = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Quick income / expense</DialogTitle>
        <DialogDescription>Track ad-hoc cash movement without creating a full sell or buy.</DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={handleQuickSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quick-type">Type</Label>
            <select
              id="quick-type"
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={quickForm.type}
              onChange={(e) => setQuickForm((prev) => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <Label htmlFor="quick-date">Date</Label>
            <Input id="quick-date" type="date" value={quickForm.date} onChange={(e) => setQuickForm((prev) => ({ ...prev, date: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="quick-description">Description</Label>
          <Input id="quick-description" value={quickForm.description} onChange={(e) => setQuickForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="e.g. Rental income" className="mt-1" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quick-amount">Amount</Label>
            <Input id="quick-amount" type="number" min="0" step="0.01" value={quickForm.amount} onChange={(e) => setQuickForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="0.00" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="quick-category">Category</Label>
            <Input id="quick-category" value={quickForm.category} onChange={(e) => setQuickForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Optional" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={savingQuick}>
            {savingQuick ? 'Saving...' : 'Save entry'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if ((summary.monthly.length || 0) === 0 && combined.length === 0) {
    return (
      <Dialog open={quickOpen} onOpenChange={(open) => { setQuickOpen(open); if (!open) resetQuickForm() }}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-2">{t('emptyDescription') || 'Record income or expenses to see analytics.'}</p>
            </div>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">+ Quick Entry</Button>
            </DialogTrigger>
          </div>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div>
              <h3 className="text-lg font-semibold mb-1">{t('emptyTitle') || 'No transactions yet'}</h3>
              <p className="text-gray-600">Use quick entries for ad-hoc cash flow or create sells/buys to populate this dashboard.</p>
              <Button variant="outline" className="mt-6" onClick={() => setQuickOpen(true)}>Add quick income / expense</Button>
            </CardContent>
          </Card>
        </div>
        {quickEntryDialog}
      </Dialog>
    )
  }
  return (
    <Dialog open={quickOpen} onOpenChange={(open) => { setQuickOpen(open); if (!open) resetQuickForm() }}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-2">Monitor income, expenses, and ad-hoc memos in one place.</p>
          </div>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">+ Quick Entry</Button>
          </DialogTrigger>
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
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                {[...combined]
                  .sort((a, b) => (new Date(b.date as any).getTime()) - (new Date(a.date as any).getTime()))
                  .slice(0, 10)
                  .map((transaction, idx) => (
                    <TableRow key={`${transaction.id}-${idx}`}>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(transaction.date as any, locale)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${transaction.type === 'income'
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
                      <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
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
      {quickEntryDialog}
    </Dialog>
  )
}
