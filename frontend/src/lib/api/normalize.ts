import { toNumber } from './http'
import type { Order, OrderItem, Customer, Product, Transaction } from '@/types'

export function normalizeOrder(apiOrder: any): Order {
  const items: OrderItem[] = (apiOrder.items || []).map((i: any) => ({
    productId: String(i.productId),
    productName: String(i.productName ?? ''),
    quantity: Number(i.quantity ?? 0),
    price: toNumber(i.price),
    total: toNumber(i.total),
  }))
  const total = items.reduce((sum, it) => sum + it.total, 0)
  const createdAt = apiOrder.createdAt ? new Date(apiOrder.createdAt) : new Date()
  const deliveredAt = apiOrder.deliveredAt ? new Date(apiOrder.deliveredAt) : undefined
  return {
    id: String(apiOrder.id),
    customerId: String(apiOrder.customerId),
    customerName: String(apiOrder.customer?.name ?? apiOrder.customerName ?? 'Customer'),
    items,
    total,
    status: apiOrder.status as Order['status'],
    deliveryAddress: String(apiOrder.deliveryAddress ?? ''),
    createdAt,
    deliveredAt,
    date: createdAt,
    discount: Number(apiOrder.discount ?? 0),
    paidAmount: Number(apiOrder.paidAmount ?? 0),
    transportPerTrip: Number(apiOrder.transportPerTrip ?? 0),
    transportTrips: Number(apiOrder.transportTrips ?? 0),
    transportTotal: Number(apiOrder.transportTotal ?? 0),
  }
}

export function normalizeCustomer(apiCustomer: any): Customer {
  return {
    id: String(apiCustomer.id),
    name: String(apiCustomer.name),
    phone: String(apiCustomer.phone),
    email: apiCustomer.email ? String(apiCustomer.email) : undefined,
    address: String(apiCustomer.address ?? ''),
    totalOrders: Number(apiCustomer.totalOrders ?? 0),
    totalSpent: toNumber(apiCustomer.totalSpent ?? 0),
    createdAt: apiCustomer.createdAt ? new Date(apiCustomer.createdAt) : new Date(),
  }
}

export function normalizeProduct(apiProduct: any): Product {
  return {
    id: String(apiProduct.id),
    name: String(apiProduct.name),
    type: String(apiProduct.type),
    grade: apiProduct.grade ? String(apiProduct.grade) : undefined,
    price: toNumber(apiProduct.price),
    buyPrice: toNumber((apiProduct as any).buyPrice ?? 0),
    targetPrice: toNumber((apiProduct as any).targetPrice ?? apiProduct.price ?? 0),
    unit: String(apiProduct.unit ?? ''),
    stock: Number(apiProduct.stock ?? 0),
    description: apiProduct.description ? String(apiProduct.description) : undefined,
  }
}

export function normalizeTransaction(apiTx: any): Transaction {
  return {
    id: String(apiTx.id),
    description: String(apiTx.description),
    type: apiTx.type === 'expense' ? 'expense' : 'income',
    amount: toNumber(apiTx.amount),
    category: String(apiTx.category ?? ''),
    date: apiTx.date ? new Date(apiTx.date) : new Date(),
  }
}
