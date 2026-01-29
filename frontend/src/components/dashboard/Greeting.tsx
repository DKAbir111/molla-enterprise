'use client'

import React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useOrganizationStore } from '@/store/useOrganization'

export function Greeting() {
  const t = useTranslations('greeting')
  const locale = useLocale()
  const { organization, fetchOrganization } = useOrganizationStore()

  React.useEffect(() => {
    if (organization === undefined) {
      fetchOrganization().catch(() => {})
    }
  }, [organization, fetchOrganization])

  const hour = new Date().getHours()
  const key = hour < 5 ? 'night' : hour < 12 ? 'morning' : hour === 12 ? 'noon' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
  const name = organization?.name || ''

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-linear-to-r from-teal-600 to-teal-500 h-9 w-9 text-white flex items-center justify-center text-lg">👋</div>
      <div className="leading-tight">
        <div className="text-sm text-gray-500">{t(key)}</div>
        <div className="text-lg font-semibold text-gray-800">{name || t('there')}</div>
      </div>
    </div>
  )
}
