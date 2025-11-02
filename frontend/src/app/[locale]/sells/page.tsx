'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate, formatOrderCode } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import { listSells } from '@/lib/api/sell-api'
import { normalizeOrder } from '@/lib/api'
import CreateSellForm from '@/components/sells/CreateSellForm'

export default function SellsPage() {
  const t = useTranslations('sells')
  const locale = useLocale()
  const { sells, addSell } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    if (sells.length === 0) {
      listSells<any[]>()
        .then((res) => { if (!mounted) return; (res || []).map(normalizeOrder).forEach(addSell) })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [sells.length, addSell])

  const filtered = sells.filter((o) => {
    const q = searchQuery.toLowerCase()
    const code = formatOrderCode(o.id, o.createdAt).toLowerCase()
    return o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || code.includes(q)
  })

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

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div>
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
                  <TableHead className="text-right">{t('total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o, idx) => (
                  <TableRow key={`${o.id}-${idx}`}>
                    <TableCell className="font-medium">{formatOrderCode(o.id, o.createdAt)}</TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell>{formatDate(o.createdAt, locale)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(o.total, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {modalOpen && (
        <CreateSellForm isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
