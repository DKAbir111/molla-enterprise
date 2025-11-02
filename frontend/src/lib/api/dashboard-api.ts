import { api } from './http'
import { normalizeOrder } from './normalize'

export type DashboardOverview = {
  totalRevenue: number
  totalExpenses: number
  activeOrders: number
  customers: number
  stockedProductValue: number
  moneyReceived?: number
  moneyDue?: number
  transportRevenue?: number
}

export type DashboardData = {
  overview: DashboardOverview
  revenueSeries: { name: string; revenue: number }[]
  productSales: { name: string; sales: number }[]
}

export async function getDashboardData(params?: { months?: number; productDays?: number; startDate?: string; endDate?: string }): Promise<DashboardData> {
  const search = new URLSearchParams()
  if (params?.months) search.set('months', String(params.months))
  if (params?.productDays) search.set('productDays', String(params.productDays))
  if (params?.startDate) search.set('startDate', params.startDate)
  if (params?.endDate) search.set('endDate', params.endDate)
  const res = await api.get<DashboardData>(`/dashboard${search.toString() ? `?${search}` : ''}`)
  return res.data
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const data = await getDashboardData()
  return data.overview
}

export async function getRecentOrders(limit = 5): Promise<ReturnType<typeof normalizeOrder>[]> {
  // For now, still rely on listOrders here (optional to move into /dashboard later)
  const res = await api.get<any[]>('/orders')
  const orders = (res.data || []).map(normalizeOrder)
  const sorted = orders.slice().sort((a, b) => {
    const da = new Date(a.createdAt || a.date || 0).getTime()
    const db = new Date(b.createdAt || b.date || 0).getTime()
    return db - da
  })
  return sorted.slice(0, limit)
}
