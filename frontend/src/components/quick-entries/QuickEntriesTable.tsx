'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { QuickTransaction } from './types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react'

type Props = {
  entries: QuickTransaction[]
  loading: boolean
  locale: string
  onDelete: (id: string) => void
}

export function QuickEntriesTable({ entries, loading, locale, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No quick entries yet.
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.date, locale)}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.category}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${entry.type === 'income'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'}`}>
                    {entry.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {entry.type}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-semibold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.type === 'income' ? '+' : '-'}
                  {formatCurrency(entry.amount, locale)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
