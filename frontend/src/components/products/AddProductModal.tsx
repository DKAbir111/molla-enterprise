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
import { Plus, Warehouse, Tag, Layers, Save } from 'lucide-react'
import { toast } from 'sonner'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const t = useTranslations('products')
  const addProduct = useStore((state) => state.addProduct)

  const [name, setName] = React.useState('')
  const [type, setType] = React.useState('')
  const [grade, setGrade] = React.useState('')
  const [price, setPrice] = React.useState<number>(0)
  const [unit, setUnit] = React.useState('')
  const [stock, setStock] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    const newProduct: Product = {
      id: String(Date.now()),
      name,
      type,
      grade,
      price,
      unit,
      stock,
    }

    addProduct(newProduct)
    toast.success('Product added')
    onClose()

    setName('')
    setType('')
    setGrade('')
    setPrice(0)
    setUnit('')
    setStock(0)
    setIsLoading(false)
  }

  const units = ['liter', 'feet', 'piece', 'ton', 'bag', 'cft', 'kg', 'meter', 'yard', 'gallon', 'cubicMeter']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 bg-white border-0 shadow-2xl overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plus className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {t('addProduct')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-blue-100 text-base">
              {t('addProductDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form content */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
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
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
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
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
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
                    {t('pricePerUnit')} ({t('currencySymbol')})
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {t('unit')}
                  </Label>
                  <Select onValueChange={setUnit} value={unit} required>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
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
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
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
                onClick={onClose}
                className="flex-1 h-11 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('adding')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {t('addProduct')}
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
