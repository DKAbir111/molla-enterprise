'use client'

import React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getMyOrganization } from '@/lib/api/organization-api'

export function Greeting() {
  const t = useTranslations('greeting')
  const locale = useLocale()
  const [name, setName] = React.useState<string>('')

  React.useEffect(() => {
    let mounted = true
    getMyOrganization<any>().then((org) => { if (!mounted) return; if (org?.name) setName(org.name) }).catch(() => { })
    return () => { mounted = false }
  }, [])

  const hour = new Date().getHours()
  const key = hour < 5 ? 'night' : hour < 12 ? 'morning' : hour === 12 ? 'noon' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-linear-to-r from-purple-600 to-blue-600 h-9 w-9 text-white flex items-center justify-center text-lg">👋</div>
      <div className="leading-tight">
        <div className="text-sm text-gray-500">{t(key)}</div>
        <div className="text-lg font-semibold text-gray-800">{name || t('there')}</div>
      </div>
    </div>
  )
}

