import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.product.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
  }

  async create(orgId: string | null | undefined, dto: CreateProductDto) {
    const organizationId = this.ensureOrg(orgId);
    const created = await this.prisma.product.create({ data: ({
      name: dto.name,
      type: dto.type,
      grade: dto.grade,
      price: dto.price,
      buyPrice: (dto as any).buyPrice ?? 0,
      targetPrice: (dto as any).targetPrice ?? dto.price,
      unit: dto.unit,
      stock: dto.stock,
      description: dto.description,
      organizationId,
    } as any) });

    // Record inventory expense (buy price * stock) as a transaction
    try {
      const qty = Number(dto.stock ?? 0)
      const unitBuy = Number((dto as any).buyPrice ?? 0)
      const amount = unitBuy * qty
      if (amount > 0) {
        await this.prisma.transaction.create({
          data: {
            organizationId,
            description: `Inventory purchase - ${dto.name}`,
            type: 'expense',
            amount: amount as any,
            category: 'inventory',
            date: new Date(),
          },
        })
      }
    } catch {}

    return created
  }

  async update(orgId: string | null | undefined, id: string, dto: UpdateProductDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Product not found');
    const data: any = { ...dto };
    const updated = await this.prisma.product.update({ where: { id }, data });

    // If stock increased, record expense for the added quantity at current buy price
    try {
      const prevStock = Number((found as any).stock ?? 0)
      const nextStock = Number((dto as any).stock ?? prevStock)
      const delta = nextStock - prevStock
      if (delta > 0) {
        const buy = Number((dto as any).buyPrice ?? (found as any).buyPrice ?? 0)
        const amount = buy * delta
        if (amount > 0) {
          await this.prisma.transaction.create({
            data: {
              organizationId,
              description: `Inventory purchase (+${delta} ${updated.unit}) - ${updated.name}`,
              type: 'expense',
              amount: amount as any,
              category: 'inventory',
              date: new Date(),
            },
          })
        }
      }
    } catch {}

    return updated
  }

  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Product not found');
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        // Foreign key constraint failed (referenced by OrderItem)
        throw new ForbiddenException('Cannot delete product because it is referenced by existing orders. Consider archiving it instead.');
      }
      throw e
    }
    return { ok: true };
  }
}
