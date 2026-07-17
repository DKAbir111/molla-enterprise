'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import { login as apiLogin } from '@/lib/api'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  // Set by the 401 interceptor so an expired session explains itself here
  // rather than looking like a random logout.
  const sessionExpired = searchParams.get('session') === 'expired'
  const from = searchParams.get('from')

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(t('enterValidEmail'))
      if (!password) throw new Error(t('enterPassword'))
      const res = await apiLogin({ email, password })
      const hasOrg = !!res.user.organizationId
      toast.success(t('signedIn'))
      // Send them back where the expired session interrupted them.
      if (hasOrg && from && from.startsWith('/')) router.replace(from)
      else router.replace(`/${locale}${hasOrg ? '' : '/organization'}`)
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.message || t('loginFailed')
      const msg = Array.isArray(raw) ? raw[0] : raw
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      altAction={{ label: t('newHere'), href: `/${locale}/register`, cta: t('createAccount') }}
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {sessionExpired && !error && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-warning bg-warning-subtle px-3 py-2.5 text-sm text-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span>{t('sessionExpired')}</span>
          </div>
        )}

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

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">{t('password')}</Label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('signingIn')}
            </>
          ) : (
            t('signIn')
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
