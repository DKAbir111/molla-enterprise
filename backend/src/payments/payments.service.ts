import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

/** Prisma transaction client — the subset of the client available inside $transaction. */
type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

function toNumber(v: any): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

/** Round to whole paisa so repeated float maths cannot drift a balance. */
function money(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  /**
   * Invoice total: line items + transport - discount.
   *
   * `Sell.total` / `Buy.total` hold only the line-item subtotal, so reading
   * that column alone silently drops transport and ignores the discount. Every
   * consumer in the app uses this same definition.
   */
  private grandTotal(order: any): number {
    const items = (order?.items ?? []).reduce((s: number, it: any) => s + toNumber(it?.total), 0);
    return money(Math.max(0, items + toNumber(order?.transportTotal) - toNumber(order?.discount)));
  }

  /**
   * Rewrite the cached `paidAmount` from the payment rows that reference the
   * order. This column is never written directly any more — it exists so the
   * many read paths (alerts, dashboard, list pages) stay cheap.
   */
  private async recomputeSellPaid(tx: Tx, sellId: string): Promise<number> {
    const agg = await tx.payment.aggregate({ where: { sellId }, _sum: { amount: true } });
    const paid = money(toNumber(agg._sum.amount));
    await tx.sell.update({ where: { id: sellId }, data: { paidAmount: paid as any } });
    return paid;
  }

  private async recomputeBuyPaid(tx: Tx, buyId: string): Promise<number> {
    const agg = await tx.payment.aggregate({ where: { buyId }, _sum: { amount: true } });
    const paid = money(toNumber(agg._sum.amount));
    await tx.buy.update({ where: { id: buyId }, data: { paidAmount: paid as any } });
    return paid;
  }

  /**
   * Record money received from a customer.
   *
   * With `sellId` the payment settles that one invoice. Without it the amount
   * is spread over the customer's unpaid invoices oldest-first, which is what
   * happens when someone clears an old balance with a single lump sum. Anything
   * left after every invoice is settled is kept as an unapplied credit
   * (`sellId: null`) rather than silently discarded.
   */
  async receiveFromCustomer(orgId: string | null | undefined, dto: CreatePaymentDto) {
    const organizationId = this.ensureOrg(orgId);
    const amount = money(dto.amount);
    if (!(amount > 0)) throw new BadRequestException('Amount must be greater than zero');
    if (!dto.customerId) throw new BadRequestException('customerId is required');

    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, organizationId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const date = dto.date ? new Date(dto.date) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    return this.prisma.$transaction(async (tx) => {
      const base = {
        organizationId,
        direction: 'in',
        date,
        method: dto.method ?? 'cash',
        note: dto.note ?? null,
        customerId: customer.id,
      };

      if (dto.sellId) {
        const sell = await tx.sell.findFirst({ where: { id: dto.sellId, organizationId }, include: { items: true } });
        if (!sell) throw new NotFoundException('Sale not found');
        await tx.payment.create({ data: { ...base, amount: amount as any, sellId: sell.id } });
        const paid = await this.recomputeSellPaid(tx, sell.id);
        return { applied: [{ sellId: sell.id, amount }], unapplied: 0, paid };
      }

      // Oldest first. Cancelled invoices are not debts and must not absorb cash.
      const open = await tx.sell.findMany({
        where: { organizationId, customerId: customer.id, status: { not: 'cancelled' } },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      });

      let remaining = amount;
      const applied: { sellId: string; amount: number }[] = [];

      for (const sell of open) {
        if (remaining <= 0) break;
        const due = money(this.grandTotal(sell) - toNumber((sell as any).paidAmount));
        if (due <= 0) continue;
        const take = money(Math.min(remaining, due));
        await tx.payment.create({ data: { ...base, amount: take as any, sellId: sell.id } });
        await this.recomputeSellPaid(tx, sell.id);
        applied.push({ sellId: sell.id, amount: take });
        remaining = money(remaining - take);
      }

      if (remaining > 0) {
        // Paid more than is owed — held against the customer, not attached to
        // any invoice, so the surplus is still visible and can be applied later.
        await tx.payment.create({ data: { ...base, amount: remaining as any, sellId: null } });
      }

      return { applied, unapplied: remaining };
    });
  }

  /** Money paid to a vendor. Mirrors `receiveFromCustomer`, against purchases. */
  async payVendor(orgId: string | null | undefined, dto: CreatePaymentDto) {
    const organizationId = this.ensureOrg(orgId);
    const amount = money(dto.amount);
    if (!(amount > 0)) throw new BadRequestException('Amount must be greater than zero');

    const date = dto.date ? new Date(dto.date) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    let vendorId: string | null = null;
    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, organizationId } });
      if (!vendor) throw new NotFoundException('Vendor not found');
      vendorId = vendor.id;
    }

    return this.prisma.$transaction(async (tx) => {
      const base = {
        organizationId,
        direction: 'out',
        date,
        method: dto.method ?? 'cash',
        note: dto.note ?? null,
        vendorId,
      };

      if (dto.buyId) {
        const buy = await tx.buy.findFirst({ where: { id: dto.buyId, organizationId }, include: { items: true } });
        if (!buy) throw new NotFoundException('Purchase not found');
        await tx.payment.create({ data: { ...base, amount: amount as any, buyId: buy.id } });
        const paid = await this.recomputeBuyPaid(tx, buy.id);
        return { applied: [{ buyId: buy.id, amount }], unapplied: 0, paid };
      }

      if (!vendorId) throw new BadRequestException('vendorId or buyId is required');

      const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });
      // Buy stores the vendor as free text rather than a foreign key, so its
      // purchases are matched back by name and phone.
      const open = await tx.buy.findMany({
        where: {
          organizationId,
          vendorName: vendor?.name ?? undefined,
          ...(vendor?.phone ? { vendorPhone: vendor.phone } : {}),
        },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      });

      let remaining = amount;
      const applied: { buyId: string; amount: number }[] = [];

      for (const buy of open) {
        if (remaining <= 0) break;
        const due = money(this.grandTotal(buy) - toNumber((buy as any).paidAmount));
        if (due <= 0) continue;
        const take = money(Math.min(remaining, due));
        await tx.payment.create({ data: { ...base, amount: take as any, buyId: buy.id } });
        await this.recomputeBuyPaid(tx, buy.id);
        applied.push({ buyId: buy.id, amount: take });
        remaining = money(remaining - take);
      }

      if (remaining > 0) {
        await tx.payment.create({ data: { ...base, amount: remaining as any, buyId: null } });
      }

      return { applied, unapplied: remaining };
    });
  }

  /**
   * Set an order's paid figure to an absolute value by booking the difference
   * as a payment. This backs the "Paid amount" field on the sell/buy edit form,
   * which states a running total rather than an increment — routing it through
   * here keeps the ledger authoritative instead of letting the form overwrite
   * the cached column and lose the history.
   */
  async setOrderPaidTotal(
    tx: Tx,
    args: { organizationId: string; sellId?: string; buyId?: string; customerId?: string | null; target: number },
  ) {
    const { organizationId, sellId, buyId, customerId, target } = args;
    const where = sellId ? { sellId } : { buyId };
    const agg = await tx.payment.aggregate({ where, _sum: { amount: true } });
    const current = money(toNumber(agg._sum.amount));
    const delta = money(money(target) - current);
    if (delta === 0) return current;

    await tx.payment.create({
      data: {
        organizationId,
        direction: sellId ? 'in' : 'out',
        amount: delta as any,
        date: new Date(),
        method: 'cash',
        note: delta > 0 ? 'Recorded from the order form' : 'Correction from the order form',
        customerId: sellId ? customerId ?? null : null,
        sellId: sellId ?? null,
        buyId: buyId ?? null,
      },
    });

    return sellId ? this.recomputeSellPaid(tx, sellId) : this.recomputeBuyPaid(tx, buyId!);
  }

  listForSell(orgId: string | null | undefined, sellId: string) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.payment.findMany({
      where: { organizationId, sellId },
      orderBy: { date: 'desc' },
    });
  }

  listForCustomer(orgId: string | null | undefined, customerId: string) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.payment.findMany({
      where: { organizationId, customerId },
      orderBy: { date: 'desc' },
    });
  }

  listForBuy(orgId: string | null | undefined, buyId: string) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.payment.findMany({ where: { organizationId, buyId }, orderBy: { date: 'desc' } });
  }

  /** Remove a payment and re-derive the affected order's cached total. */
  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const payment = await this.prisma.payment.findFirst({ where: { id, organizationId } });
    if (!payment) throw new NotFoundException('Payment not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });
      if (payment.sellId) await this.recomputeSellPaid(tx, payment.sellId);
      if (payment.buyId) await this.recomputeBuyPaid(tx, payment.buyId);
      return { ok: true };
    });
  }


  /**
   * The mirror of `receivables`: who YOU owe, worst first.
   *
   * Buy stores its vendor as free text rather than a foreign key, so purchases
   * are grouped by the name/phone pair and matched back to the vendor master
   * where one exists. A purchase typed with a vendor that was never saved still
   * shows up — it is money owed either way.
   */
  async payables(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    const [buys, vendors] = await Promise.all([
      this.prisma.buy.findMany({ where: { organizationId }, include: { items: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.vendor.findMany({ where: { organizationId }, select: { id: true, name: true, phone: true } }),
    ]);

    const vendorByKey = new Map(vendors.map((v) => [`${v.name}|${v.phone ?? ''}`, v]));
    const byVendor = new Map<string, any>();

    for (const buy of buys) {
      const name = (buy as any).vendorName ?? 'Vendor';
      const phone = (buy as any).vendorPhone ?? '';
      const key = `${name}|${phone}`;
      const due = money(this.grandTotal(buy) - toNumber((buy as any).paidAmount));

      if (!byVendor.has(key)) {
        byVendor.set(key, {
          vendorId: vendorByKey.get(key)?.id ?? null,
          name,
          phone,
          invoiced: 0,
          paid: 0,
          due: 0,
          openInvoices: 0,
          oldestUnpaidAt: null as Date | null,
        });
      }
      const row = byVendor.get(key);
      row.invoiced = money(row.invoiced + this.grandTotal(buy));
      row.paid = money(row.paid + toNumber((buy as any).paidAmount));
      if (due > 0) {
        row.due = money(row.due + due);
        row.openInvoices += 1;
        if (!row.oldestUnpaidAt) row.oldestUnpaidAt = (buy as any).createdAt;
      }
    }

    return [...byVendor.values()].filter((r) => r.due > 0).sort((a, b) => b.due - a.due);
  }

  /** Who owes money, worst first — the list the collection workflow runs off. */
  async receivables(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    const sells = await this.prisma.sell.findMany({
      where: { organizationId, status: { not: 'cancelled' } },
      include: { items: true, customer: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const byCustomer = new Map<string, any>();
    for (const sell of sells) {
      const due = money(this.grandTotal(sell) - toNumber((sell as any).paidAmount));
      const id = (sell as any).customerId as string;
      if (!byCustomer.has(id)) {
        byCustomer.set(id, {
          customerId: id,
          name: (sell as any).customer?.name ?? 'Customer',
          phone: (sell as any).customer?.phone ?? '',
          invoiced: 0,
          paid: 0,
          due: 0,
          oldestUnpaidAt: null as Date | null,
          openInvoices: 0,
        });
      }
      const row = byCustomer.get(id);
      row.invoiced = money(row.invoiced + this.grandTotal(sell));
      row.paid = money(row.paid + toNumber((sell as any).paidAmount));
      if (due > 0) {
        row.due = money(row.due + due);
        row.openInvoices += 1;
        if (!row.oldestUnpaidAt) row.oldestUnpaidAt = (sell as any).createdAt;
      }
    }

    // Unapplied credit reduces what a customer actually owes.
    const credits = await this.prisma.payment.groupBy({
      by: ['customerId'],
      where: { organizationId, direction: 'in', sellId: null, customerId: { not: null } },
      _sum: { amount: true },
    });
    for (const c of credits) {
      const row = c.customerId ? byCustomer.get(c.customerId) : null;
      if (row) {
        row.credit = money(toNumber(c._sum.amount));
        row.due = money(Math.max(0, row.due - row.credit));
      }
    }

    return [...byCustomer.values()]
      .filter((r) => r.due > 0)
      .sort((a, b) => b.due - a.due);
  }
}
