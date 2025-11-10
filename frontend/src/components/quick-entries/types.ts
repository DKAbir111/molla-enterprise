export type QuickTransaction = {
  id: string
  description: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
}

export type QuickEntryForm = {
  type: 'income' | 'expense'
  name: string
  phone: string
  address: string
  note: string
  category: string
  date: string
}

export type QuickLine = {
  id: string
  name: string
  quantity: number
  rate: string
}
