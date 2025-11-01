import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) {
    if (!orgId) throw new ForbiddenException('Organization required');
    return orgId;
  }

  findAll(orgId?: string | null) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.transaction.findMany({ where: { organizationId }, orderBy: { date: 'desc' } });
  }

  create(orgId: string | null | undefined, dto: CreateTransactionDto) {
    const organizationId = this.ensureOrg(orgId);
    return this.prisma.transaction.create({
      data: {
        organizationId,
        description: dto.description,
        type: dto.type,
        amount: dto.amount,
        category: dto.category,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async remove(orgId: string | null | undefined, id: string) {
    const organizationId = this.ensureOrg(orgId);
    const found = await this.prisma.transaction.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundException('Transaction not found');
    await this.prisma.transaction.delete({ where: { id } });
    return { ok: true };
  }
}

