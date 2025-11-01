'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Order, OrderItem, OrderStatus, Product } from '@/types'
import { MapPin, X, Search, Plus, Minus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateOrder as apiUpdateOrder, updateOrderItems as apiUpdateOrderItems, listProducts as fetchProducts } from '@/lib/api'
import { normalizeProduct } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { formatOrderCode } from '@/lib/utils'

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function EditOrderModal({ isOpen, onClose, order }: EditOrderModalProps) {
  const t = useTranslations('orders')
  const tCreate = useTranslations('createOrder')
  const common_t = useTranslations('common')
  const { updateOrder: updateLocalOrder } = useStore()
  const store = useStore()

  const [status, setStatus] = React.useState<OrderStatus>('pending')
  const [address, setAddress] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [productSearch, setProductSearch] = React.useState('')
  const [showProductDropdown, setShowProductDropdown] = React.useState(false)
  const [items, setItems] = React.useState<OrderItem[]>([])

  React.useEffect(() => {
    if (order) {
      setStatus(order.status)
      setAddress(order.deliveryAddress || '')
      setItems(order.items || [])
    }
  }, [order])

  // Ensure products available for adding
  React.useEffect(() => {
    let mounted = true
    if ((store.products || []).length === 0) {
      fetchProducts<any[]>()
        .then((res) => { if (!mounted) return; (res || []).map(normalizeProduct).forEach(store.addProduct) })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [])

  const filteredProducts = (store.products || []).filter((p) =>
    productSearch === '' || p.name.toLowerCase().includes(productSearch.toLowerCase())
  ).filter((p) => !items.some(i => i.productId === p.id))

  const addProductToOrder = (product: Product) => {
    const price = Number(product.price || 0)
    const newIt: OrderItem = { productId: product.id, productName: product.name, quantity: 1, price, total: price }
    setItems((prev) => [...prev, newIt])
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return }
    setItems((prev) => prev.map(i => i.productId === productId ? { ...i, quantity: qty, total: qty * i.price } : i))
  }

  const updatePrice = (productId: string, price: number) => {
    if (price < 0) price = 0
    setItems((prev) => prev.map(i => i.productId === productId ? { ...i, price, total: i.quantity * price } : i))
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter(i => i.productId !== productId))
  }

  const grandTotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0)

  if (!order) return null

  const onSave = async () => {
    setSaving(true)
    try {
      await apiUpdateOrder(order.id, { status, deliveryAddress: address })
      await apiUpdateOrderItems(order.id, { items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })) })
      updateLocalOrder(order.id, { status, deliveryAddress: address, items: items, total: grandTotal })
      toast.success(t('editOrderSaved') || 'Order updated')
      onClose()
    } catch (e) {
      toast.error(t('editOrderFailed') || 'Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden rounded-lg shadow-2xl hide-default-close">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {t('editOrder.title')} {formatOrderCode(order.id, order.createdAt)}
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                {t('editOrder.description')}
              </DialogDescription>
            </div>
            <Button variant="ghost" onClick={onClose} className="rounded-full w-8 h-8 p-0 text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('status')}</label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('orderStatus.pending')}</SelectItem>
                  <SelectItem value="processing">{t('orderStatus.processing')}</SelectItem>
                  <SelectItem value="delivered">{t('orderStatus.delivered')}</SelectItem>
                  <SelectItem value="cancelled">{t('orderStatus.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{tCreate('deliveryAddress')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10 h-11" placeholder={tCreate('enterAddress')} />
              </div>
            </div>
          </div>

          {/* Items editor */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-700">{t('orderItems')}</h3>
            <div className="relative dropdown-container">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={tCreate('searchProduct')}
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true) }}
                onClick={() => setShowProductDropdown(true)}
                className="pl-10 h-11"
              />
              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow z-10 max-h-64 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {filteredProducts.map((p) => (
                      <button key={p.id} className="w-full text-left p-2 rounded hover:bg-gray-50" onClick={() => addProductToOrder(p)}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('product')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('price')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((it) => (
                    <tr key={it.productId}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{it.productName}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(it.productId, it.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input type="number" value={it.quantity} onChange={(e) => updateQty(it.productId, parseInt(e.target.value || '0', 10))} className="w-16 text-center h-9" />
                          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(it.productId, it.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Input type="number" value={it.price} onChange={(e) => updatePrice(it.productId, parseFloat(e.target.value || '0'))} className="w-24 ml-auto h-9 text-right" />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-semibold">{(it.total || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <Button type="button" variant="ghost" className="text-red-600" onClick={() => removeItem(it.productId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <div className="text-right">
                <p className="text-sm text-gray-600">{t('total')}</p>
                <p className="text-2xl font-bold">{grandTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {common_t('cancel')}
          </Button>
          <Button onClick={onSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white">
            {saving ? 'Saving...' : common_t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
