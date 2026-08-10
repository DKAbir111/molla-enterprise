'use client'

import * as React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ReceivablesCard } from '@/components/payments/ReceivablesCard'
import { PayablesCard } from '@/components/payments/PayablesCard'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { formatCurrency } from '@/lib/utils'
import { listPayables, listReceivables } from '@/lib/api/payment-api'

/**
 * Money owed in both directions, on its own screen.
 *
 * This used to sit inside Accounts, but debts are not the same thing as the
 * income/expense summary: Accounts answers "how did the business do", this
 * answers "who do I chase and who do I pay". Keeping them together made both
 * harder to read.
 */
export default function DuesPage() {
  const t = useTranslations('payments')
  const locale = useLocale()
  const [totals, setTotals] = React.useState({ owedToYou: 0, youOwe: 0 })

  const loadTotals = React.useCallback(() => {
    Promise.all([listReceivables().catch(() => []), listPayables().catch(() => [])])
      .then(([recv, pay]) => {
        setTotals({
          owedToYou: recv.reduce((s, r) => s + Number(r.due || 0), 0),
          youOwe: pay.reduce((s, r) => s + Number(r.due || 0), 0),
        })
      })
      .catch(() => { })
  }, [])

  React.useEffect(() => { loadTotals() }, [loadTotals])

  const net = totals.owedToYou - totals.youOwe

  return (
    <div className="space-y-6">
      <StatRail columns={3}>
        <StatTile label={t('owedToYou')} value={formatCurrency(totals.owedToYou, locale)} tone="text-danger" />
        <StatTile label={t('youOwe')} value={formatCurrency(totals.youOwe, locale)} tone="text-warning" />
        <StatTile
          label={t('netPosition')}
          value={formatCurrency(net, locale)}
          tone={net >= 0 ? 'text-success' : 'text-danger'}
        />
      </StatRail>

      <ReceivablesCard locale={locale as string} onChanged={loadTotals} />
      <PayablesCard locale={locale as string} onChanged={loadTotals} />
    </div>
  )
}
