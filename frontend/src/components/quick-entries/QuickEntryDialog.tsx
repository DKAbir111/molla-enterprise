'use client'

import { useTranslations } from 'next-intl'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuickEntryForm, QuickLine } from './types'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, User, Package, Plus, Trash2 } from 'lucide-react'

type Props = {
  open: boolean
  form: QuickEntryForm
  lines: QuickLine[]
  locale: string
  subtotal: number
  saving: boolean
  onSubmit: (e: React.FormEvent) => void
  onChangeForm: (patch: Partial<QuickEntryForm>) => void
  onAddLine: () => void
  onUpdateLine: (id: string, patch: Partial<QuickLine>) => void
  onRemoveLine: (id: string) => void
  /** Dismissal: the X button, Escape, and clicking the overlay all route here. */
  onClose: () => void
}

export function QuickEntryDialog({
  open,
  form,
  lines,
  locale,
  subtotal,
  saving,
  onSubmit,
  onChangeForm,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onClose,
}: Props) {
  const tq = useTranslations('quickEntries')

  if (!open) return null

  // `onOpenChange` was a no-op, which silently swallowed every dismissal Radix
  // routes through it — the X button, Escape, and the overlay click. The dialog
  // could only be closed by submitting it.
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${form.type === 'income'
              ? 'gradient-primary'
              : 'bg-linear-to-br from-teal-600 to-teal-700'
              } shadow-sm`}>
              {form.type === 'income' ? (
                <TrendingUp className="h-5 w-5 text-white" />
              ) : (
                <TrendingDown className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {form.type === 'income' ? tq('newIncome') : tq('newExpense')}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1 text-subtle-foreground">
                {tq('dialogHint')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <div className="space-y-6">
              <Card className="border border-border-subtle shadow-sm">
                <CardHeader className="pb-4 bg-primary-subtle border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold text-foreground">{tq('contactDetails')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="qe-date" className="text-sm font-medium text-muted-foreground">{tq('date')}</Label>
                      <Input
                        id="qe-date"
                        type="date"
                        className="border-border-subtle focus:ring-2 focus:ring-ring"
                        value={form.date}
                        onChange={(e) => onChangeForm({ date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qe-name" className="text-sm font-medium text-muted-foreground">{tq('name')}</Label>
                      <Input
                        id="qe-name"
                        value={form.name}
                        onChange={(e) => onChangeForm({ name: e.target.value })}
                        placeholder={tq('contactNamePlaceholder')}
                        className="border-border-subtle focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="qe-phone" className="text-sm font-medium text-muted-foreground">{tq('phone')}</Label>
                      <Input
                        id="qe-phone"
                        value={form.phone}
                        onChange={(e) => onChangeForm({ phone: e.target.value })}
                        placeholder={tq('phonePlaceholder')}
                        className="border-border-subtle focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qe-address" className="text-sm font-medium text-muted-foreground">{tq('address')}</Label>
                      <Input
                        id="qe-address"
                        value={form.address}
                        onChange={(e) => onChangeForm({ address: e.target.value })}
                        placeholder={tq('addressPlaceholder')}
                        className="border-border-subtle focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border-subtle shadow-sm">
                <CardHeader className="pb-4 bg-primary-subtle border-b border-border-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base font-semibold text-foreground">{tq('lineItems')}</CardTitle>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onAddLine}
                      className="border-primary text-primary hover:bg-primary-subtle"
                    >
                      <Plus className="h-4 w-4 mr-1" /> {tq('addLine')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-3 pb-2 border-b text-xs font-semibold text-muted-foreground">
                      <div>{tq('itemDescription')}</div>
                      <div>{tq('qty')}</div>
                      <div>{tq('rate')}</div>
                      <div className="text-right">{tq('total')}</div>
                      <div></div>
                    </div>
                    {lines.map((line) => {
                      const qty = Number(line.quantity) || 0
                      const rate = Number(line.rate) || 0
                      const total = qty * rate
                      return (
                        <div key={line.id} className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-3 items-center">
                          <Input value={line.name} onChange={(e) => onUpdateLine(line.id, { name: e.target.value })} placeholder={tq('descriptionPlaceholder')} />
                          <Input type="number" min="1" value={line.quantity} onChange={(e) => onUpdateLine(line.id, { quantity: Number(e.target.value) || 0 })} />
                          <Input type="number" min="0" step="0.01" value={line.rate} onChange={(e) => onUpdateLine(line.id, { rate: e.target.value })} />
                          <div className="text-right font-medium">{formatCurrency(total, locale)}</div>
                          <Button type="button" size="icon" variant="ghost" onClick={() => onRemoveLine(line.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{tq('total')}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>{tq('amount')}</span>
              <span>{formatCurrency(subtotal, locale)}</span>
            </CardContent>
          </Card>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save entry'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
