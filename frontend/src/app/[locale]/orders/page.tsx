'use client'

import { useState, useEffect } from 'react'
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
import { formatCurrency, formatDate, formatOrderCode } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Plus, Search, Eye, Edit, X, Package, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatus, Order } from '@/types'
import { ViewOrderModal } from '@/components/orders/ViewOrderModal'
import OrderModal from '@/components/orders/OrderModal'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { listOrders as fetchOrders, deleteOrder as apiDeleteOrder, updateOrder as apiUpdateOrder } from '@/lib/api'
import { toast } from 'sonner'
import { normalizeOrder } from '@/lib/api'

export default function OrdersPage() {
  const t = useTranslations('orders')
  const locale = useLocale()
  const { orders, addOrder, updateOrderStatus, deleteOrder } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [orderToView, setOrderToView] = useState<Order | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Load orders from API
  useEffect(() => {
    let mounted = true
    if (orders.length === 0) {
      fetchOrders<any[]>()
        .then((res) => {
          if (!mounted) return
          (res || []).map(normalizeOrder).forEach(addOrder)
        })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [orders.length, addOrder])

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase()
    const code = formatOrderCode(order.id, order.createdAt).toLowerCase()
    const matchesSearch =
      order.id.toLowerCase().includes(q) ||
      code.includes(q) ||
      order.customerName.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
    }
  }

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-44">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="pending">{t('orderStatus.pending')}</SelectItem>
                <SelectItem value="processing">{t('orderStatus.processing')}</SelectItem>
                <SelectItem value="delivered">{t('orderStatus.delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('orderStatus.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="flex items-center gap-2" onClick={() => { setModalMode('create'); setSelectedOrder(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4" /> {t('newOrder')}
        </Button>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('emptyDescription')}</p>
            <Button onClick={() => { setModalMode('create'); setSelectedOrder(null); setModalOpen(true) }}>{t('newOrder')}</Button>
          </CardContent>
        </Card>
      ) : (
      <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      {/* Rest of page content */}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orderId')}</TableHead>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('total')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, idx) => (
                <TableRow key={`${order.id}-${idx}`}>
                  <TableCell className="font-medium">{formatOrderCode(order.id, order.createdAt)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt, locale)}</TableCell>
                  <TableCell>
                    <div className="min-w-[9rem]">
                      <Select
                        value={order.status}
                        onValueChange={async (v) => {
                          const next = v as OrderStatus
                          const prev = order.status
                          try {
                            // optimistic update
                            updateOrderStatus(order.id, next)
                            await apiUpdateOrder(order.id, { status: next })
                            toast.success(t('editOrderSaved'))
                          } catch (e) {
                            updateOrderStatus(order.id, prev)
                            toast.error(t('editOrderFailed'))
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 px-2 py-1 text-xs">
                          <div className={`inline-flex items-center gap-1 ${getStatusColor(order.status)} rounded-full px-2 py-1 w-full justify-between`}>
                            <span className="inline-flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {t(`orderStatus.${order.status}` as any)}
                            </span>
                          </div>
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
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.total, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setOrderToView(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setModalMode('edit'); setSelectedOrder(order); setModalOpen(true) }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={order.status === 'delivered' || order.status === 'cancelled'}
                        onClick={() => setOrderToDelete(order)}
                      >
                        <X className="h-4 w-4" />
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

      {/* Unified Create/Edit Order Modal */}
      {modalOpen && (
        <OrderModal
          mode={modalMode}
          isOpen={modalOpen}
          order={selectedOrder}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <DeleteConfirmationModal
          isOpen={!!orderToDelete}
          onClose={() => setOrderToDelete(null)}
          onConfirm={async () => {
            if (orderToDelete) {
              try {
                await apiDeleteOrder(orderToDelete.id)
                deleteOrder(orderToDelete.id)
                toast.success('Order deleted')
              } catch {
                toast.error('Failed to delete order (showing locally)')
                deleteOrder(orderToDelete.id)
              }
              setOrderToDelete(null)
            }
          }}
          title={t('deleteOrder.title')}
          description={t('deleteOrder.description', { orderId: orderToDelete.id })}
        />
      )}

      {/* View Order Modal */}
      <ViewOrderModal
        isOpen={!!orderToView}
        onClose={() => setOrderToView(null)}
        order={orderToView}
      />

      {/* Removed standalone Edit modal; handled by OrderModal */}
    </div>
  )
}
