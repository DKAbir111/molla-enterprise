'use client'

import * as React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { DuesList, type DueRow } from '@/components/payments/DuesList'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { cn, formatCurrency } from '@/lib/utils'
import { listPayables, listReceivables } from '@/lib/api/payment-api'

/**
 * Money owed in both directions.
 *
 * Kept out of Accounts on purpose: Accounts answers "how did the business do",
 * this answers "who do I chase and who do I pay". The two sides are tabs rather
 * than stacked tables — with a few hundred contacts a single scrolling page
 * buries whichever list you actually came for.
 */
export default function DuesPage() {
  const t = useTranslations('payments')
  const locale = useLocale()
  const [tab, setTab] = React.useState<'in' | 'out'>('in')
  const [receivables, setReceivables] = React.useState<DueRow[] | null>(null)
  const [payables, setPayables] = React.useState<DueRow[] | null>(null)

  const load = React.useCallback(() => {
    listReceivables()
      .then((rows) => setReceivables(rows.map((r) => ({ ...r, contactId: r.customerId }))))
      .catch(() => setReceivables([]))
    listPayables()
      .then((rows) => setPayables(rows.map((r) => ({ ...r, contactId: r.vendorId }))))
      .catch(() => setPayables([]))
  }, [])

  React.useEffect(() => { load() }, [load])

  const owedToYou = (receivables ?? []).reduce((s, r) => s + Number(r.due || 0), 0)
  const youOwe = (payables ?? []).reduce((s, r) => s + Number(r.due || 0), 0)
  const net = owedToYou - youOwe

  const tabs = [
    { key: 'in' as const, label: t('owedToYou'), count: receivables?.length ?? 0 },
    { key: 'out' as const, label: t('youOwe'), count: payables?.length ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <StatRail columns={3}>
        <StatTile label={t('owedToYou')} value={formatCurrency(owedToYou, locale)} tone="text-danger" />
        <StatTile label={t('youOwe')} value={formatCurrency(youOwe, locale)} tone="text-warning" />
        <StatTile
          label={t('netPosition')}
          value={formatCurrency(net, locale)}
          tone={net >= 0 ? 'text-success' : 'text-danger'}
        />
      </StatRail>

      <div className="border-b border-border-subtle">
        <nav className="no-scrollbar flex gap-1 overflow-x-auto" aria-label={t('duesTitle')}>
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-current={tab === item.key ? 'page' : undefined}
              className={cn(
                'tap flex min-h-12 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === item.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  tab === item.key ? 'bg-primary-subtle text-primary' : 'bg-surface-hover text-subtle-foreground',
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <DuesList
        rows={tab === 'in' ? receivables : payables}
        direction={tab}
        locale={locale as string}
        onChanged={load}
      />
    </div>
  )
}
