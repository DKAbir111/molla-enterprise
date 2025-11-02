import { api } from './http'

export type BuyItemInput = { productId: string; quantity: number; price: number }
export type CreateBuyInput = {
  vendorName?: string
  vendorPhone?: string
  items: BuyItemInput[]
  discount?: number
  paidAmount?: number
  transportPerTrip?: number
  transportTrips?: number
}

export async function listBuys<T = any[]>(): Promise<T> {
  const res = await api.get<T>('/buys')
  return res.data
}

export async function createBuy<T = any>(data: CreateBuyInput): Promise<T> {
  const res = await api.post<T>('/buys', data)
  return res.data
}

