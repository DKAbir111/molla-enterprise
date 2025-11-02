'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { AddProductModal } from '@/components/products/AddProductModal'
import { EditProductModal } from '@/components/products/EditProductModal'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { Product } from '@/types'
import { listProducts as fetchProducts, deleteProduct as apiDeleteProduct } from '@/lib/api'
import { toast } from 'sonner'
import { normalizeProduct } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ProductsPage() {
  const t = useTranslations('products')
  const locale = useLocale()
  const { products, addProduct, deleteProduct } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null)

  // Load from API
  useEffect(() => {
    let mounted = true
    if (products.length === 0) {
      fetchProducts<any[]>()
        .then((res) => {
          if (!mounted) return
          (res || []).map(normalizeProduct).forEach(addProduct)
        })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [products.length, addProduct])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGrade = filterGrade === 'all' || product.grade === filterGrade
    return matchesSearch && matchesGrade
  })

  const getProductImage = (type: string) => {
    const gradients = {
      vitiBalu: 'from-yellow-400 to-orange-500',
      gojariyaBalu: 'from-orange-400 to-red-500',
      pakshiBalu: 'from-blue-400 to-indigo-500',
      seletBalu: 'from-green-400 to-teal-500',
      pathor: 'from-gray-400 to-gray-600',
      khoya: 'from-amber-400 to-yellow-600',
      rod: 'from-slate-400 to-slate-600',
      cement: 'from-stone-400 to-stone-600',
    }
    return gradients[type as keyof typeof gradients] || 'from-purple-400 to-pink-500'
  }

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setProductToDeleteId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (productToDeleteId) {
      try {
        await apiDeleteProduct(productToDeleteId)
        deleteProduct(productToDeleteId)
        toast.success('Product deleted')
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to delete product. It may be used in orders.'
        toast.error(msg)
      }
      setProductToDeleteId(null)
      setIsDeleteModalOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4 flex-1">
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
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="type1">{t('type1')}</SelectItem>
                <SelectItem value="medium">{t('medium')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addProduct')}
        </Button>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Product Modal */}
      {selectedProduct && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={selectedProduct}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('deleteConfirmationTitle')}
        description={t('deleteConfirmationDescription')}
      />

      {/* Search and Filters moved above */}

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div>
            <h3 className="text-lg font-semibold mb-1">{t('emptyTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('emptyDescription')}</p>
            <Button onClick={() => setIsAddModalOpen(true)}>{t('addProduct')}</Button>
          </CardContent>
        </Card>
      ) : (
      /* Products Grid */
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product, idx) => (
          <Card key={`${product.id}-${idx}`} className="hover:shadow-lg transition-all group">
            <CardHeader className="pb-4">
              <div className={`h-32 rounded-lg bg-gradient-to-br ${getProductImage(product.type)} mb-4 flex items-center justify-center text-white`}>
                <span className="text-4xl font-bold opacity-50">
                  {product?.name?.split(" ")[0]}
                </span>
              </div>
              <CardTitle className="text-lg">{product?.name}</CardTitle>
              {product.grade && (
                <span className="text-sm text-gray-500 capitalize">
                  {product.grade}
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('pricePerUnit')}</span>
                  <span className="font-semibold">
                    {formatCurrency(product.price, locale)}/{product.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('stock')}</span>
                  <span className="font-semibold text-green-600">
                    {product.stock} {product.unit}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={`/${locale}/products/${product.id}`}>
                  <Button variant="outline" size="sm" className="flex-1">
                    {t('view') || 'View'}
                  </Button>
                </a>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(product)}>
                  <Edit className="h-3 w-3 mr-1" />
                  {t('edit')}
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(product.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
