'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { normalizeCustomer } from '@/lib/api'
import { createCustomer as apiCreateCustomer, updateCustomer as apiUpdateCustomer, uploadCustomerAvatar } from '@/lib/api/customer-api'
import { toast } from 'sonner'
import { UserPlus, Edit3, Save } from 'lucide-react'

type Mode = 'create' | 'edit'

export function CustomerModal({ open, mode, onClose, customer }: { open: boolean; mode: Mode; onClose: () => void; customer?: any | null }) {
  const t = useTranslations('customers')
  const addCustomer = useStore((s) => s.addCustomer)
  const updateCustomerStore = useStore((s) => s.updateCustomer)

  const isEdit = mode === 'edit' && !!customer

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const revoke = React.useCallback((url?: string | null) => {
    try { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url) } catch {}
  }, [])

  React.useEffect(() => {
    if (!open) return
    if (isEdit && customer) {
      setName(customer.name || '')
      setPhone(customer.phone || '')
      setEmail(customer.email || '')
      setAddress(customer.address || '')
      setAvatarFile(null)
      setAvatarPreview(null) // backend has no avatar field; preview is local only
    } else {
      setName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [open, isEdit, customer])

  const onPick = (file: File | null | undefined) => {
    if (!file) return
    const prev = avatarPreview
    const url = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreview(url)
    revoke(prev)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error(t('validationRequired'))
      return
    }
    setLoading(true)
    try {
      if (isEdit && customer) {
        const updated = await apiUpdateCustomer<any>(customer.id, { name, phone, email: email || undefined, address })
        let normalized = normalizeCustomer(updated)
        if (avatarFile) {
          try {
            const withAvatar = await uploadCustomerAvatar<any>(customer.id, avatarFile)
            normalized = normalizeCustomer(withAvatar)
          } catch {}
        }
        updateCustomerStore(customer.id, normalized)
        toast.success('Customer updated')
      } else {
        const created = await apiCreateCustomer<any>({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, address: address.trim() })
        let normalized = normalizeCustomer(created)
        if (avatarFile) {
          try {
            const withAvatar = await uploadCustomerAvatar<any>(normalized.id, avatarFile)
            normalized = normalizeCustomer(withAvatar)
          } catch {}
        }
        addCustomer(normalized)
        toast.success(t('added'))
      }
      onClose()
    } catch {
      toast.error(isEdit ? 'Failed to update customer' : t('addFailed'))
    } finally {
      setLoading(false)
    }
  }

  const TitleIcon = isEdit ? Edit3 : UserPlus

  return (
    <Dialog open={open} onOpenChange={() => { revoke(avatarPreview); onClose() }}>
      <DialogContent overlayClassName="bg-black/20 backdrop-blur-none" className="sm:max-w-2xl p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TitleIcon className="h-5 w-5" />
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
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-6 md:grid-cols-[120px,1fr]">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Photo</Label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0]) }}
                  className="group relative h-[120px] w-[120px] rounded-full border border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer"
                  aria-label="Upload avatar"
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">No photo</span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                </button>
                {avatarPreview && (
                  <button type="button" onClick={() => { revoke(avatarPreview); setAvatarPreview(null); setAvatarFile(null) }} className="text-xs text-red-600 hover:underline">
                    Remove photo
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0] || null)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>{t('fullName')}</Label><Input className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('enterName')} /></div>
                <div className="space-y-1"><Label>{t('phone')}</Label><Input className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder={t('enterPhone')} /></div>
                <div className="space-y-1"><Label>{t('emailOptional')}</Label><Input className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('enterEmail')} /></div>
                <div className="space-y-1 md:col-span-2"><Label>{t('address')}</Label><Input className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder={t('enterAddress')} /></div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading} className="flex-1 h-11 border-gray-300 hover:bg-gray-50">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1 h-11 bg-linear-to-r from-purple-600 to-blue-600 text-white">
                {loading ? (
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
