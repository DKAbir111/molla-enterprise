'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/lib/api'

export default function ForgotPasswordPage() {
  const locale = useLocale()
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [devToken, setDevToken] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setDevToken(null)
    try {
      const res = await forgotPassword({ email })
      setMessage('If an account exists, a reset link has been sent.')
      if (res.token) setDevToken(res.token)
    } catch {
      setMessage('If an account exists, a reset link has been sent.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
        {message && <p className="text-sm mt-3">{message}</p>}
        {devToken && (
          <p className="text-xs mt-2">
            Dev token: <a className="text-blue-600 underline" href={`/${locale}/reset-password?token=${devToken}`}>open reset</a>
          </p>
        )}
      </div>
    </div>
  )
}

