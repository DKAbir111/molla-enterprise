'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Mobile-only floating action button for a page's primary create action.
 *
 * List pages put their "Add …" button in the toolbar, which on a phone sits at
 * the very top of a long scrolling list — out of thumb reach and gone as soon
 * as you scroll. The FAB stays put and parks itself clear of the bottom tab
 * bar. Toolbar buttons should be `hidden md:flex` wherever this is used.
 */
export function Fab({
  onClick,
  label,
  icon: Icon = Plus,
  className,
}: {
  onClick: () => void
  /** Accessible name, e.g. "Add Product". Shown as the tooltip too. */
  label: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'tap fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full',
        'gradient-primary text-primary-foreground shadow-lg shadow-primary/30 md:hidden',
        className
      )}
      // Sits one gutter above the tab bar, including the home-indicator inset.
      style={{ bottom: 'calc(var(--nav-total) + 1rem)' }}
    >
      <Icon className="h-6 w-6" />
    </button>
  )
}
