'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { register as apiRegister } from '@/lib/api'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth')
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!name.trim()) throw new Error(t('nameRequired'))
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(t('enterValidEmail'))
      // 8 is the floor; the meter nudges toward better.
      if (!password || password.length < 8) throw new Error(t('passwordMin'))
      if (password !== confirmPassword) throw new Error(t('passwordsNoMatch'))
      await apiRegister({ name, email, password })
      toast.success(t('accountCreated'))
      router.replace(`/${locale}/organization`)
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.message || t('registrationFailed')
      const msg = Array.isArray(raw) ? raw[0] : raw
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
      altAction={{ label: t('haveAccount'), href: `/${locale}/login`, cta: t('signIn') }}
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
          <Label htmlFor="name">{t('fullName')}</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t('workEmail')}</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <PasswordStrength password={password} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
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

        {/* Only disabled while submitting. A submit disabled on an empty form
            just looks broken — onSubmit validates and says what is wrong. */}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('creatingAccount')}
            </>
          ) : (
            t('createAccount')
          )}
        </Button>

        {/* Consent, as any sellable SaaS needs. */}
        <p className="text-center text-xs leading-relaxed text-subtle-foreground">
          {t('consentPre')}{' '}
          <Link href={`/${locale}/terms`} className="text-primary underline-offset-4 hover:underline">
            {t('termsOfService')}
          </Link>{' '}
          {t('and')}{' '}
          <Link href={`/${locale}/privacy`} className="text-primary underline-offset-4 hover:underline">
            {t('privacyPolicy')}
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  )
}
