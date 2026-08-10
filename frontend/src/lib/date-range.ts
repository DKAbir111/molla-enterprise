/**
 * Date-range helpers shared by the dashboard, sells, buys and reports filters.
 *
 * Everything here works in LOCAL time on purpose. `toISOString()` converts to
 * UTC first, so in Asia/Dhaka (UTC+6) it reports the previous calendar day for
 * any moment before 06:00 — the "Today" preset would silently select yesterday
 * and a sale entered at 01:00 would land in the wrong bucket.
 */

export type DateRange = { start?: string; end?: string }

/** `YYYY-MM-DD` for the given date, in the viewer's own timezone. */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Midnight at the start of the day a `YYYY-MM-DD` string refers to. */
export function startOfLocalDay(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

/** The last representable instant of that same day. */
export function endOfLocalDay(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

/**
 * Whether a record falls inside the selected range.
 *
 * The bounds are whole days, so a sale recorded at 14:00 still counts when the
 * range ends on that date — comparing against a bare midnight timestamp would
 * drop everything after 00:00 on the final day.
 */
export function isWithinRange(value: Date | string | number | null | undefined, range: DateRange): boolean {
  if (!range?.start && !range?.end) return true
  if (value == null) return false

  const at = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(at.getTime())) return false

  if (range.start) {
    const from = startOfLocalDay(range.start)
    if (from && at < from) return false
  }
  if (range.end) {
    const to = endOfLocalDay(range.end)
    if (to && at > to) return false
  }
  return true
}

/** Stable per-day grouping key, again in local time. */
export function dayKey(value: Date | string | number): string {
  const at = value instanceof Date ? value : new Date(value)
  return Number.isNaN(at.getTime()) ? '' : toLocalISODate(at)
}

/** Human label for a `YYYY-MM-DD` key. */
export function formatDayKey(key: string, locale: string): string {
  const d = startOfLocalDay(key)
  if (!d) return key
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}
