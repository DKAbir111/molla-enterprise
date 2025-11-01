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
  DialogDescription
} from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { createCustomer as apiCreateCustomer } from '@/lib/api'
import { normalizeCustomer } from '@/lib/api'
import { toast } from 'sonner'
import { UserPlus, Save } from 'lucide-react'

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const addCustomer = useStore((state) => state.addCustomer)

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const reset = () => {
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error(t('validationRequired'))
      return
    }
    setIsLoading(true)
    try {
      const created = await apiCreateCustomer<any>({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, address: address.trim() })
      const normalized = normalizeCustomer(created)
      addCustomer(normalized)
      toast.success(t('added'))
      reset()
      onClose()
    } catch (err) {
      toast.error(t('addFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <UserPlus className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {t('addCustomer')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-blue-100 text-base">
              {t('addCustomerDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('enterName')} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('enterPhone')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailOptional')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('enterEmail')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('enterAddress')} required />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('saving')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {t('saveCustomer')}
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
