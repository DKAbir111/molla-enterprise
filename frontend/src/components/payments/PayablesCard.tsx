'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { listPayables, type Payable } from '@/lib/api/payment-api'
import { ReceivePaymentDialog } from './ReceivePaymentDialog'

/**
 * The mirror of ReceivablesCard: vendors you still owe.
 *
 * A purchase can name a vendor that was never saved to the vendor master, in
 * which case there is no `vendorId` to pay against — those rows still show the
 * debt but cannot take a lump-sum payment, so the action is disabled with the
 * reason rather than silently failing.
 */
export function PayablesCard({ locale, onChanged }: { locale: string; onChanged?: () => void }) {
  const t = useTranslations('payments')
  const [rows, setRows] = React.useState<Payable[] | null>(null)
  const [target, setTarget] = React.useState<Payable | null>(null)

  const load = React.useCallback(() => {
    listPayables().then(setRows).catch(() => setRows([]))
  }, [])

  React.useEffect(() => { load() }, [load])

  const total = React.useMemo(() => (rows ?? []).reduce((s, r) => s + Number(r.due || 0), 0), [rows])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-info" />
              {t('payables')}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('payablesHint')}</p>
          </div>
          {total > 0 && <span className="shrink-0 text-xl font-bold text-warning">{formatCurrency(total, locale)}</span>}
        </CardHeader>

        <CardContent className={rows && rows.length > 0 ? 'p-0 sm:px-6 sm:pb-6' : ''}>
          {rows === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('noPayables')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('vendor')}</TableHead>
                  <TableHead className="text-right">{t('invoiced')}</TableHead>
                  <TableHead className="text-right">{t('paid')}</TableHead>
                  <TableHead className="text-right">{t('due')}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.name}-${r.phone}`}>
                    <TableCell data-primary="">
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-subtle-foreground">
                        {t('openInvoices', { count: r.openInvoices })}
                        {r.oldestUnpaidAt ? ` · ${t('oldestSince', { date: formatDate(r.oldestUnpaidAt, locale) })}` : ''}
                      </p>
                    </TableCell>
                    <TableCell className="md:text-right" data-label={t('invoiced')}>{formatCurrency(Number(r.invoiced || 0), locale)}</TableCell>
                    <TableCell className="md:text-right" data-label={t('paid')}>{formatCurrency(Number(r.paid || 0), locale)}</TableCell>
                    <TableCell className="font-semibold text-warning md:text-right" data-label={t('due')}>{formatCurrency(Number(r.due || 0), locale)}</TableCell>
                    <TableCell className="md:text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="tap w-full gap-2 md:w-auto"
                        disabled={!r.vendorId}
                        title={r.vendorId ? undefined : t('vendor')}
                        onClick={() => setTarget(r)}
                      >
                        <Wallet className="h-4 w-4" />
                        {t('makePayment')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {target?.vendorId && (
        <ReceivePaymentDialog
          open
          direction="out"
          onClose={() => setTarget(null)}
          vendorId={target.vendorId}
          customerName={target.name}
          outstanding={Number(target.due || 0)}
          locale={locale}
          onRecorded={() => { load(); onChanged?.() }}
        />
      )}
    </>
  )
}
