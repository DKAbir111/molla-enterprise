'use client'

import React, { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { useLocale } from 'next-intl'
import { formatCurrency, formatDate, formatOrderCode } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'
import type { Order } from '@/types'

export function SellDetailsModal({ isOpen, onClose, sell }: { isOpen: boolean; onClose: () => void; sell: Order }) {
  const locale = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: ref, documentTitle: `Invoice_${formatOrderCode(sell.id, sell.createdAt)}` })

  const itemsTotal = (sell.items || []).reduce((s, it) => s + Number(it.total || 0), 0)
  const discount = Number(sell.discount || 0)
  const transport = Number(sell.transportTotal || 0)
  const grand = Math.max(0, itemsTotal + transport - discount)
  const paid = Number(sell.paidAmount || 0)
  const due = Math.max(0, grand - paid)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sell Details</DialogTitle>
        </DialogHeader>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Invoice</div>
            <div className="font-semibold">{formatOrderCode(sell.id, sell.createdAt)}</div>
            <div className="text-sm text-gray-500">{formatDate(sell.createdAt, locale as any)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Customer</div>
            <div className="font-semibold">{sell.customerName}</div>
            <div className="text-sm text-gray-500">{sell.deliveryAddress}</div>
          </div>
        </div>

        <div ref={ref} className="print:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sell.items.map((it, idx) => (
                <TableRow key={`${sell.id}-${idx}`}>
                  <TableCell className="font-medium">{it.productName}</TableCell>
                  <TableCell className="text-center">{it.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(it.price, locale as any)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(it.total, locale as any)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(itemsTotal, locale as any)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">Discount</TableCell>
                <TableCell className="text-right font-semibold">-{formatCurrency(discount, locale as any)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">Transport</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(transport, locale as any)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(grand, locale as any)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">Paid</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(paid, locale as any)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">Due</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(due, locale as any)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>Print Invoice</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

