import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  create(orgId: string | null | undefined, dto: CreateProductDto) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.product.create({ data: { ...dto, price: dto.price, organizationId } });
  }

  async update(orgId: string | null | undefined, id: string, dto: UpdateProductDto) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Product not found');
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}

