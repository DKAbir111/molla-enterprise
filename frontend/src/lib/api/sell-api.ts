import { api } from './http'
import type { OrderStatus } from '@/types'

export type SellItemInput = { productId: string; quantity: number; price?: number }
export type CreateSellInput = {
  customerId: string
  items: SellItemInput[]
  deliveryAddress?: string
  discount?: number
  paidAmount?: number
  transportPerTrip?: number
  transportTrips?: number
}

export type UpdateSellInput = {
  status?: OrderStatus
  deliveryAddress?: string
  discount?: number
  paidAmount?: number
  transportPerTrip?: number
  transportTrips?: number
}

export async function listSells<T = any[]>(): Promise<T> {
  const res = await api.get<T>('/sells')
  return res.data
}

export async function createSell<T = any>(data: CreateSellInput): Promise<T> {
  const res = await api.post<T>('/sells', data)
  return res.data
}

export async function updateSell<T = any>(id: string, data: UpdateSellInput): Promise<T> {
  const res = await api.patch<T>(`/sells/${id}`, data)
  return res.data
}

export async function deleteSell(id: string): Promise<{ ok: boolean } | any> {
  const res = await api.delete(`/sells/${id}`)
  return res.data
}
