'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listBuys } from '@/lib/api/buy-api'
import { listVendors, deleteVendor, updateVendor } from '@/lib/api/vendor-api'
import { AddVendorModal } from '@/components/vendors/AddVendorModal'
import { EditVendorModal } from '@/components/vendors/EditVendorModal'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Eye, Edit, Trash2, Phone, MapPin, Plus } from 'lucide-react'
// Dialog removed; dedicated details route used

type VendorRow = { name: string; phone?: string; purchases: number; totalSpent: number; totalDue: number; since?: Date; lastPurchase?: Date; buys: any[] }

export default function VendorsPage() {
  const t = useTranslations('vendors')
  const locale = useLocale()
  const [buys, setBuys] = useState<any[]>([])
  const [vendorsState, setVendorsState] = useState<any[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [vendorToEdit, setVendorToEdit] = useState<any | null>(null)
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
      map.set(key, { name: v.name, phone: v.phone, purchases: 0, totalSpent: 0, totalDue: 0, since: v.createdAt ? new Date(v.createdAt) : undefined, lastPurchase: undefined, buys: [] } as VendorRow)
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
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button className="flex items-center gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {/* Mini Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Vendors</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totals.vendors}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Purchases</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totals.purchases}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.spent, locale as any)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Due</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{formatCurrency(totals.due, locale as any)}</div></CardContent></Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><div className="mx-auto mb-4 h-14 w-14 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div><h3 className="text-lg font-semibold mb-1">No vendors yet</h3><p className="text-gray-600 mb-4">Record purchases to build your vendor directory.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-center">Total Purchases</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v, idx) => (
                  <TableRow key={`${v.name}-${idx}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-linear-to-r from-emerald-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {v.name.charAt(0)}
                        </div>
                        <div>
                          <a href={`/${locale}/vendors/${encodeURIComponent(v.name)}--${encodeURIComponent(v.phone || '')}`}>
                            <p className="font-medium hover:text-blue-600 cursor-pointer">{v.name}</p>
                          </a>
                          <p className="text-sm text-gray-500">Since {v.since ? formatDate(v.since, locale as any) : '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-3 w-3" />
                        {v.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3 w-3" />
                        -
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{v.purchases}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(v.totalSpent, locale as any)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <a href={`/${locale}/vendors/${encodeURIComponent(v.name)}--${encodeURIComponent(v.phone || '')}`}>
                          <Button variant="ghost" size="sm" title="View"><Eye className="h-4 w-4" /></Button>
                        </a>
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => {
                          const match = vendorsState.find(x => x.name === v.name && x.phone === v.phone)
                          if (match) { setVendorToEdit(match); setEditOpen(true) }
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" title="Delete" onClick={() => {
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
      <AddVendorModal isOpen={addOpen} onClose={() => { setAddOpen(false); listVendors<any[]>().then(setVendorsState).catch(() => { }) }} />
      {editOpen && vendorToEdit && (
        <EditVendorModal isOpen={editOpen} onClose={() => setEditOpen(false)} vendor={vendorToEdit} onSaved={(v) => {
          setVendorsState(prev => prev.map(x => x.id === v.id ? v : x))
        }} />
      )}
      {vendorToDelete && (
        <DeleteConfirmationModal isOpen={!!vendorToDelete} onClose={() => setVendorToDelete(null)} onConfirm={async () => {
          try { await deleteVendor(vendorToDelete.id); setVendorsState(prev => prev.filter(x => x.id !== vendorToDelete.id)) } catch { }
          setVendorToDelete(null)
        }} title={'Delete Vendor'} description={`Are you sure you want to delete ${vendorToDelete.name}?`} />
      )}
    </div>
  )
}
