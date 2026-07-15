'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login as apiLogin } from '@/lib/api'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  // Set by the 401 interceptor so an expired session explains itself here
  // rather than looking like a random logout.
  const sessionExpired = searchParams.get('session') === 'expired'
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email')
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')
      const res = await apiLogin({ email, password })
      const hasOrg = !!res.user.organizationId
      toast.success('Signed in successfully')
      router.replace(`/${locale}${hasOrg ? '' : '/organization'}`)
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Login failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="gradient-border rounded-xl">
        <div className="glass rounded-xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/conix.png" alt="Conix Logo" className="h-16 w-auto" />
          </div>
          {sessionExpired && (
            <div
              role="status"
              className="mb-6 rounded-lg border border-warning bg-warning-subtle px-4 py-3 text-sm text-foreground"
            >
              Your session expired. Please sign in again.
            </div>
          )}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold gradient-text">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="flex justify-between items-center">
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
            <div className="text-sm">
              <a href={`/${locale}/forgot-password`} className="text-primary hover:underline">Forgot password?</a>
            </div>
          </div>
          <div className="text-sm mt-4 text-muted-foreground">
            New here? <a href={`/${locale}/register`} className="text-primary hover:underline">Create account</a>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
