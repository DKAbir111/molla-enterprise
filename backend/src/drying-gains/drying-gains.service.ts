import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDryingGainDto } from './dto/create-drying-gain.dto'

@Injectable()
export class DryingGainsService {
  constructor(private prisma: PrismaService) {}

  private ensureOrg(orgId?: string | null) { if (!orgId) throw new ForbiddenException('Organization required'); return orgId }

  list(orgId?: string | null, productId?: string) {
    const organizationId = this.ensureOrg(orgId)
    return this.prisma.dryingGain.findMany({
      where: { organizationId, ...(productId ? { productId } : {}) },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(orgId: string | null | undefined, dto: CreateDryingGainDto) {
    const organizationId = this.ensureOrg(orgId)
    if (!dto.quantity || dto.quantity <= 0) throw new ForbiddenException('Quantity must be positive')

    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, organizationId } })
    if (!product) throw new NotFoundException('Product not found')

    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dryingGain.create({
        data: {
          organizationId,
          productId: dto.productId,
          quantity: Math.floor(Number(dto.quantity)),
          unitCost: (dto.unitCost ?? 0) as any,
          note: dto.note,
        } as any,
      })

      const updated = await tx.product.update({ where: { id: dto.productId }, data: { stock: { increment: Math.floor(Number(dto.quantity)) } } })
      if ((updated as any).stock > 0) {
        try { await tx.product.update({ where: { id: dto.productId }, data: { active: true } }) } catch {}
      }

      return created
    })

    return result
  }
}

