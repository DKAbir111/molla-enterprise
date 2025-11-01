'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building,
  Globe,
  Bell,
  Users,
  Save,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Palette,
  Camera
} from 'lucide-react'
import { getMyOrganization, updateOrganization } from '@/lib/api'
import { useTheme } from '@/store/useTheme'
import { toast } from 'sonner'

export default function SettingsPage() {
  const t = useTranslations('settings')
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getMyOrganization<any>()
      .then((org) => {
        if (!mounted || !org) return
        setOrgId(org.id)
        const next = {
          name: org.name || '',
          email: org.email || '',
          phone: org.phone || '',
          address: org.address || '',
          logoUrl: org.logoUrl || '',
        }
        setBusinessInfo(next)
        setLogoPreview(next.logoUrl || null)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

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
      toast.success('Business information saved')
      setBusinessInfo((prev) => ({
        ...prev,
        name: updated?.name ?? prev.name,
        email: updated?.email ?? prev.email,
        phone: updated?.phone ?? prev.phone,
        address: updated?.address ?? prev.address,
        logoUrl: updated?.logoUrl ?? prev.logoUrl,
      }))
      // Update preview to the saved public URL
      if (updated?.logoUrl) {
        if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
        setLogoPreview(updated.logoUrl)
      }
      setLogoFile(null)
    } catch (e) {
      toast.error('Failed to save business information')
    } finally {
      setSaving(false)
    }
  }

  const onPickLogo = () => {
    fileInputRef.current?.click()
  }

  const onLogoSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        try { URL.revokeObjectURL(logoPreview) } catch {}
      }
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
      setLogoFile(file)
    }
  }

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    orderUpdates: true,
    lowStock: true,
    paymentReminders: true,
  })

  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              <CardTitle>{t('business')}</CardTitle>
            </div>
            <CardDescription>
              Update your business information and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              <button
                type="button"
                aria-label="Upload logo"
                onClick={onPickLogo}
                className="relative h-24 w-24 rounded-xl border border-gray-300 bg-gray-50 overflow-hidden shadow-sm hover:shadow transition"
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <Camera className="h-6 w-6" />
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
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Business Name</label>
              <Input
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  className="pl-10"
                  type="email"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Address</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="w-full" onClick={onSaveBusinessInfo} disabled={saving || !orgId}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Business Info'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle>{t('notifications')}</CardTitle>
            </div>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <button
                  onClick={() => setNotifications({ ...notifications, [key]: !value })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            ))}
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              <CardTitle>{t('language')}</CardTitle>
            </div>
            <CardDescription>
              Choose your preferred language and region
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Default Language</label>
              <select className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="en">English</option>
                <option value="bn">বাংলা (Bengali)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Currency Display</label>
              <select className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Date Format</label>
              <select className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Language Settings
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your account security and access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Two-Factor Authentication
            </Button>
            <div className="p-4 rounded-lg bg-gray-50 text-sm text-gray-600">
              <p className="font-medium mb-1">Last Login</p>
              <p>November 6, 2024 at 10:30 AM from 192.168.1.1</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the look and feel of your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setTheme('default')}
              className={`p-4 rounded-lg border-2 cursor-pointer ${theme === 'default' ? 'border-purple-600 bg-gradient-to-r from-purple-50 to-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <h4 className="font-medium mb-2">Default Theme</h4>
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded bg-purple-600"></div>
                <div className="h-6 w-6 rounded bg-blue-600"></div>
                <div className="h-6 w-6 rounded bg-gray-200"></div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border cursor-pointer ${theme === 'dark' ? 'border-purple-600' : 'hover:border-gray-300'}`}
            >
              <h4 className="font-medium mb-2">Dark Theme</h4>
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded bg-gray-900"></div>
                <div className="h-6 w-6 rounded bg-gray-800"></div>
                <div className="h-6 w-6 rounded bg-gray-700"></div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('contrast')}
              className={`p-4 rounded-lg border cursor-pointer ${theme === 'contrast' ? 'border-purple-600' : 'hover:border-gray-300'}`}
            >
              <h4 className="font-medium mb-2">High Contrast</h4>
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded bg-black"></div>
                <div className="h-6 w-6 rounded bg-white border"></div>
                <div className="h-6 w-6 rounded bg-yellow-400"></div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
