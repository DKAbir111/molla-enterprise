import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async get(orgId: string, months = 6, productDays = 90) {
    const [incomeTx, expenseTx, activeOrders, customersCount, products, ordersForSales] = await Promise.all([
      this.prisma.transaction.findMany({ where: { organizationId: orgId, type: 'income' } }),
      this.prisma.transaction.findMany({ where: { organizationId: orgId, type: 'expense' } }),
      this.prisma.order.count({ where: { organizationId: orgId, NOT: { status: { in: ['delivered', 'cancelled'] } } } }),
      this.prisma.customer.count({ where: { organizationId: orgId } }),
      this.prisma.product.findMany({ where: { organizationId: orgId }, select: { price: true, stock: true, name: true, id: true } }),
      this.prisma.order.findMany({
        where: { organizationId: orgId, createdAt: { gte: new Date(Date.now() - productDays * 24 * 60 * 60 * 1000) } },
        include: { items: true },
      }),
    ]);

    const toNumber = (v: any) => (typeof v === 'number' ? v : Number(v ?? 0));

    const totalRevenue = incomeTx.reduce((s, t) => s + toNumber((t as any).amount), 0);
    const totalExpenses = expenseTx.reduce((s, t) => s + toNumber((t as any).amount), 0);
    const stockedProductValue = products.reduce((s, p) => s + toNumber((p as any).price) * toNumber((p as any).stock), 0);

    // Revenue series by month for the last N months
    const now = new Date();
    const monthsKeys: { key: string; label: string; month: number; year: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsKeys.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() });
    }
    const sums: Record<string, number> = {};
    monthsKeys.forEach((m) => (sums[m.key] = 0));
    incomeTx.forEach((t) => {
      const d = (t as any).date ? new Date((t as any).date as any) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in sums) sums[key] += toNumber((t as any).amount);
    });
    const revenueSeries = monthsKeys.map((m) => ({ name: m.label, revenue: sums[m.key] || 0 }));

    // Product sales (top 4 by quantity)
    const totals: Record<string, number> = {};
    ordersForSales.forEach((o) => {
      (o.items || []).forEach((it) => {
        totals[(it as any).productName] = (totals[(it as any).productName] || 0) + toNumber((it as any).quantity);
      });
    });
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, sales]) => ({ name, sales }));

    return {
      overview: {
        totalRevenue,
        totalExpenses,
        activeOrders,
        customers: customersCount,
        stockedProductValue,
      },
      revenueSeries,
      productSales: top,
    };
  }
}

