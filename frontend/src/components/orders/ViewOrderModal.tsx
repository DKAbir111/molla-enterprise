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
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { X } from 'lucide-react'

interface ViewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function ViewOrderModal({ isOpen, onClose, order }: ViewOrderModalProps) {
  const t = useTranslations('orders')
  const locale = useLocale()

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden rounded-lg shadow-2xl">
        <DialogHeader className="p-6 flex justify-between items-center border-b border-gray-200 bg-gray-50">
          <div>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {t('viewOrder.title')} #{order.id}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('viewOrder.description')}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">{t('customer')}</h3>
              <p className="text-gray-800 font-medium text-lg">{order.customerName}</p>
              <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">{t('status')}</h3>
              <p className="text-gray-800 font-medium text-lg">{order.status}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-3 border-b pb-2">{t('orderItems')}</h3>
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('product')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('price')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatCurrency(item.price, locale)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.quantity * item.price, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end items-center pt-6 border-t border-gray-200 mt-8">
            <div className="text-right">
              <p className="text-base text-gray-600 font-medium">{t('total')}</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(order.total, locale)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
