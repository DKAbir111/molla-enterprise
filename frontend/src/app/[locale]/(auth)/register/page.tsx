'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register as apiRegister } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!name.trim()) throw new Error('Name is required')
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email')
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')
      await apiRegister({ name, email, password })
      router.replace(`/${locale}/organization`)
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Create Account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-between items-center">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Register'}
            </Button>
            <div className="text-sm">
              <a href={`/${locale}/login`} className="text-blue-600 hover:underline">Already have an account?</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
