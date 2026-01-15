import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Organization } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  private orgCache = new Map<string, { org: Organization | null; expiresAt: number }>();
  private readonly orgCacheTtlMs = Math.max(
    Number(process.env.ORG_CACHE_TTL_MS ?? 60_000),
    0,
  );

  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateOrganizationDto, logoPath?: string) {
    // Prevent creating multiple orgs for minimal design; extend later if needed
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.organizationId) throw new ForbiddenException('Organization already exists for user');

    let finalLogoPath = logoPath;
    if (!finalLogoPath && dto.logoBase64) {
      finalLogoPath = await this.saveBase64(dto.logoBase64, 'org-logo');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        logoUrl: finalLogoPath,
        ownerId: userId,
      },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { organizationId: org.id } });
    // Ensure default settings for this organization
    try {
      await (this.prisma as any).organizationSettings.create({
        data: {
          organizationId: org.id,
        },
      });
    } catch { }
    this.setCachedOrg(userId, org);
    return org;
  }

  async findMine(userId: string) {
    const cached = this.getCachedOrg(userId);
    if (cached !== undefined) {
      return cached;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organization: true },
    });
    const org = user?.organization ?? null;
    this.setCachedOrg(userId, org);
    return org;
  }

  private async validateUserIsAdmin(userId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.organizationId !== orgId) throw new ForbiddenException('Not your organization');
    // Only owner or admin can disable/delete
    if (!['owner', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Only owner or admin can perform this action');
    }
    return user;
  }

  async disableOrganization(userId: string, orgId: string) {
    await this.validateUserIsAdmin(userId, orgId);
    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: { deletedAt: new Date() },
    });
    this.setCachedOrg(userId, null);
    return updated;
  }

  async deleteOrganization(userId: string, orgId: string) {
    await this.validateUserIsAdmin(userId, orgId);
    // Delete all related data in proper order
    await this.prisma.$transaction(async (tx: any) => {
      // Delete all order items first
      await tx.sellItem.deleteMany({ where: { sell: { organizationId: orgId } } });
      await tx.buyItem.deleteMany({ where: { buy: { organizationId: orgId } } });
      // Delete main entities
      await tx.sell.deleteMany({ where: { organizationId: orgId } });
      await tx.buy.deleteMany({ where: { organizationId: orgId } });
      await tx.transaction.deleteMany({ where: { organizationId: orgId } });
      await tx.dryingGain.deleteMany({ where: { organizationId: orgId } });
      await tx.product.deleteMany({ where: { organizationId: orgId } });
      await tx.customer.deleteMany({ where: { organizationId: orgId } });
      await tx.vendor.deleteMany({ where: { organizationId: orgId } });
      // Delete settings and users
      await tx.organizationSettings.deleteMany({ where: { organizationId: orgId } });
      await tx.organizationAlertSnooze.deleteMany({ where: { organizationId: orgId } });
      await tx.user.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } });
      // Delete the organization
      await tx.organization.delete({ where: { id: orgId } });
    });
    this.setCachedOrg(userId, null);
    return { message: 'Organization deleted successfully' };
  }

  async isOrganizationDisabled(orgId: string): Promise<boolean> {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    return org?.deletedAt !== null && org?.deletedAt !== undefined;
  }

  async update(userId: string, id: string, dto: UpdateOrganizationDto, logoPath?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId || user.organizationId !== id) throw new ForbiddenException('Not your organization');

    let nextLogo = logoPath;
    if (!nextLogo && dto.logoBase64) {
      nextLogo = await this.saveBase64(dto.logoBase64, `org-${id}-logo`);
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        ...(nextLogo ? { logoUrl: nextLogo } : {}),
      },
    });
    this.setCachedOrg(userId, updated);
    return updated;
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId) return null;
    let settings = await (this.prisma as any).organizationSettings.findUnique({ where: { organizationId: user.organizationId } });
    if (!settings) {
      try {
        settings = await (this.prisma as any).organizationSettings.create({ data: { organizationId: user.organizationId } });
      } catch {
        settings = await (this.prisma as any).organizationSettings.findUnique({ where: { organizationId: user.organizationId } });
      }
    }
    return settings;
  }

  async updateSettings(userId: string, id: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId || user.organizationId !== id) throw new ForbiddenException('Not your organization');
    let existing = await (this.prisma as any).organizationSettings.findUnique({ where: { organizationId: id } });
    if (!existing) {
      existing = await (this.prisma as any).organizationSettings.create({ data: { organizationId: id } });
    }
    return (this.prisma as any).organizationSettings.update({
      where: { organizationId: id },
      data: {
        notifyLowStock: dto.notifyLowStock,
        notifyOrderUpdates: dto.notifyOrderUpdates,
        notifyReceivables: dto.notifyReceivables,
        notifyPayables: dto.notifyPayables,
        emailAlerts: dto.emailAlerts,
        smsAlerts: dto.smsAlerts,
        lowStockThreshold: dto.lowStockThreshold,
        pendingOrderAgingHours: dto.pendingOrderAgingHours,
        receivableReminderDays: dto.receivableReminderDays,
        payableReminderDays: dto.payableReminderDays,
      },
    });
  }

  private async saveBase64(b64: string, basename: string) {
    const match = b64.match(/^data:(.+);base64,(.*)$/);
    const data = match ? match[2] : b64;
    const buffer = Buffer.from(data, 'base64');
    const parent = path.resolve(__dirname, '..'); // dev: backend, prod: backend/dist
    const isDist = path.basename(parent) === 'dist';
    const backendRoot = isDist ? path.resolve(parent, '..') : parent; // -> backend
    const dir = path.resolve(backendRoot, 'uploads');
    await fs.promises.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${basename}-${Date.now()}.png`);
    await fs.promises.writeFile(file, buffer);
    return '/uploads/' + path.basename(file);
  }

  private getCachedOrg(userId: string) {
    const entry = this.orgCache.get(userId);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.orgCache.delete(userId);
      return undefined;
    }
    return entry.org;
  }

  private setCachedOrg(userId: string, org: Organization | null) {
    if (!this.orgCacheTtlMs) return;
    this.orgCache.set(userId, {
      org,
      expiresAt: Date.now() + this.orgCacheTtlMs,
    });
  }

}
