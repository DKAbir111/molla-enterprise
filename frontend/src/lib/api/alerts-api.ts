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

