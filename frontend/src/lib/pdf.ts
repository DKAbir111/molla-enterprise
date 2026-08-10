/**
 * PDF export used by every report in the app.
 *
 * IMPORTANT — script support. jsPDF ships Helvetica and friends, none of which
 * carry Bengali glyphs, so Bengali text and Bengali-Indic digits (০১২৩) render
 * as blank boxes. Every caller must therefore pass Latin text and format
 * numbers with `plainAmount` / `plainNumber` below, regardless of the UI
 * locale. Producing a genuinely Bengali PDF means embedding a Noto Sans Bengali
 * TTF (~400KB base64) and calling doc.addFont/doc.setFont — deliberately not
 * done here to keep the bundle small.
 */

export type PdfColumnAlign = 'left' | 'right' | 'center'

export type ExportTablePdfOptions = {
  /** Bold line at the top of page one. */
  title: string
  /** Smaller line under the title, e.g. the report name. */
  subtitle?: string
  /** Smallest line, e.g. the selected date range. */
  meta?: string
  head: string[]
  body: (string | number)[][]
  /** Optional bolded summary row. */
  foot?: (string | number)[]
  /** Per-column alignment, indexed the same as `head`. */
  align?: Record<number, PdfColumnAlign>
  /** Saved filename, without the .pdf extension. */
  filename: string
  orientation?: 'portrait' | 'landscape'
}

/** Latin-digit currency-ish amount, safe for jsPDF's built-in fonts. */
export function plainAmount(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0))
}

/** Latin-digit plain number. */
export function plainNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(n) || 0)
}

export async function exportTablePdf(options: ExportTablePdfOptions): Promise<void> {
  const {
    title,
    subtitle,
    meta,
    head,
    body,
    foot,
    align,
    filename,
    orientation = 'landscape',
  } = options

  // Loaded on demand — jsPDF plus autotable is a heavy dependency and nobody
  // should pay for it until they actually export something.
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new JsPDF({ orientation, unit: 'pt', format: 'a4' })

  let y = 40
  doc.setFontSize(16)
  doc.text(title, 40, y)

  if (subtitle) {
    y += 20
    doc.setFontSize(11)
    doc.text(subtitle, 40, y)
  }
  if (meta) {
    y += 16
    doc.setFontSize(9)
    doc.text(meta, 40, y)
  }

  const columnStyles: Record<number, { halign: PdfColumnAlign }> = {}
  if (align) {
    for (const [index, halign] of Object.entries(align)) {
      columnStyles[Number(index)] = { halign }
    }
  }

  autoTable(doc, {
    startY: y + 16,
    head: [head],
    body: body.map((row) => row.map((cell) => String(cell))),
    foot: foot ? [foot.map((cell) => String(cell))] : undefined,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    footStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: 'bold' },
    columnStyles,
  })

  doc.save(`${filename}.pdf`)
}
