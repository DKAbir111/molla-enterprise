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
import { formatCurrency, formatDate, formatOrderCode } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Download, X } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getMyOrganization } from '@/lib/api'

interface ViewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function ViewOrderModal({ isOpen, onClose, order }: ViewOrderModalProps) {
  const t = useTranslations('orders')
  const locale = useLocale()
  const [org, setOrg] = React.useState<any | null>(null)

  React.useEffect(() => {
    let mounted = true
    if (isOpen) {
      getMyOrganization<any>().then((o) => { if (mounted) setOrg(o) }).catch(() => setOrg(null))
    }
    return () => { mounted = false }
  }, [isOpen])

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white p-0 overflow-hidden rounded-lg shadow-2xl hide-default-close">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {t('viewOrder.title')} {formatOrderCode(order.id, order.createdAt)}
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                {t('viewOrder.description')}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="bg-white/15 hover:bg-white/25 text-white border-white/30" onClick={() => downloadInvoice(order)}>
                <Download className="h-4 w-4 mr-2" /> {t('downloadInvoice')}
              </Button>
              <Button variant="ghost" onClick={onClose} className="rounded-full w-8 h-8 p-0 text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          {org && (
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-xl font-semibold text-gray-900">{org.name}</p>
                <p className="text-sm text-gray-600">{org.address}</p>
                <p className="text-sm text-gray-600">{org.email} · {org.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t('date')}: {formatDate(order.createdAt, locale)}</p>
                <p className="text-sm text-gray-500">{t('orderId')}: {formatOrderCode(order.id, order.createdAt)}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">{t('customer')}</h3>
              <p className="text-gray-800 font-medium text-lg">{order.customerName}</p>
              <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">{t('status')}</h3>
              <p className="text-gray-800 font-medium text-lg">{t(`orderStatus.${order.status}` as any)}</p>
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

function currency(value: number, locale: string) {
  try { return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) } catch { return String(value) }
}

function downloadInvoice(order: Order) {
  const doc = new jsPDF('p', 'pt', 'a4')
  const margin = 40
  const width = doc.internal.pageSize.getWidth()
  const locale = 'en'

  const code = formatOrderCode(order.id, order.createdAt)
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''

  // Header
  doc.setFillColor(76, 29, 149) // purple-800
  doc.rect(0, 0, width, 80, 'F')
  doc.setTextColor('#ffffff')
  doc.setFontSize(18)
  doc.text('Invoice', margin, 50)
  doc.setFontSize(11)
  doc.text(`Order: ${code}`, width - margin - 180, 30)
  doc.text(`Date: ${dateStr}`, width - margin - 180, 50)

  // Org / Customer
  doc.setTextColor('#111111')
  doc.setFontSize(12)
  const yStart = 110
  const orgName = (order as any).organizationName || ''
  // Customer box
  doc.text('Bill To:', margin, yStart)
  doc.setFont(undefined, 'bold')
  doc.text(order.customerName || 'Customer', margin, yStart + 18)
  doc.setFont(undefined, 'normal')
  if (order.deliveryAddress) doc.text(String(order.deliveryAddress), margin, yStart + 36, { maxWidth: 260 })

  // Items table
  const body = order.items.map((it) => [it.productName, String(it.quantity), currency(it.price, locale), currency(it.total, locale)])
  autoTable(doc, {
    head: [['Product', 'Qty', 'Price', 'Total']],
    body,
    startY: yStart + 70,
    styles: { fontSize: 11 },
    headStyles: { fillColor: [76, 29, 149] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: margin, right: margin },
  })

  // Totals
  const endY = (doc as any).lastAutoTable.finalY + 20
  doc.setFontSize(12)
  doc.text('Grand Total:', width - margin - 160, endY)
  doc.setFont(undefined, 'bold')
  doc.text(currency(order.total, locale), width - margin, endY, { align: 'right' })

  doc.save(`Invoice_${code}.pdf`)
}
