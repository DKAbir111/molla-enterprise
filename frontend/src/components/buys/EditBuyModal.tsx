'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/utils'
import { updateBuy, updateBuyItems } from '@/lib/api/buy-api'
import { toast } from 'sonner'

export function EditBuyModal({ isOpen, onClose, buy, onUpdated }: { isOpen: boolean; onClose: () => void; buy: any; onUpdated?: (b: any)=>void }) {
  const locale = useLocale()
  const [items, setItems] = useState(buy.items || [])
  const [discount, setDiscount] = useState<number>(buy.discount || 0)
  const [paidAmount, setPaidAmount] = useState<number>(buy.paidAmount || 0)
  const [transportPerTrip, setTransportPerTrip] = useState<number>(buy.transportPerTrip || 0)
  const [transportTrips, setTransportTrips] = useState<number>(buy.transportTrips || 0)
  const [vendorName, setVendorName] = useState<string>(buy.vendorName || '')
  const transportTotal = transportPerTrip * transportTrips
  useEffect(() => { setItems(buy.items || []) }, [buy])

  const setQty = (id: string, q: number) => setItems((prev:any[]) => prev.map(i => i.productId === id ? { ...i, quantity: q, total: (i.price) * q } : i))
  const setPrice = (id: string, p: number) => setItems((prev:any[]) => prev.map(i => i.productId === id ? { ...i, price: p, total: p * i.quantity } : i))
  const remove = (id: string) => setItems((prev:any[]) => prev.filter(i => i.productId !== id))
  const subtotal = items.reduce((s: number, it: any) => s + Number(it.total || 0), 0)
  const grand = Math.max(0, subtotal + transportTotal - discount)

  const submit = async () => {
    try {
      await updateBuy(buy.id, { vendorName, discount, paidAmount, transportPerTrip, transportTrips })
      const payload = { items: items.map((i:any) => ({ productId: i.productId, quantity: i.quantity, price: i.price })) }
      const updated = await updateBuyItems<any>(buy.id, payload)
      toast.success('Purchase updated')
      onUpdated?.(updated)
      onClose()
    } catch {
      toast.error('Failed to update purchase')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Purchase</DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1"><Label>Vendor</Label><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Discount</Label><Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-1"><Label>Paid Amount</Label><Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="space-y-1"><Label>Transport (per trip × trips)</Label><div className="flex items-center gap-2"><Input type="number" value={transportPerTrip} onChange={(e) => setTransportPerTrip(parseFloat(e.target.value) || 0)} className="h-9 w-28 text-right" /><span>×</span><Input type="number" value={transportTrips} onChange={(e) => setTransportTrips(parseInt(e.target.value || '0', 10))} className="h-9 w-20 text-right" /><span className="ml-auto font-medium">= {formatCurrency(transportTotal, locale as any)}</span></div></div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Product</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it:any) => (
                  <TableRow key={it.productId}>
                    <TableCell className="font-medium">{it.productName}</TableCell>
                    <TableCell className="text-center"><Input type="number" value={it.quantity} onChange={(e) => setQty(it.productId, parseInt(e.target.value || '0', 10))} className="h-9 w-20 text-center" /></TableCell>
                    <TableCell className="text-right"><Input type="number" value={it.price} onChange={(e) => setPrice(it.productId, parseFloat(e.target.value) || 0)} className="h-9 w-24 text-right ml-auto" /></TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(it.total || 0), locale as any)}</TableCell>
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

