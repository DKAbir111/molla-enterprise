'use client'
import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { KeyRound, Shield, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Save } from 'lucide-react'
import {
    changePassword as changePasswordRequest,
    createTeamMember,
    deleteTeamMember,
    fetchLoginActivity,
    listTeamMembers,
    updateTeamMember,
    type LoginActivityEntry,
    type TeamMember,
    type TeamMemberRole,
    type TeamMembersResponse,
} from '@/lib/api/user-api'
import { toast } from 'sonner'
import { PasswordChangeDialog, InviteMemberDialog, DeleteMemberDialog } from './dialogs'

interface OtherSectionProps {
    onDeleteMember?: (member: TeamMember) => void
    onDeleteMemberClick?: (member: TeamMember) => void
}

function generateSecurePassword(length = 12) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%&*?'
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : undefined
    const chars: string[] = []
    if (cryptoObj?.getRandomValues) {
        const values = new Uint32Array(length)
        cryptoObj.getRandomValues(values)
        for (let i = 0; i < length; i++) {
            chars.push(alphabet[values[i] % alphabet.length])
        }
    } else {
        for (let i = 0; i < length; i++) {
            chars.push(alphabet[Math.floor(Math.random() * alphabet.length)])
        }
    }
    return chars.join('')
}

function formatDateTime(value?: string | null) {
    if (!value) return 'Never'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
}

function summarizeUserAgent(ua?: string | null) {
    if (!ua) return null
    const str = ua.toLowerCase()
    const device =
        str.includes('iphone') ? 'iPhone' :
            str.includes('ipad') ? 'iPad' :
                str.includes('android') && str.includes('mobile') ? 'Android Phone' :
                    str.includes('android') ? 'Android' :
                        str.includes('mac os') || str.includes('macintosh') ? 'macOS' :
                            str.includes('windows') ? 'Windows' :
                                str.includes('linux') ? 'Linux' : null
    const browser =
        str.includes('edg/') ? 'Edge' :
            str.includes('chrome') ? 'Chrome' :
                str.includes('safari') && !str.includes('chrome') ? 'Safari' :
                    str.includes('firefox') ? 'Firefox' :
                        str.includes('msie') || str.includes('trident') ? 'Internet Explorer' : null
    if (browser && device) return `${browser} on ${device}`
    return browser || device
}

