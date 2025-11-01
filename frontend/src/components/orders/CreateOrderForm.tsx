'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Plus, Minus, X, Search, ShoppingCart, User, MapPin, Package, Save, Phone } from 'lucide-react'
import { Order, OrderItem, Product, Customer } from '@/types'
import { listCustomers as fetchCustomers, listProducts as fetchProducts, createOrder as apiCreateOrder } from '@/lib/api'
import { normalizeProduct, normalizeCustomer, normalizeOrder } from '@/lib/api'
import { toast } from 'sonner'

interface CreateOrderFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateOrderForm({ isOpen, onClose, onSuccess }: CreateOrderFormProps) {
  const t = useTranslations('createOrder')
  const locale = useLocale()
  const { customers, products, addOrder, addCustomer, addProduct } = useStore()

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowCustomerDropdown(false)
        setShowProductDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize data from API
  useEffect(() => {
    let mounted = true
    if (customers.length === 0) {
      fetchCustomers<any[]>()
        .then((res) => { if (mounted) (res || []).map(normalizeCustomer).forEach(addCustomer) })
        .catch(() => {})
    }
    if (products.length === 0) {
      fetchProducts<any[]>()
        .then((res) => { if (mounted) (res || []).map(normalizeProduct).forEach(addProduct) })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [customers.length, products.length, addCustomer, addProduct])

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customerSearch === '' ||
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  )

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    (productSearch === '' || product.name.toLowerCase().includes(productSearch.toLowerCase())) &&
    !orderItems.some(item => item.productId === product.id)
  )

  // Calculate total
  const total = orderItems.reduce((sum, item) => sum + item.total, 0)

  // Add product to order
  const addProductToOrder = (product: Product) => {
    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      total: product.price
    }
    setOrderItems([...orderItems, newItem])
    setProductSearch('')
    setShowProductDropdown(false)
  }

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setOrderItems(orderItems.map(item =>
      item.productId === productId
        ? { ...item, quantity, total: item.price * quantity }
        : item
    ))
  }

  // Remove item from order
  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId))
  }

  // Handle customer selection
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setCustomerPhone(customer.phone)
    setDeliveryAddress(customer.address)
    setShowCustomerDropdown(false)
  }

  // Generate order ID
  const generateOrderId = () => {
    const prefix = 'ORD'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
  }

  // Handle form submission
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
      }
      const created = await apiCreateOrder<any>(payload)
      const normalized = normalizeOrder(created)
      const finalOrder: Order = { ...normalized, customerName: selectedCustomer.name }
      addOrder(finalOrder)
      onSuccess()
      toast.success('Order created successfully')
      onClose()

      // Reset form
      setSelectedCustomer(null)
      setCustomerSearch('')
      setCustomerPhone('')
      setDeliveryAddress('')
      setOrderItems([])
      setProductSearch('')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {t('title')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-purple-100 text-base">
              {t('description')}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form content */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <User className="h-5 w-5" />
                {t('customerInformation')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('selectCustomer')}
                  </Label>
                  <div className="relative dropdown-container">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer"
                      placeholder={t('searchCustomer')}
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(true)
                      }}
                      onClick={() => setShowCustomerDropdown(true)}
                      className="pl-10 h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white backdrop-blur-md border border-purple-200 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-2">
                          {filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              className="p-4 hover:bg-purple-50 cursor-pointer rounded-lg transition-all duration-200 border border-transparent hover:border-purple-200 hover:shadow-sm"
                              onClick={() => selectCustomer(customer)}
                            >
                              <div className="flex items-center gap-4">

                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 text-base leading-tight">{customer.name}</div>
                                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{customer.address}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t('customerPhoneNumber')}
                  </Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t('enterPhone')}
                    className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('deliveryAddress')}
                  </Label>
                  <Input
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t('enterAddress')}
                    className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Product Selection Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Package className="h-5 w-5" />
                {t('addProducts')}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-medium text-gray-700">
                  {t('searchProduct')}
                </Label>
                <div className="relative dropdown-container">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="product"
                    placeholder={t('searchProduct')}
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      setShowProductDropdown(true)
                    }}
                    onClick={() => setShowProductDropdown(true)}
                    className="pl-10 h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white backdrop-blur-md border border-purple-200 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                      <div className="p-3 space-y-2">
                        {filteredProducts.map(product => (
                          <div
                            key={product.id}
                            className="p-4 hover:bg-purple-50 cursor-pointer rounded-lg transition-all duration-200 border border-transparent hover:border-purple-200 hover:shadow-sm"
                            onClick={() => addProductToOrder(product)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md">
                                  {product.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 text-base leading-tight">{product.name}</div>
                                  <div className="text-sm text-gray-600 mt-1 font-medium">
                                    {formatCurrency(product.price, locale)} <span className="text-gray-400">per {product.unit}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {product.stock > 0 && (
                                  <div className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    Stock: {product.stock}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  Click to add
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            {orderItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">{t('orderItems')}</h3>
                  <div className="text-sm text-gray-500">
                    {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">{t('product')}</TableHead>
                        <TableHead className="text-center font-semibold text-gray-700">{t('quantity')}</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">{t('price')}</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">{t('total')}</TableHead>
                        <TableHead className="text-center font-semibold text-gray-700">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, idx) => (
                        <TableRow key={`${item.productId}-${idx}`} className="hover:bg-purple-50">
                          <TableCell className="font-medium text-gray-900">{item.productName}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                className="h-8 w-8 p-0 hover:bg-purple-50 hover:border-purple-200"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-gray-700">
                            {formatCurrency(item.price, locale)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900">
                            {formatCurrency(item.total, locale)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.productId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Order Total */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-gray-700">{t('orderTotal')}</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(total, locale)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isSubmitting || !selectedCustomer || orderItems.length === 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('creating')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {t('createOrder')}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
