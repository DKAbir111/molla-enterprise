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

interface DisableOrgDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organizationName?: string
}

export function DisableOrgDialog({ open, onOpenChange, organizationName }: DisableOrgDialogProps) {
    const [disabling, setDisabling] = useState(false)
    const router = useRouter()

    const handleDisable = async () => {
        setDisabling(true)
        try {
            // TODO: Call API to disable organization - you'll need to implement this endpoint
            // await disableOrganizationApi(orgId)
            toast.success('Organization disabled')
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
