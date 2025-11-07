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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import type { Product } from '@/types'
import { Plus, Pencil, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { createProduct as apiCreateProduct, normalizeProduct } from '@/lib/api'
import { updateProduct as apiUpdateProduct, uploadProductImage } from '@/lib/api/product-api'
import { formatCurrency } from '@/lib/utils'
import { listDryingGains, createDryingGain } from '@/lib/api/drying-gain-api'
import { normalizeDryingGain } from '@/lib/api/normalize'
import type { DryingGain } from '@/types'

type Mode = 'create' | 'edit'

interface ProductModalProps {
  open: boolean
  mode: Mode
  onClose: () => void
  product?: Product | null
}

export function ProductModal({ open, mode, onClose, product }: ProductModalProps) {
  const t = useTranslations('products')
  const locale = useLocale()
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)

  const isEdit = mode === 'edit' && !!product

  const [name, setName] = React.useState('')
  const [type, setType] = React.useState('')
  const [grade, setGrade] = React.useState('')
  const [price, setPrice] = React.useState<number>(0)
  const [buyPrice, setBuyPrice] = React.useState<number>(0)
  const [otherCostPerUnit, setOtherCostPerUnit] = React.useState<number>(0)
  const [unit, setUnit] = React.useState('')
  const [stock, setStock] = React.useState<number>(0)
  const [active, setActive] = React.useState<boolean>(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [dryingGains, setDryingGains] = React.useState<DryingGain[]>([])
  const [dgQty, setDgQty] = React.useState<number>(0)
  const [dgSaving, setDgSaving] = React.useState(false)

  // initialize/reset when opening or product changes
  React.useEffect(() => {
    if (isEdit && product) {
      setName(product.name || '')
      setType(product.type || '')
      setGrade(product.grade || '')
      setPrice(product.price || 0)
      setBuyPrice(product.buyPrice || 0)
      setOtherCostPerUnit((product as any).otherCostPerUnit || 0)
      setUnit(product.unit || '')
      setStock(product.stock || 0)
      setActive(product.active !== false)
      setImagePreview(product.imageUrl || null)
      setImageFile(null)
      // Load drying gains for this product (lightweight)
      listDryingGains<any[]>(product.id).then((res) => setDryingGains((res || []).map(normalizeDryingGain))).catch(() => { })
    } else if (!open) {
      // noop when closed
    } else {
      // create mode defaults
      setName('')
      setType('')
      setGrade('')
      setPrice(0)
      setBuyPrice(0)
      setOtherCostPerUnit(0)
      setUnit('')
      setStock(0)
      setActive(true)
      setImagePreview(null)
      setImageFile(null)
      setDryingGains([])
      setDgQty(0)
    }
  }, [open, isEdit, product])

  const gainsQty = React.useMemo(() => (dryingGains || []).reduce((s, g) => s + Number(g.quantity || 0), 0), [dryingGains])
  const costfulQty = React.useMemo(() => Math.max(0, Number(stock || 0) - Number(gainsQty || 0)), [stock, gainsQty])
  const totalCost = React.useMemo(() => (costfulQty > 0 ? (buyPrice + (otherCostPerUnit || 0)) * costfulQty : 0), [costfulQty, buyPrice, otherCostPerUnit])
  const totalSell = React.useMemo(() => (stock > 0 ? price * stock : 0), [stock, price])
  const afterDryUnitPrice = React.useMemo(() => (Number(stock || 0) > 0 ? (totalCost / Number(stock || 0)) : 0), [totalCost, stock])

  const units = ['liter', 'feet', 'piece', 'ton', 'bag', 'cft', 'kg', 'meter', 'yard', 'gallon', 'cubicMeter']

  const handleClose = () => {
    revokePreview(imagePreview)
    setImageFile(null)
    onClose()
  }

  const revokePreview = React.useCallback((url?: string | null) => {
    try {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
    } catch { }
  }, [])

  const handlePickFile = React.useCallback((f: File | null | undefined) => {
    const prev = imagePreview
    if (f) {
      const url = URL.createObjectURL(f)
      setImageFile(f)
      setImagePreview(url)
      revokePreview(prev)
    }
  }, [imagePreview, revokePreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !type.trim() || !unit.trim()) {
      toast.error('Please fill in required fields')
      return
    }
    setIsLoading(true)
    try {
      if (isEdit && product) {
        // update
        const payload: Partial<Product> = {
          name,
          type,
          grade: grade || undefined,
          price: Number(price) || 0,
          otherCostPerUnit: Number(otherCostPerUnit) || 0,
          unit,
          stock: Number(stock) || 0,
          active,
        }
        const updated = await apiUpdateProduct<any>(product.id, payload)
        let normalized = normalizeProduct(updated)
        if (imageFile) {
          try {
            const withImage = await uploadProductImage<any>(product.id, imageFile)
            normalized = normalizeProduct(withImage)
          } catch { }
        }
        updateProduct(product.id, normalized as Partial<Product>)
        toast.success('Product updated')
        handleClose()
      } else {
        // create
        const created = await apiCreateProduct<any>({
          name: name.trim(),
          type: type.trim(),
          grade: grade.trim() || undefined,
          price,
          buyPrice,
          otherCostPerUnit,
          unit,
          stock,
        })
        let normalized = normalizeProduct(created)
        if (imageFile) {
          try {
            const withImage = await uploadProductImage<any>(normalized.id, imageFile)
            normalized = normalizeProduct(withImage)
          } catch { }
        }
        addProduct(normalized as Product)
        toast.success('Product added')
        handleClose()
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error(isEdit ? 'Failed to update product' : 'Failed to add product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent overlayClassName="bg-black/20 backdrop-blur-none" className="sm:max-w-2xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-linear-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {isEdit ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {isEdit ? t('editProduct') : t('addProduct')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-blue-100 text-base">
              {isEdit ? t('editProductDescription') : t('addProductDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="gap-6 md:flex md:items-start">
              {/* Image */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => { e.preventDefault(); handlePickFile(e.dataTransfer.files?.[0]) }}
                    className="group relative h-40 w-[150px] rounded-xl border border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer"
                    aria-label="Upload product image"
                  >
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm text-gray-400">No image</span>
                    )}
                    {/* subtle hover overlay without text */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                    {imagePreview && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); revokePreview(imagePreview); setImagePreview(null); setImageFile(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); revokePreview(imagePreview); setImagePreview(null); setImageFile(null) } }}
                        className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/95 border border-gray-300 shadow hover:bg-red-50 cursor-pointer"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4 text-gray-700" />
                      </span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    id="product-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Right side: first row name, second row type + grade */}
              <div className="space-y-5 self-start min-w-0 md:flex-1">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">{t('productName')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={t('enterProductName')} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">{t('productType')}</Label>
                    <Input id="type" value={type} onChange={(e) => setType(e.target.value)} required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={t('exampleProductType')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">{t('productGrade')}</Label>
                    <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={t('exampleProductGrade')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Unit / Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-medium text-gray-700">{t('unit')}</Label>
                <Select onValueChange={setUnit} value={unit || undefined} required>
                  <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <SelectValue placeholder={t('selectUnit')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-white border border-gray-200 shadow-lg">
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>{t(u)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-medium text-gray-700">{t('stock')}</Label>
                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(parseFloat(e.target.value) || 0)} required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" min="0" />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Buy Price / Unit ({t('currencySymbol')})</Label>
                <Input type="number" value={buyPrice} onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" min={0} step="0.01" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Other Cost / Unit ({t('currencySymbol')})</Label>
                <Input type="number" value={otherCostPerUnit} onChange={(e) => setOtherCostPerUnit(parseFloat(e.target.value) || 0)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" min={0} step="0.01" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Sell Price / Unit ({t('currencySymbol')})</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" min={0} step="0.01" />
              </div>
            </div>

            {/* After-dry unit price moved next to Drying Gain input */}

            {/* Drying Gain (edit mode) */}
            {isEdit && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="text-base font-semibold text-gray-900">Drying Gain</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Add Quantity ({product?.unit})</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={dgQty}
                      onChange={(e) => {
                        const n = Math.max(0, parseInt(e.target.value || '0', 10) || 0)
                        setDgQty(n)
                      }}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">After-dry Unit Price (auto)</Label>
                    <div className="h-11 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center font-medium">
                      {formatCurrency(afterDryUnitPrice, locale)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 opacity-0 select-none">Action</Label>
                    <Button type="button" className="h-11" disabled={dgSaving || dgQty <= 0} onClick={async () => {
                      if (!product || dgQty <= 0) return
                      setDgSaving(true)
                      try {
                        const created = await createDryingGain<any>({ productId: product.id, quantity: dgQty })
                        setDryingGains((prev) => [normalizeDryingGain(created), ...prev])
                        updateProduct(product.id, { stock: (product.stock || 0) + dgQty })
                        setStock((s) => (Number(s || 0) + dgQty))
                        setDgQty(0)
                      } catch { }
                      finally { setDgSaving(false) }
                    }}>Add Gain</Button>
                  </div>
                </div>
                {dryingGains.length > 0 && (
                  <div className="border rounded-lg">
                    <div className="px-3 py-2 text-sm text-gray-600 border-b bg-gray-50">Recent Gains</div>
                    <div className="max-h-40 overflow-y-auto divide-y">
                      {dryingGains.slice(0, 5).map((g) => (
                        <div key={g.id} className="px-3 py-2 text-sm flex justify-between">
                          <span>{new Date(g.createdAt).toLocaleDateString()}</span>
                          <span className="font-medium">+{g.quantity} {product?.unit}</span>
                        </div>
                      ))}
                      {dryingGains.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">No gains yet</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Totals (auto-calculated, read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Total Cost (BDT)</Label>
                <div className="h-11 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center font-medium">
                  {formatCurrency(totalCost, locale)}
                </div>
                <div className="text-xs text-gray-500">Auto = (buy + other) × (stock − drying gains)</div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Total Sell Value (BDT)</Label>
                <div className="h-11 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center font-medium">
                  {formatCurrency(totalSell, locale)}
                </div>
              </div>
            </div>

            {/* Active toggle only for edit */}
            {isEdit && (
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-gray-700">Active</Label>
                <button
                  type="button"
                  onClick={() => setActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-purple-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-11 border-gray-300 hover:bg-gray-50" disabled={isLoading}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="flex-1 h-11 bg-linear-to-r from-purple-600 to-blue-600 text-white" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEdit ? t('saving') : t('adding')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEdit ? t('saveChanges') : t('addProduct')}
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
