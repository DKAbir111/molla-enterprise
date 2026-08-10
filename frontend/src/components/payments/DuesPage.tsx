'use client'

import * as React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { DuesList, type DueRow } from '@/components/payments/DuesList'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { formatCurrency, formatDate } from '@/lib/utils'
import { listPayables, listReceivables } from '@/lib/api/payment-api'

/**
 * One side of the dues ledger as a full page.
 *
 * Receivables and payables were a single tabbed screen. They belong to
 * different halves of the business though — one is a customer conversation and
 * the other a vendor one — so each now lives beside the records it is about,
 * and this component is the shared body.
 */
export function DuesPage({ direction }: { direction: 'in' | 'out' }) {
  const t = useTranslations('payments')
  const locale = useLocale()
  const [rows, setRows] = React.useState<DueRow[] | null>(null)

  const load = React.useCallback(() => {
    const request = direction === 'in'
      ? listReceivables().then((r) => r.map((x) => ({ ...x, contactId: x.customerId })))
      : listPayables().then((r) => r.map((x) => ({ ...x, contactId: x.vendorId })))
    request.then(setRows).catch(() => setRows([]))
  }, [direction])

  React.useEffect(() => { load() }, [load])

  const total = (rows ?? []).reduce((s, r) => s + Number(r.due || 0), 0)
  // The single oldest unpaid invoice across every contact — the number that
  // says how long money has actually been sitting out there.
  const oldest = (rows ?? [])
    .map((r) => r.oldestUnpaidAt)
    .filter(Boolean)
    .sort()[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {direction === 'in' ? t('receivablesTitle') : t('payablesTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {direction === 'in' ? t('receivablesHint') : t('payablesHint')}
        </p>
      </div>

      <StatRail columns={3}>
        <StatTile
          label={direction === 'in' ? t('owedToYou') : t('youOwe')}
          value={formatCurrency(total, locale)}
          tone={direction === 'in' ? 'text-danger' : 'text-warning'}
        />
        <StatTile label={t('contactsWithDue')} value={rows?.length ?? 0} />
        <StatTile
          label={t('oldestOutstanding')}
          value={oldest ? formatDate(oldest, locale) : t('none')}
        />
      </StatRail>

      <DuesList rows={rows} direction={direction} locale={locale as string} onChanged={load} />
    </div>
  )
}
