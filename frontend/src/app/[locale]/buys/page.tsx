'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Eye, Edit, Printer } from 'lucide-react'
import { listBuys } from '@/lib/api/buy-api'
import { listProducts } from '@/lib/api/product-api'
import { normalizeProduct } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
// Details shown on dedicated page now
import { BuyModal } from '@/components/buys/BuyModal'

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
        <Card className="border-dashed"><CardContent className="py-16 text-center"><div className="mx-auto mb-4 h-14 w-14 rounded-full bg-linear-to-r from-teal-600 to-teal-500 text-white flex items-center justify-center text-2xl">+</div><h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3><p className="text-gray-600 mb-4">{t('emptyDescription')}</p><Button onClick={() => setOpen(true)}>{t('new')}</Button></CardContent></Card>
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

      {open && (
        <BuyModal open={open} mode="create" onClose={() => setOpen(false)} onSaved={(b) => {
          listBuys<any[]>().then(setBuys).catch(() => { })
        }} />
      )}
      {showEdit && selectedBuy && (
        <BuyModal open={showEdit} mode="edit" onClose={() => setShowEdit(false)} buy={selectedBuy} onSaved={(b) => {
          setBuys(prev => prev.map(x => x.id === b.id ? b : x))
        }} />
      )}
    </div>
  )
}

