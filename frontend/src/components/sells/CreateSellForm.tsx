'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Plus, Minus, X, Search, ShoppingCart, User, MapPin, Package, Save, Phone } from 'lucide-react'
import { Order, OrderItem, Product, Customer } from '@/types'
import { listCustomers as fetchCustomers, listProducts as fetchProducts } from '@/lib/api'
import { createSell as apiCreateSell } from '@/lib/api/sell-api'
import { normalizeProduct, normalizeCustomer, normalizeOrder } from '@/lib/api'
import { toast } from 'sonner'

export default function CreateSellForm({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations('createOrder')
  const locale = useLocale()
  const { customers, products, addSell, addCustomer, addProduct } = useStore()

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  useEffect(() => {
    let mounted = true
    if (customers.length === 0) fetchCustomers<any[]>().then(res => { if (mounted) (res || []).map(normalizeCustomer).forEach(addCustomer) }).catch(() => {})
    if (products.length === 0) fetchProducts<any[]>().then(res => { if (mounted) (res || []).map(normalizeProduct).forEach(addProduct) }).catch(() => {})
    return () => { mounted = false }
  }, [customers.length, products.length, addCustomer, addProduct])

  const filteredCustomers = customers.filter(c => customerSearch === '' || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
  const filteredProducts = products.filter(p => (productSearch === '' || p.name.toLowerCase().includes(productSearch.toLowerCase())) && !orderItems.some(i => i.productId === p.id))

  const total = orderItems.reduce((sum, item) => sum + item.total, 0)
  const [discount, setDiscount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [transportPerTrip, setTransportPerTrip] = useState(0)
  const [transportTrips, setTransportTrips] = useState(0)
  const transportTotal = transportPerTrip * transportTrips
  const grandTotal = Math.max(0, total + transportTotal - discount)
  const due = Math.max(0, grandTotal - paidAmount)

  const addProductToOrder = (product: Product) => {
    const newItem: OrderItem = { productId: product.id, productName: product.name, quantity: 1, price: product.price, total: product.price }
    setOrderItems(prev => [...prev, newItem])
    setProductSearch('')
    setShowProductDropdown(false)
  }
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return setOrderItems(prev => prev.filter(i => i.productId !== productId))
    setOrderItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity, total: i.price * quantity } : i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || orderItems.length === 0 || !deliveryAddress.trim()) {
      toast.error('Please select a customer, add items and delivery address')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        customerId: selectedCustomer.id,
        deliveryAddress: deliveryAddress.trim(),
        items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        discount, paidAmount, transportPerTrip, transportTrips,
      }
      const created = await apiCreateSell<any>(payload)
      const normalized = normalizeOrder(created)
      const final: Order = { ...normalized, customerName: selectedCustomer.name }
      addSell(final)
      toast.success('Sell created successfully')
      onClose()
      setSelectedCustomer(null); setCustomerSearch(''); setCustomerPhone(''); setDeliveryAddress(''); setOrderItems([]); setProductSearch('')
    } catch (err) {
      toast.error('Failed to create sell')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ShoppingCart className="h-5 w-5" /></div><DialogTitle className="text-2xl font-bold tracking-tight">New Sell</DialogTitle></div>
            <DialogDescription className="text-purple-100 text-base">Fill in the details to create a new sell.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800"><User className="h-5 w-5" />Customer Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-medium text-gray-700 flex items-center gap-2"><User className="h-4 w-4" />Select Customer</Label>
                  <div className="relative dropdown-container">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="customer" placeholder="Search customer by name or phone..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }} onClick={() => setShowCustomerDropdown(true)} className="pl-10 h-11" required />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto"><div className="p-3 space-y-2">{filteredCustomers.map(c => (
                        <div key={c.id} className="p-3 hover:bg-purple-50 cursor-pointer rounded" onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setCustomerPhone(c.phone); setDeliveryAddress(c.address); setShowCustomerDropdown(false) }}>
                          <div className="font-semibold">{c.name}</div><div className="text-xs text-gray-500">{c.address}</div>
                        </div>))}</div></div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2"><Phone className="h-4 w-4" />Customer Phone Number</Label>
                  <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter phone" className="h-11" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2"><MapPin className="h-4 w-4" />Delivery Address</Label>
                  <Input id="address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter address" className="h-11" required />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800"><Package className="h-5 w-5" />Add Products</div>
              <div className="space-y-2"><Label className="text-sm font-medium text-gray-700">Search products</Label><div className="relative dropdown-container"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="product" placeholder="Search products to add..." value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true) }} onClick={() => setShowProductDropdown(true)} className="pl-10 h-11" />{showProductDropdown && filteredProducts.length > 0 && (<div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto"><div className="p-3 space-y-2">{filteredProducts.map(p => (<div key={p.id} className="p-3 hover:bg-purple-50 cursor-pointer rounded" onClick={() => addProductToOrder(p)}><div className="font-semibold">{p.name}</div><div className="text-xs text-gray-500">{formatCurrency(p.price, locale)} per {p.unit}</div></div>))}</div></div>)}</div></div>
              <div className="border rounded-lg overflow-hidden"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow></TableHeader><TableBody>{orderItems.map(it => (<TableRow key={it.productId}><TableCell className="font-medium">{it.productName}</TableCell><TableCell><div className="flex items-center justify-center gap-2"><Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(it.productId, it.quantity - 1)}><Minus className="h-3 w-3" /></Button><Input type="number" value={it.quantity} onChange={(e) => updateItemQuantity(it.productId, parseInt(e.target.value || '0', 10))} className="w-16 text-center h-9" /><Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(it.productId, it.quantity + 1)}><Plus className="h-3 w-3" /></Button></div></TableCell><TableCell className="text-right">{formatCurrency(it.price, locale)}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(it.total, locale)}</TableCell><TableCell className="text-right"><Button type="button" variant="ghost" className="text-red-600" onClick={() => updateItemQuantity(it.productId, 0)}><X className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-sm font-medium text-gray-700">Discount</Label><Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="h-11" placeholder="0" /></div>
              <div className="space-y-2"><Label className="text-sm font-medium text-gray-700">Transport (per trip × trips)</Label><div className="flex items-center gap-2"><Input type="number" value={transportPerTrip} onChange={(e) => setTransportPerTrip(parseFloat(e.target.value) || 0)} className="h-11 w-32 text-right" placeholder="0" /><span>×</span><Input type="number" value={transportTrips} onChange={(e) => setTransportTrips(parseInt(e.target.value || '0', 10))} className="h-11 w-24 text-right" placeholder="0" /><span className="ml-auto font-medium">= {formatCurrency(transportTotal, locale)}</span></div></div>
            </div>
            <div className="p-4 rounded-lg border"><div className="flex justify-between"><span className="font-semibold">Grand Total</span><span className="text-xl font-bold">{formatCurrency(grandTotal, locale)}</span></div><div className="flex justify-between items-center gap-3 mt-2"><span className="text-sm text-gray-600">Paid</span><Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="h-10 w-32 text-right" /><span className="ml-auto font-semibold text-green-700">Due: {formatCurrency(due, locale)}</span></div></div>
            <div className="flex gap-3 pt-6 border-t border-gray-200"><Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12" disabled={isSubmitting}>Cancel</Button><Button type="submit" className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-purple-700 text-white" disabled={isSubmitting || !selectedCustomer || orderItems.length === 0}>{isSubmitting ? 'Saving...' : 'Save Sell'}</Button></div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
