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
        <DialogHeader className="p-6 flex justify-between items-center border-b border-gray-200 bg-gray-50">
          <div>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {t('editOrder.title')} #{order.id}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('editOrder.description')}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </DialogHeader>
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
