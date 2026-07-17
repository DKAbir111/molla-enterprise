'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

/**
 * Auth/onboarding layout: brand panel + form column.
 *
 * Replaces the previous "single card centred in an empty viewport" treatment.
 * The brand panel carries the product story (logo, headline, value props,
 * proof); the right column carries only the task. On mobile the panel collapses
 * to a compact header so the form stays above the fold.
 */
export function AuthShell({
  children,
  title,
  subtitle,
  /** Link shown top-right of the form column, e.g. Sign in / Create account. */
  altAction,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
  altAction?: { label: string; href: string; cta: string }
}) {
  const locale = useLocale()
  const t = useTranslations('auth')
  const valueProps = [t('prop1'), t('prop2'), t('prop3')]

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ---------------- Brand panel ---------------- */}
      <aside className="gradient-primary relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Depth wash — decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-black/10 blur-3xl"
        />

        <Link href={`/${locale}`} className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conix.png"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-lg bg-white/90 object-contain p-1"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <span className="text-lg font-semibold text-white">{t('brand')}</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight text-white">
            {t('panelHeadline')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            {t('panelSubhead')}
          </p>

          <ul className="mt-8 space-y-3">
            {valueProps.map((v) => (
              <li key={v} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                </span>
                <span className="text-sm text-white/90">{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="h-px w-full bg-white/20" />
          <p className="mt-6 text-sm leading-relaxed text-white/80">
            {t('quote')}
          </p>
          <p className="mt-3 text-xs font-medium text-white/60">
            {t('quoteAuthor')}
          </p>
        </div>
      </aside>

      {/* ---------------- Form column ---------------- */}
      <main className="app-bg flex min-h-screen flex-col">
        <div className="flex items-center justify-between gap-4 p-6 lg:px-12">
          {/* Compact brand for mobile, where the panel is hidden. */}
          <Link href={`/${locale}`} className="flex items-center gap-2 lg:invisible">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conix.png"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 rounded-md object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="text-sm font-semibold text-foreground">{t('brand')}</span>
          </Link>

          {altAction && (
            <p className="shrink-0 text-sm text-muted-foreground">
              {altAction.label}{' '}
              <Link
                href={altAction.href}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {altAction.cta}
              </Link>
            </p>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-12">
          <div className="w-full max-w-md">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </header>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
