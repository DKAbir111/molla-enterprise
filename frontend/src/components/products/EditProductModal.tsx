'use client'

import * as React from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { Product } from '@/types'
import { Edit3, Warehouse, Tag, Layers, Save, ImagePlus, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { updateProduct as apiUpdateProduct } from '@/lib/api/product-api'
import { uploadProductImage } from '@/lib/api/product-api'
import { normalizeProduct } from '@/lib/api'

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const t = useTranslations('products')
  const updateProduct = useStore((state) => state.updateProduct)

  const [name, setName] = React.useState(product?.name || '')
  const [type, setType] = React.useState(product?.type || '')
  const [grade, setGrade] = React.useState(product?.grade || '')
  const [price, setPrice] = React.useState<number>(product?.price || 0)
  const [unit, setUnit] = React.useState(product?.unit || '')
  const [stock, setStock] = React.useState<number>(product?.stock || 0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(product?.imageUrl || null)
  const [active, setActive] = React.useState<boolean>(product?.active !== false)

  // Update form fields when product changes
  React.useEffect(() => {
    if (product) {
      setName(product.name || '')
      setType(product.type || '')
      setGrade(product.grade || '')
      setPrice(product.price || 0)
      setUnit(product.unit || '')
      setStock(product.stock || 0)
      setActive(product.active !== false)
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that product exists
    if (!product) {
      console.error('No product to update')
      toast.error('No product to update')
      return
    }

    setIsLoading(true)

    const updatedProduct: Partial<Product> = {
      name,
      type,
      grade,
      price: Number(price) || 0,
      unit,
      stock: Number(stock) || 0,
      active,
    }
    try {
      // Persist main fields
      const updated = await apiUpdateProduct<any>(product.id, updatedProduct)
      let normalized = normalizeProduct(updated)
      // Upload image if selected
      if (imageFile) {
        try {
          const withImage = await uploadProductImage<any>(product.id, imageFile)
          normalized = normalizeProduct(withImage)
        } catch {}
      }
      // Update store
      updateProduct(product.id, normalized as Partial<Product>)
      toast.success('Product updated')
      onClose()
    } catch {
      toast.error('Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form to original values when closing
    if (product) {
      setName(product.name || '')
      setType(product.type || '')
      setGrade(product.grade || '')
      setPrice(product.price || 0)
      setUnit(product.unit || '')
      setStock(product.stock || 0)
    }
    onClose()
  }

  const units = ['liter', 'feet', 'piece', 'ton', 'bag', 'cft', 'kg', 'meter', 'yard', 'gallon', 'cubicMeter']

  // Don't render if no product is provided
  if (!product) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Edit3 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {t('editProduct')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-emerald-100 text-base">
              {t('editProductDescription')} &quot;{product.name}&quot;
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form content */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Product Image</Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </div>
                <div>
                  <input id="edit-product-image" type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setImageFile(f)
                    setImagePreview(f ? URL.createObjectURL(f) : (product?.imageUrl || null))
                  }} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('edit-product-image')?.click()}>
                    <ImagePlus className="h-4 w-4 mr-1" /> Change Image
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 py-1">
              <Label className="text-sm font-medium text-gray-700">Active</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setActive(v => !v)}>
                {active ? <ToggleRight className="h-4 w-4 mr-1 text-green-600" /> : <ToggleLeft className="h-4 w-4 mr-1 text-gray-500" />} {active ? 'Active' : 'Inactive'}
              </Button>
            </div>

            {/* Product Information Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t('productName')}
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200"
                    placeholder={t('enterProductName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {t('productType')}
                  </Label>
                  <Input
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200"
                    placeholder={t('exampleProductType')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                  {t('productGrade')}
                </Label>
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200"
                  placeholder={t('exampleProductGrade')}
                />
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {/* Optional icon for symmetry: <DollarSign className="h-4 w-4" /> */}
                    {t('pricePerUnit')} ({t('currencySymbol')})
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {/* Optional icon for symmetry: <Package className="h-4 w-4" /> */}
                    {t('unit')}
                  </Label>
                  <Select onValueChange={setUnit} value={unit} required>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                      <SelectValue placeholder={t('selectUnit')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white border border-gray-200 shadow-lg">
                      {units.map(u => (
                        <SelectItem key={u} value={u} className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50">
                          {t(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Warehouse className="h-4 w-4" />
                    {t('stock')}
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                    required
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

            </div>
            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-medium bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('saving')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {t('saveChanges')}
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
