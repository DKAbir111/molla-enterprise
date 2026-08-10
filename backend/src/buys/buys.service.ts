import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuyDto } from './dto/create-buy.dto';
import { UpdateBuyDto } from './dto/update-buy.dto';
import { UpdateBuyItemsDto } from './dto/update-buy-items.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class BuysService {
  constructor(private prisma: PrismaService, private payments: PaymentsService) {}

  private ensureOrg(orgId?: string | null) { if (!orgId) throw new ForbiddenException('Organization required'); return orgId }

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId)
    return this.prisma.buy.findMany({ where: { organizationId }, include: { items: true }, orderBy: { createdAt: 'desc' } })
  }

  async create(orgId: string | null | undefined, dto: CreateBuyDto) {
    const organizationId = this.ensureOrg(orgId)
    // Normalise the quantity ONCE and reuse it for the stored line, the line
    // total and the stock movement, so those three can never disagree.
    const itemsData = dto.items.map((i) => {
      const quantity = qty(i.quantity)
      return { productId: i.productId, productName: '', quantity, price: i.price, total: i.price * quantity }
    })
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

      // A purchase adds to inventory. This used to only flip awaitingPurchase
      // and move no stock at all, so buying 100 and then another 100 left the
      // product sitting at whatever figure had been typed in by hand — stock
      // could only ever go down (sells) or up via a drying gain.
      for (const it of itemsData) {
        if (it.quantity <= 0) continue
        const updated = await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity }, awaitingPurchase: false },
        })
        // A sell deactivates a product when its stock hits 0; restocking it has
        // to undo that, or the product stays invisible despite being in stock.
        if (Number((updated as any).stock ?? 0) > 0) {
          try { await tx.product.update({ where: { id: it.productId }, data: { active: true } }) } catch {}
        }
      }

      // See the note in SellsService: this is a Payment row now, not a
      // Transaction, so the purchase total and its payment stop being counted
      // as two separate expenses.
      if (paidAmount && paidAmount > 0) {
        const vendor = (dto as any).vendorName
          ? await tx.vendor.findFirst({
              where: { organizationId, name: (dto as any).vendorName },
              select: { id: true },
            })
          : null
        await tx.payment.create({
          data: {
            organizationId,
            direction: 'out',
            amount: paidAmount as any,
            date: new Date(),
            method: 'cash',
            note: 'Paid at the time of purchase',
            vendorId: vendor?.id ?? null,
            buyId: buy.id,
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

    // See SellsService.update: paidAmount is derived from the Payment ledger,
    // so the difference is booked rather than the column overwritten.
    const paidTarget = typeof (dto as any).paidAmount === 'number' ? Number((dto as any).paidAmount) : null
    delete data.paidAmount

    if (dto.transportPerTrip != null || dto.transportTrips != null) {
      const per = Number(dto.transportPerTrip ?? (found as any).transportPerTrip ?? 0)
      const trips = Number(dto.transportTrips ?? (found as any).transportTrips ?? 0)
      data.transportPerTrip = per
      data.transportTrips = trips
      data.transportTotal = per * trips
    }

    if (paidTarget === null) return this.prisma.buy.update({ where: { id }, data })

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.buy.update({ where: { id }, data })
      await this.payments.setOrderPaidTotal(tx, { organizationId, buyId: id, target: paidTarget })
      return updated
    })
  }

  async updateItems(orgId: string | null | undefined, id: string, dto: UpdateBuyItemsDto) {
    const organizationId = this.ensureOrg(orgId)
    const found = await this.prisma.buy.findFirst({ where: { id, organizationId } })
    if (!found) throw new NotFoundException('Buy not found')
    const rows = dto.items.map(i => {
      const quantity = qty(i.quantity)
      const price = Number(i.price ?? 0)
      return { productId: i.productId, productName: '', quantity, price, total: price * quantity }
    })
    const ids = dto.items.map(i => i.productId)
    const prods = await this.prisma.product.findMany({ where: { id: { in: ids }, organizationId } })
    const map = new Map(prods.map(p => [p.id, p.name]))
    rows.forEach(r => { r.productName = map.get(r.productId) || 'Item' })
    const grand = rows.reduce((s, r) => s + r.total, 0)

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.buyItem.findMany({ where: { buyId: id } })

      // Editing a buy has to move stock by the difference, the same way
      // updateItems on a sell does: unwind what the old lines added, then apply
      // the new ones. Without the unwind, correcting a 100 to a 10 would leave
      // the original 100 permanently in stock.
      for (const it of existing) {
        const q = qty((it as any).quantity)
        if (q <= 0) continue
        try { await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: q } } }) } catch {}
      }

      await tx.buyItem.deleteMany({ where: { buyId: id } })
      await tx.buyItem.createMany({ data: rows.map(r => ({ buyId: id, ...r })) })

      for (const r of rows) {
        if (r.quantity <= 0) continue
        try { await tx.product.update({ where: { id: r.productId }, data: { stock: { increment: r.quantity }, awaitingPurchase: false } }) } catch {}
      }

      // Every product on either side of the edit may have crossed the zero
      // line in either direction — a line removed entirely can push stock back
      // down to 0 — so settle `active` from the final figure rather than
      // assuming the direction of travel.
      const touched = new Set<string>([...existing.map(e => e.productId), ...rows.map(r => r.productId)])
      for (const productId of touched) {
        try {
          const p = await tx.product.findUnique({ where: { id: productId }, select: { stock: true } })
          if (!p) continue
          await tx.product.update({ where: { id: productId }, data: { active: Number((p as any).stock ?? 0) > 0 } })
        } catch {}
      }

      try { await tx.buy.update({ where: { id }, data: { total: grand } as any }) } catch {}
      return tx.buy.findUnique({ where: { id }, include: { items: true } })
    })
    return result
  }

  findOne(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId)
    return this.prisma.buy.findFirst({ where: { id, organizationId }, include: { items: true } })
  }
}

function num(v: any): number { return typeof v === 'number' ? v : Number(v ?? 0) }

/**
 * Product.stock and BuyItem.quantity are both `Int` in the schema, so a
 * fractional quantity is not storable. Coerce to a non-negative whole number
 * the same way DryingGainsService does, and coerce once at the top so the
 * stored line and the stock movement are guaranteed to use the same figure.
 */
function qty(v: any): number {
  const n = Math.floor(Number(v ?? 0))
  return Number.isFinite(n) && n > 0 ? n : 0
}
