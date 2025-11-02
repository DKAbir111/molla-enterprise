import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
type ProductLite = { id: string; name: string; price: any; stock: number };

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.order.findMany({
      where: { organizationId },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string | null | undefined, dto: CreateOrderDto) {
    const organizationId = this.ensureOrg(orgId);
    // Validate customer in org
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, organizationId } });
    if (!customer) throw new NotFoundException('Customer not found');

    // Build items with price lookup
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId }, select: { id: true, name: true, price: true, stock: true } });
    const productMap: Map<string, ProductLite> = new Map(products.map((p) => [p.id, p as ProductLite]));

    const itemsData = dto.items.map((i) => {
      const p = productMap.get(i.productId);
      if (!p) throw new NotFoundException(`Product not found: ${i.productId}`);
      const price = Number(p.price);
      const total = price * i.quantity;
      return {
        productId: p.id,
        productName: p.name,
        quantity: i.quantity,
        price,
        total,
      };
    });

    const total = itemsData.reduce((sum, i) => sum + i.total, 0);
    const discount = num((dto as any).discount)
    const paidAmount = num((dto as any).paidAmount)
    const tPerTrip = num((dto as any).transportPerTrip)
    const tTrips = Math.max(0, Number((dto as any).transportTrips ?? 0))
    const transportTotal = tPerTrip * tTrips

    // Create order, adjust stock, and record income in a single transaction
    const created = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          organizationId,
          customerId: dto.customerId,
          deliveryAddress: dto.deliveryAddress,
          status: 'pending',
          items: { create: itemsData },
          createdAt: new Date(),
        },
        include: { items: true },
      });

      // Deduct stock
      for (const it of itemsData) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
      }

      // Persist monetary fields if present
      try {
        await tx.order.update({ where: { id: order.id }, data: {
          total: total as any,
          discount: discount as any,
          paidAmount: paidAmount as any,
          transportPerTrip: tPerTrip as any,
          transportTrips: tTrips as any,
          transportTotal: transportTotal as any,
        } as any });
      } catch {}

      // Record received payment as income transaction
      if (paidAmount && paidAmount > 0) {
        await tx.transaction.create({
          data: {
            organizationId,
            description: `Order payment - ${order.id}`,
            type: 'income',
            amount: paidAmount as any,
            category: 'sales',
            date: new Date(),
          },
        });
      }
      return order;
    });

    return created;
  }

  async update(orgId: string | null | undefined, id: string, dto: UpdateOrderDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Order not found');
    const data: any = { ...dto };
    // Recalculate transportTotal if inputs are provided
    const tPerTrip = (dto as any).transportPerTrip ?? (found as any).transportPerTrip ?? 0;
    const tTrips = (dto as any).transportTrips ?? (found as any).transportTrips ?? 0;
    if (tPerTrip != null || tTrips != null) {
      const per = Number(tPerTrip ?? 0)
      const trips = Number(tTrips ?? 0)
      data.transportPerTrip = per
      data.transportTrips = trips
      data.transportTotal = per * trips
    }
    return this.prisma.order.update({ where: { id }, data });
  }

  async updateItems(orgId: string | null | undefined, id: string, dto: UpdateOrderItemsDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Order not found');

    // Fetch products for price/name fallback
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const rows = dto.items.map((i) => {
      const p = productMap.get(i.productId);
      if (!p) throw new NotFoundException(`Product not found: ${i.productId}`);
      const price = typeof i.price === 'number' ? i.price : Number(p.price);
      const total = price * i.quantity;
      return {
        orderId: id,
        productId: i.productId,
        productName: (p as any).name as string,
        quantity: i.quantity,
        price,
        total,
      };
    });

    const grand = rows.reduce((s, r) => s + r.total, 0);
    const result = await this.prisma.$transaction(async (tx) => {
      // restore previous stock from existing items
      const existing = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const it of existing) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
      }
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      // create new items and deduct stock
      await tx.orderItem.createMany({ data: rows });
      for (const r of rows) {
        await tx.product.update({ where: { id: r.productId }, data: { stock: { decrement: r.quantity } } });
      }
      // Best-effort persist of total
      try { await tx.order.update({ where: { id }, data: { total: grand } as any }); } catch {}
      return tx.order.findUnique({ where: { id }, include: { items: true, customer: true } });
    });
    return result;
  }
  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Order not found');
    // Delete child items first to satisfy FK constraints
    await this.prisma.$transaction([
      this.prisma.orderItem.deleteMany({ where: { orderId: id } }),
      this.prisma.order.delete({ where: { id } }),
    ])
    return { ok: true };
  }
}

// local numeric coercion helper
function num(v: any): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}
