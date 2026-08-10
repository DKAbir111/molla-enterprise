'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { HandCoins, Search, Wallet } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ReceivePaymentDialog } from './ReceivePaymentDialog'

/** Shape shared by a receivable and a payable — they differ only in direction. */
export type DueRow = {
  /** customerId for money in, vendorId for money out. Null vendors cannot be paid in bulk. */
  contactId: string | null
  name: string
  phone: string
  invoiced: number
  paid: number
  due: number
  openInvoices: number
  oldestUnpaidAt: string | null
}

const PAGE_SIZE = 25

/**
 * One side of the dues ledger.
 *
 * Both sides used to render in full, stacked on a single screen. That is fine
 * for a handful of contacts and unusable once there are hundreds: the page
 * grows without bound and the list you actually want is somewhere in the
 * middle. This renders one side at a time, filtered by a search box and capped
 * to a page at a time, with the running total always reflecting the FULL
 * filtered set rather than just the visible slice.
 */
export function DuesList({
  rows,
  direction,
  locale,
  onChanged,
}: {
  rows: DueRow[] | null
  direction: 'in' | 'out'
  locale: string
  onChanged?: () => void
}) {
  const t = useTranslations('payments')
  const [query, setQuery] = React.useState('')
  const [limit, setLimit] = React.useState(PAGE_SIZE)
  const [target, setTarget] = React.useState<DueRow | null>(null)

  // A new search is a new list; showing page 3 of it would be disorienting.
  React.useEffect(() => { setLimit(PAGE_SIZE) }, [query, direction])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows ?? []
    return (rows ?? []).filter(
      (r) => r.name.toLowerCase().includes(q) || (r.phone || '').toLowerCase().includes(q),
    )
  }, [rows, query])

  const total = React.useMemo(() => filtered.reduce((s, r) => s + Number(r.due || 0), 0), [filtered])
  const visible = filtered.slice(0, limit)
  const isIn = direction === 'in'
  const Icon = isIn ? HandCoins : Wallet

  if (rows === null) {
    return <p className="py-10 text-center text-sm text-muted-foreground">…</p>
  }

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {isIn ? t('noReceivables') : t('noPayables')}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isIn ? t('searchCustomers') : t('searchVendors')}
            className="h-12 pl-10 md:h-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {t('showingCount', { shown: visible.length, total: filtered.length })}
          <span className={cn('ml-3 text-lg font-bold', isIn ? 'text-danger' : 'text-warning')}>
            {formatCurrency(total, locale)}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t('noMatches')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isIn ? t('customer') : t('vendor')}</TableHead>
                  <TableHead className="text-right">{t('invoiced')}</TableHead>
                  <TableHead className="text-right">{t('paid')}</TableHead>
                  <TableHead className="text-right">{t('due')}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={`${r.contactId ?? r.name}-${r.phone}`}>
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
                    <TableCell
                      className={cn('font-semibold md:text-right', isIn ? 'text-danger' : 'text-warning')}
                      data-label={t('due')}
                    >
                      {formatCurrency(Number(r.due || 0), locale)}
                    </TableCell>
                    <TableCell className="md:text-right">
                      <Button
                        size="sm"
                        variant={isIn ? 'default' : 'outline'}
                        className="tap w-full gap-2 md:w-auto"
                        // A purchase can name a vendor that was never saved to
                        // the vendor master, leaving nothing to pay against.
                        disabled={!r.contactId}
                        onClick={() => setTarget(r)}
                      >
                        <Icon className="h-4 w-4" />
                        {isIn ? t('receivePayment') : t('makePayment')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {visible.length < filtered.length && (
              <div className="flex justify-center px-4 pb-4 pt-2 sm:px-0">
                <Button variant="outline" className="tap w-full sm:w-auto" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                  {t('showMore')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {target?.contactId && (
        <ReceivePaymentDialog
          open
          direction={direction}
          onClose={() => setTarget(null)}
          customerId={isIn ? target.contactId : undefined}
          vendorId={isIn ? undefined : target.contactId}
          customerName={target.name}
          outstanding={Number(target.due || 0)}
          locale={locale}
          onRecorded={() => { setTarget(null); onChanged?.() }}
        />
      )}
    </div>
  )
}
