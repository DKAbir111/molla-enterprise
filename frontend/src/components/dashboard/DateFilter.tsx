'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function DateFilter() {
  const t = useTranslations('dateFilter')
  const [startDate, setStartDate] = React.useState<string>('')
  const [endDate, setEndDate] = React.useState<string>('')

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    const today = new Date()
    const end = today.toISOString().split('T')[0]
    let start = ''

    switch (selectedValue) {
      case 'today': {
        start = end; break
      }
      case 'last7days': {
        const d = new Date(today); d.setDate(today.getDate() - 7)
        start = d.toISOString().split('T')[0]; break
      }
      case 'last30days': {
        const d = new Date(today); d.setDate(today.getDate() - 30)
        start = d.toISOString().split('T')[0]; break
      }
      case 'last3months': {
        const d = new Date(today); d.setDate(today.getDate() - 90)
        start = d.toISOString().split('T')[0]; break
      }
      case 'last6months': {
        const d = new Date(today); d.setDate(today.getDate() - 180)
        start = d.toISOString().split('T')[0]; break
      }
      case 'lastyear': {
        const d = new Date(today); d.setDate(today.getDate() - 365)
        start = d.toISOString().split('T')[0]; break
      }
    }

    setStartDate(start)
    setEndDate(end)
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[var(--card-bg)]/60 px-3 py-2">
      <select
        onChange={handlePresetChange}
        defaultValue=""
        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="" disabled>{t('selectRange')}</option>
        <option value="today">{t('today')}</option>
        <option value="last7days">{t('last7Days')}</option>
        <option value="last30days">{t('last30Days')}</option>
        <option value="last3months">{t('last3Months')}</option>
        <option value="last6months">{t('last6Months')}</option>
        <option value="lastyear">{t('lastYear')}</option>
      </select>

      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <span className="text-[color:var(--text)]/60">-</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <Button size="sm" onClick={handleClear}>{t('clear')}</Button>
    </div>
  )
}
