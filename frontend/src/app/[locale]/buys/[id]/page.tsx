'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { api } from '@/lib/api/http'
import { ChevronLeft } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

export default function BuyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const [buy, setBuy] = useState<any | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: ref, documentTitle: buy ? `Purchase_${buy.id}` : 'Purchase' })

  useEffect(() => {
    let mounted = true
    api.get(`/buys/${params.id}`).then((res) => { if (mounted) setBuy(res.data) }).catch(() => {})
    return () => { mounted = false }
  }, [params.id])

  const totals = useMemo(() => {
    const itemsTotal = (buy?.items || []).reduce((s: number, it: any) => s + Number(it.total || 0), 0)
    const discount = Number(buy?.discount || 0)
    const transport = Number(buy?.transportTotal || 0)
    const grand = Math.max(0, itemsTotal + transport - discount)
    const paid = Number(buy?.paidAmount || 0)
    const due = Math.max(0, grand - paid)
    return { itemsTotal, discount, transport, grand, paid, due }
  }, [buy])

  if (!buy) return <div className="flex items-center justify-center h-64 text-gray-500">Loading purchase...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-1"><ChevronLeft className="h-5 w-5" /> Back</Button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{buy.vendorName || 'Vendor'}</h1>
          <p className="text-gray-600">{formatDate(buy.createdAt, locale as any)}</p>
        </div>
        <div className="flex gap-2"><Button variant="outline" onClick={handlePrint}>Print</Button></div>
      </div>

      <Card ref={ref}>
        <CardHeader><CardTitle>Purchase</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Product</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(buy.items || []).map((it: any) => (
                <TableRow key={it.id}><TableCell className="font-medium">{it.productName}</TableCell><TableCell className="text-center">{it.quantity}</TableCell><TableCell className="text-right">{formatCurrency(Number(it.price||0), locale as any)}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(Number(it.total||0), locale as any)}</TableCell></TableRow>
              ))}
              <TableRow><TableCell colSpan={3} className="text-right">Subtotal</TableCell><TableCell className="text-right font-semibold">{formatCurrency(totals.itemsTotal, locale as any)}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="text-right">Discount</TableCell><TableCell className="text-right font-semibold">-{formatCurrency(totals.discount, locale as any)}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="text-right">Transport</TableCell><TableCell className="text-right font-semibold">{formatCurrency(totals.transport, locale as any)}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="text-right">Grand Total</TableCell><TableCell className="text-right font-bold">{formatCurrency(totals.grand, locale as any)}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="text-right">Paid</TableCell><TableCell className="text-right font-semibold">{formatCurrency(totals.paid, locale as any)}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="text-right">Due</TableCell><TableCell className="text-right font-semibold">{formatCurrency(totals.due, locale as any)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

