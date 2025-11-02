import { create } from 'zustand'
import { Product, Customer, Order, Transaction } from '@/types'

interface Store {
  // Products
  products: Product[]
  addProduct: (product: Product) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void

  // Customers
  customers: Customer[]
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => void

  // Sells (was Orders)
  sells: Order[]
  addSell: (sell: Order) => void
  updateSellStatus: (id: string, status: Order['status']) => void
  updateSell: (id: string, patch: Partial<Order>) => void
  deleteSell: (id: string) => void

  // Invoices removed
  // Delivery removed

  // Accounts
  transactions: Transaction[]
  addTransaction: (transaction: Transaction) => void

  // Oil business removed
}

export const useStore = create<Store>((set) => ({
  // Products
  products: [],
  addProduct: (product) => set((state) => {
    const exists = state.products.some((p) => p.id === product.id)
    return exists ? { products: state.products } : { products: [...state.products, product] }
  }),
  updateProduct: (id, updatedProduct) => set((state) => ({
    products: state.products.map((p) => p.id === id ? { ...p, ...updatedProduct } : p)
  })),
  deleteProduct: (id) => set((state) => ({
    products: state.products.filter((p) => p.id !== id)
  })),

  // Customers
  customers: [],
  addCustomer: (customer) => set((state) => {
    const exists = state.customers.some((c) => c.id === customer.id)
    return exists ? { customers: state.customers } : { customers: [...state.customers, customer] }
  }),
  updateCustomer: (id, updatedCustomer) => set((state) => ({
    customers: state.customers.map((c) => c.id === id ? { ...c, ...updatedCustomer } : c)
  })),
  deleteCustomer: (id) => set((state) => ({
    customers: state.customers.filter((c) => c.id !== id)
  })),

  // Sells (was Orders)
  sells: [],
  addSell: (sell) => set((state) => {
    const exists = state.sells.some((o) => o.id === sell.id)
    return exists ? { sells: state.sells } : { sells: [...state.sells, sell] }
  }),
  updateSellStatus: (id, status) => set((state) => ({
    sells: state.sells.map((o) => o.id === id ? { ...o, status } : o)
  })),
  updateSell: (id, patch) => set((state) => ({
    sells: state.sells.map((o) => o.id === id ? { ...o, ...patch } : o)
  })),
  deleteSell: (id) => set((state) => ({ sells: state.sells.filter((o) => o.id !== id) })),

  // Invoices removed
  // Delivery removed

  // Accounts
  transactions: [],
  addTransaction: (transaction) => set((state) => {
    const exists = state.transactions.some((t) => t.id === transaction.id)
    return exists ? { transactions: state.transactions } : { transactions: [...state.transactions, transaction] }
  }),

  // Oil business removed
}))
