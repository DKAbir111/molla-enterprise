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
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { enableOrganization } from '@/lib/api/organization-api'

interface EnableOrgDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organizationName?: string
    organizationId?: string
}

export function EnableOrgDialog({ open, onOpenChange, organizationName, organizationId }: EnableOrgDialogProps) {
    const [enabling, setEnabling] = useState(false)
    const router = useRouter()

    const handleEnable = async () => {
        if (!organizationId) {
            toast.error('Organization ID is missing')
            return
        }
        setEnabling(true)
        try {
            await enableOrganization(organizationId)
            toast.success('Organization enabled successfully')
            onOpenChange(false)
            router.refresh()
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Failed to enable organization'
            toast.error(message)
        } finally {
            setEnabling(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Enable Organization
                    </DialogTitle>
                    <DialogDescription>
                        This will re-enable {organizationName} and restore write access for members.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={enabling}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        onClick={handleEnable}
                        disabled={enabling}
                    >
                        {enabling ? 'Enabling...' : 'Enable Organization'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
