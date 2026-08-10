'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { Fab } from '@/components/shared/Fab'
import { listBuys } from '@/lib/api/buy-api'
import { listVendors, deleteVendor } from '@/lib/api/vendor-api'
import { VendorModal } from '@/components/vendors/VendorModal'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Eye, Edit, Trash2, Phone, MapPin, Plus } from 'lucide-react'
// Dialog removed; dedicated details route used

type VendorRow = {
  address: string; name: string; phone?: string; purchases: number; totalSpent: number; totalDue: number; since?: Date; lastPurchase?: Date; buys: any[]
}

export default function VendorsPage() {
  const t = useTranslations('vendors')
  const locale = useLocale()
  const [buys, setBuys] = useState<any[]>([])
  const [vendorsState, setVendorsState] = useState<any[]>([])
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; vendor?: any | null }>({ open: false, mode: 'create', vendor: null })
  const [vendorToDelete, setVendorToDelete] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  // details handled via dedicated route

  useEffect(() => {
    let mounted = true
    Promise.all([listBuys<any[]>(), listVendors<any[]>()])
      .then(([b, v]) => { if (!mounted) return; setBuys(b || []); setVendorsState(v || []) })
      .catch(() => { })
    return () => { mounted = false }
  }, [])

  const vendors: VendorRow[] = useMemo(() => {
    const map = new Map<string, VendorRow>()
    // Initialize from vendor master
    for (const v of vendorsState) {
      const key = `${v.name}|${v.phone || ''}`
      map.set(key, { name: v.name, address: v.address, phone: v.phone, purchases: 0, totalSpent: 0, totalDue: 0, since: v.createdAt ? new Date(v.createdAt) : undefined, lastPurchase: undefined, buys: [] } as unknown as VendorRow)
    }
    // Fold in buys
    for (const b of buys) {
      const key = `${b.vendorName || 'Vendor'}|${b.vendorPhone || ''}`
      const existing = map.get(key)
      if (!existing) continue // only aggregate for vendors present in master list
      const row = existing
      const itemsTotal = (b.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
      const discount = Number(b.discount || 0)
      const transport = Number(b.transportTotal || 0)
      const grand = Math.max(0, itemsTotal + transport - discount)
      const paid = Number(b.paidAmount || 0)
      row.purchases += 1
      row.totalSpent += grand
      row.totalDue += Math.max(0, grand - paid)
      const d = b.createdAt ? new Date(b.createdAt) : undefined
      if (!row.since || (d && d < row.since)) row.since = d
      if (!row.lastPurchase || (d && d > row.lastPurchase)) row.lastPurchase = d
      row.buys.push(b)
      map.set(key, row)
    }
    return Array.from(map.values())
  }, [buys, vendorsState])

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    return v.name.toLowerCase().includes(q) || (v.phone || '').toLowerCase().includes(q)
  })

  const totals = {
    vendors: vendors.length,
    purchases: vendors.reduce((s, v) => s + v.purchases, 0),
    spent: vendors.reduce((s, v) => s + v.totalSpent, 0),
    due: vendors.reduce((s, v) => s + v.totalDue, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle-foreground" />
          <Input type="search" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 pl-10 md:h-10" />
        </div>
        {/* Mobile uses the floating action button below instead. */}
        <Button className="hidden shrink-0 items-center gap-2 md:flex" onClick={() => setModal({ open: true, mode: 'create' })}>
          <Plus className="h-4 w-4" /> {t('addVendor')}
        </Button>
      </div>

      {/* Mini Dashboard */}
      <StatRail>
        <StatTile label={t('vendorsCount')} value={totals.vendors} />
        <StatTile label={t('purchases')} value={totals.purchases} />
        <StatTile label={t('totalSpent')} value={formatCurrency(totals.spent, locale as any)} tone="text-info" />
        <StatTile label={t('totalDue')} value={formatCurrency(totals.due, locale as any)} tone="text-warning" />
      </StatRail>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground mb-4">{t('emptyDescription')}</p>
            <Button onClick={() => setModal({ open: true, mode: 'create' })}>{t('addVendor')}</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('phone')}</TableHead>
                  <TableHead>{t('address')}</TableHead>
                  <TableHead className="text-center">{t('totalPurchases')}</TableHead>
                  <TableHead className="text-right">{t('totalSpent')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v, idx) => (
                  <TableRow key={`${v.name}-${idx}`}>
                    <TableCell className="font-medium" data-primary="">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-linear-to-r from-emerald-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {v.name.charAt(0)}
                        </div>
                        <div>
                          <a href={`/${locale}/vendors/${encodeURIComponent(v.name)}--${encodeURIComponent(v.phone || '')}`}>
                            <p className="font-medium hover:text-info cursor-pointer">{v.name}</p>
                          </a>
                          <p className="text-sm text-subtle-foreground">{t('since')} {v.since ? formatDate(v.since, locale as any) : '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-label={t('phone')}>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        {v.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell data-label={t('address')}>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {v.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="md:text-center" data-label={t('totalPurchases')}>
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-info-subtle text-info">{v.purchases}</span>
                    </TableCell>
                    <TableCell className="font-medium md:text-right" data-label={t('totalSpent')}>{formatCurrency(v.totalSpent, locale as any)}</TableCell>
                    <TableCell className="md:text-right">
                      <div className="flex justify-end gap-2">
                        <a href={`/${locale}/vendors/${encodeURIComponent(v.name)}--${encodeURIComponent(v.phone || '')}`}>
                          <Button variant="ghost" size="icon" className="tap" title={t('view')} aria-label={t('view')}><Eye className="h-4 w-4" /></Button>
                        </a>
                        <Button variant="ghost" size="icon" className="tap" title={t('edit')} aria-label={t('edit')} onClick={() => {
                          const match = vendorsState.find(x => x.name === v.name && x.phone === v.phone)
                          if (match) { setModal({ open: true, mode: 'edit', vendor: match }) }
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="tap text-danger" title={t('delete')} aria-label={t('delete')} onClick={() => {
                          const match = vendorsState.find(x => x.name === v.name && x.phone === v.phone)
                          if (match) setVendorToDelete(match)
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Fab onClick={() => setModal({ open: true, mode: 'create' })} label={t('addVendor')} />

      <VendorModal
        open={modal.open}
        mode={modal.mode}
        vendor={modal.vendor || null}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        onSaved={(v) => {
          if (modal.mode === 'edit') setVendorsState(prev => prev.map(x => x.id === v.id ? v : x))
          else setVendorsState(prev => [...prev, v])
        }}
      />
      {vendorToDelete && (
        <DeleteConfirmationModal isOpen={!!vendorToDelete} onClose={() => setVendorToDelete(null)} onConfirm={async () => {
          try { await deleteVendor(vendorToDelete.id); setVendorsState(prev => prev.filter(x => x.id !== vendorToDelete.id)) } catch { }
          setVendorToDelete(null)
        }} title={t('deleteTitle')} description={t('deleteConfirm', { name: vendorToDelete.name })} />
      )}
    </div>
  )
}
