import { LegalPlaceholder } from '@/components/legal/LegalPlaceholder'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      title="Privacy Policy"
      docName="Privacy Policy"
      note="This product stores names, emails, phone numbers, addresses, and login IP/device data (see the LoginActivity table). A real policy must disclose what is collected, why, how long it is kept, and who it is shared with."
    />
  )
}
