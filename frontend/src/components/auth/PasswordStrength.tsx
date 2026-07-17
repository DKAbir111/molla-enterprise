'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type Strength = { score: 0 | 1 | 2 | 3 | 4; labelKey: string; hintKey: string }

/**
 * Lightweight heuristic meter — length first, then variety. Not a substitute for
 * a real strength estimator (zxcvbn) or a breach check, but it gives the user
 * feedback instead of a silent minimum. Returns translation KEYS, not literal
 * text, so the labels localise with the rest of the auth flow.
 */
export function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, labelKey: '', hintKey: '' }

  if (pw.length < 8) {
    return { score: 1, labelKey: 'strengthTooShort', hintKey: 'hintUseChars' }
  }

  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++

  const s = Math.min(score, 4) as Strength['score']
  const labelKeys: Record<number, string> = {
    0: 'strengthVeryWeak', 1: 'strengthWeak', 2: 'strengthFair', 3: 'strengthGood', 4: 'strengthStrong',
  }
  const hintKeys: Record<number, string> = {
    0: 'hintVariety', 1: 'hintVariety', 2: 'hintMix', 3: 'hintLonger', 4: '',
  }
  return { score: s, labelKey: labelKeys[s], hintKey: hintKeys[s] }
}

const BAR_TONE: Record<number, string> = {
  0: 'bg-danger', 1: 'bg-danger', 2: 'bg-warning', 3: 'bg-info', 4: 'bg-success',
}
const TEXT_TONE: Record<number, string> = {
  0: 'text-danger', 1: 'text-danger', 2: 'text-warning', 3: 'text-info', 4: 'text-success',
}

export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations('auth')
  const { score, labelKey, hintKey } = scorePassword(password)
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
        {labelKey && <span className={cn('font-medium', TEXT_TONE[score])}>{t(labelKey)}</span>}
        {hintKey && <span className="text-subtle-foreground"> {t(hintKey)}</span>}
      </p>
    </div>
  )
}
