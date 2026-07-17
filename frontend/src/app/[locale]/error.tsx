'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Route-level error boundary. Without this a thrown render error falls through
 * to the framework's raw default page.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errorPages')

  React.useEffect(() => {
    // Replace with a real reporter (Sentry et al.) when one is wired up.
    console.error('Unhandled route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="glass w-full max-w-md rounded-xl p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle">
          <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{t('somethingWrong')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('errorBody')}</p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-subtle-foreground">
            {t('reference')} {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>
            <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('tryAgain')}
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            {t('goToDashboard')}
          </Button>
        </div>
      </div>
    </div>
  )
}
