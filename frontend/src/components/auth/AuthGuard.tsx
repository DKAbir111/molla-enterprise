'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getAuthToken } from '@/lib/api'

export function AuthGuard() {
  const router = useRouter()
  const locale = useLocale()

  React.useEffect(() => {
    const token = getAuthToken()
    if (!token) router.replace(`/${locale}/login`)
  }, [router, locale])

  return null
}

