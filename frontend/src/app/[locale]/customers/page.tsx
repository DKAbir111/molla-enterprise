'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="flex items-center gap-2" onClick={() => setModal({ open: true, mode: 'create' })}>
          <Plus className="h-4 w-4" />
          {t('addCustomer')}
        </Button>
      </div>

      {/* Mini Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue, locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue, locale)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-linear-to-r from-teal-600 to-teal-500 text-white flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('emptyDescription')}</p>
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
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-linear-to-r from-teal-600 to-teal-500 flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <Link href={`/customers/${customer.id}`}>
                              <p className="font-medium hover:text-blue-600 cursor-pointer">
                                {customer.name}
                              </p>
                            </Link>
                            <p className="text-sm text-gray-500">
                              Since {formatDate(customer.createdAt, locale)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {customer.address}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {customer.totalOrders}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.totalSpent, locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm" title={t('viewDetails')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title={t('edit')} onClick={() => setModal({ open: true, mode: 'edit', customer })}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title={t('delete')} onClick={() => setCustomerToDelete(customer)}>
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
