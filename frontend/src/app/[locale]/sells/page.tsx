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
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate, formatOrderCode } from '@/lib/utils'
import { Plus, Search, Eye, Edit, Printer, HandCoins } from 'lucide-react'
import { ReceivePaymentDialog } from '@/components/payments/ReceivePaymentDialog'
import { listSells } from '@/lib/api/sell-api'
import { normalizeOrder } from '@/lib/api'
import { SellModal } from '@/components/sells/SellModal'
// Details shown in dedicated page now
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSell as apiUpdateSell } from '@/lib/api/sell-api'
import { toast } from 'sonner'

export default function SellsPage() {
  const t = useTranslations('sells')
  const tPay = useTranslations('payments')
  const locale = useLocale()
  const { sells, addSell } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [range, setRange] = useState<DateRange>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSell, setSelectedSell] = useState<any | null>(null)
  // const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [payTarget, setPayTarget] = useState<any | null>(null)
  const updateSellStatus = useStore((s) => s.updateSellStatus)

  useEffect(() => {
    let mounted = true
    if (sells.length === 0) {
      listSells<any[]>()
        .then((res) => { if (!mounted) return; (res || []).map(normalizeOrder).forEach(addSell) })
        .catch(() => { })
    }
    return () => { mounted = false }
  }, [sells.length, addSell])

  const filtered = sells.filter((o) => {
    if (!isWithinRange(o.createdAt, range)) return false
    const q = searchQuery.toLowerCase()
    const code = formatOrderCode(o.id, o.createdAt).toLowerCase()
    return o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || code.includes(q)
  })

  // Counted from the date-filtered set, not the whole table — picking "Today"
  // has to answer "how much did I sell today", which it cannot do if the tiles
  // keep reporting all-time figures.
  const inRange = useMemo(() => sells.filter((o) => isWithinRange(o.createdAt, range)), [sells, range])

  const stats = useMemo(() => ({
    total: inRange.length,
    pending: inRange.filter(s => s.status === 'pending').length,
    processing: inRange.filter(s => s.status === 'processing').length,
    delivered: inRange.filter(s => s.status === 'delivered').length,
    cancelled: inRange.filter(s => s.status === 'cancelled').length,
  }), [inRange])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-[12rem] flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle-foreground" />
          <Input type="search" placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 pl-10 md:h-10" />
        </div>
        <DateFilter value={range} onChange={(v) => setRange({ start: v.start, end: v.end })} />

        {/* Mobile uses the floating action button below instead. */}
        <Button className="hidden shrink-0 items-center gap-2 md:ml-auto md:flex" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('newOrder')}
        </Button>
      </div>

      {/* Mini Dashboard */}
      <StatRail className="md:grid-cols-5">
        <StatTile label={t('statTotal')} value={stats.total} />
        <StatTile label={t('orderStatus.pending')} value={stats.pending} tone="text-warning" />
        <StatTile label={t('orderStatus.processing')} value={stats.processing} tone="text-info" />
        <StatTile label={t('orderStatus.delivered')} value={stats.delivered} tone="text-success" />
        <StatTile label={t('orderStatus.cancelled')} value={stats.cancelled} tone="text-danger" />
      </StatRail>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground mb-4">{t('emptyDescription')}</p>
            <Button onClick={() => setModalOpen(true)}>{t('newOrder')}</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderId')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead className="text-right">{t('status')}</TableHead>
                  <TableHead className="text-right">{t('paidDue')}</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o, idx) => {
                  const itemsTotal = (o.items || []).reduce((s, it) => s + Number(it.total || 0), 0)
                  const discount = Number(o.discount || 0)
                  const transport = Number(o.transportTotal || 0)
                  const grand = Math.max(0, itemsTotal + transport - discount)
                  const paid = Number(o.paidAmount || 0)
                  const due = Math.max(0, grand - paid)
                  return (
                    <TableRow key={`${o.id}-${idx}`}>
                      <TableCell className="font-medium" data-primary="">{formatOrderCode(o.id, o.createdAt)}</TableCell>
                      <TableCell data-label={t('customer')}>{o.customerName}</TableCell>
                      <TableCell data-label={t('date')}>{formatDate(o.createdAt, locale)}</TableCell>
                      <TableCell className="md:text-right" data-label={t('status')}>
                        <div className="w-36 ml-auto">
                          <Select
                            value={o.status}
                            onValueChange={async (v) => {
                              const next = v as any
                              const prev = o.status
                              try {
                                updateSellStatus(o.id, next)
                                await apiUpdateSell(o.id, { status: next })
                                toast.success(t('statusUpdated'))
                              } catch {
                                updateSellStatus(o.id, prev)
                                toast.error(t('statusUpdateFailed'))
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 px-2 py-1 text-xs md:h-8">
                              <SelectValue placeholder={t('orderStatus.pending')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{t('orderStatus.pending')}</SelectItem>
                              <SelectItem value="processing">{t('orderStatus.processing')}</SelectItem>
                              <SelectItem value="delivered">{t('orderStatus.delivered')}</SelectItem>
                              <SelectItem value="cancelled">{t('orderStatus.cancelled')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="md:text-right" data-label={t('paidDue')}>{formatCurrency(paid, locale)} / {formatCurrency(due, locale)}</TableCell>
                      <TableCell className="font-medium md:text-right" data-label={t('total')}>{formatCurrency(grand, locale)}</TableCell>
                      <TableCell className="md:text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`/${locale}/sells/${o.id}`}>
                            <Button variant="ghost" size="icon" className="tap" title={t('view')} aria-label={t('view')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="icon" className="tap" title={t('edit')} aria-label={t('edit')} onClick={() => { setSelectedSell(o); setShowEdit(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {due > 0 && o.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="tap text-success hover:text-success"
                              title={tPay('receivePayment')}
                              aria-label={tPay('receivePayment')}
                              onClick={() => setPayTarget({ ...o, due })}
                            >
                              <HandCoins className="h-4 w-4" />
                            </Button>
                          )}
                          <a href={`/${locale}/sells/${o.id}`}>
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

      {modalOpen && (
        <SellModal open={modalOpen} mode="create" onClose={() => setModalOpen(false)} />
      )}

      <Fab onClick={() => setModalOpen(true)} label={t('newOrder')} />

      {payTarget && (
        <ReceivePaymentDialog
          open
          onClose={() => setPayTarget(null)}
          customerId={payTarget.customerId}
          customerName={payTarget.customerName}
          outstanding={payTarget.due}
          sellId={payTarget.id}
          locale={locale as string}
          onRecorded={() => {
            // paidAmount is derived server-side now, so refetch rather than
            // guessing the new figure locally.
            listSells<any[]>()
              .then((res) => { (res || []).map(normalizeOrder).forEach(addSell) })
              .catch(() => { })
          }}
        />
      )}

      {/* Details modal removed in favor of dedicated page */}

      {showEdit && selectedSell && (
        <SellModal open={showEdit} mode="edit" onClose={() => setShowEdit(false)} sell={selectedSell} />
      )}
    </div>
  )
}
