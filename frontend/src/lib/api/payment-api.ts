import { api } from './http'

export type PaymentMethod = 'cash' | 'bank' | 'mobile' | 'cheque' | 'other'

export type Payment = {
  id: string
  direction: 'in' | 'out'
  amount: number | string
  date: string
  method: PaymentMethod
  note?: string | null
  customerId?: string | null
  vendorId?: string | null
  sellId?: string | null
  buyId?: string | null
}

export type ReceivePaymentInput = {
  amount: number
  customerId: string
  /** Settle one invoice. Omit to spread across unpaid invoices, oldest first. */
  sellId?: string
  date?: string
  method?: PaymentMethod
  note?: string
}

export type PayVendorInput = {
  amount: number
  vendorId?: string
  buyId?: string
  date?: string
  method?: PaymentMethod
  note?: string
}

export type AllocationResult = {
  applied: { sellId?: string; buyId?: string; amount: number }[]
  /** Paid more than was owed; held as credit against the contact. */
  unapplied: number
}

/** Who owes money, largest debt first. */
export type Receivable = {
  customerId: string
  name: string
  phone: string
  invoiced: number
  paid: number
  due: number
  credit?: number
  openInvoices: number
  oldestUnpaidAt: string | null
}

export async function receivePayment(data: ReceivePaymentInput): Promise<AllocationResult> {
  const res = await api.post<AllocationResult>('/payments/receive', data)
  return res.data
}

export async function payVendor(data: PayVendorInput): Promise<AllocationResult> {
  const res = await api.post<AllocationResult>('/payments/pay', data)
  return res.data
}

export type Payable = {
  vendorId: string | null
  name: string
  phone: string
  invoiced: number
  paid: number
  due: number
  openInvoices: number
  oldestUnpaidAt: string | null
}

export async function listPayables(): Promise<Payable[]> {
  const res = await api.get<Payable[]>('/payments/payables')
  return res.data
}

export async function listReceivables(): Promise<Receivable[]> {
  const res = await api.get<Receivable[]>('/payments/receivables')
  return res.data
}

export async function listPayments(params: { sellId?: string; buyId?: string; customerId?: string }): Promise<Payment[]> {
  const res = await api.get<Payment[]>('/payments', { params })
  return res.data
}

export async function deletePayment(id: string): Promise<{ ok: boolean }> {
  const res = await api.delete(`/payments/${id}`)
  return res.data
}
