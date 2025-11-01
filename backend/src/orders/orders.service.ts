import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
type ProductLite = { id: string; name: string; price: any };

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
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId } });
    const productMap: Map<string, ProductLite> = new Map(products.map((p) => [p.id, p as unknown as ProductLite]));

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

    return this.prisma.order.create({
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
  }

  async update(orgId: string | null | undefined, id: string, dto: UpdateOrderDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Order not found');
    return this.prisma.order.update({ where: { id }, data: dto });
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

    await this.prisma.$transaction([
      this.prisma.orderItem.deleteMany({ where: { orderId: id } }),
      this.prisma.orderItem.createMany({ data: rows }),
    ]);

    return this.prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
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
