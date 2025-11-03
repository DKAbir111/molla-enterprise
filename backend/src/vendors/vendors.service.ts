import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.vendor.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
  }

  findOne(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.vendor.findFirst({ where: { id, organizationId } });
  }

  create(orgId: string | null | undefined, dto: any) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.vendor.create({ data: { name: dto.name, phone: dto.phone, email: dto.email, address: dto.address, organizationId } });
  }

  async update(orgId: string | null | undefined, id: string, dto: any) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.vendor.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Vendor not found');
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.vendor.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Vendor not found');
    await this.prisma.vendor.delete({ where: { id } });
    return { ok: true };
  }
}

