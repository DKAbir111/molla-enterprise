'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getMyOrganizationSettings, updateOrganizationSettings } from '@/lib/api'

/**
 * Business-domain feature toggles.
 *
 * Drying gain is specific to the sand and aggregate trade — stock gains volume
 * as it dries — and is meaningless noise for anyone selling cement or rod. It
 * is off by default and the product form hides the field entirely until it is
 * switched on here.
 */
export function FeaturesSection({ orgId }: { orgId: string | null }) {
  const t = useTranslations('settings')
  const [dryingGainEnabled, setDryingGainEnabled] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    getMyOrganizationSettings<any>()
      .then((s) => { if (mounted && s) setDryingGainEnabled(!!s.dryingGainEnabled) })
      .catch(() => { })
    return () => { mounted = false }
  }, [])

  const toggle = async () => {
    if (!orgId || saving) return
    const next = !dryingGainEnabled
    setDryingGainEnabled(next)
    setSaving(true)
    try {
      await updateOrganizationSettings(orgId, { dryingGainEnabled: next } as any)
      toast.success(next ? t('featureEnabled') : t('featureDisabled'))
    } catch {
      setDryingGainEnabled(!next)
      toast.error(t('featureUpdateFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('features')}</CardTitle>
        <CardDescription>{t('featuresHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-surface-hover">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground">{t('dryingGain')}</div>
            <div className="text-sm text-muted-foreground">{t('dryingGainHint')}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dryingGainEnabled}
            aria-label={t('dryingGain')}
            onClick={toggle}
            disabled={saving}
            className={cn(
              'tap relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
              dryingGainEnabled ? 'bg-primary' : 'bg-border',
            )}
          >
            <span
              className={cn(
                'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform',
                dryingGainEnabled ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
