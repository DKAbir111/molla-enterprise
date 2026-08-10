'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'
import { cn, formatCurrency } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, X } from 'lucide-react'
import { ProductModal } from '@/components/products/ProductModal'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { StatRail, StatTile } from '@/components/shared/StatRail'
import { Fab } from '@/components/shared/Fab'
import { Product } from '@/types'
import { listProducts as fetchProducts, deleteProduct as apiDeleteProduct } from '@/lib/api'
import { toast } from 'sonner'
import { normalizeProduct } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/* Matches Button variant="outline" size="icon". Used for the View link, which
   has to be a real anchor for prefetching and open-in-new-tab to work — Button
   has no `asChild` escape hatch to render one. */
const ICON_ACTION_CLASS =
  'tap inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border ' +
  'bg-transparent text-sm font-medium text-foreground transition-all hover:bg-surface-hover ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  // From md up it matches the original `<Button variant="outline" size="sm" className="flex-1">`.
  'md:h-9 md:w-auto md:flex-1 md:px-3'

export default function ProductsPage() {
  const t = useTranslations('products')
  const locale = useLocale()
  const { products, addProduct, deleteProduct } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; product?: Product | null }>({ open: false, mode: 'create', product: null })
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
        .catch(() => { })
    }
    return () => { mounted = false }
  }, [products.length, addProduct])

  // Mini dashboard stats
  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter(p => p.active !== false).length
    const out = products.filter(p => Number(p.stock || 0) <= 0).length
    const value = products.reduce((s, p) => s + (Number(p.price || 0) * Number(p.stock || 0)), 0)
    return { total, active, out, value }
  }, [products])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGrade = filterGrade === 'all' || product.grade === filterGrade
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? product.active !== false : product.active === false)
    return matchesSearch && matchesGrade && matchesStatus
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
    return gradients[type as keyof typeof gradients] || 'from-teal-400 to-teal-500'
  }

  const handleEditClick = (product: Product) => setModal({ open: true, mode: 'edit', product })

  const handleDeleteClick = (id: string) => {
    setProductToDeleteId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (productToDeleteId) {
      try {
        await apiDeleteProduct(productToDeleteId)
        deleteProduct(productToDeleteId)
        toast.success(t('deleted'))
      } catch (err: any) {
        const msg = err?.response?.data?.message || t('deleteFailed')
        toast.error(msg)
      }
      setProductToDeleteId(null)
      setIsDeleteModalOpen(false)
    }
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Search + filters. On a phone the search field owns its own row and  */}
      {/* the two filters split the next one; on desktop they share a line    */}
      {/* with the Add button.                                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-3 md:flex md:items-center md:justify-between md:gap-4 md:space-y-0">
        <div className="space-y-3 md:flex md:flex-1 md:items-center md:gap-4 md:space-y-0">
          <div className="relative md:w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
            <Input
              type="search"
              inputMode="search"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 pr-10 md:h-10"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={t('search')}
                onClick={() => setSearchQuery('')}
                className="tap absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-subtle-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="h-12 md:h-10 md:w-44">
                <SelectValue placeholder={t('filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="type1">{t('type1')}</SelectItem>
                <SelectItem value="medium">{t('medium')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-12 md:h-10 md:w-44">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile uses the floating action button at the bottom of the screen
            instead — within thumb reach, and it stays put while scrolling. */}
        <Button className="hidden shrink-0 items-center gap-2 md:flex" onClick={() => setModal({ open: true, mode: 'create' })}>
          <Plus className="h-4 w-4" /> {t('addProduct')}
        </Button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Stats. Four stacked cards eat an entire phone screen before the      */}
      {/* first product, so on mobile they become a swipeable rail.           */}
      {/* ---------------------------------------------------------------- */}
      <StatRail>
        <StatTile label={t('totalProducts')} value={stats.total} />
        <StatTile label={t('activeProducts')} value={stats.active} tone="text-success" />
        <StatTile label={t('outOfStock')} value={stats.out} tone="text-danger" />
        <StatTile label={t('inventoryValue')} value={formatCurrency(stats.value, locale)} tone="text-info" />
      </StatRail>

      {/* Product Modal (create/edit) */}
      <ProductModal
        open={modal.open}
        mode={modal.mode}
        product={modal.product || null}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('deleteConfirmationTitle')}
        description={t('deleteConfirmationDescription')}
      />

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="px-4 py-12 text-center md:py-16">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-2xl text-primary-foreground">+</div>
            <h3 className="mb-1 text-lg font-semibold">{t('emptyTitle')}</h3>
            <p className="mb-4 text-muted-foreground">{t('emptyDescription')}</p>
            <Button onClick={() => setModal({ open: true, mode: 'create' })}>{t('addProduct')}</Button>
          </CardContent>
        </Card>
      ) : (
        /* ------------------------------------------------------------ */
        /* One card structure that reflows: a horizontal list row on a    */
        /* phone, a vertical tile from `sm` up. No duplicated markup.     */
        /* ------------------------------------------------------------ */
        <div className="grid gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, idx) => (
            <Card
              key={`${product.id}-${idx}`}
              className={cn(
                'group relative flex flex-row overflow-hidden transition-all hover:shadow-lg md:flex-col',
                product.awaitingPurchase !== false ? 'border-warning bg-warning-subtle' : 'bg-surface'
              )}
            >
              {/* Desktop keeps the original badges floating over the image. On a
                  phone the image is a small square to the left, so they would
                  land on top of the title — they move inline below instead. */}
              <div className="pointer-events-none absolute inset-x-2 top-2 z-10 hidden items-start justify-between md:flex">
                <span>
                  {product.awaitingPurchase !== false && (
                    <span className="rounded bg-warning-subtle px-2 py-0.5 text-xs text-warning">{t('awaitingPurchase')}</span>
                  )}
                </span>
                <span>
                  {!product.active && (
                    <span className="rounded bg-danger-subtle px-2 py-0.5 text-xs text-danger">{t('inactive')}</span>
                  )}
                </span>
              </div>

              {/* Thumbnail: a fixed square beside the text on mobile, the
                  original full-width banner from md up. */}
              <div
                className={cn(
                  'h-28 w-28 shrink-0 overflow-hidden md:mb-4 md:h-32 md:w-full md:rounded-lg',
                  product.imageUrl
                    ? ''
                    : `flex items-center justify-center bg-linear-to-br text-white ${getProductImage(product.type)}`
                )}
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="truncate px-2 text-2xl font-bold opacity-50 md:text-4xl">
                    {product?.name?.split(' ')[0]}
                  </span>
                )}
              </div>

              <CardContent className="flex min-w-0 flex-1 flex-col p-3 md:p-6 md:pt-0">
                {/* Mobile-only inline status chips (see the note above). */}
                {(product.active === false || product.awaitingPurchase !== false) && (
                  <div className="mb-1.5 flex flex-wrap gap-1 md:hidden">
                    {product.awaitingPurchase !== false && (
                      <span className="rounded bg-warning-subtle px-1.5 py-0.5 text-[10px] font-medium text-warning">Awaiting Purchase</span>
                    )}
                    {product.active === false && (
                      <span className="rounded bg-danger-subtle px-1.5 py-0.5 text-[10px] font-medium text-danger">Inactive</span>
                    )}
                  </div>
                )}

                <h3 className="truncate text-base font-semibold leading-tight text-foreground md:text-lg">
                  {product?.name}
                </h3>
                {product.grade && (
                  <span className="text-xs capitalize text-subtle-foreground md:text-sm">{product.grade}</span>
                )}

                <div className="mt-2 space-y-1 md:mt-4 md:space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-subtle-foreground md:text-sm">{t('pricePerUnit')}</span>
                    <span className="truncate text-sm font-semibold md:text-base">
                      {formatCurrency(product.price, locale)}/{product.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-subtle-foreground md:text-sm">{t('stock')}</span>
                    <span className={cn(
                      'truncate text-sm font-semibold md:text-base',
                      Number(product.stock || 0) <= 0 ? 'text-danger' : 'text-success'
                    )}>
                      {product.stock} {product.unit}
                    </span>
                  </div>
                </div>

                {/* Desktop keeps the original hover-to-reveal labelled buttons.
                    On touch there is no hover, so `opacity-0` made these
                    permanently unreachable — mobile shows icon buttons instead. */}
                <div className="mt-auto flex items-center gap-1.5 pt-3 transition-opacity md:mt-4 md:gap-2 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <Link
                    href={`/${locale}/products/${product.id}`}
                    aria-label={t('view')}
                    title={t('view')}
                    className={ICON_ACTION_CLASS}
                  >
                    <Eye className="h-4 w-4 md:hidden" />
                    <span className="hidden md:inline">{t('view')}</span>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('edit')}
                    title={t('edit')}
                    className="tap md:w-auto md:flex-1 md:px-3"
                    onClick={() => handleEditClick(product)}
                  >
                    <Edit className="h-4 w-4 md:mr-1 md:h-3 md:w-3" />
                    <span className="hidden md:inline">{t('edit')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('delete')}
                    title={t('delete')}
                    className="tap text-danger hover:text-danger"
                    onClick={() => handleDeleteClick(product.id)}
                  >
                    <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Fab onClick={() => setModal({ open: true, mode: 'create' })} label={t('addProduct')} />
    </div>
  )
}
