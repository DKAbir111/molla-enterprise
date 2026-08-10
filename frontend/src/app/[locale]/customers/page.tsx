'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { Fab } from '@/components/shared/Fab'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Plus, Search, Eye, Edit, Trash2, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
// import { InlineEditCustomer } from '@/components/customers/InlineEditCustomer'
import { listCustomers as fetchCustomers } from '@/lib/api'
import { normalizeCustomer } from '@/lib/api'
// import { AddCustomerModal } from '@/components/customers/AddCustomerModal'
import { CustomerModal } from '@/components/customers/CustomerModal'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { deleteCustomer as apiDeleteCustomer } from '@/lib/api/customer-api'

export default function CustomersPage() {
  const t = useTranslations('customers')
  const locale = useLocale()
  const { customers, addCustomer } = useStore()
  const updateCustomer = useStore((s) => s.updateCustomer)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; customer?: any | null }>({ open: false, mode: 'create', customer: null })
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null)

  // Load from API
  useEffect(() => {
    let mounted = true
    fetchCustomers<any[]>()
      .then((res) => {
        if (!mounted) return
        const incoming = (res || []).map(normalizeCustomer)
        incoming.forEach((c) => {
          const exists = customers.find((x) => x.id === c.id)
          if (exists) {
            // Update totals and any changed fields
            updateCustomer(c.id, c)
          } else {
            addCustomer(c)
          }
        })
      })
      .catch(() => { })
    return () => { mounted = false }
  }, [addCustomer, updateCustomer])

  // Backend now includes aggregates in /customers; no client aggregation needed

  // Mini dashboard stats (always show, even if empty)
  const stats = useMemo(() => {
    const total = customers.length
    const active = customers.filter(c => (c.totalOrders || 0) > 0).length
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
    const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0
    return { total, active, totalRevenue, avgOrderValue }
  }, [customers])

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            type="search"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10 md:h-10"
          />
        </div>
        {/* Mobile uses the floating action button below instead. */}
        <Button className="hidden shrink-0 items-center gap-2 md:flex" onClick={() => setModal({ open: true, mode: 'create' })}>
          <Plus className="h-4 w-4" />
          {t('addCustomer')}
        </Button>
      </div>

      {/* Mini Dashboard */}
      <StatRail>
        <StatTile label={t('totalCustomers')} value={stats.total} />
        <StatTile label={t('activeCustomers')} value={stats.active} tone="text-success" />
        <StatTile label={t('totalRevenue')} value={formatCurrency(stats.totalRevenue, locale)} tone="text-info" />
        <StatTile label={t('avgOrderValue')} value={formatCurrency(stats.avgOrderValue, locale)} />
      </StatRail>

      {/* Empty State */}
      {filteredCustomers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground mb-4">{t('emptyDescription')}</p>
            <Button onClick={() => setModal({ open: true, mode: 'create' })}>{t('addCustomer')}</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Customers Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('phone')}</TableHead>
                    <TableHead>{t('address')}</TableHead>
                    <TableHead className="text-center">{t('totalOrders')}</TableHead>
                    <TableHead className="text-right">{t('totalSpent')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, idx) => (
                    <TableRow key={`${customer.id}-${idx}`}>
                      {/* `data-primary` makes this the card headline on mobile;
                          `data-label` turns the rest into labelled rows. */}
                      <TableCell className="font-medium" data-primary="">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <Link href={`/customers/${customer.id}`}>
                              <p className="font-medium hover:text-info cursor-pointer">
                                {customer.name}
                              </p>
                            </Link>
                            <p className="text-sm text-subtle-foreground">
                              {t('since')} {formatDate(customer.createdAt, locale)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-label={t('phone')}>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell data-label={t('address')}>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {customer.address}
                        </div>
                      </TableCell>
                      <TableCell className="md:text-center" data-label={t('totalOrders')}>
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-info-subtle text-info">
                          {customer.totalOrders}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium md:text-right" data-label={t('totalSpent')}>
                        {formatCurrency(customer.totalSpent, locale)}
                      </TableCell>
                      <TableCell className="md:text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" className="tap" title={t('viewDetails')} aria-label={t('viewDetails')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="tap" title={t('edit')} aria-label={t('edit')} onClick={() => setModal({ open: true, mode: 'edit', customer })}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="tap text-danger hover:text-danger" title={t('delete')} aria-label={t('delete')} onClick={() => setCustomerToDelete(customer)}>
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
        </>
      )}
      <Fab onClick={() => setModal({ open: true, mode: 'create' })} label={t('addCustomer')} />

      <CustomerModal open={modal.open} mode={modal.mode} customer={modal.customer || null} onClose={() => setModal((m) => ({ ...m, open: false }))} />
      {customerToDelete && (
        <DeleteConfirmationModal isOpen={!!customerToDelete} onClose={() => setCustomerToDelete(null)} onConfirm={async () => {
          try { await apiDeleteCustomer(customerToDelete.id) } catch { }
          // Optimistic removal from store
          const delId = customerToDelete.id
          useStore.setState(s => ({ customers: s.customers.filter(x => x.id !== delId) }))
          setCustomerToDelete(null)
        }} title={t('delete')} description={`Are you sure you want to delete ${customerToDelete.name}?`} />
      )}
    </div>
  )
}
