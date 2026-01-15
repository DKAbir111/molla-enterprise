'use client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { type TeamMember } from '@/lib/api/user-api'

interface DeleteMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    memberToDelete: TeamMember | null
    onConfirm: () => Promise<void>
    isDeleting: boolean
}

export function DeleteMemberDialog({
    open,
    onOpenChange,
    memberToDelete,
    onConfirm,
    isDeleting,
}: DeleteMemberDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Remove member</DialogTitle>
                    <DialogDescription>
                        Remove {memberToDelete?.name}? They will immediately lose access.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false)
                        }}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Removing...' : 'Remove'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
