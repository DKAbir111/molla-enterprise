'use client'
import { useState } from 'react'
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
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteOrganization } from '@/lib/api/organization-api'

interface DeleteOrgDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organizationName?: string
    organizationId?: string
}

export function DeleteOrgDialog({ open, onOpenChange, organizationName, organizationId }: DeleteOrgDialogProps) {
    const [confirm, setConfirm] = useState('')
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (confirm !== organizationName) {
            toast.error('Organization name does not match')
            return
        }
        if (!organizationId) {
            toast.error('Organization ID is missing')
            return
        }
        setDeleting(true)
        try {
            await deleteOrganization(organizationId)
            toast.success('Organization deleted successfully')
            router.push('/')
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Failed to delete organization'
            toast.error(message)
        } finally {
            setDeleting(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen)
        if (!newOpen) {
            setConfirm('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Organization
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. All data will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleDelete()
                    }}
                    className="space-y-4"
                >
                    <div>
                        <p className="text-sm text-gray-600 mb-2">
                            To confirm, type the organization name <strong>{organizationName}</strong>
                        </p>
                        <Input
                            type="text"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder={organizationName}
                            className="border-red-300 focus:border-red-500 focus:ring-red-500"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={deleting || confirm !== organizationName}
                        >
                            {deleting ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
