import { api } from './http'

export type CreateOrganizationInput = {
  name: string
  email: string
  phone: string
  address: string
  logoFile?: File | null
  logoBase64?: string
}

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>

export async function createOrganization<T = any>(data: CreateOrganizationInput): Promise<T> {
  const form = new FormData()
  form.append('name', data.name)
  form.append('email', data.email)
  form.append('phone', data.phone)
  form.append('address', data.address)
  if (data.logoFile) form.append('logo', data.logoFile)
  else if (data.logoBase64) form.append('logoBase64', data.logoBase64)
  const res = await api.post<T>('/organizations', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function getMyOrganization<T = any>(): Promise<T> {
  const res = await api.get<T>('/organizations/me')
  return res.data
}

export async function updateOrganization<T = any>(id: string, data: UpdateOrganizationInput): Promise<T> {
  const form = new FormData()
  if (data.name) form.append('name', data.name)
  if (data.email) form.append('email', data.email)
  if (data.phone) form.append('phone', data.phone)
  if (data.address) form.append('address', data.address)
  if (data.logoFile) form.append('logo', data.logoFile)
  else if (data.logoBase64) form.append('logoBase64', data.logoBase64)
  const res = await api.patch<T>(`/organizations/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function getMyOrganizationSettings<T = any>(): Promise<T> {
  const res = await api.get<T>('/organizations/me/settings')
  return res.data
}

export type UpdateOrganizationSettingsInput = Partial<{
  notifyLowStock: boolean
  notifyOrderUpdates: boolean
  notifyReceivables: boolean
  notifyPayables: boolean
  emailAlerts: boolean
  smsAlerts: boolean
  lowStockThreshold: number
  pendingOrderAgingHours: number
  receivableReminderDays: number
  payableReminderDays: number
}>

export async function updateOrganizationSettings<T = any>(id: string, data: UpdateOrganizationSettingsInput): Promise<T> {
  const res = await api.patch<T>(`/organizations/${id}/settings`, data)
  return res.data
}
