'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Save } from 'lucide-react'
import { getMyOrganizationSettings, updateOrganizationSettings } from '@/lib/api/organization-api'
import { listSnoozes, unsnoozeAlert, type SnoozedItem } from '@/lib/api/alerts-api'
import { toast } from 'sonner'

interface NotificationsSectionProps {
    orgId: string | null
}

export function NotificationsSection({ orgId }: NotificationsSectionProps) {
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
    const [snoozes, setSnoozes] = useState<SnoozedItem[] | null>(null)
    const [snoozeLoading, setSnoozeLoading] = useState(false)

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

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Alert Preferences</CardTitle>
                    <CardDescription>Choose which notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
    )
}
