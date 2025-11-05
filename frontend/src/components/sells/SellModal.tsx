'use client'

import * as React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import type { Order, OrderItem, Product, Customer } from '@/types'
import { ShoppingCart, Edit3, Save, Plus, Minus, X, Search, User, MapPin, Phone, Package, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { listCustomers as fetchCustomers, listProducts as fetchProducts } from '@/lib/api'
import { createSell as apiCreateSell, updateSell as apiUpdateSell, updateSellItems } from '@/lib/api/sell-api'
import { normalizeProduct, normalizeCustomer, normalizeOrder } from '@/lib/api'

type Mode = 'create' | 'edit'

interface SellModalProps {
    open: boolean
    mode: Mode
    onClose: () => void
    sell?: Order | null
}

export function SellModal({ open, mode, onClose, sell }: SellModalProps) {
    const t = useTranslations('createOrder')
    const locale = useLocale()
    const { customers, products, addSell, updateSell, addCustomer, addProduct } = useStore()

    const isEdit = mode === 'edit' && !!sell

    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
    const [customerSearch, setCustomerSearch] = React.useState('')
    const [customerPhone, setCustomerPhone] = React.useState('')
    const [deliveryAddress, setDeliveryAddress] = React.useState('')
    const [orderItems, setOrderItems] = React.useState<OrderItem[]>([])
    const [productSearch, setProductSearch] = React.useState('')
    const [discount, setDiscount] = React.useState(0)
    const [paidAmount, setPaidAmount] = React.useState(0)
    const [transportPerTrip, setTransportPerTrip] = React.useState(0)
    const [transportTrips, setTransportTrips] = React.useState(0)
    const [isLoading, setIsLoading] = React.useState(false)
    const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false)
    const [showProductDropdown, setShowProductDropdown] = React.useState(false)

    // Load customers and products
    React.useEffect(() => {
        let mounted = true
        if (customers.length === 0) {
            fetchCustomers<any[]>().then(res => {
                if (mounted) (res || []).map(normalizeCustomer).forEach(addCustomer)
            }).catch(() => { })
        }
        if (products.length === 0) {
            fetchProducts<any[]>().then(res => {
                if (mounted) (res || []).map(normalizeProduct).forEach(addProduct)
            }).catch(() => { })
        }
        return () => { mounted = false }
    }, [customers.length, products.length, addCustomer, addProduct])

    // Initialize/reset when opening or sell changes
    React.useEffect(() => {
        if (isEdit && sell) {
            const customer = customers.find(c => c.id === sell.customerId)
            setSelectedCustomer(customer || null)
            setCustomerSearch(customer?.name || '')
            setCustomerPhone(customer?.phone || '')
            setDeliveryAddress(sell.deliveryAddress || '')
            setOrderItems(sell.items || [])
            setDiscount(sell.discount || 0)
            setPaidAmount(sell.paidAmount || 0)
            setTransportPerTrip(sell.transportPerTrip || 0)
            setTransportTrips(sell.transportTrips || 0)
        } else if (!open) {
            // noop when closed
        } else {
            // create mode defaults
            setSelectedCustomer(null)
            setCustomerSearch('')
            setCustomerPhone('')
            setDeliveryAddress('')
            setOrderItems([])
            setDiscount(0)
            setPaidAmount(0)
            setTransportPerTrip(0)
            setTransportTrips(0)
        }
        setProductSearch('')
        setShowCustomerDropdown(false)
        setShowProductDropdown(false)
    }, [open, isEdit, sell, customers])

    const filteredCustomers = customers.filter(c =>
        customerSearch === '' ||
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    )

    const filteredProducts = products
        .filter(p => p.active !== false)
        .filter(p =>
            (productSearch === '' || p.name.toLowerCase().includes(productSearch.toLowerCase())) &&
            !orderItems.some(i => i.productId === p.id)
        )

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
    const transportTotal = transportPerTrip * transportTrips
    const grandTotal = Math.max(0, subtotal + transportTotal - discount)
    const due = Math.max(0, grandTotal - paidAmount)

    const handleClose = () => {
        onClose()
    }

    const addProductToOrder = (product: Product) => {
        const startPrice = (typeof product.price === 'number' ? product.price : 0)
        const minPrice = typeof product.targetPrice === 'number' ? product.targetPrice! : startPrice
        const effective = Math.max(startPrice, minPrice)
        const newItem: OrderItem = {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: effective,
            total: effective
        }
        setOrderItems(prev => [...prev, newItem])
        setProductSearch('')
        setShowProductDropdown(false)
    }

    const updateItemPrice = (productId: string, price: number) => {
        const p = products.find(pr => pr.id === productId)
        const floor = p && typeof p.targetPrice === 'number' ? p.targetPrice! : (p?.price || 0)
        const next = isNaN(price) ? floor : Math.max(price, floor)
        setOrderItems(prev => prev.map(i =>
            i.productId === productId ? { ...i, price: next, total: next * i.quantity } : i
        ))
    }

    const updateItemQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            return setOrderItems(prev => prev.filter(i => i.productId !== productId))
        }
        setOrderItems(prev => prev.map(i =>
            i.productId === productId ? { ...i, quantity, total: i.price * quantity } : i
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCustomer || orderItems.length === 0 || !deliveryAddress.trim()) {
            toast.error('Please select a customer, add items and delivery address')
            return
        }
        setIsLoading(true)
        try {
            if (isEdit && sell) {
                // Update existing sell
                await apiUpdateSell(sell.id, { discount, paidAmount, transportPerTrip, transportTrips })
                const itemsPayload = {
                    items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price }))
                }
                await updateSellItems<any>(sell.id, itemsPayload)
                updateSell(sell.id, {
                    ...sell,
                    items: orderItems,
                    discount,
                    paidAmount,
                    transportPerTrip,
                    transportTrips,
                    transportTotal,
                    total: subtotal
                })
                toast.success('Sell updated successfully')
            } else {
                // Create new sell
                const payload = {
                    customerId: selectedCustomer.id,
                    deliveryAddress: deliveryAddress.trim(),
                    items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
                    discount,
                    paidAmount,
                    transportPerTrip,
                    transportTrips,
                }
                const created = await apiCreateSell<any>(payload)
                const normalized = normalizeOrder(created)
                const final: Order = { ...normalized, customerName: selectedCustomer.name }
                addSell(final)
                toast.success('Sell created successfully')
            }
            handleClose()
        } catch (err) {
            toast.error(isEdit ? 'Failed to update sell' : 'Failed to create sell')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent overlayClassName="bg-black/20 backdrop-blur-none" className="sm:max-w-6xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="bg-linear-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                {isEdit ? <Edit3 className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                            </div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                {isEdit ? 'Edit Sell' : 'New Sell'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-blue-100 text-base">
                            {isEdit ? 'Update sell information and items' : 'Fill in the details to create a new sell'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-8 py-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Customer Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 pb-2 border-b">
                                <User className="h-5 w-5 text-purple-600" />
                                <span>Customer Information</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer" className="text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Select Customer
                                        </div>
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                                        <Input
                                            id="customer"
                                            placeholder="Search by name or phone..."
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value)
                                                setShowCustomerDropdown(true)
                                            }}
                                            onClick={() => setShowCustomerDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                            className="pl-10 h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                            required
                                            disabled={isEdit}
                                        />
                                        {showCustomerDropdown && filteredCustomers.length > 0 && !isEdit && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                {filteredCustomers.map(c => (
                                                    <div
                                                        key={c.id}
                                                        className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                        onClick={() => {
                                                            setSelectedCustomer(c)
                                                            setCustomerSearch(c.name)
                                                            setCustomerPhone(c.phone)
                                                            setDeliveryAddress(c.address)
                                                            setShowCustomerDropdown(false)
                                                        }}
                                                    >
                                                        <div className="font-semibold text-gray-900">{c.name}</div>
                                                        <div className="text-xs text-gray-500">{c.phone}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Phone Number
                                        </div>
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Enter phone"
                                        className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                        required
                                        disabled={isEdit}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Delivery Address
                                        </div>
                                    </Label>
                                    <Input
                                        id="address"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        placeholder="Enter delivery address"
                                        className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 pb-2 border-b">
                                <Package className="h-5 w-5 text-purple-600" />
                                <span>Products</span>
                            </div>
                            {!isEdit && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Search & Add Products</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                                        <Input
                                            placeholder="Search products to add..."
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value)
                                                setShowProductDropdown(true)
                                            }}
                                            onClick={() => setShowProductDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                                            className="pl-10 h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                        />
                                        {showProductDropdown && filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                {filteredProducts.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                        onClick={() => addProductToOrder(p)}
                                                    >
                                                        <div className="font-semibold text-gray-900">{p.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatCurrency(p.price, locale)} per {p.unit}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {orderItems.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="font-semibold">Product</TableHead>
                                                <TableHead className="text-center font-semibold">Quantity</TableHead>
                                                <TableHead className="text-right font-semibold">Price/Unit</TableHead>
                                                <TableHead className="text-right font-semibold">Total</TableHead>
                                                <TableHead className="w-16"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orderItems.map(item => (
                                                <TableRow key={item.productId}>
                                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value || '0', 10))}
                                                                className="w-20 text-center h-9"
                                                                min="1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.price}
                                                            onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value))}
                                                            className="w-32 text-right h-9 ml-auto"
                                                            min="0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-gray-900">
                                                        {formatCurrency(item.total, locale)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => updateItemQuantity(item.productId, 0)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                                    No products added yet
                                </div>
                            )}
                        </div>

                        {/* Financial Details Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 pb-2 border-b">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                <span>Financial Details</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Discount ({formatCurrency(0, locale).replace(/[0-9.,]/g, '')})</Label>
                                    <Input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">
                                        Transport Cost (per trip × trips)
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={transportPerTrip}
                                            onChange={(e) => setTransportPerTrip(parseFloat(e.target.value) || 0)}
                                            className="h-11 flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                        />
                                        <span className="text-gray-500">×</span>
                                        <Input
                                            type="number"
                                            value={transportTrips}
                                            onChange={(e) => setTransportTrips(parseInt(e.target.value || '0', 10))}
                                            className="h-11 w-24 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                            placeholder="0"
                                            min="0"
                                        />
                                        <div className="min-w-[120px] text-right font-semibold text-gray-900">
                                            = {formatCurrency(transportTotal, locale)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-5 space-y-3 border border-purple-200">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(subtotal, locale)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Transport</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(transportTotal, locale)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-semibold text-red-600">- {formatCurrency(discount, locale)}</span>
                                </div>
                                <div className="border-t border-purple-200 pt-3 flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                                    <span className="text-2xl font-bold text-purple-600">{formatCurrency(grandTotal, locale)}</span>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Paid Amount</Label>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        className="h-10 flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                    <div className="min-w-[150px] text-right">
                                        <span className="text-sm text-gray-600">Due: </span>
                                        <span className="text-lg font-bold text-green-600">{formatCurrency(due, locale)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-11 bg-linear-to-r from-purple-600 to-blue-600 text-white"
                                disabled={isLoading || !selectedCustomer || orderItems.length === 0}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        {isEdit ? 'Update Sell' : 'Create Sell'}
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