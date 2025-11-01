import { api } from './http'

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled'

export type OrderItemInput = {
  productId: string
  quantity: number
}

export type CreateOrderInput = {
  customerId: string
  items: OrderItemInput[]
  deliveryAddress?: string
  discount?: number
  paidAmount?: number
  transportPerTrip?: number
  transportTrips?: number
}

export type UpdateOrderInput = {
  status?: OrderStatus
  deliveryAddress?: string
  discount?: number
  paidAmount?: number
  transportPerTrip?: number
  transportTrips?: number
}

export async function listOrders<T = any[]>(): Promise<T> {
  const res = await api.get<T>('/orders')
  return res.data
}

export async function createOrder<T = any>(data: CreateOrderInput): Promise<T> {
  const res = await api.post<T>('/orders', data)
  return res.data
}

export async function updateOrder<T = any>(id: string, data: UpdateOrderInput): Promise<T> {
  const res = await api.patch<T>(`/orders/${id}`, data)
  return res.data
}

export async function deleteOrder(id: string): Promise<{ ok: boolean } | any> {
  const res = await api.delete(`/orders/${id}`)
  return res.data
}

export type UpdateOrderItemsInput = {
  items: { productId: string; quantity: number; price?: number }[]
}

export async function updateOrderItems<T = any>(id: string, data: UpdateOrderItemsInput): Promise<T> {
  const res = await api.put<T>(`/orders/${id}/items`, data)
  return res.data
}
