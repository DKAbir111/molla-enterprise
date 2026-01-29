'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Building, Globe, Bell, Palette, AlertTriangle } from 'lucide-react'
import { updateOrganization } from '@/lib/api'
import { useOrganizationStore } from '@/store/useOrganization'
import { toast } from 'sonner'
import {
  BusinessInfoSection,
  NotificationsSection,
  AppearanceSection,
  OtherSection,
  DangerZoneSection,
} from '@/components/settings'

export default function SettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const [activeTab, setActiveTab] = useState('business')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '' as string | null,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { organization, fetchOrganization, setOrganization } = useOrganizationStore()

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'other', label: 'Other', icon: Globe },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]

  // Initialize tab from ?tab=notification (or other) and keep URL in sync on change
  useEffect(() => {
    const q = search?.get('tab') || ''
    const norm = q === 'notification' ? 'notifications' : q
    if (['business', 'notifications', 'appearance', 'other', 'danger'].includes(norm)) {
      setActiveTab(norm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchTab = (key: string) => {
    setActiveTab(key)
    const params = new URLSearchParams(search?.toString())
    params.set('tab', key === 'notifications' ? 'notification' : key)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  useEffect(() => {
    if (organization === undefined) {
      fetchOrganization().catch(() => { })
      return
    }
    if (!organization) return

    setOrgId(organization.id)
    const next = {
      name: organization.name || '',
      email: organization.email || '',
      phone: organization.phone || '',
      address: organization.address || '',
      logoUrl: organization.logoUrl || '',
    }
    setBusinessInfo(next)
    setLogoPreview((current) => (current && current.startsWith('blob:') ? current : (next.logoUrl || null)))
  }, [organization, fetchOrganization])

  const onSaveBusinessInfo = async () => {
    if (!orgId) return
    setSaving(true)
    try {
      const updated = await updateOrganization<any>(orgId, {
        name: businessInfo.name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        address: businessInfo.address,
        logoFile: logoFile || undefined,
      })
      setOrganization(updated)
      toast.success('Business information saved')
      setBusinessInfo((prev) => ({
        ...prev,
        name: updated?.name ?? prev.name,
        email: updated?.email ?? prev.email,
        phone: updated?.phone ?? prev.phone,
        address: updated?.address ?? prev.address,
        logoUrl: updated?.logoUrl ?? prev.logoUrl,
      }))
      if (updated?.logoUrl) {
        if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
        setLogoPreview(updated.logoUrl)
      }
      setLogoFile(null)
    } catch (e) {
      toast.error('Failed to save business information')
      console.log(e)
    } finally {
      setSaving(false)
    }
  }

  const isOrgDisabled = organization && 'deletedAt' in organization && organization.deletedAt ? true : false

  return (
    <div className="max-w-6xl mx-auto">
      {/* Disabled Organization Banner */}
      {isOrgDisabled && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Organization Disabled</h3>
              <p className="text-sm text-red-700 mt-1">
                This organization is currently disabled. Only read-only operations are allowed.
                Contact the owner or administrator to re-enable it.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'business' && (
          <BusinessInfoSection
            businessInfo={businessInfo}
            setBusinessInfo={setBusinessInfo}
            logoPreview={logoPreview}
            setLogoPreview={setLogoPreview}
            setLogoFile={setLogoFile}
            orgId={orgId}
            onSave={onSaveBusinessInfo}
            saving={saving}
            isDisabled={isOrgDisabled}
          />
        )}

        {activeTab === 'notifications' && <NotificationsSection orgId={orgId} />}

        {activeTab === 'appearance' && <AppearanceSection />}

        {activeTab === 'other' && <OtherSection />}

        {activeTab === 'danger' && <DangerZoneSection organizationName={organization?.name} organizationId={organization?.id} isDisabled={isOrgDisabled} />}
      </div>
    </div>
  )
}
