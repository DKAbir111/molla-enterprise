'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * On/off switch.
 *
 * The knob is laid out IN FLOW (`inline-flex` track + `inline-block` knob) and
 * moved with a transform. An earlier version positioned it `absolute` with no
 * `left`, which resolves to the element's static position — and because a
 * `<button>` centres its inline content, the knob started mid-track and the
 * translate pushed it clean out of the pill. Keeping it in flow means the
 * offsets are measured from a known edge.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  disabled?: boolean
  /** Accessible name. Required when no visible <label> is wired to this. */
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'tap relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // The pill is only 24px tall; this widens the hit area to clear the 44px
        // minimum on touch without changing how it looks or affecting layout.
        'after:absolute after:-inset-x-2 after:-inset-y-2.5 after:content-[""]',
        checked ? 'bg-primary' : 'bg-border',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          // Track 44px, knob 16px: 4px inset on the left, 24px travel leaves the
          // same 4px on the right.
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
