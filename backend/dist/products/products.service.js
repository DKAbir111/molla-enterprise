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
    create(orgId, dto) {
        const organizationId = this.ensureOrg(orgId);
        return this.prisma.product.create({ data: {
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
    }
    async update(orgId, id, dto) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Product not found');
        const data = { ...dto };
        return this.prisma.product.update({ where: { id }, data });
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
