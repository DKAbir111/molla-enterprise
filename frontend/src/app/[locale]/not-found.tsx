import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Shown for unmatched routes inside a locale. */
export default async function LocaleNotFound() {
  const t = await getTranslations('errorPages')
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="glass w-full max-w-md rounded-xl p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
          <FileQuestion className="h-6 w-6 text-subtle-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">{t('notFoundTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('notFoundBody')}</p>
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button>{t('goToDashboard')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
