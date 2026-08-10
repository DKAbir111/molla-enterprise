'use client'

import { DuesPage } from '@/components/payments/DuesPage'

/** Money owed to vendors. Sits beside Vendors in the navigation. */
export default function PayablesRoute() {
  return <DuesPage direction="out" />
}
