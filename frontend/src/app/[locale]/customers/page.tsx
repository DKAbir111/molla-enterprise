'use client'

import { useState, useEffect, useRef } from 'react'
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
import { listCustomers as fetchCustomers } from '@/lib/api'
import { normalizeCustomer } from '@/lib/api'
import { AddCustomerModal } from '@/components/customers/AddCustomerModal'

export default function CustomersPage() {
  const t = useTranslations('customers')
  const locale = useLocale()
  const { customers, addCustomer } = useStore()
  const updateCustomer = useStore((s) => s.updateCustomer)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)

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
      .catch(() => {})
    return () => { mounted = false }
  }, [addCustomer, updateCustomer])

  // Backend now includes aggregates in /customers; no client aggregation needed

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
        <Button className="flex items-center gap-2" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('addCustomer')}
        </Button>
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('emptyDescription')}</p>
            <Button onClick={() => setIsAddOpen(true)}>{t('addCustomer')}</Button>
          </CardContent>
        </Card>
      ) : (
      <>
      {/* Customer Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.totalOrders > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                customers.reduce((sum, c) => sum + c.totalSpent, 0),
                locale
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg. Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                customers.reduce((sum, c) => sum + c.totalSpent, 0) / 
                customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0,
                locale
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
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
                      <Button variant="ghost" size="sm" title={t('edit')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title={t('delete')}>
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
      <AddCustomerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  )
}
