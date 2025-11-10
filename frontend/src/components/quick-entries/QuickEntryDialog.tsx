'use client'

import {
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
}: Props) {
  if (!open) return null

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader className="border-b pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${form.type === 'income'
            ? 'bg-linear-to-br from-purple-500 to-blue-600'
            : 'bg-linear-to-br from-fuchsia-600 to-rose-500'
            } shadow-sm`}>
            {form.type === 'income' ? (
              <TrendingUp className="h-5 w-5 text-white" />
            ) : (
              <TrendingDown className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <DialogTitle className="text-2xl">
              {form.type === 'income' ? 'New Income Entry' : 'New Expense Entry'}
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-gray-500">
              Record transaction details with line items and contact information.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-6">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base font-semibold text-gray-800">Contact details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="qe-date" className="text-sm font-medium text-gray-700">Date</Label>
                    <Input
                      id="qe-date"
                      type="date"
                      className="border-gray-200 focus:ring-2 focus:ring-purple-500"
                      value={form.date}
                      onChange={(e) => onChangeForm({ date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qe-name" className="text-sm font-medium text-gray-700">Name</Label>
                    <Input
                      id="qe-name"
                      value={form.name}
                      onChange={(e) => onChangeForm({ name: e.target.value })}
                      placeholder="Customer or contact name"
                      className="border-gray-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {/* <div className="space-y-2">
                    <Label htmlFor="qe-category" className="text-sm font-medium text-gray-700">Category</Label>
                    <Input
                      id="qe-category"
                      value={form.category}
                      onChange={(e) => onChangeForm({ category: e.target.value })}
                      placeholder="Optional"
                      className="border-gray-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div> */}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="space-y-2">
                    <Label htmlFor="qe-phone" className="text-sm font-medium text-gray-700">Phone</Label>
                    <Input
                      id="qe-phone"
                      value={form.phone}
                      onChange={(e) => onChangeForm({ phone: e.target.value })}
                      placeholder="+880 123456789"
                      className="border-gray-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qe-address" className="text-sm font-medium text-gray-700">Address</Label>
                    <Input
                      id="qe-address"
                      value={form.address}
                      onChange={(e) => onChangeForm({ address: e.target.value })}
                      placeholder="Street, city"
                      className="border-gray-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="qe-note" className="text-sm font-medium text-gray-700">Memo</Label>
                  <Input
                    id="qe-note"
                    value={form.note}
                    onChange={(e) => onChangeForm({ note: e.target.value })}
                    placeholder="Add a note or reference"
                    className="border-gray-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div> */}
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base font-semibold text-gray-800">Line items</CardTitle>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onAddLine}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-3 pb-2 border-b text-xs font-semibold text-slate-700">
                    <div>Item Description</div>
                    <div>Qty</div>
                    <div>Rate</div>
                    <div className="text-right">Total</div>
                    <div></div>
                  </div>
                  {lines.map((line) => {
                    const qty = Number(line.quantity) || 0
                    const rate = Number(line.rate) || 0
                    const total = qty * rate
                    return (
                      <div key={line.id} className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-3 items-center">
                        <Input value={line.name} onChange={(e) => onUpdateLine(line.id, { name: e.target.value })} placeholder="Description" />
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
            <CardTitle className="text-sm font-semibold text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-base font-semibold text-gray-900">
            <span>Amount</span>
            <span>{formatCurrency(subtotal, locale)}</span>
          </CardContent>
        </Card>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save entry'}
        </Button>
      </form>
    </DialogContent>
  )
}
