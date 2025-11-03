import { api } from './http'

export type CreateVendorInput = {
  name: string
  phone: string
  email?: string
  address?: string
}

export type UpdateVendorInput = Partial<CreateVendorInput>

export async function listVendors<T = any[]>(): Promise<T> {
  const res = await api.get<T>('/vendors')
  return res.data
}

export async function getVendor<T = any>(id: string): Promise<T> {
  const res = await api.get<T>(`/vendors/${id}`)
  return res.data
}

export async function createVendor<T = any>(data: CreateVendorInput): Promise<T> {
  const res = await api.post<T>('/vendors', data)
  return res.data
}

export async function updateVendor<T = any>(id: string, data: UpdateVendorInput): Promise<T> {
  const res = await api.patch<T>(`/vendors/${id}`, data)
  return res.data
}

export async function deleteVendor(id: string): Promise<{ ok: boolean } | any> {
  const res = await api.delete(`/vendors/${id}`)
  return res.data
}