export function OtherSection() {
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [teamMeta, setTeamMeta] = useState<Pick<TeamMembersResponse, 'currentUserId' | 'currentUserRole'> | null>(null)
    const [teamLoading, setTeamLoading] = useState(false)
    const [teamInitialized, setTeamInitialized] = useState(false)
    const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null)
    const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null)
    const [loginActivity, setLoginActivity] = useState<LoginActivityEntry[] | null>(null)
    const [activityLoading, setActivityLoading] = useState(false)
    const [activityInitialized, setActivityInitialized] = useState(false)

    const roleOptions: { value: TeamMemberRole; label: string }[] = [
        { value: 'owner', label: 'Owner' },
        { value: 'admin', label: 'Admin' },
        { value: 'member', label: 'Member' },
    ]

    const currentRole = teamMeta?.currentUserRole ?? 'member'
    const isOwner = currentRole === 'owner'
    const canManageMembers = currentRole === 'owner' || currentRole === 'admin'

    const loadTeamMembers = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setTeamLoading(true)
        try {
            const data = await listTeamMembers<TeamMembersResponse>()
            setTeamMembers(data?.members ?? [])
            setTeamMeta({ currentUserId: data.currentUserId, currentUserRole: data.currentUserRole })
            setTeamInitialized(true)
        } catch (error: any) {
            if (!opts?.silent) {
                const message = error?.response?.data?.message ?? 'Failed to load team members'
                toast.error(message)
            }
        } finally {
            if (!opts?.silent) setTeamLoading(false)
        }
    }, [])

    const loadLoginActivity = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setActivityLoading(true)
        try {
            const entries = await fetchLoginActivity()
            setLoginActivity(entries ?? [])
            setActivityInitialized(true)
        } catch (error: any) {
            if (!opts?.silent) {
                const message = error?.response?.data?.message ?? 'Failed to load login activity'
                toast.error(message)
            }
        } finally {
            if (!opts?.silent) setActivityLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!teamInitialized && !teamLoading) {
            loadTeamMembers()
        }
        if (!activityInitialized && !activityLoading) {
            loadLoginActivity()
        }
    }, [teamInitialized, teamLoading, activityInitialized, activityLoading, loadTeamMembers, loadLoginActivity])

    const handleRoleChange = async (member: TeamMember, nextRole: TeamMemberRole) => {
        if (member.role === nextRole) return
        setRoleUpdatingId(member.id)
        try {
            const updated = await updateTeamMember(member.id, { role: nextRole })
            setTeamMembers((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
            if (member.id === teamMeta?.currentUserId) {
                setTeamMeta((prev) => (prev ? { ...prev, currentUserRole: nextRole } : prev))
            }
            toast.success('Role updated')
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Failed to update role'
            toast.error(message)
        } finally {
            setRoleUpdatingId(null)
        }
    }

    const handleDeleteMember = (member: TeamMember) => {
        setMemberToDelete(member)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!memberToDelete) return
        setDeletingMemberId(memberToDelete.id)
        try {
            await deleteTeamMember(memberToDelete.id)
            setTeamMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id))
            toast.success('Member removed')
            setDeleteConfirmOpen(false)
            setMemberToDelete(null)
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Failed to remove member'
            toast.error(message)
        } finally {
            setDeletingMemberId(null)
        }
    }

    const handleInviteSubmit = async (formData: { name: string; email: string; temporaryPassword: string; role: TeamMemberRole }) => {
        try {
            await createTeamMember(formData)
            toast.success('Team member invited')
            setInviteOpen(false)
            await loadTeamMembers({ silent: true })
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Failed to invite member'
            toast.error(message)
            throw error
        }
    }

    return (
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
                            <select className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="en">English</option>
                                <option value="bn">বাংলা (Bengali)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Currency</label>
                            <select className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="BDT">BDT (৳)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Date Format</label>
                            <select className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
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
                    <button
                        type="button"
                        onClick={() => setPasswordDialogOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                                <KeyRound className="h-5 w-5 text-teal-600" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Change Password</div>
                                <div className="text-sm text-gray-600">Update your account password</div>
                            </div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left" type="button">
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
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Control who has access to your organization</CardDescription>
                    </div>
                    {canManageMembers && (
                        <Button size="sm" onClick={() => setInviteOpen(true)} disabled={teamLoading}>
                            <Plus className="h-4 w-4 mr-1" />
                            Invite Member
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {teamLoading && teamMembers.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4">Loading team members...</div>
                    )}
                    {!teamLoading && teamMembers.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4">
                            {canManageMembers ? 'No additional members yet. Invite a teammate to get started.' : 'No other members are linked to this organization.'}
                        </div>
                    )}
                    {teamMembers.length > 0 && (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead className="w-32">Role</TableHead>
                                        <TableHead className="w-56">Last Active</TableHead>
                                        <TableHead className="w-20 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamMembers.map((member) => {
                                        const isSelf = member.id === teamMeta?.currentUserId
                                        const canEditThisMember = canManageMembers && !isSelf && (member.role !== 'owner' || isOwner)
                                        const canDeleteThisMember = canManageMembers && !isSelf && (member.role !== 'owner' || isOwner)
                                        return (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                                        {member.name}
                                                        {isSelf && <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">You</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{member.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {canManageMembers ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={member.role}
                                                                onChange={(e) => handleRoleChange(member, e.target.value as TeamMemberRole)}
                                                                disabled={!canEditThisMember || roleUpdatingId === member.id}
                                                                className="min-w-24 rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                                            >
                                                                {roleOptions.map((option) => (
                                                                    <option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                        disabled={!isOwner && option.value === 'owner'}
                                                                    >
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {roleUpdatingId === member.id && <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-600 capitalize">{member.role}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-gray-700">{formatDateTime(member.lastLoginAt)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {canDeleteThisMember ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="default"
                                                            onClick={() => handleDeleteMember(member)}
                                                            disabled={deletingMemberId === member.id}
                                                        >
                                                            <Trash2 className={`h-4 w-4 text-gray-500 ${deletingMemberId === member.id ? 'animate-pulse' : ''}`} />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {canManageMembers && (
                        <p className="text-xs text-gray-500 pt-3">
                            Share the temporary password securely with the teammate after creating their account.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Login Activity</CardTitle>
                        <CardDescription>Recent access to your account</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loadLoginActivity()} disabled={activityLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${activityLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {activityLoading && (!loginActivity || loginActivity.length === 0) && (
                        <div className="text-sm text-gray-500 text-center py-4">Loading recent activity...</div>
                    )}
                    {!activityLoading && (!loginActivity || loginActivity.length === 0) && (
                        <div className="text-sm text-gray-500 text-center py-4">No login events yet. They&apos;ll appear here after your next sign-in.</div>
                    )}
                    {(loginActivity?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                            {activityLoading && <div className="text-xs text-gray-500 text-center">Refreshing…</div>}
                            {(loginActivity ?? []).map((entry, index) => {
                                const label = entry.deviceLabel || summarizeUserAgent(entry.userAgent) || 'Unknown device'
                                const isCurrent = index === 0
                                return (
                                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{label}</span>
                                                {isCurrent && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Current session</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {formatDateTime(entry.createdAt)} • {entry.ipAddress ?? 'Unknown IP'}
                                            </div>
                                            {entry.location && <div className="text-xs text-gray-500">{entry.location}</div>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <PasswordChangeDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
            <InviteMemberDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                isOwner={isOwner}
                onSubmit={handleInviteSubmit}
            />
            <DeleteMemberDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                memberToDelete={memberToDelete}
                onConfirm={handleConfirmDelete}
                isDeleting={deletingMemberId !== null}
            />
        </div>
    )
}
