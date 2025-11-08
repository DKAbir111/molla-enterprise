import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateSellDto } from './dto/create-sell.dto';
import { UpdateSellDto } from './dto/update-sell.dto';
import { UpdateSellItemsDto } from './dto/update-sell-items.dto';

type ProductLite = { id: string; name: string; price: any; stock: number; targetPrice?: any };

@Injectable()
export class SellsService {
  constructor(private prisma: PrismaService, private alertsSvc: AlertsService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.sell.findMany({
      where: { organizationId },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.sell.findFirst({
      where: { id, organizationId },
      include: { items: true, customer: true },
    });
  }

  async create(orgId: string | null | undefined, dto: CreateSellDto) {
    const organizationId = this.ensureOrg(orgId);
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, organizationId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId }, select: { id: true, name: true, price: true, stock: true, targetPrice: true } });
    const productMap: Map<string, ProductLite> = new Map(products.map((p) => [p.id, p as ProductLite]));

    const itemsData = dto.items.map((i) => {
      const p = productMap.get(i.productId);
      if (!p) throw new NotFoundException(`Product not found: ${i.productId}`);
      let price = typeof (i as any).price === 'number' ? Number((i as any).price) : Number(p.price);
      const floor = Number((p as any).targetPrice ?? p.price ?? 0);
      if (price < floor) price = floor;
      const total = price * i.quantity;
      return { productId: p.id, productName: p.name, quantity: i.quantity, price, total };
    });

    const total = itemsData.reduce((sum, i) => sum + i.total, 0);
    const discount = num((dto as any).discount)
    const paidAmount = num((dto as any).paidAmount)
    const tPerTrip = num((dto as any).transportPerTrip)
    const tTrips = Math.max(0, Number((dto as any).transportTrips ?? 0))
    const transportTotal = tPerTrip * tTrips

    const created = await this.prisma.$transaction(async (tx) => {
      const sell = await tx.sell.create({
        data: {
          organizationId,
          customerId: dto.customerId,
          deliveryAddress: dto.deliveryAddress,
          status: 'pending',
          items: { create: itemsData },
          createdAt: new Date(),
          total: total as any,
          discount: discount as any,
          paidAmount: paidAmount as any,
          transportPerTrip: tPerTrip as any,
          transportTrips: tTrips as any,
          transportTotal: transportTotal as any,
        },
        include: { items: true },
      });

      // Generate and persist short code for fast lookup
      try {
        const code = this.makeShortCode(sell.id, new Date((sell as any).createdAt ?? Date.now()))
        await (tx as any).sell.update({ where: { id: sell.id }, data: { shortCode: code } })
        ;(sell as any).shortCode = code
      } catch {}

      const crossed: string[] = []
      for (const it of itemsData) {
        const updated = await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
        try {
          const prev = productMap.get(it.productId) as any
          const settings = await (this.prisma as any).organizationSettings.findUnique({ where: { organizationId } }).catch(() => null) as any
          const threshold = settings?.lowStockThreshold ?? 5
          if (prev && Number(prev.stock || 0) > threshold && Number((updated as any).stock || 0) <= threshold) {
            crossed.push(it.productId)
          }
        } catch {}
        if ((updated as any).stock <= 0) {
          try { await tx.product.update({ where: { id: it.productId }, data: { active: false } }); } catch {}
        }
      }

      if (paidAmount && paidAmount > 0) {
        await tx.transaction.create({
          data: {
            organizationId,
            description: `Sell payment - ${sell.id}`,
            type: 'income',
            amount: paidAmount as any,
            category: 'sales',
            date: new Date(),
          },
        });
      }

      // Notify low stock for any crossing products (fire & forget)
      try { if (crossed.length > 0) await this.alertsSvc.notifyLowStockIfNeeded(organizationId, crossed) } catch {}
      return sell;
    });

    return created;
  }

  async update(orgId: string | null | undefined, id: string, dto: UpdateSellDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.sell.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Sell not found');
    const data: any = { ...dto };
    const tPerTrip = (dto as any).transportPerTrip ?? (found as any).transportPerTrip ?? 0;
    const tTrips = (dto as any).transportTrips ?? (found as any).transportTrips ?? 0;
    if (tPerTrip != null || tTrips != null) {
      const per = Number(tPerTrip ?? 0)
      const trips = Number(tTrips ?? 0)
      data.transportPerTrip = per
      data.transportTrips = trips
      data.transportTotal = per * trips
    }
    return this.prisma.sell.update({ where: { id }, data });
  }

  async updateItems(orgId: string | null | undefined, id: string, dto: UpdateSellItemsDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.sell.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Sell not found');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const rows = dto.items.map((i) => {
      const p = productMap.get(i.productId);
      if (!p) throw new NotFoundException(`Product not found: ${i.productId}`);
      const price = typeof i.price === 'number' ? i.price : Number((p as any).price);
      const total = price * i.quantity;
      return { orderId: id as any, productId: i.productId, productName: (p as any).name as string, quantity: i.quantity, price, total } as any;
    });

    const grand = rows.reduce((s, r) => s + r.total, 0);
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.sellItem.findMany({ where: { sellId: id } });
      for (const it of existing) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
      }
      await tx.sellItem.deleteMany({ where: { sellId: id } });
      await tx.sellItem.createMany({ data: rows.map(r => ({ sellId: id, ...r, orderId: undefined })) as any });
      for (const r of rows) {
        const updated = await tx.product.update({ where: { id: r.productId }, data: { stock: { decrement: r.quantity } } });
        if ((updated as any).stock <= 0) {
          try { await tx.product.update({ where: { id: r.productId }, data: { active: false } }); } catch {}
        }
      }
      try { await tx.sell.update({ where: { id }, data: { total: grand } as any }); } catch {}
      return tx.sell.findUnique({ where: { id }, include: { items: true, customer: true } });
    });
    return result;
  }

  search(orgId?: string | null, q?: string) {
    const organizationId = this.ensureOrg(orgId)
    const raw = (q || '').trim()
    if (!raw) return this.prisma.sell.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, include: { items: true, customer: true } })
    const normalized = raw.toUpperCase()
    // Extract short suffix if a display code like ORD-YYMM-XXXXXX
    let suffix = ''
    const m = normalized.match(/^ORD-\d{4}-([A-Z0-9]{6})$/)
    if (m) suffix = m[1].toLowerCase()
    else if (/^[A-Z0-9]{6}$/.test(normalized)) suffix = normalized.toLowerCase()
    return this.prisma.sell.findMany({
      where: {
        organizationId,
        OR: [
          { id: raw },
          { shortCode: normalized },
          ...(suffix ? [{ id: { contains: suffix } }] : []),
        ] as any,
      },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
      take: 25,
    })
  }

  private makeShortCode(id: string, date?: Date) {
    const d = date || new Date()
    const yy = String(d.getFullYear()).slice(-2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const short = (id || '').replace(/-/g, '').slice(0, 6).toUpperCase()
    return `ORD-${yy}${mm}-${short}`
  }
}

function num(v: any): number { return typeof v === 'number' ? v : Number(v ?? 0) }
