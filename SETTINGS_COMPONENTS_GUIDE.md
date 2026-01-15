# Settings Components - Developer Guide

## Quick Overview

The settings page has been refactored from a single 1500+ line component into organized, modular pieces.

## File Locations

```
frontend/src/components/settings/
├── index.ts                           # Import here
├── BusinessInfoSection.tsx
├── NotificationsSection.tsx
├── AppearanceSection.tsx
├── OtherSection.tsx
├── DangerZoneSection.tsx
└── dialogs/
    ├── PasswordChangeDialog.tsx
    ├── InviteMemberDialog.tsx
    ├── DeleteMemberDialog.tsx
    ├── DisableOrgDialog.tsx
    └── DeleteOrgDialog.tsx
```

## Quick Import

```typescript
import {
  BusinessInfoSection,
  NotificationsSection,
  AppearanceSection,
  OtherSection,
  DangerZoneSection,
} from '@/components/settings'
```

## Component Props Reference

### BusinessInfoSection
```typescript
interface BusinessInfoSectionProps {
  businessInfo: {
    name: string
    email: string
    phone: string
    address: string
    logoUrl: string | null
  }
  setBusinessInfo: (info: any) => void
  logoPreview: string | null
  setLogoPreview: (preview: string | null) => void
  setLogoFile: (file: File | null) => void
  orgId: string | null
  onSave: () => Promise<void>
  saving: boolean
}
```

### NotificationsSection
```typescript
interface NotificationsSectionProps {
  orgId: string | null
}
```

### AppearanceSection
No props required - uses internal useTheme hook

### OtherSection
No props required - handles all its own state and API calls

### DangerZoneSection
```typescript
interface DangerZoneSectionProps {
  organizationName?: string
}
```

## Dialog Props Reference

### PasswordChangeDialog
```typescript
interface PasswordChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

### InviteMemberDialog
```typescript
interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isOwner: boolean
  onSubmit: (data: {
    name: string
    email: string
    temporaryPassword: string
    role: TeamMemberRole
  }) => Promise<void>
}
```

### DeleteMemberDialog
```typescript
interface DeleteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberToDelete: TeamMember | null
  onConfirm: () => Promise<void>
  isDeleting: boolean
}
```

### DisableOrgDialog
```typescript
interface DisableOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationName?: string
}
```

### DeleteOrgDialog
```typescript
interface DeleteOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationName?: string
}
```

## Key Features by Section

### BusinessInfoSection
- ✅ Logo upload with preview
- ✅ Business info form
- ✅ Auto-save on button click
- ✅ Error handling

### NotificationsSection
- ✅ Toggle alert preferences (auto-save)
- ✅ Configure alert thresholds
- ✅ Manage snoozed alerts
- ✅ Reactivate alerts
- ✅ Auto-load settings on mount

### AppearanceSection
- ✅ Theme selector
- ✅ Invoice preferences (coming soon)

### OtherSection
- ✅ Language & region settings
- ✅ Account security (password change)
- ✅ User management table
- ✅ Role editing
- ✅ Delete member with confirmation
- ✅ Login activity tracking
- ✅ Device detection
- ✅ Lazy-loaded data

### DangerZoneSection
- ✅ Disable organization action
- ✅ Delete organization action
- ✅ Confirmation dialogs

## Common Patterns

### State Management
Each section manages its own state. The main page only manages:
- Active tab
- Organization ID
- Business info (because it's needed for save)
- Logo file/preview (because it's needed for save)

### Error Handling
All components use `toast.error()` for user feedback:
```typescript
try {
  // do something
} catch (error: any) {
  const message = error?.response?.data?.message ?? 'Failed to perform action'
  toast.error(message)
}
```

### Loading States
Components use simple boolean states:
```typescript
const [saving, setSaving] = useState(false)

<Button disabled={saving}>
  {saving ? 'Saving...' : 'Save'}
</Button>
```

### Validation
Use toast for validation errors:
```typescript
if (!form.email) {
  toast.error('Email is required')
  return
}
```

## Making Changes

### Adding a New Section
1. Create new component in `frontend/src/components/settings/NewSection.tsx`
2. Define props interface
3. Add to `index.ts` exports
4. Import in main `page.tsx`
5. Add conditional render

### Adding a New Dialog
1. Create new component in `frontend/src/components/settings/dialogs/NewDialog.tsx`
2. Define props interface
3. Use Dialog components from UI
4. Handle form submission
5. Use in parent component

### Modifying Existing Section
1. Locate the section file
2. Update props if needed
3. Update the main page.tsx if props changed
4. Test thoroughly

## API Integration

### Organizations API
```typescript
import { updateOrganization } from '@/lib/api'
import { 
  getMyOrganizationSettings, 
  updateOrganizationSettings 
} from '@/lib/api/organization-api'
```

### User API
```typescript
import {
  changePassword as changePasswordRequest,
  createTeamMember,
  deleteTeamMember,
  fetchLoginActivity,
  listTeamMembers,
  updateTeamMember,
} from '@/lib/api/user-api'
```

### Alerts API
```typescript
import { 
  listSnoozes, 
  unsnoozeAlert 
} from '@/lib/api/alerts-api'
```

## TODO Items

1. **Backend Endpoints**
   - `POST /api/organizations/{id}/disable`
   - `DELETE /api/organizations/{id}`

2. **Component Improvements**
   - Extract utility functions to shared utils
   - Add localization/i18n support
   - Improve accessibility (ARIA labels)
   - Add keyboard navigation

3. **Testing**
   - Unit tests for each component
   - Integration tests for dialogs
   - E2E tests for critical flows

## Styling

All components use:
- **Tailwind CSS**: For styling
- **Radix UI**: For accessible components
- **lucide-react**: For icons
- **sonner**: For toasts

Maintain consistent styling when modifying.

## Performance Tips

- OtherSection lazy-loads team members (only when tab is active)
- NotificationsSection loads settings only once on mount
- Avoid adding heavy computations to render path
- Use useCallback for event handlers

## Debugging Tips

1. **Check console**: Look for network errors
2. **Verify props**: Ensure all required props are passed
3. **Check API responses**: Use browser devtools network tab
4. **Test dialogs**: Ensure open/onOpenChange works
5. **Verify state**: Check component state in React DevTools

## Questions & Support

- Check REFACTORING_NOTES.md for detailed architecture
- Review component code for implementation details
- Check main page.tsx for integration example
