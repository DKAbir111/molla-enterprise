# Settings Page Refactoring Summary

## Overview
The monolithic settings page (`page.tsx` - 1500+ lines) has been refactored into smaller, maintainable component modules.

## New File Structure

```
frontend/src/components/settings/
├── index.ts                           # Barrel export for easy imports
├── BusinessInfoSection.tsx            # Business info & logo upload
├── NotificationsSection.tsx           # Alert preferences & thresholds
├── AppearanceSection.tsx              # Theme & invoice preferences
├── OtherSection.tsx                   # Language, security, user management, login activity
├── DangerZoneSection.tsx              # Disable/delete organization
└── dialogs/
    ├── PasswordChangeDialog.tsx       # Change password modal
    ├── InviteMemberDialog.tsx         # Invite team member modal
    ├── DeleteMemberDialog.tsx         # Delete team member confirmation
    ├── DisableOrgDialog.tsx           # Disable organization confirmation
    └── DeleteOrgDialog.tsx            # Delete organization with name confirmation
```

## Component Breakdown

### BusinessInfoSection
- **File**: `BusinessInfoSection.tsx`
- **Responsibility**: Manages business information and logo upload
- **Props**: Business info state, logo preview, orgId, save handler
- **Features**: Logo upload with preview, form validation

### NotificationsSection
- **File**: `NotificationsSection.tsx`
- **Responsibility**: Alert preferences, thresholds, and snoozed alerts
- **Features**: 
  - Toggle alert preferences with immediate save
  - Configure alert thresholds
  - Manage snoozed alerts
  - Auto-loads settings and snoozes on mount

### AppearanceSection
- **File**: `AppearanceSection.tsx`
- **Responsibility**: Theme selection and invoice preferences
- **Features**: Theme switcher, invoice template preview (coming soon)

### OtherSection
- **File**: `OtherSection.tsx`
- **Responsibility**: Language, security, user management, login activity
- **Features**:
  - Language & region settings
  - Password change button
  - Two-factor auth (coming soon)
  - User management table with role editing
  - Delete user with confirmation
  - Login activity with device detection
- **Note**: Loads team members and login activity on mount (lazy loading)

### DangerZoneSection
- **File**: `DangerZoneSection.tsx`
- **Responsibility**: Dangerous organization actions
- **Features**: 
  - Disable organization button
  - Delete organization button
  - Manages confirmation dialogs

### Dialog Components

#### PasswordChangeDialog
- Current, new, and confirm password fields
- Validation for matching passwords
- Auto-cleanup on close

#### InviteMemberDialog
- Name, email, temporary password, role
- Secure password generation
- Role selection with owner restriction

#### DeleteMemberDialog
- Simple confirmation with member name
- Loading state during deletion

#### DisableOrgDialog
- Organization name displayed
- Simple yes/no confirmation

#### DeleteOrgDialog
- Requires typing organization name to confirm
- Extra safety measure for destructive action
- Form submission handling

## Benefits of Refactoring

1. **Reduced Complexity**: Main page now ~170 lines vs. 1500+
2. **Better Maintainability**: Each section is self-contained
3. **Easier Testing**: Smaller components are easier to unit test
4. **Code Reusability**: Dialog and section components can be reused elsewhere
5. **Clear Separation**: Each section handles its own logic and state
6. **Type Safety**: Better TypeScript support with defined props
7. **Performance**: Each section can be optimized independently

## Import Usage

```typescript
// Easy barrel imports
import {
  BusinessInfoSection,
  NotificationsSection,
  AppearanceSection,
  OtherSection,
  DangerZoneSection,
} from '@/components/settings'

// Dialog imports (if needed separately)
import { PasswordChangeDialog } from '@/components/settings/dialogs/PasswordChangeDialog'
import { InviteMemberDialog } from '@/components/settings/dialogs/InviteMemberDialog'
// ... etc
```

## Key Implementation Details

### State Management
- Each section maintains its own state
- No global state management, keeping components isolated
- Parent page handles only tab navigation and business info

### API Integration
- NotificationsSection handles organization settings API
- OtherSection handles team members and login activity API
- Danger zone dialogs have TODO comments for backend endpoints

### Lazy Loading
- OtherSection loads team members only when tab is active
- Prevents unnecessary API calls on page load

### Error Handling
- Each component has its own error toast notifications
- Silent errors (with `silent: true` option) for background refreshes

## Next Steps

1. **Implement Backend Endpoints** for:
   - Disable organization: `POST /api/organizations/{id}/disable`
   - Delete organization: `DELETE /api/organizations/{id}`

2. **Add Tests**: Create `.test.tsx` files for each component

3. **Future Enhancements**:
   - Localization for dialog and section labels
   - Accessibility improvements (ARIA labels, keyboard navigation)
   - Theme customization UI (currently selector only)
   - Invoice template customization

## Files Modified/Created

- ✅ Created: `frontend/src/components/settings/` directory
- ✅ Created: `frontend/src/components/settings/dialogs/` directory
- ✅ Created: All 5 section components
- ✅ Created: All 5 dialog components
- ✅ Created: Index file for barrel exports
- ✅ Refactored: `frontend/src/app/[locale]/settings/page.tsx` (from 1500+ to 170 lines)
