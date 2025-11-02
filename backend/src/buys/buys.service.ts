import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuyDto } from './dto/create-buy.dto';

@Injectable()
export class BuysService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) { if (!orgId) throw new ForbiddenException('Organization required'); return orgId }

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId)
    return this.prisma.buy.findMany({ where: { organizationId }, include: { items: true }, orderBy: { createdAt: 'desc' } })
  }

  async create(orgId: string | null | undefined, dto: CreateBuyDto) {
    const organizationId = this.ensureOrg(orgId)
    const itemsData = dto.items.map((i) => ({ productId: i.productId, productName: '', quantity: i.quantity, price: i.price, total: i.price * i.quantity }))
    const total = itemsData.reduce((s, i) => s + i.total, 0)
    const discount = num((dto as any).discount)
    const paidAmount = num((dto as any).paidAmount)
    const tPerTrip = num((dto as any).transportPerTrip)
    const tTrips = Math.max(0, Number((dto as any).transportTrips ?? 0))
    const transportTotal = tPerTrip * tTrips

    // Fetch product names
    const ids = dto.items.map(i => i.productId)
    const prods = await this.prisma.product.findMany({ where: { id: { in: ids }, organizationId } })
    const map = new Map(prods.map(p => [p.id, p.name]))
    itemsData.forEach(it => { it.productName = map.get(it.productId) || 'Item' })

    const created = await this.prisma.$transaction(async (tx) => {
      const buy = await tx.buy.create({
        data: {
          organizationId,
          vendorName: (dto as any).vendorName,
          vendorPhone: (dto as any).vendorPhone,
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
      })

      for (const it of itemsData) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } })
      }

      if (paidAmount && paidAmount > 0) {
        await tx.transaction.create({
          data: {
            organizationId,
            description: `Buy payment - ${buy.id}`,
            type: 'expense',
            amount: paidAmount as any,
            category: 'inventory',
            date: new Date(),
          },
        })
      }

      return buy
    })
    return created
  }
}

function num(v: any): number { return typeof v === 'number' ? v : Number(v ?? 0) }
