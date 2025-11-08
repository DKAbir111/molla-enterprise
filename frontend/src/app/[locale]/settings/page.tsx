'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
// import { useTranslations } from 'next-intl'
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
  Camera,
  Check,
} from 'lucide-react'
import { getMyOrganization, updateOrganization } from '@/lib/api'
import { getMyOrganizationSettings, updateOrganizationSettings } from '@/lib/api/organization-api'
import { listSnoozes, unsnoozeAlert, type SnoozedItem } from '@/lib/api/alerts-api'
import { useTheme } from '@/store/useTheme'
import { toast } from 'sonner'

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
      .catch(() => { })
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

  const [notifications, setNotifications] = useState({
    notifyLowStock: true,
    notifyOrderUpdates: true,
    notifyReceivables: true,
    notifyPayables: true,
    emailAlerts: false,
    smsAlerts: false,
  })
  const [thresholds, setThresholds] = useState({
    lowStockThreshold: 5,
    pendingOrderAgingHours: 24,
    receivableReminderDays: 3,
    payableReminderDays: 3,
  })

  useEffect(() => {
    let mounted = true
    getMyOrganizationSettings<any>()
      .then((s) => {
        if (!mounted || !s) return
        setNotifications((prev) => ({
          ...prev,
          notifyLowStock: s.notifyLowStock ?? prev.notifyLowStock,
          notifyOrderUpdates: s.notifyOrderUpdates ?? prev.notifyOrderUpdates,
          notifyReceivables: s.notifyReceivables ?? prev.notifyReceivables,
          notifyPayables: s.notifyPayables ?? prev.notifyPayables,
          emailAlerts: s.emailAlerts ?? prev.emailAlerts,
          smsAlerts: s.smsAlerts ?? prev.smsAlerts,
        }))
        setThresholds((prev) => ({
          ...prev,
          lowStockThreshold: s.lowStockThreshold ?? prev.lowStockThreshold,
          pendingOrderAgingHours: s.pendingOrderAgingHours ?? prev.pendingOrderAgingHours,
          receivableReminderDays: s.receivableReminderDays ?? prev.receivableReminderDays,
          payableReminderDays: s.payableReminderDays ?? prev.payableReminderDays,
        }))
      })
      .catch(() => { })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    setSnoozeLoading(true)
    listSnoozes<any>()
      .then((items) => { if (mounted) setSnoozes(items || []) })
      .catch(() => { if (mounted) setSnoozes([]) })
      .finally(() => { if (mounted) setSnoozeLoading(false) })
    return () => { mounted = false }
  }, [])

  const { theme, setTheme } = useTheme()
  const [snoozes, setSnoozes] = useState<SnoozedItem[] | null>(null)
  const [snoozeLoading, setSnoozeLoading] = useState(false)

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'other', label: 'Other', icon: Globe },
  ]

  // Initialize tab from ?tab=notification (or other) and keep URL in sync on change
  useEffect(() => {
    const q = search?.get('tab') || ''
    const norm = q === 'notification' ? 'notifications' : q
    if (['business','notifications','appearance','other'].includes(norm)) {
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
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
        {/* Business Information */}
        {activeTab === 'business' && (
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
                  <Button onClick={onSaveBusinessInfo} disabled={saving || !orgId} className="px-6">
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
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>Choose which notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Toggle items save immediately when switched */}
                {[
                  { key: 'notifyLowStock', label: 'Low Stock Alerts', desc: 'Get notified when products are running low' },
                  { key: 'notifyOrderUpdates', label: 'Order Updates', desc: 'Receive updates on pending and aging orders' },
                  { key: 'notifyReceivables', label: 'Receivable Reminders', desc: 'Get reminded about outstanding payments' },
                  { key: 'notifyPayables', label: 'Payable Reminders', desc: 'Stay on top of bills you need to pay' },
                  { key: 'emailAlerts', label: 'Email Notifications', desc: 'Receive alerts via email' },
                  { key: 'smsAlerts', label: 'SMS Notifications', desc: 'Get text message alerts (coming soon)', disabled: true },
                ].map(({ key, label, desc, disabled }) => (
                  <div key={key} className={`flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors ${disabled ? 'opacity-50' : ''}`}>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{label}</div>
                      <div className="text-sm text-gray-600">{desc}</div>
                    </div>
                    <button
                      onClick={async () => {
                        if (disabled) return
                        const next = !(notifications as any)[key]
                        const prevState = notifications
                        setNotifications({ ...notifications, [key]: next } as any)
                        if (!orgId) return
                        try {
                          await updateOrganizationSettings(orgId, { [key]: next } as any)
                          toast.success(`${label} ${next ? 'enabled' : 'disabled'}`)
                        } catch {
                          // revert on failure
                          setNotifications(prevState)
                          toast.error('Failed to update setting')
                        }
                      }}
                      disabled={disabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(notifications as any)[key] ? 'bg-purple-600' : 'bg-gray-300'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(notifications as any)[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
                <CardDescription>Configure when alerts should be triggered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Low Stock Threshold</label>
                    <Input
                      type="number"
                      min={0}
                      value={thresholds.lowStockThreshold}
                      onChange={(e) => setThresholds({ ...thresholds, lowStockThreshold: Number(e.target.value || 0) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this quantity</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Order Aging (hours)</label>
                    <Input
                      type="number"
                      min={0}
                      value={thresholds.pendingOrderAgingHours}
                      onChange={(e) => setThresholds({ ...thresholds, pendingOrderAgingHours: Number(e.target.value || 0) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Alert for orders pending longer than this</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Receivable Reminder (days)</label>
                    <Input
                      type="number"
                      min={0}
                      value={thresholds.receivableReminderDays}
                      onChange={(e) => setThresholds({ ...thresholds, receivableReminderDays: Number(e.target.value || 0) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Remind for unpaid invoices after this period</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Payable Reminder (days)</label>
                    <Input
                      type="number"
                      min={0}
                      value={thresholds.payableReminderDays}
                      onChange={(e) => setThresholds({ ...thresholds, payableReminderDays: Number(e.target.value || 0) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Remind for unpaid bills after this period</p>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t mt-6">
                  <Button onClick={async () => {
                    if (!orgId) return
                    try {
                      await updateOrganizationSettings(orgId, { ...notifications, ...thresholds })
                      toast.success('Notification settings saved')
                    } catch {
                      toast.error('Failed to save notification settings')
                    }
                  }} className="px-6">
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Snoozed Alerts */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Snoozed Alerts</CardTitle>
                <CardDescription>Manage alerts you&apos;ve temporarily muted</CardDescription>
              </CardHeader>
              <CardContent>
                {snoozeLoading && <div className="text-sm text-gray-500 py-8 text-center">Loading...</div>}
                {!snoozeLoading && (snoozes?.length || 0) === 0 && (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No snoozed alerts</p>
                  </div>
                )}
                {!snoozeLoading && (snoozes && snoozes.length > 0) && (
                  <div className="space-y-2">
                    {snoozes.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{s.label || s.refId}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs px-2 py-1 rounded bg-white border text-gray-600">{s.type}</span>
                            <span className="text-xs text-gray-600">
                              {s.permanent ? 'Muted permanently' : `Until ${s.until ? new Date(s.until).toLocaleString() : '—'}`}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await unsnoozeAlert({ type: s.type, refId: s.refId })
                              setSnoozes((prev) => (prev || []).filter((x) => x.id !== s.id))
                              toast.success('Alert reactivated')
                            } catch {
                              toast.error('Failed to reactivate')
                            }
                          }}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Reactivate
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appearance */}
        {activeTab === 'appearance' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>Customize how your dashboard looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    { id: 'default', name: 'Default', desc: 'Light theme with purple accents', colors: ['bg-purple-600', 'bg-blue-600', 'bg-gray-200'] },
                    { id: 'dark', name: 'Dark Mode', desc: 'Easy on the eyes', colors: ['bg-gray-900', 'bg-gray-800', 'bg-gray-700'] },
                    { id: 'contrast', name: 'High Contrast', desc: 'Enhanced visibility', colors: ['bg-black', 'bg-white', 'bg-yellow-400'] },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as any)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${theme === t.id
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{t.name}</h4>
                        {theme === t.id && <Check className="h-5 w-5 text-purple-600" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{t.desc}</p>
                      <div className="flex gap-2">
                        {t.colors.map((color, i) => (
                          <div key={i} className={`h-8 w-8 rounded ${color} ${color === 'bg-white' ? 'border-2 border-gray-300' : ''}`}></div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Preferences</CardTitle>
                <CardDescription>Select template and defaults (coming soon)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {['Classic', 'Compact', 'Modern'].map((tpl) => (
                    <label key={tpl} className="border rounded-lg p-3 flex items-center gap-2 cursor-not-allowed opacity-60">
                      <input type="radio" name="invTpl" disabled />
                      <span>{tpl}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Invoice Prefix</label>
                    <Input placeholder="INV" disabled className="mt-1" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" disabled className="h-4 w-4" />
                    Show logo on invoice
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other (Language + Security) */}
        {activeTab === 'other' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>Configure language, currency, and regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Display Language</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="en">English</option>
                      <option value="bn">বাংলা (Bengali)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Currency</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Date Format</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button className="px-6">
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Manage your password and authentication methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Change Password</div>
                      <div className="text-sm text-gray-600">Update your account password</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-600">Add an extra layer of security</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Coming soon</span>
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Control who has access to your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <button className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Manage Team Members</div>
                      <div className="text-sm text-gray-600">Add, remove, or update user permissions</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Login Activity</CardTitle>
                <CardDescription>Recent access to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: 'Nov 7, 2024 10:30 AM', ip: '192.168.1.1', device: 'Chrome on Windows', current: true },
                    { date: 'Nov 6, 2024 3:15 PM', ip: '192.168.1.1', device: 'Safari on iPhone', current: false },
                    { date: 'Nov 5, 2024 9:20 AM', ip: '192.168.1.1', device: 'Chrome on Windows', current: false },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{activity.device}</span>
                          {activity.current && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Current</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {activity.date} • {activity.ip}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
