import Link from 'next/link'
import { FileText, TriangleAlert } from 'lucide-react'

/**
 * Deliberate placeholder.
 *
 * The signup consent line has to link somewhere, and a 404 behind "you agree to
 * our Terms" is worse than an honest stub. This is NOT legal copy — it must be
 * replaced with text from a qualified source before the product is sold.
 */
export function LegalPlaceholder({
  title,
  docName,
  note,
}: {
  title: string
  docName: string
  note?: string
}) {
  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>

        <div
          role="note"
          className="flex items-start gap-3 rounded-lg border border-warning bg-warning-subtle px-4 py-3"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <div className="text-sm text-foreground">
            <p className="font-medium">Placeholder — not yet written.</p>
            <p className="mt-1 text-muted-foreground">
              This page exists so the signup consent link resolves. It is not a{' '}
              {docName} and has no legal effect. Replace it with copy from a
              qualified source before selling access to this product.
            </p>
            {note && <p className="mt-2 text-muted-foreground">{note}</p>}
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="../login"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
