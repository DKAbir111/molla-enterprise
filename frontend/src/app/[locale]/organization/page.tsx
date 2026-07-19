'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Building2, ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrganization } from '@/lib/api'
import { toast } from 'sonner'
import { useOrganizationStore } from '@/store/useOrganization'

export default function OrganizationPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('onboarding')
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const { organization, fetchOrganization, setOrganization } = useOrganizationStore()

  React.useEffect(() => {
    let active = true
    const ensureOrg = async () => {
      if (organization === undefined) {
        try {
          const org = await fetchOrganization()
          if (!active) return
          if (org && org.id) router.replace(`/${locale}`)
          else setLoading(false)
        } catch {
          if (active) setLoading(false)
        }
      } else if (organization && organization.id) {
        router.replace(`/${locale}`)
      } else {
        setLoading(false)
      }
    }
    ensureOrg()
    return () => { active = false }
  }, [organization, fetchOrganization, router, locale])

  const onPickLogo = (file: File | null) => {
    setLogoFile(file)
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
  }
  // Revoke the object URL on unmount.
  React.useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview) }, [logoPreview])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (!name.trim()) throw new Error(t('nameRequired'))
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(t('enterValidEmail'))
      if (!phone.trim()) throw new Error(t('phoneRequired'))
      if (!address.trim()) throw new Error(t('addressRequired'))
      const created = await createOrganization<any>({ name, email, phone, address, logoFile })
      setOrganization(created)
      toast.success(t('created'))
      router.replace(`/${locale}`)
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.message || t('createFailed')
      const msg = Array.isArray(raw) ? raw[0] : raw
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center app-bg" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">{t('checking')}</span>
      </div>
    )
  }

  return (
    <div className="app-bg min-h-screen">
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-16">
        {/* Headline */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
          {/* Context header bar — the "app" strip, like Odoo's Stock row */}
          <div className="flex items-center gap-3 border-b border-border-subtle bg-surface-muted px-6 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle">
              <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{t('cardTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('cardHint')}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 p-6 sm:p-8" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger bg-danger-subtle px-3 py-2.5 text-sm text-foreground"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">{t('businessName')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('businessNamePlaceholder')} required />
            </div>

            {/* Two-column grid on wider screens */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input id="phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phonePlaceholder')} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">{t('address')}</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('addressPlaceholder')} required />
            </div>

            {/* Logo uploader — styled dropzone, not the native file input */}
            <div className="space-y-1.5">
              <Label htmlFor="logo">
                {t('logo')} <span className="font-normal text-subtle-foreground">({t('optional')})</span>
              </Label>
              {logoPreview ? (
                <div className="flex items-center gap-4 rounded-lg border border-border p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="" className="h-14 w-14 rounded-lg border border-border-subtle object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{logoFile?.name}</p>
                    <label className="cursor-pointer text-xs font-medium text-primary underline-offset-4 hover:underline">
                      {t('change')}
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPickLogo(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPickLogo(null)}
                    aria-label={t('remove')}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="logo"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-muted px-6 py-8 text-center transition-colors hover:border-primary hover:bg-primary-subtle/40"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-hover">
                    <ImagePlus className="h-5 w-5 text-subtle-foreground" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{t('uploadLogo')}</span>
                  <span className="text-xs text-subtle-foreground">{t('logoHint')}</span>
                  <input id="logo" type="file" accept="image/*" className="sr-only" onChange={(e) => onPickLogo(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('creating')}
                </>
              ) : (
                t('create')
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
