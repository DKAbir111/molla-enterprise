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

export type RevenuePoint = { name: string; revenue: number }
export type ProductSalesPoint = { name: string; sales: number }

export type DashboardData = {
  overview: DashboardOverview
  revenueSeries: RevenuePoint[]
  productSales: ProductSalesPoint[]
}

