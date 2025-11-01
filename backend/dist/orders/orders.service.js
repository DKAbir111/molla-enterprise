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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
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
        return this.prisma.order.findMany({
            where: { organizationId },
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(orgId, dto) {
        const organizationId = this.ensureOrg(orgId);
        const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, organizationId } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId } });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const itemsData = dto.items.map((i) => {
            const p = productMap.get(i.productId);
            if (!p)
                throw new common_1.NotFoundException(`Product not found: ${i.productId}`);
            const price = Number(p.price);
            const total = price * i.quantity;
            return {
                productId: p.id,
                productName: p.name,
                quantity: i.quantity,
                price,
                total,
            };
        });
        const total = itemsData.reduce((sum, i) => sum + i.total, 0);
        return this.prisma.order.create({
            data: {
                organizationId,
                customerId: dto.customerId,
                deliveryAddress: dto.deliveryAddress,
                status: 'pending',
                items: { create: itemsData },
                createdAt: new Date(),
            },
            include: { items: true },
        });
    }
    async update(orgId, id, dto) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Order not found');
        return this.prisma.order.update({ where: { id }, data: dto });
    }
    async remove(orgId, id) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Order not found');
        await this.prisma.order.delete({ where: { id } });
        return { ok: true };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map