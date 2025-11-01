'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const locale = useLocale()
  const search = useSearchParams()
  const [token, setToken] = React.useState(search.get('token') || '')
  const [newPassword, setNewPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await resetPassword({ token, newPassword })
      setMessage('Password updated. You can now log in.')
      setTimeout(() => router.replace(`/${locale}/login`), 800)
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="gradient-border rounded-xl">
        <div className="glass rounded-xl p-8 shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text">Reset password</h1>
            <p className="text-sm text-gray-600 mt-1">Enter your token and new password</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="token">Token</Label>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Reset Password'}
          </Button>
        </form>
        {message && <p className="text-sm mt-3">{message}</p>}
        </div>
      </div>
    </div>
  )
}
