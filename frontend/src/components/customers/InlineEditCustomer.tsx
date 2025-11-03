'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateCustomer } from '@/lib/api/customer-api'
import { toast } from 'sonner'

export function InlineEditCustomer({ customer, onClose, onSaved }: { customer: any; onClose: () => void; onSaved: (c:any)=>void }) {
  const [name, setName] = React.useState(customer?.name || '')
  const [phone, setPhone] = React.useState(customer?.phone || '')
  const [email, setEmail] = React.useState(customer?.email || '')
  const [address, setAddress] = React.useState(customer?.address || '')
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updated = await updateCustomer(customer.id, { name, phone, email: email || undefined, address })
      toast.success('Customer updated')
      onSaved(updated)
    } catch {
      toast.error('Failed to update customer')
    } finally { setLoading(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Customer</DialogTitle>
            <DialogDescription className="text-blue-100 text-base">Update customer information</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-8 py-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Email (optional)</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1 md:col-span-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
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

