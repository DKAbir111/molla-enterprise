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

  async create(orgId: string | null | undefined, dto: CreateProductDto, imagePath?: string) {
    const organizationId = this.ensureOrg(orgId);
    const created = await this.prisma.product.create({ data: ({
      name: dto.name,
      type: dto.type,
      grade: dto.grade,
      price: dto.price,
      buyPrice: (dto as any).buyPrice ?? 0,
      otherCostPerUnit: (dto as any).otherCostPerUnit ?? 0,
      targetPrice: (dto as any).targetPrice ?? dto.price,
      unit: dto.unit,
      stock: dto.stock,
      description: dto.description,
      imageUrl: imagePath,
      active: (dto as any).active ?? (dto.stock > 0),
      organizationId,
    } as any) });

    return created
  }

  async update(orgId: string | null | undefined, id: string, dto: UpdateProductDto, imagePath?: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Product not found');
    const data: any = { ...dto };
    if (imagePath) data.imageUrl = imagePath;
    // Auto-deactivate when stock drops to 0 if active not explicitly set
    if (typeof dto.active === 'undefined' && typeof (dto as any).stock === 'number' && (dto as any).stock <= 0) {
      data.active = false
    }
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Product not found');
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        // Foreign key constraint failed (referenced by SellItem/BuyItem)
        throw new ForbiddenException('Cannot delete product because it is referenced by existing sells/buys. Consider archiving it instead.');
      }
      throw e
    }
    return { ok: true };
  }
}
