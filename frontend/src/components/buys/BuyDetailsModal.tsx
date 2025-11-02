'use client'

import React, { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { useLocale } from 'next-intl'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useReactToPrint } from 'react-to-print'

export function BuyDetailsModal({ isOpen, onClose, buy }: { isOpen: boolean; onClose: () => void; buy: any }) {
  const locale = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: ref, documentTitle: `Purchase_${buy.id}` })

  const itemsTotal = (buy.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
  const discount = Number(buy.discount || 0)
  const transport = Number(buy.transportTotal || 0)
  const grand = Math.max(0, itemsTotal + transport - discount)
  const paid = Number(buy.paidAmount || 0)
  const due = Math.max(0, grand - paid)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Purchase Details</DialogTitle>
        </DialogHeader>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Purchase ID</div>
            <div className="font-semibold">{buy.id}</div>
            <div className="text-sm text-gray-500">{formatDate(buy.createdAt, locale as any)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Vendor</div>
            <div className="font-semibold">{buy.vendorName || '-'}</div>
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
              {(buy.items || []).map((it: any) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.productName}</TableCell>
                  <TableCell className="text-center">{it.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(it.price || 0), locale as any)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(it.total || 0), locale as any)}</TableCell>
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
          <Button onClick={handlePrint}>Print</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

