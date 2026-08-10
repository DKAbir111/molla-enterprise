import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  async findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    const [customers, aggregates] = await Promise.all([
      this.prisma.customer.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } }),
      // "Total spent" has to mean the same thing here as everywhere else in
      // the app: line items + transport - discount. Summing SellItem.total
      // alone ignored both, and cancelled orders were counted as spend.
      //
      // The per-sell figures are pulled through a LATERAL subquery rather than
      // a plain join, because joining SellItem directly would repeat the
      // order-level transport and discount once per line item.
      this.prisma.$queryRaw<Array<{ customerId: string; orders: number; total_spent: any }>>`
        SELECT s."customerId" AS "customerId",
               COUNT(*)::int  AS orders,
               COALESCE(SUM(GREATEST(li.items_total + s."transportTotal" - s."discount", 0)), 0) AS total_spent
        FROM "Sell" s
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(si."total"), 0) AS items_total
          FROM "SellItem" si
          WHERE si."sellId" = s."id"
        ) li ON TRUE
        WHERE s."organizationId" = ${organizationId}
          AND s."status" <> 'cancelled'
        GROUP BY s."customerId"
      `,
    ]);

    const map = new Map<string, { orders: number; total_spent: any }>();
    aggregates.forEach((r) => map.set(String(r.customerId), { orders: Number((r as any).orders || 0), total_spent: (r as any).total_spent ?? 0 }));

    return customers.map((c) => {
      const agg = map.get(c.id) || { orders: 0, total_spent: 0 };
      return {
        ...c,
        totalOrders: agg.orders,
        totalSpent: agg.total_spent,
      } as any;
    });
  }

  async findOne(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.customer.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Customer not found');
    return found;
  }

  create(orgId: string | null | undefined, dto: CreateCustomerDto) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.customer.create({ data: { ...dto, organizationId } });
  }

  async update(orgId: string | null | undefined, id: string, dto: UpdateCustomerDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.customer.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Customer not found');
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.customer.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Customer not found');
    await this.prisma.customer.delete({ where: { id } });
    return { ok: true };
  }
}
