'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import { forgotPassword } from '@/lib/api'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const locale = useLocale()
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
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email')
      const res = await forgotPassword({ email })
      // Always report success — never reveal whether an account exists.
      setSent(true)
      toast.success('If an account exists, a reset link has been sent.')
      if (res?.token) setDevToken(res.token)
    } catch (err: any) {
      // A genuine validation error (bad email) is worth surfacing; a lookup
      // miss is not, so the API's own not-found still resolves to "sent".
      if (err?.message === 'Enter a valid email') {
        setError(err.message)
      } else {
        setSent(true)
        toast.success('If an account exists, a reset link has been sent.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={sent ? 'Check your email' : 'Forgot password?'}
      subtitle={
        sent
          ? undefined
          : "Enter your email and we'll send you a link to reset your password."
      }
      altAction={{ label: 'Remembered it?', href: `/${locale}/login`, cta: 'Sign in' }}
    >
      {sent ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-success bg-success-subtle px-4 py-3">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div className="text-sm text-foreground">
              <p className="font-medium">Reset link sent</p>
              <p className="mt-1 text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>,
                a password reset link is on its way. Check your inbox and spam folder.
              </p>
            </div>
          </div>

          {devToken && (
            <p className="text-xs text-subtle-foreground">
              Dev shortcut:{' '}
              <Link
                className="text-primary underline underline-offset-4"
                href={`/${locale}/reset-password?token=${devToken}`}
              >
                open reset page
              </Link>
            </p>
          )}

          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>

          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  )
}
