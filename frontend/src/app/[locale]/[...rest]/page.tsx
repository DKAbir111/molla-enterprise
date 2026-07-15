import { notFound } from 'next/navigation'

/**
 * Catch-all for unmatched URLs under a locale.
 *
 * Without this, an unknown path never reaches `[locale]/not-found.tsx` — Next
 * falls back to its own unstyled 404, which ignores the theme entirely. Calling
 * notFound() here hands rendering to our not-found page inside the locale layout.
 */
export default function CatchAllNotFound() {
  notFound()
}
