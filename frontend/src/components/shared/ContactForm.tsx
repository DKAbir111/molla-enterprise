'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

export type ContactValues = {
  name: string
  phone: string
  email?: string
  address?: string
}

export type ContactFormProps = {
  values: ContactValues
  onChange: (next: ContactValues) => void
  showPhoto?: boolean
  photoUrl?: string | null
  onPickPhoto?: (file: File | null) => void
  onRemovePhoto?: () => void
  labels?: Partial<{ photo: string; name: string; phone: string; email: string; address: string }>
  placeholders?: Partial<{ name: string; phone: string; email: string; address: string }>
}

export function ContactForm({ values, onChange, showPhoto, photoUrl, onPickPhoto, onRemovePhoto, labels, placeholders }: ContactFormProps) {
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const onLocalPick = (file: File | null | undefined) => {
    if (!onPickPhoto) return
    onPickPhoto(file ?? null)
  }

  return (
    <div className="space-y-5">
      <div className="gap-6 md:flex md:items-start">
        {showPhoto && (
          <div className="space-y-2 md:w-[120px]">
            {labels?.photo && (<Label className="text-sm font-medium text-gray-700">{labels.photo}</Label>)}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={(e) => { e.preventDefault(); onLocalPick(e.dataTransfer.files?.[0]) }}
                className="group relative h-28 w-28 rounded-full border border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer"
                aria-label="Upload photo"
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Photo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No photo</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                {photoUrl && onRemovePhoto && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onRemovePhoto() }} className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/95 border border-gray-300 shadow hover:bg-red-50" aria-label="Remove">
                    <X className="h-4 w-4 text-gray-700" />
                  </button>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLocalPick(e.target.files?.[0] || null)} />
            </div>
          </div>
        )}

        <div className="space-y-5 self-start min-w-0 md:flex-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{labels?.name || 'Full Name'}</Label>
            <Input className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} required placeholder={placeholders?.name || 'e.g., John Doe'} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">{labels?.phone || 'Phone'}</Label>
              <Input className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" value={values.phone} onChange={(e) => onChange({ ...values, phone: e.target.value })} required placeholder={placeholders?.phone || 'e.g., +880 1XXXXXXXXX'} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">{labels?.email || 'Email (optional)'}</Label>
              <Input type="email" className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" value={values.email || ''} onChange={(e) => onChange({ ...values, email: e.target.value })} placeholder={placeholders?.email || 'e.g., user@example.com'} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{labels?.address || 'Address'}</Label>
            <Input className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" value={values.address || ''} onChange={(e) => onChange({ ...values, address: e.target.value })} required placeholder={placeholders?.address || 'Street, City, Country'} />
          </div>
        </div>
      </div>
    </div>
  )
}

