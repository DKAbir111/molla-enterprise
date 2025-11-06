import { api } from './http'

export type CreateDryingGainInput = {
  productId: string
  quantity: number
  unitCost?: number
  note?: string
}

export async function listDryingGains<T = any[]>(productId?: string): Promise<T> {
  const res = await api.get<T>('/drying-gains', { params: productId ? { productId } : {} })
  return res.data
}

export async function createDryingGain<T = any>(data: CreateDryingGainInput): Promise<T> {
  const res = await api.post<T>('/drying-gains', data)
  return res.data
}

