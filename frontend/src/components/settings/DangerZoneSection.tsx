'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { DisableOrgDialog, DeleteOrgDialog } from './dialogs'
import EnableButton from './EnableButton'

interface DangerZoneSectionProps {
    organizationName?: string
    organizationId?: string
    isDisabled?: boolean
}

export function DangerZoneSection({ organizationName, organizationId, isDisabled = false }: DangerZoneSectionProps) {
    const [disableOrgOpen, setDisableOrgOpen] = useState(false)
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

    if (isDisabled) {
        return (
            <div className="space-y-6">
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-blue-700">Organization Already Disabled</CardTitle>
                        <CardDescription className="text-blue-600">
                            This organization is currently disabled. Only owner/admin can manage it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-end">
                        {/* Enable button will only be visible to owner/admin via OtherSection team meta check */}
                        <EnableButton organizationId={organizationId} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-600">
                        Irreversible actions. Please proceed with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Disable Organization */}
                    <div className="flex items-start justify-between p-4 rounded-lg border border-red-200 bg-white">
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Disable Organization</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Temporarily disable this organization. All members will lose access and data will be archived.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setDisableOrgOpen(true)}
                            className="whitespace-nowrap ml-4"
                        >
                            Disable
                        </Button>
                    </div>

                    {/* Delete Organization */}
                    <div className="flex items-start justify-between p-4 rounded-lg border border-red-200 bg-white">
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Delete Organization</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Permanently delete this organization and all associated data. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteAccountOpen(true)}
                            className="whitespace-nowrap ml-4"
                        >
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <DisableOrgDialog
                open={disableOrgOpen}
                onOpenChange={setDisableOrgOpen}
                organizationName={organizationName}
                organizationId={organizationId}
            />
            <DeleteOrgDialog
                open={deleteAccountOpen}
                onOpenChange={setDeleteAccountOpen}
                organizationName={organizationName}
                organizationId={organizationId}
            />
        </div>
    )
}
