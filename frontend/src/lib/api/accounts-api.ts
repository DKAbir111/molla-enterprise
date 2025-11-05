import { api } from './http'

export type AccountsSummary = {
  totals: { income: number; expenses: number; net: number }
  monthly: { month: string; income: number; expense: number }[]
  recent: { id: string; type: 'income' | 'expense'; description: string; amount: number; date: string }[]
}

export async function getAccountsSummary<T = AccountsSummary>(): Promise<T> {
  const res = await api.get<T>('/accounts/summary')
  return res.data
}

