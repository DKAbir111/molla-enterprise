"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = require("fs");
const path = require("path");
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.orgCache = new Map();
        this.orgCacheTtlMs = Math.max(Number(process.env.ORG_CACHE_TTL_MS ?? 60000), 0);
    }
    async create(userId, dto, logoPath) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.organizationId)
            throw new common_1.ForbiddenException('Organization already exists for user');
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
        try {
            await this.prisma.organizationSettings.create({
                data: {
                    organizationId: org.id,
                },
            });
        }
        catch { }
        this.setCachedOrg(userId, org);
        return org;
    }
    async findMine(userId) {
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
    async update(userId, id, dto, logoPath) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId || user.organizationId !== id)
            throw new common_1.ForbiddenException('Not your organization');
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
    async getSettings(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId)
            return null;
        let settings = await this.prisma.organizationSettings.findUnique({ where: { organizationId: user.organizationId } });
        if (!settings) {
            try {
                settings = await this.prisma.organizationSettings.create({ data: { organizationId: user.organizationId } });
            }
            catch {
                settings = await this.prisma.organizationSettings.findUnique({ where: { organizationId: user.organizationId } });
            }
        }
        return settings;
    }
    async updateSettings(userId, id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId || user.organizationId !== id)
            throw new common_1.ForbiddenException('Not your organization');
        let existing = await this.prisma.organizationSettings.findUnique({ where: { organizationId: id } });
        if (!existing) {
            existing = await this.prisma.organizationSettings.create({ data: { organizationId: id } });
        }
        return this.prisma.organizationSettings.update({
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
    async saveBase64(b64, basename) {
        const match = b64.match(/^data:(.+);base64,(.*)$/);
        const data = match ? match[2] : b64;
        const buffer = Buffer.from(data, 'base64');
        const parent = path.resolve(__dirname, '..');
        const isDist = path.basename(parent) === 'dist';
        const backendRoot = isDist ? path.resolve(parent, '..') : parent;
        const dir = path.resolve(backendRoot, 'uploads');
        await fs.promises.mkdir(dir, { recursive: true });
        const file = path.join(dir, `${basename}-${Date.now()}.png`);
        await fs.promises.writeFile(file, buffer);
        return '/uploads/' + path.basename(file);
    }
    getCachedOrg(userId) {
        const entry = this.orgCache.get(userId);
        if (!entry)
            return undefined;
        if (entry.expiresAt <= Date.now()) {
            this.orgCache.delete(userId);
            return undefined;
        }
        return entry.org;
    }
    async disableOrganization(userId, orgId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId || user.organizationId !== orgId) {
            throw new common_1.ForbiddenException('Not your organization');
        }
        const updated = await this.prisma.organization.update({
            where: { id: orgId },
            data: {
                deletedAt: new Date(),
            },
        });
        this.setCachedOrg(userId, null);
        return updated;
    }
    async deleteOrganization(userId, orgId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId || user.organizationId !== orgId) {
            throw new common_1.ForbiddenException('Not your organization');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.sellItem.deleteMany({ where: { sell: { organizationId: orgId } } });
            await tx.buyItem.deleteMany({ where: { buy: { organizationId: orgId } } });
            await tx.sell.deleteMany({ where: { organizationId: orgId } });
            await tx.buy.deleteMany({ where: { organizationId: orgId } });
            await tx.transaction.deleteMany({ where: { organizationId: orgId } });
            await tx.dryingGain.deleteMany({ where: { organizationId: orgId } });
            await tx.product.deleteMany({ where: { organizationId: orgId } });
            await tx.customer.deleteMany({ where: { organizationId: orgId } });
            await tx.vendor.deleteMany({ where: { organizationId: orgId } });
            await tx.organizationSettings.deleteMany({ where: { organizationId: orgId } });
            await tx.organizationAlertSnooze.deleteMany({ where: { organizationId: orgId } });
            await tx.user.updateMany({
                where: { organizationId: orgId },
                data: { organizationId: null },
            });
            await tx.organization.delete({ where: { id: orgId } });
        });
        this.setCachedOrg(userId, null);
        return { message: 'Organization deleted successfully' };
    }
    setCachedOrg(userId, org) {
        if (!this.orgCacheTtlMs)
            return;
        this.orgCache.set(userId, {
            org,
            expiresAt: Date.now() + this.orgCacheTtlMs,
        });
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
