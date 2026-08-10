'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { HandCoins } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { listReceivables, type Receivable } from '@/lib/api/payment-api'
import { ReceivePaymentDialog } from './ReceivePaymentDialog'

/**
 * Who owes money and how much, largest debt first.
 *
 * Before this the outstanding balance existed only inside the notification
 * bell's alert payload — there was no screen listing debtors and no way to act
 * on one. "Receive" here takes a lump sum and the server applies it across that
 * customer's unpaid invoices, oldest first.
 */
export function ReceivablesCard({ locale, onChanged }: { locale: string; onChanged?: () => void }) {
  const t = useTranslations('payments')
  const [rows, setRows] = React.useState<Receivable[] | null>(null)
  const [target, setTarget] = React.useState<Receivable | null>(null)

  const load = React.useCallback(() => {
    listReceivables()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  React.useEffect(() => { load() }, [load])

  const total = React.useMemo(
    () => (rows ?? []).reduce((s, r) => s + Number(r.due || 0), 0),
    [rows],
  )

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HandCoins className="h-5 w-5 text-warning" />
              {t('receivables')}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('receivablesHint')}</p>
          </div>
          {total > 0 && (
            <span className="shrink-0 text-xl font-bold text-danger">{formatCurrency(total, locale)}</span>
          )}
        </CardHeader>

        <CardContent className={rows && rows.length > 0 ? 'p-0 sm:px-6 sm:pb-6' : ''}>
          {rows === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('noReceivables')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead className="text-right">{t('invoiced')}</TableHead>
                  <TableHead className="text-right">{t('paid')}</TableHead>
                  <TableHead className="text-right">{t('due')}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.customerId}>
                    <TableCell data-primary="">
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-subtle-foreground">
                        {t('openInvoices', { count: r.openInvoices })}
                        {r.oldestUnpaidAt ? ` · ${t('oldestSince', { date: formatDate(r.oldestUnpaidAt, locale) })}` : ''}
                      </p>
                    </TableCell>
                    <TableCell className="md:text-right" data-label={t('invoiced')}>
                      {formatCurrency(Number(r.invoiced || 0), locale)}
                    </TableCell>
                    <TableCell className="md:text-right" data-label={t('paid')}>
                      {formatCurrency(Number(r.paid || 0), locale)}
                    </TableCell>
                    <TableCell className="font-semibold text-danger md:text-right" data-label={t('due')}>
                      {formatCurrency(Number(r.due || 0), locale)}
                    </TableCell>
                    <TableCell className="md:text-right">
                      <Button size="sm" className="tap w-full gap-2 md:w-auto" onClick={() => setTarget(r)}>
                        <HandCoins className="h-4 w-4" />
                        {t('receivePayment')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {target && (
        <ReceivePaymentDialog
          open
          onClose={() => setTarget(null)}
          customerId={target.customerId}
          customerName={target.name}
          outstanding={Number(target.due || 0)}
          locale={locale}
          onRecorded={() => { load(); onChanged?.() }}
        />
      )}
    </>
  )
}
