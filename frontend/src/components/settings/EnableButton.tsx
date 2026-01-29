'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { EnableOrgDialog } from './dialogs/EnableOrgDialog'
import { toast } from 'sonner'
import { listTeamMembers } from '@/lib/api/user-api'

interface EnableButtonProps {
    organizationId?: string
}

export default function EnableButton({ organizationId }: EnableButtonProps) {
    const [open, setOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (!organizationId) return
        // Fetch team meta to know current role
        listTeamMembers<{ currentUserId: string; currentUserRole: string }>()
            .then((data) => {
                setIsAdmin(data.currentUserRole === 'owner' || data.currentUserRole === 'admin')
            })
            .catch(() => {
                toast.error('Failed to determine permissions')
            })
    }, [organizationId])

    if (!isAdmin) return null

    return (
        <>
            <Button variant="default" onClick={() => setOpen(true)}>
                Enable Organization
            </Button>
            <EnableOrgDialog open={open} onOpenChange={setOpen} organizationId={organizationId} />
        </>
    )
}
