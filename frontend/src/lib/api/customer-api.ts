import { api } from './http'

export type CreateCustomerInput = {
  name: string
  phone: string
  email?: string
  address: string
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

export async function listCustomers<T = any[]>(): Promise<T> {
  const res = await api.get<T>('/customers')
  return res.data
}

export async function getCustomer<T = any>(id: string): Promise<T> {
  const res = await api.get<T>(`/customers/${id}`)
  return res.data
}

export async function createCustomer<T = any>(data: CreateCustomerInput): Promise<T> {
  const res = await api.post<T>('/customers', data)
  return res.data
}

export async function updateCustomer<T = any>(id: string, data: UpdateCustomerInput): Promise<T> {
  const res = await api.patch<T>(`/customers/${id}`, data)
  return res.data
}

export async function deleteCustomer(id: string): Promise<{ ok: boolean } | any> {
  const res = await api.delete(`/customers/${id}`)
  return res.data
}

export async function uploadCustomerAvatar<T = any>(id: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('avatar', file)
  const res = await api.patch<T>(`/customers/${id}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}
