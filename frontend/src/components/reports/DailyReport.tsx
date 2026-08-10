'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { dayKey, formatDayKey, isWithinRange, type DateRange } from '@/lib/date-range'
import { exportTablePdf, plainAmount } from '@/lib/pdf'

export type DailyRow = {
  key: string
  sellCount: number
  sellTotal: number
  buyCount: number
  buyTotal: number
  net: number
}

/**
 * The grand total of an order: line items plus transport, less discount. Kept
 * identical to the backend (alerts, accounts) and the sells/buys list pages —
 * `Sell.total` / `Buy.total` hold only the line-item subtotal, so reading that
 * column alone silently drops transport and ignores the discount.
 */
function grandTotal(order: any): number {
  const items = (order?.items || []).reduce((s: number, it: any) => s + Number(it?.total || 0), 0)
  const transport = Number(order?.transportTotal || 0)
  const discount = Number(order?.discount || 0)
  return Math.max(0, items + transport - discount)
}

export function buildDailyRows(sells: any[], buys: any[], range: DateRange): DailyRow[] {
  const byDay = new Map<string, DailyRow>()

  const row = (key: string) => {
    let r = byDay.get(key)
    if (!r) {
      r = { key, sellCount: 0, sellTotal: 0, buyCount: 0, buyTotal: 0, net: 0 }
      byDay.set(key, r)
    }
    return r
  }

  for (const s of sells || []) {
    // A cancelled order is not a sale and must not appear in the day's takings.
    if (String(s?.status) === 'cancelled') continue
    if (!isWithinRange(s?.createdAt, range)) continue
    const k = dayKey(s.createdAt)
    if (!k) continue
    const r = row(k)
    r.sellCount += 1
    r.sellTotal += grandTotal(s)
  }

  for (const b of buys || []) {
    if (!isWithinRange(b?.createdAt, range)) continue
    const k = dayKey(b.createdAt)
    if (!k) continue
    const r = row(k)
    r.buyCount += 1
    r.buyTotal += grandTotal(b)
  }

  return [...byDay.values()]
    .map((r) => ({ ...r, net: r.sellTotal - r.buyTotal }))
    .sort((a, b) => b.key.localeCompare(a.key)) // newest day first
}

export function DailyReport({
  sells,
  buys,
  range,
  locale,
  organizationName,
}: {
  sells: any[]
  buys: any[]
  range: DateRange
  locale: string
  organizationName?: string
}) {
  const t = useTranslations('reports')
  const [exporting, setExporting] = React.useState(false)

  const rows = React.useMemo(() => buildDailyRows(sells, buys, range), [sells, buys, range])

  const totals = React.useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          sellCount: acc.sellCount + r.sellCount,
          sellTotal: acc.sellTotal + r.sellTotal,
          buyCount: acc.buyCount + r.buyCount,
          buyTotal: acc.buyTotal + r.buyTotal,
          net: acc.net + r.net,
        }),
        { sellCount: 0, sellTotal: 0, buyCount: 0, buyTotal: 0, net: 0 },
      ),
    [rows],
  )

  const rangeLabel = range.start && range.end
    ? `${formatDayKey(range.start, 'en-US')} — ${formatDayKey(range.end, 'en-US')}`
    : 'All time'

  const downloadPdf = async () => {
    if (rows.length === 0) return
    setExporting(true)
    try {
      await exportTablePdf({
        title: organizationName || 'Business Manager',
        subtitle: 'Daily sales & purchases',
        meta: rangeLabel,
        head: ['Date', 'Sales', 'Sales total', 'Purchases', 'Purchase total', 'Net'],
        body: rows.map((r) => [
          formatDayKey(r.key, 'en-US'),
          r.sellCount,
          plainAmount(r.sellTotal),
          r.buyCount,
          plainAmount(r.buyTotal),
          plainAmount(r.net),
        ]),
        foot: [
          'Total',
          totals.sellCount,
          plainAmount(totals.sellTotal),
          totals.buyCount,
          plainAmount(totals.buyTotal),
          plainAmount(totals.net),
        ],
        align: { 1: 'right', 2: 'right', 3: 'right', 4: 'right', 5: 'right' },
        filename: `daily-report-${range.start && range.end ? `${range.start}_${range.end}` : 'all-time'}`,
      })
    } catch {
      toast.error('Could not generate the PDF.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-lg">{t('dailyReport')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t('dailyReportHint')}</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadPdf}
          disabled={exporting || rows.length === 0}
          className="shrink-0 gap-2"
        >
          <Download className="h-4 w-4" />
          {t('downloadPdf')}
        </Button>
      </CardHeader>

      <CardContent className={rows.length === 0 ? '' : 'p-0 sm:px-6 sm:pb-6'}>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('noDataForRange')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('day')}</TableHead>
                <TableHead className="text-right">{t('salesCount')}</TableHead>
                <TableHead className="text-right">{t('salesTotal')}</TableHead>
                <TableHead className="text-right">{t('purchaseCount')}</TableHead>
                <TableHead className="text-right">{t('purchaseTotal')}</TableHead>
                <TableHead className="text-right">{t('net')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium" data-primary="">{formatDayKey(r.key, locale)}</TableCell>
                  <TableCell className="md:text-right" data-label={t('salesCount')}>{r.sellCount}</TableCell>
                  <TableCell className="md:text-right" data-label={t('salesTotal')}>{formatCurrency(r.sellTotal, locale)}</TableCell>
                  <TableCell className="md:text-right" data-label={t('purchaseCount')}>{r.buyCount}</TableCell>
                  <TableCell className="md:text-right" data-label={t('purchaseTotal')}>{formatCurrency(r.buyTotal, locale)}</TableCell>
                  <TableCell
                    data-label={t('net')}
                    className={`font-semibold md:text-right ${r.net >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {formatCurrency(r.net, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold" data-primary="">{t('grandTotal')}</TableCell>
                <TableCell className="font-semibold md:text-right" data-label={t('salesCount')}>{totals.sellCount}</TableCell>
                <TableCell className="font-semibold md:text-right" data-label={t('salesTotal')}>{formatCurrency(totals.sellTotal, locale)}</TableCell>
                <TableCell className="font-semibold md:text-right" data-label={t('purchaseCount')}>{totals.buyCount}</TableCell>
                <TableCell className="font-semibold md:text-right" data-label={t('purchaseTotal')}>{formatCurrency(totals.buyTotal, locale)}</TableCell>
                <TableCell
                  data-label={t('net')}
                  className={`font-bold md:text-right ${totals.net >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {formatCurrency(totals.net, locale)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
