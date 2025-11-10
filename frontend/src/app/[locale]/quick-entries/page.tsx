'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { Dialog } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createTransaction, deleteTransaction, listTransactions } from '@/lib/api/transaction-api'
import { QuickEntriesHeader } from '@/components/quick-entries/QuickEntriesHeader'
import { QuickEntriesStats } from '@/components/quick-entries/QuickEntriesStats'
import { QuickEntriesTable } from '@/components/quick-entries/QuickEntriesTable'
import { QuickEntryDialog } from '@/components/quick-entries/QuickEntryDialog'
import { QuickEntryForm, QuickLine, QuickTransaction } from '@/components/quick-entries/types'

const defaultForm = (): QuickEntryForm => ({
  type: 'income',
  name: '',
  phone: '',
  address: '',
  note: '',
  category: '',
  date: new Date().toISOString().slice(0, 10),
})

const createLine = (): QuickLine => ({
  id: Math.random().toString(36).slice(2, 9),
  name: '',
  quantity: 1,
  rate: '',
})

export default function QuickEntriesPage() {
  const locale = useLocale()
  const [entries, setEntries] = useState<QuickTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<QuickEntryForm>(() => defaultForm())
  const [lines, setLines] = useState<QuickLine[]>([createLine()])
  const [search, setSearch] = useState('')

  const loadEntries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listTransactions<QuickTransaction[]>()
      setEntries(data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  const resetForm = () => {
    setForm(defaultForm())
    setLines([createLine()])
  }

  const handleFormChange = (patch: Partial<QuickEntryForm>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const subtotal = useMemo(() => lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0
    const rate = Number(line.rate) || 0
    return sum + Math.max(0, qty * rate)
  }, 0), [lines])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    try {
      if (subtotal <= 0) throw new Error('Add at least one line with amount')
      const category = (form.category || '').trim() || (form.type === 'income' ? 'Other Income' : 'Other Expense')
      const baseDescription = form.note.trim() || (form.type === 'income' ? 'Quick income entry' : 'Quick expense entry')
      const counterpart = form.name.trim()
      const contactExtras = [form.phone.trim(), form.address.trim()].filter(Boolean).join(' • ')
      const descriptionParts = [
        counterpart ? `${counterpart} - ${baseDescription}` : baseDescription,
        contactExtras,
      ].filter(Boolean)
      const description = descriptionParts.join(' | ')
      setSaving(true)
      await createTransaction({
        description,
        category,
        amount: subtotal,
        type: form.type,
        date: form.date,
      })
      resetForm()
      setDialogOpen(false)
      loadEntries()
    } finally {
      setSaving(false)
    }
  }

  const openModal = (type: 'income' | 'expense') => {
    setForm({ ...defaultForm(), type })
    setLines([createLine()])
    setDialogOpen(true)
  }

  const updateLine = (id: string, patch: Partial<QuickLine>) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.id !== id)))
  }

  const addLine = () => setLines((prev) => [...prev, createLine()])

  const removeEntry = async (id: string) => {
    if (!confirm('Remove this entry?')) return
    await deleteTransaction(id)
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const totals = useMemo(() => {
    return entries.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount
      else acc.expense += curr.amount
      acc.net = acc.income - acc.expense
      return acc
    }, { income: 0, expense: 0, net: 0 })
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter((entry) =>
      entry.description.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q) ||
      entry.type.toLowerCase().includes(q),
    )
  }, [entries, search])

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
      <div className="space-y-6">
        <QuickEntriesHeader
          search={search}
          onSearchChange={setSearch}
          onAddIncome={() => openModal('income')}
          onAddExpense={() => openModal('expense')}
        />
        <QuickEntriesStats totals={totals} locale={locale} />

        {filteredEntries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl">+</div>
              <p className="text-gray-600">No quick entries found.</p>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => openModal('income')}>Add income</Button>
                <Button variant="outline" onClick={() => openModal('expense')}>Add expense</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <QuickEntriesTable entries={filteredEntries} loading={loading} locale={locale} onDelete={removeEntry} />
        )}
      </div>
      <QuickEntryDialog
        open={dialogOpen}
        form={form}
        lines={lines}
        locale={locale}
        subtotal={subtotal}
        saving={saving}
        onSubmit={submit}
        onChangeForm={handleFormChange}
        onAddLine={addLine}
        onUpdateLine={updateLine}
        onRemoveLine={removeLine}
      />
    </Dialog>
  )
}
