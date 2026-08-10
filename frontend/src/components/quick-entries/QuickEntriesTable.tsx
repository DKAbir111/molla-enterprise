'use client'

import { useTranslations } from 'next-intl'

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
  const t = useTranslations('quickEntries')
  const tc = useTranslations('common')
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('description')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead className="text-right">{t('amount')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-subtle-foreground">
                  {tc('loading')}
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-subtle-foreground">
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell data-label={t('date')}>{formatDate(entry.date, locale)}</TableCell>
                <TableCell data-primary="">{entry.description}</TableCell>
                <TableCell data-label={t('category')}>{entry.category}</TableCell>
                <TableCell data-label={t('type')}>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${entry.type === 'income'
                    ? 'bg-success-subtle text-success'
                    : 'bg-danger-subtle text-danger'}`}>
                    {entry.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {entry.type}
                  </span>
                </TableCell>
                <TableCell data-label={t('amount')} className={`font-semibold md:text-right ${entry.type === 'income' ? 'text-success' : 'text-danger'}`}>
                  {entry.type === 'income' ? '+' : '-'}
                  {formatCurrency(entry.amount, locale)}
                </TableCell>
                <TableCell className="md:text-right">
                  <Button variant="ghost" size="icon" className="tap" aria-label={t('deleteEntry')} onClick={() => onDelete(entry.id)}>
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
