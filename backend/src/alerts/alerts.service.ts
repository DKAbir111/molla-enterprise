import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

function toNumber(x: any): number {
  if (x == null) return 0;
  if (typeof x === 'number') return x;
  return Number(x);
}

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

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

    // Load snoozes (active only)
    const now = new Date();
    const snoozes = await (this.prisma as any).organizationAlertSnooze.findMany({
      where: {
        organizationId,
        OR: [
          { permanent: true },
          { until: { gte: now } },
        ],
      },
      select: { type: true, refId: true },
    }).catch(() => []) as Array<{ type: string; refId: string }>
    const snoozeSet = {
      lowStock: new Set<string>(),
      pendingOrder: new Set<string>(),
      receivable: new Set<string>(),
      payable: new Set<string>(),
    } as Record<string, Set<string>>
    for (const s of snoozes) { (snoozeSet[s.type] || new Set()).add(s.refId) }

    // Low stock (active products only)
    let lowStock = { count: 0, items: [] as any[] };
    if (cfg.notifyLowStock) {
      const items = await this.prisma.product.findMany({
        where: { organizationId, active: true, stock: { lte: cfg.lowStockThreshold }, id: { notIn: Array.from(snoozeSet.lowStock) } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: limit,
      });
      const cnt = await this.prisma.product.count({ where: { organizationId, active: true, stock: { lte: cfg.lowStockThreshold }, id: { notIn: Array.from(snoozeSet.lowStock) } } });
      lowStock = { count: cnt, items };
    }

    // Pending orders + aging
    let pendingOrders = { count: 0, agingCount: 0, items: [] as any[] };
    if (cfg.notifyOrderUpdates) {
      const agingDate = new Date(now.getTime() - cfg.pendingOrderAgingHours * 3600 * 1000);
      const items = await this.prisma.sell.findMany({
        where: { organizationId, status: 'pending', id: { notIn: Array.from(snoozeSet.pendingOrder) } },
        select: { id: true, createdAt: true, customer: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
      const cnt = await this.prisma.sell.count({ where: { organizationId, status: 'pending', id: { notIn: Array.from(snoozeSet.pendingOrder) } } });
      const agingCnt = await this.prisma.sell.count({ where: { organizationId, status: 'pending', createdAt: { lte: agingDate }, id: { notIn: Array.from(snoozeSet.pendingOrder) } } });
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
      }).filter((r) => r.due > 0 && !snoozeSet.receivable.has(r.id));
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
      }).filter((r) => r.due > 0 && !snoozeSet.payable.has(r.id));
      const totalDue = rows.reduce((sum, r) => sum + r.due, 0);
      payables = { count: rows.length, totalDue, items: rows.slice(0, limit) };
    }

    return { lowStock, pendingOrders, receivables, payables };
  }

  async snooze(orgId: string | null | undefined, type: 'lowStock'|'pendingOrder'|'receivable'|'payable', refId: string, days?: number, forever?: boolean) {
    const organizationId = this.ensureOrg(orgId)
    const now = new Date()
    const until = forever ? null : (days && days > 0 ? new Date(now.getTime() + days * 86400000) : new Date(now.getTime() + 7 * 86400000))
    const permanent = !!forever
    const existing = await (this.prisma as any).organizationAlertSnooze.findFirst({ where: { organizationId, type, refId } })
    if (existing) {
      return (this.prisma as any).organizationAlertSnooze.update({ where: { id: (existing as any).id }, data: { until, permanent } })
    }
    return (this.prisma as any).organizationAlertSnooze.create({ data: { organizationId, type, refId, until, permanent } })
  }

  async unsnooze(orgId: string | null | undefined, type: 'lowStock'|'pendingOrder'|'receivable'|'payable', refId: string) {
    const organizationId = this.ensureOrg(orgId)
    await (this.prisma as any).organizationAlertSnooze.deleteMany({ where: { organizationId, type, refId } })
    return { ok: true }
  }

  async listSnoozes(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId)
    const now = new Date()
    const rows = await (this.prisma as any).organizationAlertSnooze.findMany({
      where: { organizationId, OR: [{ permanent: true }, { until: { gte: now } }] },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, refId: true, until: true, permanent: true, createdAt: true },
    })
    const byType = rows.reduce((acc: Record<string, string[]>, r: any) => {
      (acc[r.type] ||= []).push(r.refId); return acc
    }, {})
    const [products, sells, buys] = await Promise.all([
      (byType['lowStock']?.length ? this.prisma.product.findMany({ where: { id: { in: byType['lowStock'] }, organizationId }, select: { id: true, name: true, stock: true } }) : Promise.resolve([])) as any,
      ((byType['pendingOrder']?.length || byType['receivable']?.length) ? this.prisma.sell.findMany({ where: { id: { in: [ ...(byType['pendingOrder']||[]), ...(byType['receivable']||[]) ] }, organizationId }, select: { id: true, createdAt: true, total: true, discount: true, transportTotal: true, paidAmount: true, customer: { select: { name: true } } } }) : Promise.resolve([])) as any,
      (byType['payable']?.length ? this.prisma.buy.findMany({ where: { id: { in: byType['payable'] }, organizationId }, select: { id: true, createdAt: true, total: true, discount: true, transportTotal: true, paidAmount: true, vendorName: true } }) : Promise.resolve([])) as any,
    ])
    const pArr: any[] = products as any[]
    const sArr: any[] = sells as any[]
    const bArr: any[] = buys as any[]
    const pMap = new Map<any, any>(pArr.map((p: any) => [p.id, p]))
    const sMap = new Map<any, any>(sArr.map((s: any) => [s.id, s]))
    const bMap = new Map<any, any>(bArr.map((b: any) => [b.id, b]))
    const list = rows.map((r: any) => {
      if (r.type === 'lowStock') {
        const p = pMap.get(r.refId) as any
        return { ...r, label: p ? p.name : 'Product', extra: p ? { stock: Number(p.stock || 0) } : undefined }
      }
      if (r.type === 'pendingOrder' || r.type === 'receivable') {
        const s = sMap.get(r.refId) as any
        const grand = s ? Math.max(0, toNumber(s.total) + toNumber(s.transportTotal) - toNumber(s.discount)) : 0
        const due = s ? Math.max(0, grand - toNumber(s.paidAmount)) : 0
        const ageHours = s ? Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 3600000) : 0
        return { ...r, label: s ? `#${String(r.refId).slice(0,6).toUpperCase()} - ${s.customer?.name ?? 'Customer'}` : 'Order', extra: { due, ageHours } }
      }
      if (r.type === 'payable') {
        const b = bMap.get(r.refId) as any
        const grand = b ? Math.max(0, toNumber(b.total) + toNumber(b.transportTotal) - toNumber(b.discount)) : 0
        const due = b ? Math.max(0, grand - toNumber(b.paidAmount)) : 0
        return { ...r, label: b ? b.vendorName ?? 'Vendor' : 'Vendor', extra: { due } }
      }
      return r
    })
    return list
  }

  async notifyLowStockIfNeeded(orgId: string, productIds: string[]) {
    const organizationId = this.ensureOrg(orgId)
    const settings = await (this.prisma as any).organizationSettings.findUnique({ where: { organizationId } }).catch(() => null) as any
    if (!settings?.emailAlerts || !settings?.notifyLowStock) return
    const threshold = settings.lowStockThreshold ?? 5
    const now = new Date()
    const snoozed = await (this.prisma as any).organizationAlertSnooze.findMany({
      where: { organizationId, type: 'lowStock', OR: [{ permanent: true }, { until: { gte: now } }] }, select: { refId: true }
    }).catch(() => []) as any[]
    const muted = new Set(snoozed.map(s => s.refId))
    const prods = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId, active: true }, select: { id: true, name: true, stock: true } })
    const toSend = prods.filter(p => !muted.has(p.id) && Number(p.stock || 0) <= threshold)
    if (toSend.length === 0) return
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId }, select: { email: true, name: true } })
    if (!org?.email) return
    const lis = toSend.map(p => `<li>${p.name} — ${p.stock} left</li>`).join('')
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;font-size:14px;">
      <p>Low stock alert for ${org.name}:</p>
      <ul>${lis}</ul>
      <p style="font-size:12px;color:#555;">You can snooze specific items from the app.</p>
    </div>`
    await this.mail.sendGeneric(org.email, `Low stock alert (${toSend.length})`, html)
  }
}
