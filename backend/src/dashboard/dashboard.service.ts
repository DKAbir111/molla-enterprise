import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async get(orgId: string, months = 6, productDays = 90, startDate?: string, endDate?: string) {
    const now = new Date();
    let seriesStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    let seriesEnd = now;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= e) {
        seriesStart = s;
        seriesEnd = e;
      }
    }
    const [incomeTx, expenseTx, activeOrders, customersCount, products, ordersForSales, ordersForRevenue] = await Promise.all([
      this.prisma.transaction.findMany({ where: { organizationId: orgId, type: 'income' } }),
      this.prisma.transaction.findMany({ where: { organizationId: orgId, type: 'expense' } }),
      this.prisma.sell.count({ where: { organizationId: orgId, NOT: { status: { in: ['delivered', 'cancelled'] } } } }),
      this.prisma.customer.count({ where: { organizationId: orgId } }),
      this.prisma.product.findMany({ where: { organizationId: orgId }, select: { price: true, buyPrice: true, otherCostPerUnit: true, stock: true, name: true, id: true } }),
      this.prisma.sell.findMany({
        where: { organizationId: orgId, createdAt: { gte: new Date(Date.now() - productDays * 24 * 60 * 60 * 1000) } },
        include: { items: true },
      }),
      this.prisma.sell.findMany({
        where: { organizationId: orgId, createdAt: { gte: seriesStart, lte: seriesEnd } },
        include: { items: true },
      }),
    ]);

    const toNumber = (v: any) => (typeof v === 'number' ? v : Number(v ?? 0));

    // Revenue should be based on orders (sales), not transactions
    let totalRevenue = 0;
    const totalExpenses = expenseTx.reduce((s, t) => s + toNumber((t as any).amount), 0);
    const stockedProductValue = products.reduce((s, p) => s + (toNumber((p as any).buyPrice ?? 0) + toNumber((p as any).otherCostPerUnit ?? 0)) * toNumber((p as any).stock), 0);

    // Revenue series by month for the last N months
    const monthsKeys: { key: string; label: string; month: number; year: number }[] = [];
    const startY = seriesStart.getFullYear();
    const startM = seriesStart.getMonth();
    const endY = seriesEnd.getFullYear();
    const endM = seriesEnd.getMonth();
    const steps = (endY - startY) * 12 + (endM - startM) + 1;
    for (let i = 0; i < steps; i++) {
      const d = new Date(startY, startM + i, 1);
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
    const orderSums: Record<string, number> = {};
    monthsKeys.forEach((m) => (orderSums[m.key] = 0));
    ordersForRevenue.forEach((o) => {
      const d = (o as any).createdAt ? new Date((o as any).createdAt as any) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      // Revenue from products sold, minus discount; transport is excluded from revenue
      const itemsTotal = (o.items || []).reduce((s, it) => s + toNumber((it as any).total), 0);
      const discount = toNumber((o as any).discount);
      const revenue = Math.max(0, itemsTotal - discount);
      if (key in orderSums) orderSums[key] += revenue;
    });
    let revenueSeries = monthsKeys.map((m) => ({ name: m.label, revenue: orderSums[m.key] || 0 }));
    totalRevenue = revenueSeries.reduce((s, p) => s + p.revenue, 0);

    // Received and Due based on orders in period
    const moneyReceived = ordersForRevenue.reduce((s, o) => s + toNumber((o as any).paidAmount), 0);
    const moneyDue = ordersForRevenue.reduce((s, o) => {
      const itemsTotal = (o.items || []).reduce((acc, it) => acc + toNumber((it as any).total), 0);
      const tTotal = toNumber((o as any).transportTotal);
      const discount = toNumber((o as any).discount);
      const paid = toNumber((o as any).paidAmount);
      const due = (itemsTotal + tTotal - discount) - paid;
      return s + Math.max(0, due);
    }, 0);

    // Transportation revenue (sum of transportTotal)
    const transportRevenue = ordersForRevenue.reduce((s, o) => s + toNumber((o as any).transportTotal), 0);

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
        transportRevenue,
        moneyReceived,
        moneyDue,
      },
      revenueSeries,
      productSales: top,
    };
  }
}
