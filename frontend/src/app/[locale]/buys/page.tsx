'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { Fab } from '@/components/shared/Fab'
import { DateFilter } from '@/components/shared/DateFilter'
import { isWithinRange, type DateRange } from '@/lib/date-range'
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
  const [range, setRange] = useState<DateRange>({})
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

  const inRange = useMemo(
    () => buys.filter((b: any) => isWithinRange(b.createdAt, range)),
    [buys, range],
  )

  const filtered = inRange.filter(b => search === '' || String(b.vendorName || '').toLowerCase().includes(search.toLowerCase()))

  // Totals follow the selected range, so "Today" answers what was bought today
  // rather than repeating the all-time figure.
  const stats = useMemo(() => {
    const total = inRange.length
    let spent = 0, paid = 0, due = 0
    inRange.forEach((b: any) => {
      const itemsTotal = (b.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
      const discount = Number(b.discount || 0)
      const transport = Number(b.transportTotal || 0)
      const grand = Math.max(0, itemsTotal + transport - discount)
      spent += grand
      paid += Number(b.paidAmount || 0)
      due += Math.max(0, grand - Number(b.paidAmount || 0))
    })
    return { total, spent, paid, due }
  }, [inRange])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-[12rem] flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle-foreground" />
          <Input type="search" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 pl-10 md:h-10" />
        </div>
        <DateFilter value={range} onChange={(v) => setRange({ start: v.start, end: v.end })} />

        {/* Mobile uses the floating action button below instead. */}
        <Button className="hidden shrink-0 items-center gap-2 md:ml-auto md:flex" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t('new')}
        </Button>
      </div>

      {/* Mini Dashboard like Sells */}
      <StatRail>
        <StatTile label={t('totalPurchases')} value={stats.total} />
        <StatTile label={t('totalSpent')} value={formatCurrency(stats.spent, locale)} tone="text-info" />
        <StatTile label={t('totalPaid')} value={formatCurrency(stats.paid, locale)} tone="text-success" />
        <StatTile label={t('totalDue')} value={formatCurrency(stats.due, locale)} tone="text-warning" />
      </StatRail>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><div className="mx-auto mb-4 h-14 w-14 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-2xl">+</div><h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3><p className="text-muted-foreground mb-4">{t('emptyDescription')}</p><Button onClick={() => setOpen(true)}>{t('new')}</Button></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('vendor')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead className="text-right">{t('paidDue')}</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
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
                      <TableCell className="font-medium" data-primary="">{b.vendorName || '-'}</TableCell>
                      <TableCell data-label={t('date')}>{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="md:text-right" data-label={t('paidDue')}>{formatCurrency(paid, locale)} / {formatCurrency(due, locale)}</TableCell>
                      <TableCell className="font-medium md:text-right" data-label={t('total')}>{formatCurrency(grand, locale)}</TableCell>
                      <TableCell className="md:text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`/${locale}/buys/${b.id}`}>
                            <Button variant="ghost" size="icon" className="tap" title={t('view')} aria-label={t('view')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="icon" className="tap" title={t('edit')} aria-label={t('edit')} onClick={() => { setSelectedBuy(b); setShowEdit(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <a href={`/${locale}/buys/${b.id}`}>
                            <Button variant="ghost" size="icon" className="tap" title={t('print')} aria-label={t('print')}>
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

      <Fab onClick={() => setOpen(true)} label={t('new')} />

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

