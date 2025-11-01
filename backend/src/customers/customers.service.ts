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

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.customer.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
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

