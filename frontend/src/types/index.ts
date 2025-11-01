export type ProductType =
  | 'vitiBalu'
  | 'gojariyaBalu'
  | 'pakshiBalu'
  | 'seletBalu'
  | 'pathor'
  | 'khoya'
  | 'rod'
  | 'cement'
  | string

export type ProductGrade = 'type1' | 'medium' | string

export interface Product {
  id: string
  name: string
  type: ProductType
  grade?: ProductGrade
  price: number
  buyPrice?: number
  targetPrice?: number
  unit: string
  stock: number
  description?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address: string
  totalOrders: number
  totalSpent: number
  createdAt: Date
}

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

export interface Order {
  date: string | number | Date
  id: string
  customerId: string
  customerName: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  deliveryAddress: string
  createdAt: Date
  deliveredAt?: Date
  discount?: number
  paidAmount?: number
  transportPerTrip?: number
  transportTrips?: number
  transportTotal?: number
}

export type InvoiceStatus = 'paid' | 'unpaid' | 'partial'

export interface Invoice {
  id: string
  invoiceNo: string
  orderId: string
  customerId: string
  customerName: string
  items: OrderItem[]
  amount: number
  status: InvoiceStatus
  dueDate: Date
  issueDate: Date
  createdAt: Date
  paidAt?: Date
}

export type DeliveryStatus = 'pending' | 'enRoute' | 'delivered'

export interface Delivery {
  deliveryDate: string | number | Date
  id: string
  orderId: string
  truckId: string
  driverId: string
  destination: string
  status: DeliveryStatus
  estimatedTime?: Date
  completedAt?: Date
  createdAt: Date
}

export interface Truck {
  id: string
  number: string
  driver: string
  capacity: number
  status: 'available' | 'busy' | 'maintenance'
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  description: string
  type: TransactionType
  amount: number
  category: string
  date: Date
}

export interface OilSale {
  id: string
  product: string
  quantity: number
  price: number
  total: number
  customerId: string
  customerName: string
  date: Date
}
