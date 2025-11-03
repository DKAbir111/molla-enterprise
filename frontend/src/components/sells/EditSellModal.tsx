'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@/types'
import { updateSell, updateSellItems } from '@/lib/api/sell-api'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'

export function EditSellModal({ isOpen, onClose, sell }: { isOpen: boolean; onClose: () => void; sell: Order }) {
  const locale = useLocale()
  const updateSellStore = useStore((s) => s.updateSell)
  const [items, setItems] = useState(sell.items)
  const [discount, setDiscount] = useState<number>(sell.discount || 0)
  const [paidAmount, setPaidAmount] = useState<number>(sell.paidAmount || 0)
  const [transportPerTrip, setTransportPerTrip] = useState<number>(sell.transportPerTrip || 0)
  const [transportTrips, setTransportTrips] = useState<number>(sell.transportTrips || 0)
  const transportTotal = transportPerTrip * transportTrips
  useEffect(() => { setItems(sell.items) }, [sell])

  const setQty = (id: string, q: number) => setItems(prev => prev.map(i => i.productId === id ? { ...i, quantity: q, total: (i.price) * q } : i))
  const setPrice = (id: string, p: number) => setItems(prev => prev.map(i => i.productId === id ? { ...i, price: p, total: p * i.quantity } : i))
  const remove = (id: string) => setItems(prev => prev.filter(i => i.productId !== id))
  const subtotal = items.reduce((s, it) => s + it.total, 0)
  const grand = Math.max(0, subtotal + transportTotal - discount)

  const submit = async () => {
    try {
      await updateSell(sell.id, { discount, paidAmount, transportPerTrip, transportTrips })
      const payload = { items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })) }
      const updated = await updateSellItems<any>(sell.id, payload)
      updateSellStore(sell.id, { ...sell, items: items, discount, paidAmount, transportPerTrip, transportTrips, transportTotal, total: subtotal })
      toast.success('Sell updated')
      onClose()
    } catch {
      toast.error('Failed to update sell')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-linear-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Sell</DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1"><Label>Discount</Label><Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-1"><Label>Paid Amount</Label><Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-1"><Label>Transport (per trip × trips)</Label><div className="flex items-center gap-2"><Input type="number" value={transportPerTrip} onChange={(e) => setTransportPerTrip(parseFloat(e.target.value) || 0)} className="h-9 w-28 text-right" /><span>×</span><Input type="number" value={transportTrips} onChange={(e) => setTransportTrips(parseInt(e.target.value || '0', 10))} className="h-9 w-20 text-right" /><span className="ml-auto font-medium">= {formatCurrency(transportTotal, locale as any)}</span></div></div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Product</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow>
              </TableHeader>
              <TableBody>
                {items.map(it => (
                  <TableRow key={it.productId}>
                    <TableCell className="font-medium">{it.productName}</TableCell>
                    <TableCell className="text-center"><Input type="number" value={it.quantity} onChange={(e) => setQty(it.productId, parseInt(e.target.value || '0', 10))} className="h-9 w-20 text-center" /></TableCell>
                    <TableCell className="text-right"><Input type="number" value={it.price} onChange={(e) => setPrice(it.productId, parseFloat(e.target.value) || 0)} className="h-9 w-24 text-right ml-auto" /></TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(it.total, locale as any)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" className="text-red-600" onClick={() => remove(it.productId)}>Remove</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">Subtotal</div>
            <div className="text-lg font-semibold">{formatCurrency(subtotal, locale as any)}</div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

