'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  onAddIncome: () => void
  onAddExpense: () => void
}

export function QuickEntriesHeader({ search, onSearchChange, onAddIncome, onAddExpense }: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search quick entries"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button className="flex items-center gap-2" onClick={onAddIncome}>
          <Plus className="h-4 w-4" />
          Income entry
        </Button>
        <Button className="flex items-center gap-2" variant="outline" onClick={onAddExpense}>
          <Plus className="h-4 w-4" />
          Expense entry
        </Button>
      </div>
    </div>
  )
}
