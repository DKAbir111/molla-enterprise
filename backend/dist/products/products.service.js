"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
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
        return this.prisma.product.create({ data: { ...dto, price: dto.price, organizationId } });
    }
    async update(orgId, id, dto) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.product.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Product not found');
        return this.prisma.product.update({ where: { id }, data: dto });
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
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map