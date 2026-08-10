'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * The row of summary figures that sits above every list page.
 *
 * On desktop it is the same 4-up grid as before. On a phone four stacked
 * full-width cards would fill the entire screen before a single record was
 * visible, so it becomes a swipeable rail (see `.rail` in globals.css, which is
 * itself scoped to the mobile breakpoint — the grid classes here apply
 * untouched on desktop).
 */
export function StatRail({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}) {
  return (
    <div
      className={cn(
        'rail md:grid md:gap-4',
        columns === 2 && 'md:grid-cols-2',
        columns === 3 && 'md:grid-cols-3',
        columns === 4 && 'md:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: React.ReactNode
  /** Text colour utility for the figure, e.g. `text-success`. */
  tone?: string
}) {
  return (
    <Card className="min-w-[9.5rem] md:min-w-0">
      <CardContent className="p-4 md:p-6">
        <p className="truncate text-xs font-medium text-muted-foreground md:text-sm">{label}</p>
        <p className={cn('mt-1 truncate text-xl font-bold md:mt-2 md:text-2xl', tone)}>{value}</p>
      </CardContent>
    </Card>
  )
}
