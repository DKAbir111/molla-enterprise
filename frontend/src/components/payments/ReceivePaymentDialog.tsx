'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { toLocalISODate } from '@/lib/date-range'
import { receivePayment, payVendor, type PaymentMethod } from '@/lib/api/payment-api'

const METHODS: PaymentMethod[] = ['cash', 'bank', 'mobile', 'cheque', 'other']

/**
 * Records money received from a customer.
 *
 * With `sellId` it settles that one invoice. Without it the server spreads the
 * amount across the customer's unpaid invoices oldest-first, which is the case
 * that had no home before: someone clearing an old balance with a lump sum.
 */
export function ReceivePaymentDialog({
  open,
  onClose,
  customerId,
  vendorId,
  customerName,
  outstanding,
  sellId,
  buyId,
  direction = 'in',
  locale,
  onRecorded,
}: {
  open: boolean
  onClose: () => void
  /** Required when direction is "in". */
  customerId?: string
  /** Required when direction is "out". */
  vendorId?: string
  customerName: string
  /** Current balance owed, used for the "pay full balance" shortcut. */
  outstanding?: number
  /** Settle a single invoice instead of allocating across the balance. */
  sellId?: string
  buyId?: string
  /** "in" = money received from a customer, "out" = money paid to a vendor. */
  direction?: 'in' | 'out'
  locale: string
  onRecorded?: () => void
}) {
  const t = useTranslations('payments')
  const [amount, setAmount] = React.useState('')
  const [date, setDate] = React.useState(() => toLocalISODate(new Date()))
  const [method, setMethod] = React.useState<PaymentMethod>('cash')
  const [note, setNote] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // Reopening for a different customer must not inherit the previous entry.
  React.useEffect(() => {
    if (!open) return
    setAmount('')
    setDate(toLocalISODate(new Date()))
    setMethod('cash')
    setNote('')
  }, [open, customerId, vendorId, sellId, buyId])

  if (!open) return null

  const numericAmount = Number(amount)
  const valid = Number.isFinite(numericAmount) && numericAmount > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) {
      toast.error(t('amountRequired'))
      return
    }
    setSaving(true)
    try {
      // Sent as a plain local date; the server treats it as the payment date.
      const iso = new Date(`${date}T12:00:00`).toISOString()
      const result =
        direction === 'out'
          ? await payVendor({ amount: numericAmount, vendorId, buyId, date: iso, method, note: note.trim() || undefined })
          : await receivePayment({ amount: numericAmount, customerId: customerId!, sellId, date: iso, method, note: note.trim() || undefined })

      toast.success(t('recorded'))
      if (result.applied?.length) {
        toast.message(t('appliedTo', { count: result.applied.length }))
      }
      if (result.unapplied > 0) {
        toast.message(t('heldAsCredit', { amount: formatCurrency(result.unapplied, locale) }))
      }
      onRecorded?.()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('recordFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{direction === 'out' ? t('payTo', { name: customerName }) : t('receiveFrom', { name: customerName })}</DialogTitle>
          {typeof outstanding === 'number' && (
            <DialogDescription>
              {t('outstanding')}: <span className="font-semibold text-danger">{formatCurrency(outstanding, locale)}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">{t('amount')}</Label>
            <Input
              id="payment-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 md:h-10"
              autoFocus
            />
            {typeof outstanding === 'number' && outstanding > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(outstanding))}
                className="tap-sm text-xs font-medium text-primary hover:underline"
              >
                {t('payFullBalance')} ({formatCurrency(outstanding, locale)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">{t('date')}</Label>
              <Input
                id="payment-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 md:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-method">{t('method')}</Label>
              <select
                id="payment-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="h-12 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:h-10"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{t(m)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-note">{t('note')}</Label>
            <Input
              id="payment-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 md:h-10"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 md:h-10">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!valid || saving} className="h-12 md:h-10">
              {saving ? t('saving') : direction === 'out' ? t('savePayment') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
