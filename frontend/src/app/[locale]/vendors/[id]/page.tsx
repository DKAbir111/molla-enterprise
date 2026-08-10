'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ChevronLeft, Package, FileText, Calendar } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { listBuys } from '@/lib/api/buy-api'
import { generateVendorPDF } from '@/lib/pdfGenerator'

type PurchaseHistoryItem = {
  id: string
  date: Date
  productName: string
  quantity: number
  price: number
  total: number
  purchaseId: string
}

export default function VendorDetailsPage() {
  const t = useTranslations('vendors')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()

  // decode id as name--phone
  const raw = (params.id as string) || ''
  const [vendorName, vendorPhone] = raw.split('--').map(decodeURIComponent)

  const [history, setHistory] = useState<PurchaseHistoryItem[]>([])
  const [meta, setMeta] = useState<{ totalPurchases: number; totalSpent: number; vendorSince?: Date }>({ totalPurchases: 0, totalSpent: 0 })
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Vendor_${vendorName}` })

  useEffect(() => {
    let mounted = true
    listBuys<any[]>()
      .then((res) => {
        if (!mounted) return
        const all = (res || []).filter(b => String(b.vendorName || '') === vendorName && String(b.vendorPhone || '') === (vendorPhone || ''))
        const hist: PurchaseHistoryItem[] = []
        let earliest: Date | undefined
        let spent = 0
        all.forEach(b => {
          const d = b.createdAt ? new Date(b.createdAt) : new Date()
          if (!earliest || d < earliest) earliest = d
          const itemsTotal = (b.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
          const discount = Number(b.discount || 0)
          const transport = Number(b.transportTotal || 0)
          const grand = Math.max(0, itemsTotal + transport - discount)
          spent += grand
          ;(b.items || []).forEach((it: any) => {
            hist.push({
              id: `${b.id}-${it.productId}`,
              date: d,
              productName: String(it.productName || ''),
              quantity: Number(it.quantity || 0),
              price: Number(it.price || 0),
              total: Number(it.total || 0),
              purchaseId: b.id,
            })
          })
        })
        hist.sort((a, b) => b.date.getTime() - a.date.getTime())
        setHistory(hist)
        setMeta({ totalPurchases: all.length, totalSpent: spent, vendorSince: earliest })
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [vendorName, vendorPhone])

  const productSummary = useMemo(() => {
    const acc: Record<string, { quantity: number; transactions: number; totalAmount: number }> = {}
    history.forEach(h => {
      if (!acc[h.productName]) acc[h.productName] = { quantity: 0, transactions: 0, totalAmount: 0 }
      acc[h.productName].quantity += h.quantity
      acc[h.productName].transactions += 1
      acc[h.productName].totalAmount += h.total
    })
    return acc
  }, [history])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/${locale}/vendors`)} className="flex items-center gap-1">
            <ChevronLeft className="h-5 w-5" /> Back
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{vendorName}</h1>
          <p className="text-muted-foreground">{t('details')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">{t('print')}</Button>
          <Button onClick={() => generateVendorPDF({ name: vendorName, phone: vendorPhone }, history, productSummary, locale as string)}>{t('downloadPDF')}</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('phone')}</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{vendorPhone || '-'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />{t('vendorSince')}</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{meta.vendorSince ? formatDate(meta.vendorSince, locale as string) : '-'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('totalPurchases')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{meta.totalPurchases}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('totalSpent')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-info">{formatCurrency(meta.totalSpent, locale as string)}</div></CardContent>
        </Card>
      </div>

      {/* Product Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />{t('productsSupplied')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('product')}</TableHead>
                <TableHead className="text-center">{t('transactions')}</TableHead>
                <TableHead className="text-center">{t('totalQty')}</TableHead>
                <TableHead className="text-right">{t('totalSpent')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(productSummary).map(([name, data]) => (
                <TableRow key={name}>
                  <TableCell className="font-medium" data-primary="">{name}</TableCell>
                  <TableCell className="md:text-center" data-label={t('transactions')}>{data.transactions}</TableCell>
                  <TableCell className="md:text-center" data-label={t('totalQty')}>{data.quantity}</TableCell>
                  <TableCell className="font-medium md:text-right" data-label={t('totalSpent')}>{formatCurrency(data.totalAmount, locale as string)}</TableCell>
                </TableRow>
              ))}
              {Object.keys(productSummary).length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-subtle-foreground py-8">{t('noProductsYet')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchase History */}
      <div ref={printRef}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t('purchaseHistory')}</CardTitle>
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
                  <TableHead className="text-center">{t('purchase')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell data-label={t('date')}>{formatDate(item.date, locale as string)}</TableCell>
                    <TableCell className="font-medium" data-primary="">{item.productName}</TableCell>
                    <TableCell className="md:text-center" data-label={t('quantity')}>{item.quantity}</TableCell>
                    <TableCell className="md:text-right" data-label={t('price')}>{formatCurrency(item.price, locale as string)}</TableCell>
                    <TableCell className="font-medium md:text-right" data-label={t('total')}>{formatCurrency(item.total, locale as string)}</TableCell>
                    <TableCell className="md:text-center" data-label={t('purchase')}><span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-surface-hover text-muted-foreground">{item.purchaseId}</span></TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-subtle-foreground py-8">{t('noPurchasesYet')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

