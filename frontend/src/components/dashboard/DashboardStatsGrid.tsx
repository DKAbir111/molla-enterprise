'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatAccent = 'primary' | 'success' | 'danger' | 'info' | 'warning'

interface StatItem {
  title: string
  value: string
  icon: React.ElementType
  accent?: StatAccent
  change?: string
  positive?: boolean
  toggle?: () => void
  toggleIcon?: React.ElementType
}

interface DashboardStatsGridProps {
  stats: StatItem[]
}

// Tinted icon chip per stat semantic. Values map to the design tokens, so both
// themes are covered automatically.
const ACCENT_CHIP: Record<StatAccent, string> = {
  primary: 'bg-primary-subtle text-primary',
  success: 'bg-success-subtle text-success',
  danger: 'bg-danger-subtle text-danger',
  info: 'bg-info-subtle text-info',
  warning: 'bg-warning-subtle text-warning',
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  const t = useTranslations('dashboard')

  return (
    // Two-up on a phone. Eight full-width cards stacked pushed the charts and
    // recent activity roughly a screen and a half down the page.
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const ToggleIcon = stat.toggleIcon
        const accent = stat.accent ?? 'primary'
        return (
          <div
            key={stat.title}
            className="group relative min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <p className="min-w-0 text-xs font-medium leading-snug text-muted-foreground sm:text-sm">{stat.title}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                {stat.toggle && ToggleIcon && (
                  <button
                    type="button"
                    onClick={stat.toggle}
                    aria-label="Toggle visibility"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ToggleIcon className="h-4 w-4" />
                  </button>
                )}
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10', ACCENT_CHIP[accent])}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </span>
              </div>
            </div>

            {/* `truncate` + title: a long currency figure must not widen the
                card and reintroduce a horizontal scroll on a 360px screen. */}
            <p
              title={stat.value}
              className="mt-3 truncate text-xl font-bold tracking-tight text-foreground tabular-nums sm:mt-4 sm:text-3xl"
            >
              {stat.value}
            </p>

            {typeof stat.change !== 'undefined' && typeof stat.positive !== 'undefined' ? (
              <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs">
                {stat.positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
                )}
                <span className={cn('font-semibold', stat.positive ? 'text-success' : 'text-danger')}>
                  {stat.change}
                </span>
                {/* Too long to fit beside the figure on a two-up phone card. */}
                <span className="hidden truncate text-subtle-foreground sm:inline">{t('fromLastMonth')}</span>
              </div>
            ) : (
              <div className="mt-2 h-[1.125rem]" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
