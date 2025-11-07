import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function toNumber(x: any): number {
  if (x == null) return 0;
  if (typeof x === 'number') return x;
  return Number(x);
}

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  async getAlerts(orgId?: string | null, limit = 5) {
    const organizationId = this.ensureOrg(orgId);

    // Load settings or defaults
    const settings = await (this.prisma as any).organizationSettings.findUnique({ where: { organizationId } })
      .catch(() => null) as any;
    const cfg = {
      notifyLowStock: settings?.notifyLowStock ?? true,
      notifyOrderUpdates: settings?.notifyOrderUpdates ?? true,
      notifyReceivables: settings?.notifyReceivables ?? true,
      notifyPayables: settings?.notifyPayables ?? true,
      lowStockThreshold: settings?.lowStockThreshold ?? 5,
      pendingOrderAgingHours: settings?.pendingOrderAgingHours ?? 24,
      receivableReminderDays: settings?.receivableReminderDays ?? 3,
      payableReminderDays: settings?.payableReminderDays ?? 3,
    };

    // Low stock
    let lowStock = { count: 0, items: [] as any[] };
    if (cfg.notifyLowStock) {
      const items = await this.prisma.product.findMany({
        where: { organizationId, stock: { lte: cfg.lowStockThreshold } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: limit,
      });
      const cnt = await this.prisma.product.count({ where: { organizationId, stock: { lte: cfg.lowStockThreshold } } });
      lowStock = { count: cnt, items };
    }

    // Pending orders + aging
    let pendingOrders = { count: 0, agingCount: 0, items: [] as any[] };
    if (cfg.notifyOrderUpdates) {
      const now = new Date();
      const agingDate = new Date(now.getTime() - cfg.pendingOrderAgingHours * 3600 * 1000);
      const items = await this.prisma.sell.findMany({
        where: { organizationId, status: 'pending' },
        select: { id: true, createdAt: true, customer: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
      const cnt = await this.prisma.sell.count({ where: { organizationId, status: 'pending' } });
      const agingCnt = await this.prisma.sell.count({ where: { organizationId, status: 'pending', createdAt: { lte: agingDate } } });
      const map = items.map((s) => ({ id: s.id, customerName: s.customer?.name ?? 'Customer', ageHours: Math.floor((now.getTime() - new Date(s.createdAt).getTime()) / 3600000) }));
      pendingOrders = { count: cnt, agingCount: agingCnt, items: map };
    }

    // Receivables (due > 0)
    let receivables = { count: 0, totalDue: 0, items: [] as any[] };
    if (cfg.notifyReceivables) {
      const sells = await this.prisma.sell.findMany({
        where: { organizationId },
        select: { id: true, customer: { select: { name: true } }, total: true, discount: true, transportTotal: true, paidAmount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const rows = sells.map((s) => {
        const grand = Math.max(0, toNumber(s.total) + toNumber(s.transportTotal) - toNumber(s.discount));
        const due = Math.max(0, grand - toNumber(s.paidAmount));
        return { id: s.id, customerName: s.customer?.name ?? 'Customer', due, createdAt: s.createdAt };
      }).filter((r) => r.due > 0);
      const totalDue = rows.reduce((sum, r) => sum + r.due, 0);
      receivables = { count: rows.length, totalDue, items: rows.slice(0, limit) };
    }

    // Payables (due > 0)
    let payables = { count: 0, totalDue: 0, items: [] as any[] };
    if (cfg.notifyPayables) {
      const buys = await this.prisma.buy.findMany({
        where: { organizationId },
        select: { id: true, vendorName: true, total: true, discount: true, transportTotal: true, paidAmount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const rows = buys.map((b) => {
        const grand = Math.max(0, toNumber(b.total) + toNumber(b.transportTotal) - toNumber(b.discount));
        const due = Math.max(0, grand - toNumber(b.paidAmount));
        return { id: b.id, vendorName: b.vendorName ?? 'Vendor', due, createdAt: b.createdAt };
      }).filter((r) => r.due > 0);
      const totalDue = rows.reduce((sum, r) => sum + r.due, 0);
      payables = { count: rows.length, totalDue, items: rows.slice(0, limit) };
    }

    return { lowStock, pendingOrders, receivables, payables };
  }
}

