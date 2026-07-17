'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { resetPassword } from '@/lib/api'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth')
  const search = useSearchParams()
  const token = search.get('token') || ''

  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!token) throw new Error(t('linkExpired'))
      if (!newPassword || newPassword.length < 8) throw new Error(t('passwordMin'))
      if (newPassword !== confirmPassword) throw new Error(t('passwordsNoMatch'))
      await resetPassword({ token, newPassword })
      toast.success(t('passwordUpdated'))
      setTimeout(() => router.replace(`/${locale}/login`), 800)
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.message || t('resetFailed')
      const msg = Array.isArray(raw) ? raw[0] : raw
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // No token at all: don't show a form that cannot succeed.
  if (!token) {
    return (
      <AuthShell
        title={t('invalidLinkTitle')}
        subtitle={t('invalidLinkSubtitle')}
        altAction={{ label: t('rememberedIt'), href: `/${locale}/login`, cta: t('signIn') }}
      >
        <div className="space-y-6">
          <div className="flex items-start gap-2 rounded-lg border border-danger bg-danger-subtle px-3 py-2.5 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
            <span>{t('invalidLinkBody')}</span>
          </div>
          <Link href={`/${locale}/forgot-password`}>
            <Button size="lg" className="w-full">{t('requestNewLink')}</Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('resetTitle')}
      subtitle={t('resetSubtitle')}
      altAction={{ label: t('rememberedIt'), href: `/${locale}/login`, cta: t('signIn') }}
    >
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
          <Label htmlFor="newPassword">{t('newPassword')}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-describedby="password-strength"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-subtle-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div id="password-strength">
            <PasswordStrength password={newPassword} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={mismatch}
            required
          />
          {mismatch && (
            <p className="text-xs text-danger" role="alert">{t('passwordsNoMatch')}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('updating')}
            </>
          ) : (
            t('updatePassword')
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
    </AuthShell>
  )
}
