'use client'

import * as React from 'react'
import { useLocale } from 'next-intl'
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
import type { Order, OrderItem, Product } from '@/types'
import { ShoppingBag, Edit3, Save, Plus, Minus, X, Search, Building2, Package, DollarSign, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { listProducts as fetchProducts } from '@/lib/api'
import { listVendors } from '@/lib/api/vendor-api'
import { createBuy as apiCreateBuy, updateBuy as apiUpdateBuy, updateBuyItems } from '@/lib/api/buy-api'
import { normalizeProduct, normalizeOrder } from '@/lib/api'

type Mode = 'create' | 'edit'

interface BuyModalProps {
    open: boolean
    mode: Mode
    onClose: () => void
    buy?: any | null
    onSaved?: (b: any) => void
}

export function BuyModal({ open, mode, onClose, buy, onSaved }: BuyModalProps) {
    const locale = useLocale()
    const { products, addBuy, updateBuy: updateBuyStore, addProduct } = useStore()

    const isEdit = mode === 'edit' && !!buy

    const [vendorName, setVendorName] = React.useState('')
    const [vendorPhone, setVendorPhone] = React.useState('')
    const [vendorAddress, setVendorAddress] = React.useState('')
    const [orderItems, setOrderItems] = React.useState<OrderItem[]>([])
    const [productSearch, setProductSearch] = React.useState('')
    const [paidAmount, setPaidAmount] = React.useState(0)
    const [transportPerTrip, setTransportPerTrip] = React.useState(0)
    const [transportTrips, setTransportTrips] = React.useState(0)
    const [otherCost, setOtherCost] = React.useState(0)
    const [isLoading, setIsLoading] = React.useState(false)
    const [showProductDropdown, setShowProductDropdown] = React.useState(false)
    const [vendors, setVendors] = React.useState<any[]>([])
    const [vendorSearchOpen, setVendorSearchOpen] = React.useState(false)

    // Load products and vendors
    React.useEffect(() => {
        let mounted = true
        if (products.length === 0) {
            fetchProducts<any[]>().then(res => {
                if (mounted) (res || []).map(normalizeProduct).forEach(addProduct)
            }).catch(() => { })
        }
        listVendors<any[]>().then(res => { if (mounted) setVendors(res || []) }).catch(() => { })
        return () => { mounted = false }
    }, [products.length, addProduct])

    // Initialize/reset when opening or buy changes
    React.useEffect(() => {
        if (isEdit && buy) {
            setVendorName(buy.vendorName || '')
            setVendorPhone(buy.vendorPhone || '')
            setVendorAddress('')
            setOrderItems(buy.items || [])
            setPaidAmount(buy.paidAmount || 0)
            setTransportPerTrip(buy.transportPerTrip || 0)
            setTransportTrips(buy.transportTrips || 0)
            setOtherCost(buy.otherCost || 0)
        } else if (!open) {
            // noop when closed
        } else {
            // create mode defaults
            setVendorName('')
            setVendorPhone('')
            setVendorAddress('')
            setOrderItems([])
            setPaidAmount(0)
            setTransportPerTrip(0)
            setTransportTrips(0)
            setOtherCost(0)
        }
        setProductSearch('')
        setShowProductDropdown(false)
    }, [open, isEdit, buy])

    const filteredProducts = products
        .filter(p => p.active !== false)
        .filter(p =>
            (productSearch === '' || p.name.toLowerCase().includes(productSearch.toLowerCase())) &&
            !orderItems.some(i => i.productId === p.id)
        )

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
    const transportTotal = transportPerTrip * transportTrips
    const additionalCosts = otherCost
    const grandTotal = subtotal + transportTotal + additionalCosts
    const due = Math.max(0, grandTotal - paidAmount)

    const handleClose = () => {
        onClose()
    }

    const selectVendor = (v: any) => {
        setVendorName(v.name || '')
        setVendorPhone(v.phone || '')
        setVendorAddress(v.address || '')
        setVendorSearchOpen(false)
    }

    const filteredVendors = React.useMemo(() => {
        const q = vendorName.trim().toLowerCase()
        const base = vendors || []
        if (q === '') return base.slice(0, 8)
        return base.filter((v: any) => v.name.toLowerCase().includes(q) || (v.phone || '').toLowerCase().includes(q)).slice(0, 8)
    }, [vendors, vendorName])

    const addProductToOrder = (product: Product) => {
        const price = (product.buyPrice || product.price || 0) + (product.otherCostPerUnit || 0)
        const initialQty = Number(product.stock || 0) > 0 ? Number(product.stock) : 1
        const newItem: OrderItem = {
            productId: product.id,
            productName: product.name,
            quantity: initialQty,
            price: price,
            total: price * initialQty
        }
        setOrderItems(prev => [...prev, newItem])
        setProductSearch('')
        setShowProductDropdown(false)
    }

    const updateItemPrice = (productId: string, price: number) => {
        const next = isNaN(price) || price < 0 ? 0 : price
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
        if (!vendorName.trim() || orderItems.length === 0) {
            toast.error('Please enter vendor name and add items')
            return
        }
        setIsLoading(true)
        try {
            if (isEdit && buy) {
                // Update existing buy
                await apiUpdateBuy(buy.id, {
                    vendorName,
                    vendorPhone: vendorPhone || undefined,
                    paidAmount,
                    transportPerTrip,
                    transportTrips,
                    // otherCost not persisted
                })
                const itemsPayload = {
                    items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price }))
                }
                await updateBuyItems<any>(buy.id, itemsPayload)
                const updatedLocal = {
                    ...buy,
                    vendorName,
                    vendorPhone,
                    items: orderItems,
                    paidAmount,
                    transportPerTrip,
                    transportTrips,
                    transportTotal,
                    otherCost,
                    total: subtotal
                }
                updateBuyStore?.(buy.id, updatedLocal as any)
                toast.success('Purchase updated successfully')
                onSaved?.(updatedLocal)
            } else {
                // Create new buy
                const payload = {
                    vendorName: vendorName.trim(),
                    vendorPhone: vendorPhone.trim() || undefined,
                    items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
                    paidAmount,
                    transportPerTrip,
                    transportTrips,
                    // otherCost not persisted
                }
                const created = await apiCreateBuy<any>(payload)
                const normalized = normalizeOrder(created)
                addBuy?.(normalized as any)
                toast.success('Purchase created successfully')
                onSaved?.(created)
            }
            handleClose()
        } catch (err) {
            toast.error(isEdit ? 'Failed to update purchase' : 'Failed to create purchase')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent overlayClassName="bg-black/20 backdrop-blur-none" className="sm:max-w-6xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                {isEdit ? <Edit3 className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                            </div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                {isEdit ? 'Edit Purchase' : 'New Purchase'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-emerald-100 text-base">
                            {isEdit ? 'Update purchase information and items' : 'Record a new purchase from vendor'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-8 py-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Vendor Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 pb-2 border-b">
                                <Building2 className="h-5 w-5 text-emerald-600" />
                                <span>Vendor Information</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="vendor" className="text-sm font-medium text-gray-700">Vendor</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                                        <Input
                                            id="vendor"
                                            placeholder="Search vendor by name..."
                                            value={vendorName}
                                            onChange={(e) => { setVendorName(e.target.value); setVendorSearchOpen(true) }}
                                            onFocus={() => setVendorSearchOpen(true)}
                                            onClick={() => setVendorSearchOpen(true)}
                                            onBlur={() => setTimeout(() => setVendorSearchOpen(false), 200)}
                                            className="pl-10 h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                            required
                                        />
                                        {vendorSearchOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                {filteredVendors.map((v: any) => (
                                                        <div key={v.id} className="p-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => selectVendor(v)}>
                                                            <div className="font-semibold text-gray-900">{v.name}</div>
                                                            <div className="text-xs text-gray-500">{v.phone || ''}{v.address ? ` • ${v.address}` : ''}</div>
                                                        </div>
                                                    ))}
                                                {filteredVendors.length === 0 && (
                                                    <div className="p-3 text-sm text-gray-500">No vendors found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                                    <Input value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="e.g., +880 1XXXXXXXXX" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Address</Label>
                                    <Input value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Street, City, Country" />
                                </div>
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 pb-2 border-b">
                                <Package className="h-5 w-5 text-emerald-600" />
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
                                            className="pl-10 h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                        />
                                        {showProductDropdown && filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                {filteredProducts.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="p-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                        onClick={() => addProductToOrder(p)}
                                                    >
                                                        <div className="font-semibold text-gray-900">{p.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            Buy: {formatCurrency((p.buyPrice || p.price || 0) + (p.otherCostPerUnit || 0), locale)} per {p.unit}
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
                                                <TableHead className="text-right font-semibold">Unit Cost</TableHead>
                                                <TableHead className="text-right font-semibold">Total Cost</TableHead>
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
                                                            onChange={(e) => updateItemQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                                            className="w-20 text-center h-9"
                                                            min="0.01"
                                                            step="0.01"
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
                                                        {/* show unit to the right */}
                                                        <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                                                            {(() => {
                                                                const p = products.find(p => p.id === item.productId)
                                                                return p?.unit ? p.unit : ''
                                                            })()}
                                                        </span>
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
                                                    <div>{formatCurrency(item.total, locale)}</div>
                                                    <div className="text-xs text-gray-500 font-normal">
                                                        {formatCurrency(item.price, locale)} × {item.quantity}
                                                    </div>
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

                        {/* Additional Costs Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 pb-2 border-b">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                                <span>Additional Costs</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4" />
                                            Transport Cost (per trip × trips)
                                        </div>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={transportPerTrip}
                                            onChange={(e) => setTransportPerTrip(parseFloat(e.target.value) || 0)}
                                            className="h-11 flex-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                        />
                                        <span className="text-gray-500">×</span>
                                        <Input
                                            type="number"
                                            value={transportTrips}
                                            onChange={(e) => setTransportTrips(parseInt(e.target.value || '0', 10))}
                                            className="h-11 w-24 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="0"
                                            min="0"
                                        />
                                        <div className="min-w-[120px] text-right font-semibold text-gray-900">
                                            = {formatCurrency(transportTotal, locale)}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Other Cost</Label>
                                    <Input
                                        type="number"
                                        value={otherCost}
                                        onChange={(e) => setOtherCost(parseFloat(e.target.value) || 0)}
                                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                    <div className="text-xs text-gray-500">Includes labor/loading, packaging, tips, etc.</div>
                                </div>
                            </div>
                            {/* removed separate other costs input */}
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-5 space-y-3 border border-emerald-200">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Products Subtotal</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(subtotal, locale)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Transport Cost</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(transportTotal, locale)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Other Cost</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(otherCost, locale)}</span>
                                </div>
                                <div className="border-t border-emerald-200 pt-3 flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total Purchase Cost</span>
                                    <span className="text-2xl font-bold text-emerald-600">{formatCurrency(grandTotal, locale)}</span>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Paid Amount</Label>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        className="h-10 flex-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                    <div className="min-w-[150px] text-right">
                                        <span className="text-sm text-gray-600">Due: </span>
                                        <span className="text-lg font-bold text-red-600">{formatCurrency(due, locale)}</span>
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
                                className="flex-1 h-11 bg-linear-to-r from-emerald-600 to-teal-600 text-white"
                                disabled={isLoading || !vendorName.trim() || orderItems.length === 0}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        {isEdit ? 'Update Purchase' : 'Create Purchase'}
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
