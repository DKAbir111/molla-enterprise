'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrganization, getMyOrganization } from '@/lib/api'

export default function OrganizationPage() {
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form fields
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [logoFile, setLogoFile] = React.useState<File | null>(null)

  React.useEffect(() => {
    let mounted = true
    getMyOrganization<any>()
      .then((org) => {
        if (!mounted) return
        if (org && org.id) {
          router.replace(`/${locale}`)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
    return () => { mounted = false }
  }, [router, locale])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (!name.trim()) throw new Error('Business name is required')
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email')
      if (!phone.trim()) throw new Error('Phone is required')
      if (!address.trim()) throw new Error('Address is required')
      await createOrganization({ name, email, phone, address, logoFile })
      router.replace(`/${locale}`)
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600">Checking organization...</div>
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="gradient-border rounded-xl">
        <div className="glass rounded-xl p-8 shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text">Create your organization</h1>
            <p className="text-sm text-gray-600 mt-1">Provide business details to get started</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sand Business Company Ltd." required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@sandbusiness.com" required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1234567890" required />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Business Street, Dhaka, Bangladesh" required />
          </div>
          <div>
            <Label htmlFor="logo">Logo (optional)</Label>
            <Input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
