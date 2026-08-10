'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { toLocalISODate } from '@/lib/date-range'

export function DateFilter({
  value,
  onChange,
}: {
  value?: { start?: string; end?: string }
  onChange?: (v: { start?: string; end?: string; preset?: string }) => void
}) {
  const t = useTranslations('dateFilter')
  const [startDate, setStartDate] = React.useState<string>(value?.start || '')
  const [endDate, setEndDate] = React.useState<string>(value?.end || '')

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    const today = new Date()
    // Local dates throughout: toISOString() shifts to UTC first, so east of
    // Greenwich "Today" resolved to yesterday for the whole early morning.
    const end = toLocalISODate(today)
    let start = ''

    const daysBack = (n: number) => {
      const d = new Date(today)
      d.setDate(today.getDate() - n)
      return toLocalISODate(d)
    }

    switch (selectedValue) {
      case 'today': start = end; break
      case 'last7days': start = daysBack(7); break
      case 'last30days': start = daysBack(30); break
      case 'last3months': start = daysBack(90); break
      case 'last6months': start = daysBack(180); break
      case 'lastyear': start = daysBack(365); break
    }

    setStartDate(start)
    setEndDate(end)
    onChange?.({ start, end, preset: selectedValue })
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    onChange?.({ start: undefined, end: undefined, preset: undefined as any })
  }

  return (
    // A native date input has an intrinsic minimum width of roughly 140px and
    // will not shrink below it, so on a phone the four controls stack.
    //
    // From md up they sit on ONE line and stay there. An earlier version used
    // `flex-wrap` as an overflow guard, but in Bengali the longer labels tipped
    // it over and dropped Clear onto a second line inside the bordered box,
    // which just read as broken. The control is given its own full-width row by
    // its callers instead, so there is always room.
    <div className="flex w-full flex-col gap-2 rounded-lg border border-border-subtle bg-surface/60 p-2 md:w-auto md:flex-row md:items-center md:px-3 md:py-2">
      <select
        onChange={handlePresetChange}
        defaultValue=""
        aria-label={t('selectRange')}
        className="h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:h-10 md:w-auto"
      >
        <option value="" disabled>{t('selectRange')}</option>
        <option value="today">{t('today')}</option>
        <option value="last7days">{t('last7Days')}</option>
        <option value="last30days">{t('last30Days')}</option>
        <option value="last3months">{t('last3Months')}</option>
        <option value="last6months">{t('last6Months')}</option>
        <option value="lastyear">{t('lastYear')}</option>
      </select>

      {/* The two dates stay on one line together at every width; `min-w-0`
          on both the group and the inputs is what lets them actually shrink. */}
      <div className="flex min-w-0 items-center gap-2">
        <input
          type="date"
          value={startDate}
          aria-label={t('selectRange')}
          onChange={(e) => { setStartDate(e.target.value); onChange?.({ start: e.target.value, end: endDate }) }}
          className="h-11 w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:h-10 md:w-auto md:flex-none"
        />
        <span className="shrink-0 text-subtle-foreground">-</span>
        <input
          type="date"
          value={endDate}
          aria-label={t('selectRange')}
          onChange={(e) => { setEndDate(e.target.value); onChange?.({ start: startDate, end: e.target.value }) }}
          className="h-11 w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:h-10 md:w-auto md:flex-none"
        />
      </div>

      <Button size="sm" onClick={handleClear} className="h-11 w-full shrink-0 whitespace-nowrap md:h-9 md:w-auto">
        {t('clear')}
      </Button>
    </div>
  )
}
