'use client'

import * as React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CalendarDays, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDayKey, toLocalISODate } from '@/lib/date-range'

type Preset = 'today' | 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'lastyear'

const PRESETS: { value: Preset; labelKey: string; days: number }[] = [
  { value: 'today', labelKey: 'today', days: 0 },
  { value: 'last7days', labelKey: 'last7Days', days: 7 },
  { value: 'last30days', labelKey: 'last30Days', days: 30 },
  { value: 'last3months', labelKey: 'last3Months', days: 90 },
  { value: 'last6months', labelKey: 'last6Months', days: 180 },
  { value: 'lastyear', labelKey: 'lastYear', days: 365 },
]

/**
 * Date range filter as a single chip.
 *
 * This used to be a preset select, two native date inputs, a dash and a Clear
 * button laid out inline — roughly 460px that cannot shrink, because a native
 * date input has a hard intrinsic minimum width. It could never share a row
 * with a search box and a primary action, so it always got a line of its own
 * and pushed the actual content down.
 *
 * Now the toolbar carries one button showing the current selection, and the
 * heavy inputs live in a popover (a bottom sheet on mobile, where a floating
 * panel is awkward to hit). Same `value`/`onChange` contract as before, so
 * every call site is unchanged.
 */
export function DateFilter({
  value,
  onChange,
  className,
}: {
  value?: { start?: string; end?: string }
  onChange?: (v: { start?: string; end?: string; preset?: string }) => void
  className?: string
}) {
  const t = useTranslations('dateFilter')
  const locale = useLocale()
  const [open, setOpen] = React.useState(false)
  const [preset, setPreset] = React.useState<Preset | null>(null)
  const [draftStart, setDraftStart] = React.useState(value?.start ?? '')
  const [draftEnd, setDraftEnd] = React.useState(value?.end ?? '')
  const rootRef = React.useRef<HTMLDivElement>(null)

  const active = Boolean(value?.start && value?.end)

  // Reopening should show what is currently applied, not a stale draft.
  React.useEffect(() => {
    if (!open) return
    setDraftStart(value?.start ?? '')
    setDraftEnd(value?.end ?? '')
  }, [open, value?.start, value?.end])

  // Dismiss on outside click and on Escape, the two things a popover owes you.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    const today = new Date()
    const end = toLocalISODate(today)
    const from = new Date(today)
    from.setDate(today.getDate() - p.days)
    const start = toLocalISODate(from)
    setPreset(p.value)
    onChange?.({ start, end, preset: p.value })
    setOpen(false)
  }

  const applyCustom = () => {
    if (!draftStart || !draftEnd) return
    // Tolerate a backwards range rather than silently returning nothing.
    const [start, end] = draftStart <= draftEnd ? [draftStart, draftEnd] : [draftEnd, draftStart]
    setPreset(null)
    onChange?.({ start, end })
    setOpen(false)
  }

  const clear = () => {
    setPreset(null)
    setDraftStart('')
    setDraftEnd('')
    onChange?.({ start: undefined, end: undefined, preset: undefined as any })
    setOpen(false)
  }

  const label = React.useMemo(() => {
    if (!active) return t('dateRange')
    if (preset) return t(PRESETS.find((p) => p.value === preset)!.labelKey as any)
    const from = formatDayKey(value!.start!, locale)
    const to = formatDayKey(value!.end!, locale)
    return from === to ? from : `${from} – ${to}`
  }, [active, preset, value?.start, value?.end, locale, t])

  const panel = (
    <div className="max-h-[70vh] overflow-y-auto overscroll-contain p-2">
      <ul className="space-y-0.5">
        <li>
          <button
            type="button"
            onClick={clear}
            className={cn(
              'tap-sm flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm hover:bg-surface-hover',
              !active ? 'font-semibold text-primary' : 'text-foreground',
            )}
          >
            {t('allTime')}
            {!active && <Check className="h-4 w-4" />}
          </button>
        </li>
        {PRESETS.map((p) => (
          <li key={p.value}>
            <button
              type="button"
              onClick={() => applyPreset(p)}
              className={cn(
                'tap-sm flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm hover:bg-surface-hover',
                preset === p.value ? 'font-semibold text-primary' : 'text-foreground',
              )}
            >
              {t(p.labelKey as any)}
              {preset === p.value && <Check className="h-4 w-4" />}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 space-y-2 border-t border-border-subtle px-1 pt-3">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
          {t('custom')}
        </p>
        <div className="flex items-center gap-2 px-1">
          <input
            type="date"
            aria-label={t('from')}
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
            className="h-11 w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:h-9"
          />
          <span className="shrink-0 text-subtle-foreground">–</span>
          <input
            type="date"
            aria-label={t('to')}
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
            className="h-11 w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:h-9"
          />
        </div>
        <div className="px-1 pb-1">
          <Button
            type="button"
            size="sm"
            className="h-11 w-full md:h-9"
            disabled={!draftStart || !draftEnd}
            onClick={applyCustom}
          >
            {t('apply')}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'inline-flex h-12 items-center rounded-lg border transition-colors md:h-10',
          active ? 'border-primary bg-primary-subtle' : 'border-border bg-surface',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            'tap-sm flex h-full items-center gap-2 rounded-lg px-3 text-sm font-medium',
            active ? 'text-primary' : 'text-foreground',
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="max-w-[11rem] truncate">{label}</span>
        </button>

        {active && (
          <button
            type="button"
            onClick={clear}
            aria-label={t('clearRange')}
            title={t('clearRange')}
            className="tap-sm mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <>
          {/* Mobile: a bottom sheet. A small floating panel anchored to a chip
              is fiddly to hit with a thumb and can land off-screen. */}
          <div className="fixed inset-0 z-[200] md:hidden">
            <button
              type="button"
              aria-label={t('clearRange')}
              onClick={() => setOpen(false)}
              className="animate-fade-in absolute inset-0 bg-black/50"
            />
            <div className="animate-sheet-up absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border-subtle bg-surface shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
              </div>
              <p className="px-4 pb-2 text-base font-semibold text-foreground">{t('dateRange')}</p>
              {panel}
              <div className="pb-safe" />
            </div>
          </div>

          {/* Desktop: anchored popover. */}
          <div className="absolute right-0 z-50 mt-2 hidden w-72 rounded-xl border border-border-subtle bg-surface shadow-2xl md:block">
            {panel}
          </div>
        </>
      )}
    </div>
  )
}
