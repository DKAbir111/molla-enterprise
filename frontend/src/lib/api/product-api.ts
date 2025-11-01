import { api } from './http'

export type CreateProductInput = {
  name: string
  type: string
  grade?: string
  price: number
  unit: string
  stock: number
  description?: string
}

export type UpdateProductInput = Partial<CreateProductInput>

export async function listProducts<T = any[]>(): Promise<T> {
  const res = await api.get<T>('/products')
  return res.data
}

export async function createProduct<T = any>(data: CreateProductInput): Promise<T> {
  const res = await api.post<T>('/products', data)
  return res.data
}

export async function updateProduct<T = any>(id: string, data: UpdateProductInput): Promise<T> {
  const res = await api.patch<T>(`/products/${id}`, data)
  return res.data
}

export async function deleteProduct(id: string): Promise<{ ok: boolean } | any> {
  const res = await api.delete(`/products/${id}`)
  return res.data
}

