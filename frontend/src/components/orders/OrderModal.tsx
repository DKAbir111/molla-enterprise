'use client'

import * as React from 'react'
import CreateOrderForm from '@/components/orders/CreateOrderForm'
import type { Order } from '@/types'

type Mode = 'create' | 'edit'

export interface OrderModalProps {
  mode: Mode
  isOpen: boolean
  onClose: () => void
  order?: Order | null
}

// Unified entry component so pages can use a single modal toggle
export function OrderModal({ mode, isOpen, onClose, order }: OrderModalProps) {
  return (
    <CreateOrderForm
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={() => {}}
      mode={mode}
      order={order ?? undefined}
    />
  )
}

export default OrderModal
