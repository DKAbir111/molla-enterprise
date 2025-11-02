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
      // Aggregate by joining sell items to avoid relying on totals
      this.prisma.$queryRaw<Array<{ customerId: string; orders: number; total_spent: any }>>`
        SELECT s."customerId"    AS "customerId",
               COUNT(DISTINCT s."id")::int AS orders,
               COALESCE(SUM(si.total), 0)   AS total_spent
        FROM "Sell" s
        LEFT JOIN "SellItem" si ON si."sellId" = s."id"
        WHERE s."organizationId" = ${organizationId}
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
