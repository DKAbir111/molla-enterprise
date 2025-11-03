'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate, formatOrderCode } from '@/lib/utils'
import { Plus, Search, Eye, Edit, Printer } from 'lucide-react'
import { listSells } from '@/lib/api/sell-api'
import { normalizeOrder } from '@/lib/api'
import CreateSellForm from '@/components/sells/CreateSellForm'
// Details shown in dedicated page now
import { EditSellModal } from '@/components/sells/EditSellModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSell as apiUpdateSell } from '@/lib/api/sell-api'
import { toast } from 'sonner'

export default function SellsPage() {
  const t = useTranslations('sells')
  const locale = useLocale()
  const { sells, addSell } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSell, setSelectedSell] = useState<any | null>(null)
  // const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
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
    const q = searchQuery.toLowerCase()
    const code = formatOrderCode(o.id, o.createdAt).toLowerCase()
    return o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || code.includes(q)
  })

  const stats = {
    total: sells.length,
    pending: sells.filter(s => s.status === 'pending').length,
    processing: sells.filter(s => s.status === 'processing').length,
    delivered: sells.filter(s => s.status === 'delivered').length,
    cancelled: sells.filter(s => s.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Button className="flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('newOrder')}
        </Button>
      </div>

      {/* Mini Dashboard */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Processing</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{stats.processing}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Delivered</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.delivered}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Cancelled</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.cancelled}</div></CardContent>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('emptyDescription')}</p>
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
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Paid / Due</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="font-medium">{formatOrderCode(o.id, o.createdAt)}</TableCell>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell>{formatDate(o.createdAt, locale)}</TableCell>
                      <TableCell className="text-right">
                        <div className="w-36 ml-auto">
                          <Select
                            value={o.status}
                            onValueChange={async (v) => {
                              const next = v as any
                              const prev = o.status
                              try {
                                updateSellStatus(o.id, next)
                                await apiUpdateSell(o.id, { status: next })
                                toast.success('Status updated')
                              } catch {
                                updateSellStatus(o.id, prev)
                                toast.error('Failed to update status')
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 px-2 py-1 text-xs">
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
                      <TableCell className="text-right">{formatCurrency(paid, locale)} / {formatCurrency(due, locale)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(grand, locale)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`/${locale}/sells/${o.id}`}>
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => { setSelectedSell(o); setShowEdit(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <a href={`/${locale}/sells/${o.id}`}>
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

      {modalOpen && (
        <CreateSellForm isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}

      {/* Details modal removed in favor of dedicated page */}

      {showEdit && selectedSell && (
        <EditSellModal isOpen={showEdit} onClose={() => setShowEdit(false)} sell={selectedSell} />
      )}
    </div>
  )
}
