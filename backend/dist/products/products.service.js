"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    ensureOrg(orgId) {
        if (!orgId)
            throw new common_1.ForbiddenException('Organization required');
        return orgId;
    }
    findAll(orgId) {
        const organizationId = this.ensureOrg(orgId);
        return this.prisma.product.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
    }
    async create(orgId, dto) {
        const organizationId = this.ensureOrg(orgId);
        const created = await this.prisma.product.create({ data: {
                name: dto.name,
                type: dto.type,
                grade: dto.grade,
                price: dto.price,
                buyPrice: dto.buyPrice ?? 0,
                targetPrice: dto.targetPrice ?? dto.price,
                unit: dto.unit,
                stock: dto.stock,
                description: dto.description,
                organizationId,
            } });
        try {
            const qty = Number(dto.stock ?? 0);
            const unitBuy = Number(dto.buyPrice ?? 0);
            const amount = unitBuy * qty;
            if (amount > 0) {
                await this.prisma.transaction.create({
                    data: {
                        organizationId,
                        description: `Inventory purchase - ${dto.name}`,
                        type: 'expense',
                        amount: amount,
                        category: 'inventory',
                        date: new Date(),
                    },
                });
            }
        }
        catch { }
        return created;
    }
    async update(orgId, id, dto) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Product not found');
        const data = { ...dto };
        const updated = await this.prisma.product.update({ where: { id }, data });
        try {
            const prevStock = Number(found.stock ?? 0);
            const nextStock = Number(dto.stock ?? prevStock);
            const delta = nextStock - prevStock;
            if (delta > 0) {
                const buy = Number(dto.buyPrice ?? found.buyPrice ?? 0);
                const amount = buy * delta;
                if (amount > 0) {
                    await this.prisma.transaction.create({
                        data: {
                            organizationId,
                            description: `Inventory purchase (+${delta} ${updated.unit}) - ${updated.name}`,
                            type: 'expense',
                            amount: amount,
                            category: 'inventory',
                            date: new Date(),
                        },
                    });
                }
            }
        }
        catch { }
        return updated;
    }
    async remove(orgId, id) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Product not found');
        await this.prisma.product.delete({ where: { id } });
        return { ok: true };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
