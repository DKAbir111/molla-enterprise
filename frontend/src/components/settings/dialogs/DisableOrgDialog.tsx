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
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { disableOrganization } from '@/lib/api/organization-api'

interface DisableOrgDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organizationName?: string
    organizationId?: string
}

export function DisableOrgDialog({ open, onOpenChange, organizationName, organizationId }: DisableOrgDialogProps) {
    const [disabling, setDisabling] = useState(false)
    const router = useRouter()

    const handleDisable = async () => {
        if (!organizationId) {
            toast.error('Organization ID is missing')
            return
        }
        setDisabling(true)
        try {
            await disableOrganization(organizationId)
            toast.success('Organization disabled successfully')
            onOpenChange(false)
            router.push('/')
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Failed to disable organization'
            toast.error(message)
        } finally {
            setDisabling(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Disable Organization
                    </DialogTitle>
                    <DialogDescription>
                        This will temporarily disable {organizationName}. All members will lose access. Are you sure?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={disabling}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDisable}
                        disabled={disabling}
                    >
                        {disabling ? 'Disabling...' : 'Disable Organization'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
