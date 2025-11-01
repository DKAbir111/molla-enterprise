import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Friendly order code from UUID/date, e.g., ORD-2511-7C3A9F
export function formatOrderCode(id: string, date?: Date | string): string {
  const short = (id || '').replace(/-/g, '').slice(0, 6).toUpperCase()
  if (date) {
    const d = typeof date === 'string' ? new Date(date) : date
    const yy = String(d.getFullYear()).slice(-2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `ORD-${yy}${mm}-${short}`
  }
  return `ORD-${short}`
}
