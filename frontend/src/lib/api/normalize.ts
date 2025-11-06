import { toNumber } from './http'
import type { Order, OrderItem, Customer, Product, Transaction, Buy, BuyItem, DryingGain } from '@/types'

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
    avatarUrl: apiCustomer.avatarUrl ? String(apiCustomer.avatarUrl) : undefined,
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
    otherCostPerUnit: toNumber((apiProduct as any).otherCostPerUnit ?? 0),
    targetPrice: toNumber((apiProduct as any).targetPrice ?? apiProduct.price ?? 0),
    unit: String(apiProduct.unit ?? ''),
    stock: Number(apiProduct.stock ?? 0),
    description: apiProduct.description ? String(apiProduct.description) : undefined,
    imageUrl: apiProduct.imageUrl ? String(apiProduct.imageUrl) : undefined,
    active: typeof apiProduct.active === 'boolean' ? apiProduct.active : true,
    awaitingPurchase: typeof (apiProduct as any).awaitingPurchase === 'boolean' ? Boolean((apiProduct as any).awaitingPurchase) : true,
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

export function normalizeBuy(apiBuy: any): Buy {
  const items: BuyItem[] = (apiBuy.items || []).map((i: any) => ({
    productId: String(i.productId),
    productName: String(i.productName ?? ''),
    quantity: Number(i.quantity ?? 0),
    price: toNumber(i.price),
    total: toNumber(i.total),
  }))
  return {
    id: String(apiBuy.id),
    vendorName: apiBuy.vendorName ? String(apiBuy.vendorName) : undefined,
    vendorPhone: apiBuy.vendorPhone ? String(apiBuy.vendorPhone) : undefined,
    items,
    total: toNumber(apiBuy.total ?? items.reduce((s, it) => s + it.total, 0)),
    discount: toNumber(apiBuy.discount ?? 0),
    paidAmount: toNumber(apiBuy.paidAmount ?? 0),
    transportPerTrip: toNumber(apiBuy.transportPerTrip ?? 0),
    transportTrips: Number(apiBuy.transportTrips ?? 0),
    transportTotal: toNumber(apiBuy.transportTotal ?? 0),
    createdAt: apiBuy.createdAt ? new Date(apiBuy.createdAt) : new Date(),
  }
}

export function normalizeDryingGain(api: any): DryingGain {
  return {
    id: String(api.id),
    productId: String(api.productId),
    quantity: Number(api.quantity ?? 0),
    unitCost: toNumber(api.unitCost ?? 0),
    note: api.note ? String(api.note) : undefined,
    createdAt: api.createdAt ? new Date(api.createdAt) : new Date(),
  }
}
