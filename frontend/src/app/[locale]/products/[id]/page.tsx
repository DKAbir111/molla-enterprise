'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate, formatOrderCode } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { ChevronLeft, Package, TrendingUp, Layers, Tag } from 'lucide-react'
import { listSells as fetchSells, listProducts as fetchProducts } from '@/lib/api'
import { normalizeOrder, normalizeProduct } from '@/lib/api'

type SaleRow = { id: string; date: Date; orderId: string; quantity: number; price: number; total: number }

export default function ProductDetailsPage() {
  const tNav = useTranslations('nav')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const { products, addProduct } = useStore()

  const productId = params.id as string
  const product = products.find(p => p.id === productId)

  const [sales, setSales] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(false)

  // Ensure product exists on direct visits
  useEffect(() => {
    let mounted = true
    if (!product) {
      setLoading(true)
      fetchProducts<any[]>()
        .then(res => { if (!mounted) return; (res || []).map(normalizeProduct).forEach(addProduct) })
        .finally(() => { if (mounted) setLoading(false) })
    }
    return () => { mounted = false }
  }, [product, addProduct])

  // Load sales history for this product
  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchSells<any[]>()
      .then(res => {
        if (!mounted) return
        const orders = (res || []).map(normalizeOrder)
        const rows: SaleRow[] = []
        orders.forEach(o => {
          o.items.forEach(it => {
            if (it.productId === productId) {
              rows.push({ id: `${o.id}-${it.productId}`, date: o.createdAt, orderId: o.id, quantity: it.quantity, price: it.price, total: it.total })
            }
          })
        })
        rows.sort((a, b) => b.date.getTime() - a.date.getTime())
        setSales(rows)
      })
      .finally(() => setLoading(false))
  }, [productId])

  const summary = useMemo(() => {
    const totalQty = sales.reduce((s, r) => s + r.quantity, 0)
    const totalRevenue = sales.reduce((s, r) => s + r.total, 0)
    const ordersCount = new Set(sales.map(r => r.orderId)).size
    const last30Cut = new Date(); last30Cut.setDate(last30Cut.getDate() - 30)
    const qtyLast30 = sales.filter(r => r.date >= last30Cut).reduce((s, r) => s + r.quantity, 0)
    const avgPerDay = qtyLast30 / 30
    const avgSellPrice = totalQty > 0 ? totalRevenue / totalQty : 0
    return { totalQty, totalRevenue, ordersCount, avgPerDay, avgSellPrice }
  }, [sales])

  if (!product && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <Button onClick={() => router.push(`/${locale}/products`)} variant="outline" className="mt-2 flex items-center gap-2"><ChevronLeft className="h-4 w-4" />Back to Products</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/${locale}/products`)} className="flex items-center gap-1">
            <ChevronLeft className="h-5 w-5" /> Back
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{product?.name}</h1>
          <p className="text-gray-600">Product Details & Sales</p>
        </div>
        <div />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Sold (Qty)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.totalQty}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue, locale)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Sells</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.ordersCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Avg/day (last 30d)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.avgPerDay.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      {/* Product meta */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 flex items-center gap-2"><Layers className="h-4 w-4" /> Type</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-semibold">{product?.type || '-'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 flex items-center gap-2"><Tag className="h-4 w-4" /> Grade</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-semibold">{product?.grade || '-'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Sell Price / Unit</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-semibold">{formatCurrency(product?.price || 0, locale)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Stock Left</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-semibold">{product?.stock} {product?.unit}</div></CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date, locale)}</TableCell>
                  <TableCell className="font-medium">{formatOrderCode(row.orderId, row.date)}</TableCell>
                  <TableCell className="text-center">{row.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.price, locale)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(row.total, locale)}</TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-10">No sales yet for this product.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
