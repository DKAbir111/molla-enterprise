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

export type UpdateBuyInput = Partial<Omit<CreateBuyInput, 'items'>>
export type UpdateBuyItemsInput = { items: { productId: string; quantity: number; price?: number }[] }

export async function updateBuy<T = any>(id: string, data: UpdateBuyInput): Promise<T> {
  const res = await api.patch<T>(`/buys/${id}`, data)
  return res.data
}

export async function updateBuyItems<T = any>(id: string, data: UpdateBuyItemsInput): Promise<T> {
  const res = await api.put<T>(`/buys/${id}/items`, data)
  return res.data
}
