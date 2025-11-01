'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

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
      case 'today':
        start = end
        break
      case 'last7days':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        start = sevenDaysAgo.toISOString().split('T')[0]
        break
      case 'last30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        start = thirtyDaysAgo.toISOString().split('T')[0]
        break
      case 'last3months':
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(today.getDate() - 90)
        start = ninetyDaysAgo.toISOString().split('T')[0]
        break
      case 'last6months':
        const oneEightyDaysAgo = new Date(today)
        oneEightyDaysAgo.setDate(today.getDate() - 180)
        start = oneEightyDaysAgo.toISOString().split('T')[0]
        break
      case 'lastyear':
        const oneYearAgo = new Date(today)
        oneYearAgo.setDate(today.getDate() - 365)
        start = oneYearAgo.toISOString().split('T')[0]
        break
      default:
        break
    }

    setStartDate(start)
    setEndDate(end)
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      backgroundColor: '#f9f9f9'
    }}>
      <select
        onChange={handlePresetChange}
        value=""
        style={selectStyle}
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
        style={inputStyle}
      />
      <span>-</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={inputStyle}
      />
      <button
        onClick={handleClear}
        style={buttonStyle}
      >{t('clear')}</button>
    </div>
  )
}

const buttonStyle = {
  padding: '8px 12px',
  border: '1px solid #007bff',
  borderRadius: '4px',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  whiteSpace: 'nowrap'
}

const inputStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px'
}

const selectStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: 'white'
}