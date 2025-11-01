import { toNumber } from './http'
import { listOrders } from './order-api'
import { listProducts } from './product-api'
import { listCustomers } from './customer-api'
import { listTransactions } from './transaction-api'
import { normalizeOrder } from './normalize'

export type DashboardOverview = {
  totalRevenue: number
  totalExpenses: number
  activeOrders: number
  customers: number
  stockedProductValue: number
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [orders, products, customers, transactions] = await Promise.all([
    listOrders<any[]>(),
    listProducts<any[]>(),
    listCustomers<any[]>(),
    listTransactions<any[]>(),
  ])

  const totalRevenue = (transactions || [])
    .filter((t: any) => String(t.type) === 'income')
    .reduce((sum: number, t: any) => sum + toNumber(t.amount), 0)

  const totalExpenses = (transactions || [])
    .filter((t: any) => String(t.type) === 'expense')
    .reduce((sum: number, t: any) => sum + toNumber(t.amount), 0)

  const activeOrders = (orders || []).filter((o: any) => !['delivered', 'cancelled'].includes(String(o.status))).length

  const stockedProductValue = (products || [])
    .reduce((sum: number, p: any) => sum + toNumber(p.price) * toNumber(p.stock), 0)

  return {
    totalRevenue,
    totalExpenses,
    activeOrders,
    customers: (customers || []).length,
    stockedProductValue,
  }
}

export async function getRecentOrders(limit = 5): Promise<ReturnType<typeof normalizeOrder>[]> {
  const raw = await listOrders<any[]>()
  const orders = (raw || []).map(normalizeOrder)
  const sorted = orders.slice().sort((a, b) => {
    const da = new Date(a.createdAt || a.date || 0).getTime()
    const db = new Date(b.createdAt || b.date || 0).getTime()
    return db - da
  })
  return sorted.slice(0, limit)
}

