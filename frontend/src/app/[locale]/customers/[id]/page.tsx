/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useRef } from 'react'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLocale } from 'next-intl'
import {
  ArrowLeft,
  Download,
  Printer,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  Package,
  FileText,
  ChevronLeft
} from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { generateCustomerPDF } from '@/lib/pdfGenerator'
import { listOrders as fetchOrders, getCustomer as apiGetCustomer } from '@/lib/api'
import { normalizeOrder, normalizeCustomer } from '@/lib/api'

interface PurchaseHistoryItem {
  id: string
  date: Date
  productName: string
  quantity: number
  price: number
  total: number
  invoiceId: string
}

export default function CustomerDetailsPage() {
  const t = useTranslations('customerDetails')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const { customers, updateCustomer, addCustomer } = useStore()
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([])
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const customerId = params.id as string
  const customer = customers.find(c => c.id === customerId)

  // Fetch single customer on direct access/refresh
  useEffect(() => {
    let mounted = true
    if (!customer && customerId) {
      setLoadingCustomer(true)
      apiGetCustomer<any>(customerId)
        .then((c) => { if (mounted && c) addCustomer(normalizeCustomer(c)) })
        .catch(() => {})
        .finally(() => { if (mounted) setLoadingCustomer(false) })
    }
    return () => { mounted = false }
  }, [customerId, customer, addCustomer])

  // Load customer's purchase history once per customer and avoid loops
  useEffect(() => {
    let mounted = true
    fetchOrders<any[]>()
      .then((res) => {
        if (!mounted) return
        const all = (res || []).map(normalizeOrder)
        const customerOrders = all.filter((o) => o.customerId === customerId)
        const history: PurchaseHistoryItem[] = []
        customerOrders.forEach(order => {
          order.items.forEach(item => {
            history.push({
              id: `${order.id}-${item.productId}`,
              date: order.createdAt as Date,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              invoiceId: order.id
            })
          })
        })
        history.sort((a, b) => b.date.getTime() - a.date.getTime())
        setPurchaseHistory(history)

        // Update aggregates only if they changed to prevent re-renders loops
        const totalOrders = customerOrders.length
        const totalSpent = history.reduce((sum, h) => sum + h.total, 0)
        const current = customers.find(c => c.id === customerId)
        if (current && (current.totalOrders !== totalOrders || current.totalSpent !== totalSpent)) {
          updateCustomer(customerId, { totalOrders, totalSpent })
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [customerId])

  // Group products by name and sum quantities
  const productSummary = purchaseHistory.reduce((acc, item) => {
    if (acc[item.productName]) {
      acc[item.productName].quantity += item.quantity
      acc[item.productName].totalAmount += item.total
      acc[item.productName].transactions += 1
    } else {
      acc[item.productName] = {
        quantity: item.quantity,
        totalAmount: item.total,
        transactions: 1,
        unit: item.productName.includes('রড') ? 'TON' :
          item.productName.includes('সিমেন্ট') ? 'BAG' : 'CFT'
      }
    }
    return acc
  }, {} as Record<string, { quantity: number; totalAmount: number; transactions: number; unit: string }>)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Customer Details - ${customer?.name}`,
  })

  const handleDownloadPDF = () => {
    if (customer) {
      generateCustomerPDF(customer, purchaseHistory, productSummary, locale)
    }
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          {loadingCustomer ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading customer...</h2>
              <p className="text-gray-600 mb-4">Please wait.</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h2>
              <p className="text-gray-600 mb-4">The customer you&apos;re looking for doesn&apos;t exist.</p>
              <Button onClick={() => router.push(`/${locale}/customers`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-5 w-5" />
            {t('back')}
          </Button>
        </div>
        <div className='text-center'>
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-600">{t('customerDetails')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            {t('print')}
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            {t('downloadPDF')}
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="print:p-8">
        {/* Customer Info */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('phone')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{customer.phone}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('address')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{customer.address}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('customerSince')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {formatDate(customer.createdAt, locale)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t('totalOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{customer.totalOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('purchaseSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{t('totalSpent')}</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(customer.totalSpent, locale)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{t('averageOrderValue')}</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(customer.totalSpent / customer.totalOrders, locale)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('productsPurchased')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('productName')}</TableHead>
                  <TableHead className="text-center">{t('totalQuantity')}</TableHead>
                  <TableHead className="text-center">{t('transactions')}</TableHead>
                  <TableHead className="text-right">{t('totalAmount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(productSummary).map(([productName, data]) => (
                  <TableRow key={productName}>
                    <TableCell className="font-medium">{productName}</TableCell>
                    <TableCell className="text-center">
                      {data.quantity} {data.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {data.transactions}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(data.totalAmount, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('purchaseHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('product')}</TableHead>
                  <TableHead className="text-center">{t('quantity')}</TableHead>
                  <TableHead className="text-right">{t('price')}</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                  <TableHead className="text-center">{t('invoice')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {formatDate(item.date, locale)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price, locale)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total, locale)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {item.invoiceId}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
