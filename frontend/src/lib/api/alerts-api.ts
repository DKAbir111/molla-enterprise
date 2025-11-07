import { api } from './http'

export type AlertsFeed = {
  lowStock: { count: number; items: { id: string; name: string; stock: number }[] }
  pendingOrders: { count: number; agingCount: number; items: { id: string; customerName: string; ageHours: number }[] }
  receivables: { count: number; totalDue: number; items: { id: string; customerName: string; due: number }[] }
  payables: { count: number; totalDue: number; items: { id: string; vendorName: string; due: number }[] }
}

export async function getAlerts<T = AlertsFeed>(limit = 5): Promise<T> {
  const res = await api.get<T>(`/alerts`, { params: { limit } })
  return res.data
}

export type SnoozePayload = { type: 'lowStock'|'pendingOrder'|'receivable'|'payable'; refId: string; days?: number; forever?: boolean }

export async function snoozeAlert(payload: SnoozePayload) {
  const res = await api.post(`/alerts/snooze`, payload)
  return res.data
}

export async function unsnoozeAlert(payload: { type: SnoozePayload['type']; refId: string }) {
  const res = await api.delete(`/alerts/snooze`, { data: payload as any })
  return res.data
}

export type SnoozedItem = {
  id: string
  type: 'lowStock'|'pendingOrder'|'receivable'|'payable'
  refId: string
  until?: string
  permanent?: boolean
  label?: string
  extra?: any
}

export async function listSnoozes<T = SnoozedItem[]>(): Promise<T> {
  const res = await api.get<T>(`/alerts/snoozes`)
  return res.data
}
