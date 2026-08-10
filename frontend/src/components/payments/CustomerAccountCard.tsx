'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { HandCoins, Clock } from 'lucide-react'
import { formatCurrency, formatDate, formatOrderCode, cn } from '@/lib/utils'
import { listSells } from '@/lib/api/sell-api'
import { normalizeOrder } from '@/lib/api'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { ReceivePaymentDialog } from './ReceivePaymentDialog'

/**
 * The customer's running account: what they owe, which orders are still open,
 * and the button that records them paying.
 *
 * This is the screen the collection workflow actually happens on — you look
 * someone up, see that three orders are undelivered and ৳12,000 is outstanding,
 * and take the money without hunting through the sells list for their invoices.
 */
export function CustomerAccountCard({
  customerId,
  customerName,
  locale,
}: {
  customerId: string
  customerName: string
  locale: string
}) {
  const t = useTranslations('payments')
  const ts = useTranslations('sells')
  const [orders, setOrders] = React.useState<any[] | null>(null)
  const [payOpen, setPayOpen] = React.useState(false)
  const [payTarget, setPayTarget] = React.useState<any | null>(null)

  const load = React.useCallback(() => {
    listSells<any[]>()
      .then((res) => {
        const mine = (res || [])
          .map(normalizeOrder)
          .filter((o: any) => o.customerId === customerId)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(mine)
      })
      .catch(() => setOrders([]))
  }, [customerId])

  React.useEffect(() => { load() }, [load])

  const rows = React.useMemo(() => {
    return (orders ?? [])
      .filter((o) => o.status !== 'cancelled')
      .map((o) => {
        const items = (o.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
        const grand = Math.max(0, items + Number(o.transportTotal || 0) - Number(o.discount || 0))
        const paid = Number(o.paidAmount || 0)
        return { ...o, grand, paid, due: Math.max(0, grand - paid) }
      })
  }, [orders])

  const totals = React.useMemo(() => ({
    due: rows.reduce((s, r) => s + r.due, 0),
    invoiced: rows.reduce((s, r) => s + r.grand, 0),
    // "Pending" here means not yet delivered — the orders still owed as goods,
    // which is a different question from the ones still owed as money.
    undelivered: rows.filter((r) => r.status !== 'delivered').length,
  }), [rows])

  const openRows = rows.filter((r) => r.due > 0 || r.status !== 'delivered')

  return (
    <>
      <StatRail columns={3}>
        <StatTile label={t('invoiced')} value={formatCurrency(totals.invoiced, locale)} />
        <StatTile label={t('outstanding')} value={formatCurrency(totals.due, locale)} tone="text-danger" />
        <StatTile label={ts('orderStatus.pending')} value={totals.undelivered} tone="text-warning" />
      </StatRail>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-warning" />
            {t('openOrders')}
          </CardTitle>
          <Button
            className="tap shrink-0 gap-2"
            disabled={totals.due <= 0}
            onClick={() => { setPayTarget(null); setPayOpen(true) }}
          >
            <HandCoins className="h-4 w-4" />
            {t('receivePayment')}
          </Button>
        </CardHeader>

        <CardContent className={openRows.length ? 'p-0 sm:px-6 sm:pb-6' : ''}>
          {orders === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">…</p>
          ) : openRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('noOpenOrders')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ts('orderId')}</TableHead>
                  <TableHead>{ts('date')}</TableHead>
                  <TableHead>{ts('status')}</TableHead>
                  <TableHead className="text-right">{ts('total')}</TableHead>
                  <TableHead className="text-right">{t('due')}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {openRows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium" data-primary="">
                      <Link href={`/${locale}/sells/${o.id}`} className="hover:text-info">
                        {formatOrderCode(o.id, o.createdAt)}
                      </Link>
                    </TableCell>
                    <TableCell data-label={ts('date')}>{formatDate(o.createdAt, locale)}</TableCell>
                    <TableCell data-label={ts('status')}>
                      <span className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        o.status === 'delivered' ? 'bg-success-subtle text-success'
                          : o.status === 'processing' ? 'bg-info-subtle text-info'
                            : 'bg-warning-subtle text-warning',
                      )}>
                        {ts(`orderStatus.${o.status}` as any)}
                      </span>
                    </TableCell>
                    <TableCell className="md:text-right" data-label={ts('total')}>{formatCurrency(o.grand, locale)}</TableCell>
                    <TableCell
                      className={cn('font-semibold md:text-right', o.due > 0 ? 'text-danger' : 'text-success')}
                      data-label={t('due')}
                    >
                      {formatCurrency(o.due, locale)}
                    </TableCell>
                    <TableCell className="md:text-right">
                      {o.due > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="tap w-full gap-2 md:w-auto"
                          onClick={() => { setPayTarget(o); setPayOpen(true) }}
                        >
                          <HandCoins className="h-4 w-4" />
                          {t('makePayment')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {payOpen && (
        <ReceivePaymentDialog
          open
          onClose={() => { setPayOpen(false); setPayTarget(null) }}
          customerId={customerId}
          customerName={customerName}
          // Against one invoice when a row's button was used, otherwise the
          // whole balance, which the server spreads oldest-first.
          outstanding={payTarget ? payTarget.due : totals.due}
          sellId={payTarget?.id}
          locale={locale}
          onRecorded={load}
        />
      )}
    </>
  )
}
