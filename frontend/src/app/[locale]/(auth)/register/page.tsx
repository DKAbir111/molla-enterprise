'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register as apiRegister } from '@/lib/api'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
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
      if (password !== confirmPassword) throw new Error('Passwords do not match')
      await apiRegister({ name, email, password })
      toast.success('Account created successfully')
      router.replace(`/${locale}/organization`)
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Registration failed'
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text">Create your account</h1>
            <p className="text-sm text-gray-600 mt-1">Start by entering your details</p>
          </div>
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
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
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
    </div>
  )
}
