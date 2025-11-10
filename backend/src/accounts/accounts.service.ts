import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function toNumber(x: any): number {
  if (x == null) return 0
  if (typeof x === 'number') return x
  return Number(x)
}

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required')
    return orgId
  }

  async getSummary(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId)

    const [sells, buys, transactions] = await Promise.all([
      this.prisma.sell.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, select: { id: true, customerId: true, createdAt: true, total: true, discount: true, transportTotal: true, customer: { select: { name: true } } } }),
      this.prisma.buy.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, select: { id: true, vendorName: true, createdAt: true, total: true, discount: true, transportTotal: true } }),
      this.prisma.transaction.findMany({ where: { organizationId }, orderBy: { date: 'desc' } }),
    ])

    const manualIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Math.max(0, toNumber(t.amount)), 0)
    const manualExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.max(0, toNumber(t.amount)), 0)

    const income = sells.reduce((sum, s) => sum + Math.max(0, toNumber(s.total) + toNumber(s.transportTotal) - toNumber(s.discount)), 0) + manualIncome
    const expenses = buys.reduce((sum, b) => sum + Math.max(0, toNumber(b.total) + toNumber(b.transportTotal) - toNumber(b.discount)), 0) + manualExpense
    const net = income - expenses

    // Last 6 months buckets
    const now = new Date()
    const buckets: { key: string; label: string; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toISOString().slice(0, 7), income: 0, expense: 0 })
    }
    const bucketMap = new Map(buckets.map(b => [b.key, b]))

    for (const s of sells) {
      const d = new Date(s.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const b = bucketMap.get(key)
      if (b) b.income += Math.max(0, toNumber(s.total) + toNumber(s.transportTotal) - toNumber(s.discount))
    }
    for (const bBuy of buys) {
      const d = new Date(bBuy.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const b = bucketMap.get(key)
      if (b) b.expense += Math.max(0, toNumber(bBuy.total) + toNumber(bBuy.transportTotal) - toNumber(bBuy.discount))
    }
    for (const txn of transactions) {
      const d = new Date(txn.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = bucketMap.get(key)
      if (!bucket) continue
      const amt = Math.max(0, toNumber(txn.amount))
      if (txn.type === 'income') bucket.income += amt
      else bucket.expense += amt
    }

    // Recent combined
    const recent = [
      ...sells.map((s) => ({
        id: `sell-${s.id}`,
        type: 'income' as const,
        description: `Sale - ${s.customer?.name ?? 'Customer'}`,
        amount: Math.max(0, toNumber(s.total) + toNumber(s.transportTotal) - toNumber(s.discount)),
        date: s.createdAt,
      })),
      ...buys.map((b) => ({
        id: `buy-${b.id}`,
        type: 'expense' as const,
        description: `Purchase - ${b.vendorName ?? 'Vendor'}`,
        amount: Math.max(0, toNumber(b.total) + toNumber(b.transportTotal) - toNumber(b.discount)),
        date: b.createdAt,
      })),
      ...transactions.map((t) => ({
        id: `txn-${t.id}`,
        type: (t.type === 'income' ? 'income' : 'expense') as const,
        description: t.description,
        amount: Math.max(0, toNumber(t.amount)),
        date: t.date,
      })),
    ]
      .sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime())
      .slice(0, 10)

    return {
      totals: { income, expenses, net },
      monthly: buckets.map(b => ({ month: b.label, income: b.income, expense: b.expense })),
      recent,
    }
  }
}
