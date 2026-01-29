'use client'

import * as React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Save, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createTransaction } from '@/lib/api/transaction-api'
import { normalizeTransaction } from '@/lib/api'

type Mode = 'create'

export type TransactionModalProps = {
  open: boolean
  onClose: () => void
  onSaved?: (tx: any) => void
}

export function TransactionModal({ open, onClose, onSaved }: TransactionModalProps) {
  const t = useTranslations('accounts')
  const locale = useLocale()

  const [description, setDescription] = React.useState('')
  const [type, setType] = React.useState<'income' | 'expense'>('income')
  const [amount, setAmount] = React.useState<number>(0)
  const [category, setCategory] = React.useState('')
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setDescription('')
      setType('income')
      setAmount(0)
      setCategory('')
      setDate(new Date().toISOString().slice(0, 10))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || amount <= 0) {
      toast.error('Please provide description and positive amount')
      return
    }
    setIsLoading(true)
    try {
      const created = await createTransaction<any>({
        description: description.trim(),
        type,
        amount: Number(amount) || 0,
        category: category.trim() || (type === 'income' ? 'Sales' : 'General'),
        date,
      })
      const normalized = normalizeTransaction(created)
      toast.success(type === 'income' ? 'Income recorded' : 'Expense recorded')
      onSaved?.(normalized)
      onClose()
    } catch {
      toast.error('Failed to record transaction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent overlayClassName="bg-black/20 backdrop-blur-none" className="sm:max-w-lg p-0 bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-linear-to-r from-teal-600 to-teal-500 px-8 py-6 text-white">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <PlusCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {t('addTransaction') || 'Add Transaction'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-blue-100 text-base">
              {t('addTransactionDescription') || 'Record income or expense for your accounts'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('description')}</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Cash sale" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('type')}</Label>
                <div className="flex items-center gap-3 h-11">
                  <button type="button" onClick={() => setType('income')} className={`px-3 py-2 rounded-lg border ${type === 'income' ? 'border-green-600 text-green-700 bg-green-50' : 'border-gray-300 text-gray-700'}`}>{t('income')}</button>
                  <button type="button" onClick={() => setType('expense')} className={`px-3 py-2 rounded-lg border ${type === 'expense' ? 'border-red-600 text-red-700 bg-red-50' : 'border-gray-300 text-gray-700'}`}>{t('expense')}</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('amount')}</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" min={0} step="0.01" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder={type === 'income' ? 'Sales, Other' : 'Transport, Rent, Utilities'} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 border-gray-300 hover:bg-gray-50" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-11 bg-linear-to-r from-teal-600 to-teal-500 text-white" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Transaction
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

