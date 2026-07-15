'use client'

import { cn } from '@/lib/utils'

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; hint: string }

/**
 * Lightweight heuristic meter — length first, then variety. Not a substitute for
 * a real strength estimator (zxcvbn) or a breach check, but it gives the user
 * feedback instead of a silent 6-character minimum.
 */
export function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, label: '', hint: '' }

  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++

  if (pw.length < 8) {
    return { score: 1, label: 'Too short', hint: 'Use at least 8 characters.' }
  }

  const s = Math.min(score, 4) as Strength['score']
  const labels: Record<number, string> = {
    0: 'Very weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong',
  }
  const hints: Record<number, string> = {
    0: 'Add length and variety.',
    1: 'Add length and variety.',
    2: 'Mix upper and lower case, numbers and symbols.',
    3: 'Longer is stronger — 12+ characters.',
    4: '',
  }
  return { score: s, label: labels[s], hint: hints[s] }
}

const BAR_TONE: Record<number, string> = {
  0: 'bg-danger',
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-info',
  4: 'bg-success',
}

const TEXT_TONE: Record<number, string> = {
  0: 'text-danger',
  1: 'text-danger',
  2: 'text-warning',
  3: 'text-info',
  4: 'text-success',
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, hint } = scorePassword(password)
  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < score ? BAR_TONE[score] : 'bg-surface-hover',
            )}
          />
        ))}
      </div>
      {/* Label carries the meaning so strength is never colour-alone. */}
      <p className="mt-1.5 text-xs" role="status">
        <span className={cn('font-medium', TEXT_TONE[score])}>{label}</span>
        {hint && <span className="text-subtle-foreground"> {hint}</span>}
      </p>
    </div>
  )
}
