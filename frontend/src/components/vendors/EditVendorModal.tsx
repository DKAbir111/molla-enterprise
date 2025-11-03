'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { updateVendor } from '@/lib/api/vendor-api'

export function EditVendorModal({ isOpen, onClose, vendor, onSaved }: { isOpen: boolean; onClose: () => void; vendor: any; onSaved?: (v: any) => void }) {
  const [name, setName] = React.useState(vendor?.name || '')
  const [phone, setPhone] = React.useState(vendor?.phone || '')
  const [email, setEmail] = React.useState(vendor?.email || '')
  const [address, setAddress] = React.useState(vendor?.address || '')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (vendor) {
      setName(vendor.name || '')
      setPhone(vendor.phone || '')
      setEmail(vendor.email || '')
      setAddress(vendor.address || '')
    }
  }, [vendor])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updated = await updateVendor(vendor.id, { name, phone, email: email || undefined, address: address || undefined })
      toast.success('Vendor updated')
      onSaved?.(updated)
      onClose()
    } catch {
      toast.error('Failed to update vendor')
    } finally { setLoading(false) }
  }

  if (!vendor) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Vendor</DialogTitle>
            <DialogDescription className="text-blue-100 text-base">Update vendor information</DialogDescription>
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
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

