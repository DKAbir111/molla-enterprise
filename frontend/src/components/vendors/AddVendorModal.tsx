'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { createVendor } from '@/lib/api/vendor-api'

export function AddVendorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations('customers')
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      toast.error('Please provide name and phone')
      return
    }
    setLoading(true)
    try {
      await createVendor({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, address: address.trim() || undefined })
      toast.success('Vendor added')
      onClose()
      setName(''); setPhone(''); setEmail(''); setAddress('')
    } catch {
      toast.error('Failed to add vendor')
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Vendor</DialogTitle>
            <DialogDescription className="text-blue-100 text-base">Create a new vendor</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-8 py-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Email (optional)</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1 md:col-span-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Vendor'}</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

