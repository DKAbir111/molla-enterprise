'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { DisableOrgDialog, DeleteOrgDialog } from './dialogs'

interface DangerZoneSectionProps {
    organizationName?: string
    organizationId?: string
}

export function DangerZoneSection({ organizationName, organizationId }: DangerZoneSectionProps) {
    const [disableOrgOpen, setDisableOrgOpen] = useState(false)
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

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
