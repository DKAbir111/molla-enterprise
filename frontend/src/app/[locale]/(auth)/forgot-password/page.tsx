'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import { forgotPassword } from '@/lib/api'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const locale = useLocale()
  const t = useTranslations('auth')
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const [devToken, setDevToken] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(t('enterValidEmail'))
      const res = await forgotPassword({ email })
      // Always report success — never reveal whether an account exists.
      setSent(true)
      toast.success(t('genericSent'))
      if (res?.token) setDevToken(res.token)
    } catch (err: any) {
      // A genuine validation error (bad email) is worth surfacing; a lookup
      // miss is not, so the API's own not-found still resolves to "sent".
      if (err?.message === t('enterValidEmail')) {
        setError(err.message)
      } else {
        setSent(true)
        toast.success(t('genericSent'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={sent ? t('checkEmail') : t('forgotTitle')}
      subtitle={sent ? undefined : t('forgotSubtitle')}
      altAction={{ label: t('rememberedIt'), href: `/${locale}/login`, cta: t('signIn') }}
    >
      {sent ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-success bg-success-subtle px-4 py-3">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div className="text-sm text-foreground">
              <p className="font-medium">{t('resetLinkSent')}</p>
              <p className="mt-1 text-muted-foreground">
                {t('resetLinkSentBody', { email })}
              </p>
            </div>
          </div>

          {devToken && (
            <p className="text-xs text-subtle-foreground">
              {t('devShortcut')}{' '}
              <Link
                className="text-primary underline underline-offset-4"
                href={`/${locale}/reset-password?token=${devToken}`}
              >
                {t('openResetPage')}
              </Link>
            </p>
          )}

          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('backToSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-danger bg-danger-subtle px-3 py-2.5 text-sm text-foreground"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('sending')}
              </>
            ) : (
              t('sendResetLink')
            )}
          </Button>

          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('backToSignIn')}
          </Link>
        </form>
      )}
    </AuthShell>
  )
}
