import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuyDto } from './dto/create-buy.dto';
import { UpdateBuyDto } from './dto/update-buy.dto';
import { UpdateBuyItemsDto } from './dto/update-buy-items.dto';

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
        const updated = await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } })
        if ((updated as any).stock > 0) {
          try { await tx.product.update({ where: { id: it.productId }, data: { active: true } }) } catch {}
        }
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

  async update(orgId: string | null | undefined, id: string, dto: UpdateBuyDto) {
    const organizationId = this.ensureOrg(orgId)
    const found = await this.prisma.buy.findFirst({ where: { id, organizationId } })
    if (!found) throw new NotFoundException('Buy not found')
    const data: any = { ...dto }
    if (dto.transportPerTrip != null || dto.transportTrips != null) {
      const per = Number(dto.transportPerTrip ?? (found as any).transportPerTrip ?? 0)
      const trips = Number(dto.transportTrips ?? (found as any).transportTrips ?? 0)
      data.transportPerTrip = per
      data.transportTrips = trips
      data.transportTotal = per * trips
    }
    return this.prisma.buy.update({ where: { id }, data })
  }

  async updateItems(orgId: string | null | undefined, id: string, dto: UpdateBuyItemsDto) {
    const organizationId = this.ensureOrg(orgId)
    const found = await this.prisma.buy.findFirst({ where: { id, organizationId } })
    if (!found) throw new NotFoundException('Buy not found')
    const rows = dto.items.map(i => ({ productId: i.productId, productName: '', quantity: i.quantity, price: Number(i.price ?? 0), total: Number(i.price ?? 0) * i.quantity }))
    const ids = dto.items.map(i => i.productId)
    const prods = await this.prisma.product.findMany({ where: { id: { in: ids }, organizationId } })
    const map = new Map(prods.map(p => [p.id, p.name]))
    rows.forEach(r => { r.productName = map.get(r.productId) || 'Item' })
    const grand = rows.reduce((s, r) => s + r.total, 0)

    const result = await this.prisma.$transaction(async (tx) => {
      // reverse previous stock increments
      const existing = await tx.buyItem.findMany({ where: { buyId: id } })
      for (const it of existing) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } })
      }
      await tx.buyItem.deleteMany({ where: { buyId: id } })
      await tx.buyItem.createMany({ data: rows.map(r => ({ buyId: id, ...r })) })
      // apply new stock increments
      for (const r of rows) {
        const updated = await tx.product.update({ where: { id: r.productId }, data: { stock: { increment: r.quantity } } })
        if ((updated as any).stock > 0) {
          try { await tx.product.update({ where: { id: r.productId }, data: { active: true } }) } catch {}
        }
      }
      try { await tx.buy.update({ where: { id }, data: { total: grand } as any }) } catch {}
      return tx.buy.findUnique({ where: { id }, include: { items: true } })
    })
    return result
  }
}

function num(v: any): number { return typeof v === 'number' ? v : Number(v ?? 0) }
