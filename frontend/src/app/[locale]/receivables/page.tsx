'use client'

import { DuesPage } from '@/components/payments/DuesPage'

/** Money customers owe. Sits beside Customers in the navigation. */
export default function ReceivablesRoute() {
  return <DuesPage direction="in" />
}
