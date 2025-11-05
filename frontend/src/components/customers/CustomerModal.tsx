'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { UserPlus, Edit3, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeCustomer } from '@/lib/api'
import { createCustomer as apiCreateCustomer, updateCustomer as apiUpdateCustomer, uploadCustomerAvatar } from '@/lib/api/customer-api'

type Mode = 'create' | 'edit'

interface CustomerModalProps {
  open: boolean
  mode: Mode
  onClose: () => void
  customer?: any | null
}

export function CustomerModal({ open, mode, onClose, customer }: CustomerModalProps) {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const addCustomer = useStore((s) => s.addCustomer)
  const updateCustomerStore = useStore((s) => s.updateCustomer)

  const isEdit = mode === 'edit' && !!customer

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // initialize/reset when opening or customer changes
  React.useEffect(() => {
    if (isEdit && customer) {
      setName(customer.name || '')
      setPhone(customer.phone || '')
      setEmail(customer.email || '')
      setAddress(customer.address || '')
      setAvatarPreview(customer.avatarUrl || null)
      setAvatarFile(null)
    } else if (!open) {
      // noop when closed
    } else {
      // create mode defaults
      setName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setAvatarPreview(null)
      setAvatarFile(null)
    }
  }, [open, isEdit, customer])

  const handleClose = () => {
    revokePreview(avatarPreview)
    setAvatarFile(null)
    onClose()
  }

  const revokePreview = React.useCallback((url?: string | null) => {
    try {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
    } catch { }
  }, [])

  const handlePickFile = React.useCallback((f: File | null | undefined) => {
    const prev = avatarPreview
    if (f) {
      const url = URL.createObjectURL(f)
      setAvatarFile(f)
      setAvatarPreview(url)
      revokePreview(prev)
    }
  }, [avatarPreview, revokePreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error('Please fill in required fields')
      return
    }
    setIsLoading(true)
    try {
      if (isEdit && customer) {
        // update
        const payload = {
          name,
          phone,
          email: email || undefined,
          address,
        }
        const updated = await apiUpdateCustomer<any>(customer.id, payload)
        let normalized = normalizeCustomer(updated)
        if (avatarFile) {
          try {
            const withAvatar = await uploadCustomerAvatar<any>(customer.id, avatarFile)
            normalized = normalizeCustomer(withAvatar)
          } catch { }
        }
        updateCustomerStore(customer.id, normalized)
        toast.success('Customer updated')
        handleClose()
      } else {
        // create
        const created = await apiCreateCustomer<any>({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim(),
        })
        let normalized = normalizeCustomer(created)
        if (avatarFile) {
          try {
            const withAvatar = await uploadCustomerAvatar<any>(normalized.id, avatarFile)
            normalized = normalizeCustomer(withAvatar)
          } catch { }
        }
        addCustomer(normalized)
        toast.success(t('added'))
        handleClose()
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error(isEdit ? 'Failed to update customer' : t('addFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent overlayClassName="bg-black/20 backdrop-blur-none" className="sm:max-w-2xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-linear-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {isEdit ? <Edit3 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {isEdit ? 'Edit Customer' : t('addCustomer')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-blue-100 text-base">
              {isEdit ? 'Update customer information' : t('addCustomerDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="gap-6 md:flex md:items-start">
              {/* Avatar */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => { e.preventDefault(); handlePickFile(e.dataTransfer.files?.[0]) }}
                    className="group relative h-40 w-[150px] rounded-xl border border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer"
                    aria-label="Upload customer photo"
                  >
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm text-gray-400">No photo</span>
                    )}
                    {/* subtle hover overlay without text */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                    {avatarPreview && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); revokePreview(avatarPreview); setAvatarPreview(null); setAvatarFile(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); revokePreview(avatarPreview); setAvatarPreview(null); setAvatarFile(null) } }}
                        className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/95 border border-gray-300 shadow hover:bg-red-50 cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4 text-gray-700" />
                      </span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    id="customer-avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Right side: first row name, second row address */}
              <div className="space-y-5 self-start min-w-0 md:flex-1">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">{t('fullName')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={t('enterName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">{t('address')}</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={t('enterAddress')} />
                </div>
              </div>
            </div>

            {/* Phone and Email (below image) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">{t('phone')}</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={t('enterPhone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">{t('emailOptional')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={t('enterEmail')} />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-11 border-gray-300 hover:bg-gray-50" disabled={isLoading}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" className="flex-1 h-11 bg-linear-to-r from-purple-600 to-blue-600 text-white" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('saving')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEdit ? 'Save Changes' : t('saveCustomer')}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
