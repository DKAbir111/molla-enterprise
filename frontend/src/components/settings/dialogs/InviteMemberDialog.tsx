'use client'
import { FormEvent, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type TeamMemberRole } from '@/lib/api/user-api'
import { toast } from 'sonner'

interface InviteMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isOwner: boolean
    onSubmit: (data: { name: string; email: string; temporaryPassword: string; role: TeamMemberRole }) => Promise<void>
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

const roleOptions: { value: TeamMemberRole; label: string }[] = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
]

export function InviteMemberDialog({ open, onOpenChange, isOwner, onSubmit }: InviteMemberDialogProps) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        temporaryPassword: generateSecurePassword(),
        role: 'member' as TeamMemberRole,
    })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!form.name.trim() || !form.email.trim() || form.temporaryPassword.length < 8) {
            toast.error('Please fill all required fields')
            return
        }
        setSubmitting(true)
        try {
            await onSubmit(form)
            setForm({
                name: '',
                email: '',
                temporaryPassword: generateSecurePassword(),
                role: 'member',
            })
        } finally {
            setSubmitting(false)
        }
    }

    const regeneratePassword = () => {
        setForm((prev) => ({ ...prev, temporaryPassword: generateSecurePassword() }))
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                onOpenChange(newOpen)
                if (!newOpen) {
                    setForm({
                        name: '',
                        email: '',
                        temporaryPassword: generateSecurePassword(),
                        role: 'member',
                    })
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite a team member</DialogTitle>
                    <DialogDescription>They&apos;ll be able to sign in immediately with the temporary password.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="invite-name">Full name</Label>
                        <Input
                            id="invite-name"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Jane Doe"
                        />
                    </div>
                    <div>
                        <Label htmlFor="invite-email">Email address</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="jane@example.com"
                        />
                    </div>
                    <div>
                        <Label htmlFor="invite-password">Temporary password</Label>
                        <div className="flex gap-2">
                            <Input
                                id="invite-password"
                                type="text"
                                value={form.temporaryPassword}
                                onChange={(e) => setForm((prev) => ({ ...prev, temporaryPassword: e.target.value }))}
                                minLength={8}
                            />
                            <Button type="button" variant="outline" onClick={regeneratePassword}>
                                Generate
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Share this password securely with the teammate.</p>
                    </div>
                    <div>
                        <Label htmlFor="invite-role">Role</Label>
                        <select
                            id="invite-role"
                            value={form.role}
                            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as TeamMemberRole }))}
                            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        >
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value} disabled={!isOwner && option.value === 'owner'}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Inviting...' : 'Invite Member'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
