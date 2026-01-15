'use client'
import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Mail, Phone, MapPin, Save } from 'lucide-react'
import { updateOrganization } from '@/lib/api'
import { toast } from 'sonner'

interface BusinessInfoSectionProps {
    businessInfo: {
        name: string
        email: string
        phone: string
        address: string
        logoUrl: string | null
    }
    setBusinessInfo: (info: any) => void
    logoPreview: string | null
    setLogoPreview: (preview: string | null) => void
    setLogoFile: (file: File | null) => void
    orgId: string | null
    onSave: () => Promise<void>
    saving: boolean
}

export function BusinessInfoSection({
    businessInfo,
    setBusinessInfo,
    logoPreview,
    setLogoPreview,
    setLogoFile,
    orgId,
    onSave,
    saving,
}: BusinessInfoSectionProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const onPickLogo = () => {
        fileInputRef.current?.click()
    }

    const onLogoSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (logoPreview && logoPreview.startsWith('blob:')) {
                try { URL.revokeObjectURL(logoPreview) } catch { }
            }
            const url = URL.createObjectURL(file)
            setLogoPreview(url)
            setLogoFile(file)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>Update your business details and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Logo Section */}
                    <div className="flex items-start gap-6 p-4 bg-gray-50 rounded-lg">
                        <button
                            type="button"
                            aria-label="Upload logo"
                            onClick={onPickLogo}
                            className="relative h-32 w-32 rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden hover:border-purple-400 transition-colors group"
                        >
                            {logoPreview ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                                    <Camera className="h-8 w-8 mb-2" />
                                    <span className="text-xs">Upload Logo</span>
                                </div>
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onLogoSelected}
                        />
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">Organization Logo</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Upload your business logo. Recommended size: 512x512px. Max file size: 2MB.
                            </p>
                            <Button variant="outline" size="sm" onClick={onPickLogo}>
                                <Camera className="h-4 w-4 mr-2" />
                                Change Logo
                            </Button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid gap-6">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Business Name *</label>
                            <Input
                                value={businessInfo.name}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                                placeholder="Enter business name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={businessInfo.email}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                                    className="pl-10"
                                    type="email"
                                    placeholder="business@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={businessInfo.phone}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                                    className="pl-10"
                                    placeholder="+880 1XXX-XXXXXX"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Business Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={businessInfo.address}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                                    className="pl-10"
                                    placeholder="Street, City, Country"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={onSave} disabled={saving || !orgId} className="px-6">
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Additional business info (future) */}
            <Card>
                <CardHeader>
                    <CardTitle>Additional Info</CardTitle>
                    <CardDescription>Website and registration details (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Website</label>
                        <Input placeholder="https://example.com" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">VAT/GST Number</label>
                        <Input placeholder="e.g., 123456789" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Trade License / Registration No.</label>
                        <Input placeholder="e.g., ABC-2024-001" />
                    </div>
                    <p className="text-xs text-gray-500">These fields will be saved in a future update.</p>
                </CardContent>
            </Card>
        </div>
    )
}
