'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Eye, Edit, Printer } from 'lucide-react'
import { listBuys, createBuy } from '@/lib/api/buy-api'
import { listProducts } from '@/lib/api/product-api'
import { normalizeProduct } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
// Details shown on dedicated page now
import { EditBuyModal } from '@/components/buys/EditBuyModal'

export default function BuysPage() {
  const t = useTranslations('buys')
  const locale = useLocale()
  const [buys, setBuys] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const { products, addProduct } = useStore()
  const [selectedBuy, setSelectedBuy] = useState<any | null>(null)
  // const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    let mounted = true
    listBuys<any[]>().then(res => { if (mounted) setBuys(res || []) }).catch(() => { })
    if (products.length === 0) listProducts<any[]>().then(res => { (res || []).map(normalizeProduct).forEach(addProduct) }).catch(() => { })
    return () => { mounted = false }
  }, [products.length, addProduct])

  const filtered = buys.filter(b => search === '' || String(b.vendorName || '').toLowerCase().includes(search.toLowerCase()))

  // Mini dashboard stats
  const stats = useMemo(() => {
    const total = buys.length
    let spent = 0, paid = 0, due = 0
    buys.forEach((b: any) => {
      const itemsTotal = (b.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
      const discount = Number(b.discount || 0)
      const transport = Number(b.transportTotal || 0)
      const grand = Math.max(0, itemsTotal + transport - discount)
      spent += grand
      paid += Number(b.paidAmount || 0)
      due += Math.max(0, grand - Number(b.paidAmount || 0))
    })
    return { total, spent, paid, due }
  }, [buys])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button className="flex items-center gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t('new')}
        </Button>
      </div>

      {/* Mini Dashboard like Sells */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Purchases</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.spent, locale)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Paid</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid, locale)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Due</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.due, locale)}</div></CardContent></Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><div className="mx-auto mb-4 h-14 w-14 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div><h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3><p className="text-gray-600 mb-4">{t('emptyDescription')}</p><Button onClick={() => setOpen(true)}>{t('new')}</Button></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('vendor')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead className="text-right">Paid / Due</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b, idx) => {
                  const itemsTotal = (b.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
                  const discount = Number(b.discount || 0)
                  const transport = Number(b.transportTotal || 0)
                  const grand = Math.max(0, itemsTotal + transport - discount)
                  const paid = Number(b.paidAmount || 0)
                  const due = Math.max(0, grand - paid)
                  return (
                    <TableRow key={`${b.id}-${idx}`}>
                      <TableCell className="font-medium">{b.vendorName || '-'}</TableCell>
                      <TableCell>{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(paid, locale)} / {formatCurrency(due, locale)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(grand, locale)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`/${locale}/buys/${b.id}`}>
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => { setSelectedBuy(b); setShowEdit(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <a href={`/${locale}/buys/${b.id}`}>
                            <Button variant="ghost" size="sm" title="Print">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {open && <CreateBuyModal isOpen={open} onClose={() => setOpen(false)} />}
      {showEdit && selectedBuy && (
        <EditBuyModal isOpen={showEdit} onClose={() => setShowEdit(false)} buy={selectedBuy} onUpdated={(b) => {
          setBuys(prev => prev.map(x => x.id === b.id ? b : x))
        }} />
      )}
    </div>
  )
}

function CreateBuyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { products } = useStore()
  const locale = useLocale()
  const [vendorName, setVendorName] = useState('')
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; price: number; total: number }[]>([])
  const [search, setSearch] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [transportPerTrip, setTransportPerTrip] = useState(0)
  const [transportTrips, setTransportTrips] = useState(0)
  const transportTotal = transportPerTrip * transportTrips
  const subtotal = items.reduce((s, it) => s + it.total, 0)
  const grand = Math.max(0, subtotal + transportTotal - discount)

  const available = products.filter(p => (search === '' || p.name.toLowerCase().includes(search.toLowerCase())) && !items.some(i => i.productId === p.id))
  const add = (p: any) => setItems(prev => [...prev, { productId: p.id, productName: p.name, quantity: 1, price: p.buyPrice || 0, total: p.buyPrice || 0 }])
  const setQty = (id: string, q: number) => setItems(prev => prev.map(i => i.productId === id ? { ...i, quantity: q, total: q * i.price } : i))
  const setPrice = (id: string, pr: number) => setItems(prev => prev.map(i => i.productId === id ? { ...i, price: pr, total: pr * i.quantity } : i))
  const remove = (id: string) => setItems(prev => prev.filter(i => i.productId !== id))

  const submit = async () => {
    try {
      if (items.length === 0) { toast.error('Add items'); return }
      const payload = { vendorName, items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })), discount, paidAmount, transportPerTrip, transportTrips }
      await createBuy(payload)
      toast.success('Buy recorded')
      onClose()
    } catch {
      toast.error('Failed to create buy')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-linear-to-r from-purple-600 to-blue-600 px-8 py-6 text-white"><DialogHeader><DialogTitle className="text-2xl font-bold">New Buy</DialogTitle><DialogDescription>Record a purchase</DialogDescription></DialogHeader></div>
        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label>Vendor (optional)</Label><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Search Product</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto border p-3 rounded">
            {available.map(p => (
              <button key={p.id} className="text-left p-2 rounded hover:bg-purple-50" onClick={() => add(p)}>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">Buy: {formatCurrency(p.buyPrice || 0, locale)} / {p.unit}</div>
              </button>
            ))}
            {available.length === 0 && <div className="text-sm text-gray-500">No products</div>}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow></TableHeader><TableBody>{items.map(it => (<TableRow key={it.productId}><TableCell className="font-medium">{it.productName}</TableCell><TableCell className="text-center"><Input type="number" value={it.quantity} onChange={(e) => setQty(it.productId, parseInt(e.target.value || '0', 10))} className="h-9 w-20 text-center" /></TableCell><TableCell className="text-right"><Input type="number" value={it.price} onChange={(e) => setPrice(it.productId, parseFloat(e.target.value || '0'))} className="h-9 w-24 text-right ml-auto" /></TableCell><TableCell className="text-right font-semibold">{formatCurrency(it.total, locale)}</TableCell><TableCell className="text-right"><Button variant="ghost" onClick={() => remove(it.productId)} className="text-red-600">Remove</Button></TableCell></TableRow>))}</TableBody></Table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label>Discount</Label><Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Transport (per trip × trips)</Label><div className="flex items-center gap-2"><Input type="number" value={transportPerTrip} onChange={(e) => setTransportPerTrip(parseFloat(e.target.value) || 0)} className="h-9 w-32 text-right" /><span>×</span><Input type="number" value={transportTrips} onChange={(e) => setTransportTrips(parseInt(e.target.value || '0', 10))} className="h-9 w-24 text-right" /><span className="ml-auto font-medium">= {formatCurrency(transportTotal, useLocale() as any)}</span></div></div>
          </div>
          <div className="p-4 rounded border"><div className="flex justify-between"><span className="font-semibold">Grand Total</span><span className="text-xl font-bold">{formatCurrency(grand, locale)}</span></div><div className="flex justify-between items-center gap-3 mt-2"><span className="text-sm text-gray-600">Paid</span><Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="h-10 w-32 text-right" /><span className="ml-auto font-semibold text-green-700">Due: {formatCurrency(Math.max(0, grand - paidAmount), locale)}</span></div></div>
          <div className="flex gap-3 pt-4"><Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button><Button onClick={submit} className="flex-1 bg-linear-to-r from-purple-600 to-purple-700 text-white">Save Buy</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
