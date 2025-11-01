import { api } from './http'

export type CreateTransactionInput = {
  description: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date?: string
}

export async function listTransactions<T = any[]>(): Promise<T> {
  const res = await api.get<T>('/transactions')
  return res.data
}

export async function createTransaction<T = any>(data: CreateTransactionInput): Promise<T> {
  const res = await api.post<T>('/transactions', data)
  return res.data
}

export async function deleteTransaction(id: string): Promise<{ ok: boolean } | any> {
  const res = await api.delete(`/transactions/${id}`)
  return res.data
}

