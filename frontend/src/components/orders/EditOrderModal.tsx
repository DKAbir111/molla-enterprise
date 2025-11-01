'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Order } from '@/types'
import { X } from 'lucide-react'

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function EditOrderModal({ isOpen, onClose, order }: EditOrderModalProps) {
  const t = useTranslations('orders')
  const common_t = useTranslations('common')

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden rounded-lg shadow-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {t('editOrder.title')} #{order.id}
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                {t('editOrder.description')}
              </DialogDescription>
            </div>
            <Button variant="ghost" onClick={onClose} className="rounded-full w-8 h-8 p-0 text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-8">
          <p>Edit form will go here.</p>
        </div>
        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            {common_t('cancel')}
          </Button>
          <Button onClick={onClose}>{common_t('save')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
