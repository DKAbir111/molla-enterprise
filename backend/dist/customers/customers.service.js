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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomersService = class CustomersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    ensureOrg(orgId) {
        if (!orgId)
            throw new common_1.ForbiddenException('Organization required');
        return orgId;
    }
    async findAll(orgId) {
        const organizationId = this.ensureOrg(orgId);
        const [customers, aggregates] = await Promise.all([
            this.prisma.customer.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } }),
            this.prisma.$queryRaw `
        SELECT o."customerId"    AS "customerId",
               COUNT(DISTINCT o."id")::int AS orders,
               COALESCE(SUM(oi.total), 0)   AS total_spent
        FROM "Order" o
        LEFT JOIN "OrderItem" oi ON oi."orderId" = o."id"
        WHERE o."organizationId" = ${organizationId}
        GROUP BY o."customerId"
      `,
        ]);
        const map = new Map();
        aggregates.forEach((r) => { var _a; return map.set(String(r.customerId), { orders: Number(r.orders || 0), total_spent: (_a = r.total_spent) !== null && _a !== void 0 ? _a : 0 }); });
        return customers.map((c) => {
            const agg = map.get(c.id) || { orders: 0, total_spent: 0 };
            return {
                ...c,
                totalOrders: agg.orders,
                totalSpent: agg.total_spent,
            };
        });
    }
    async findOne(orgId, id) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.customer.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Customer not found');
        return found;
    }
    create(orgId, dto) {
        const organizationId = this.ensureOrg(orgId);
        return this.prisma.customer.create({ data: { ...dto, organizationId } });
    }
    async update(orgId, id, dto) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.customer.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Customer not found');
        return this.prisma.customer.update({ where: { id }, data: dto });
    }
    async remove(orgId, id) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.customer.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Customer not found');
        await this.prisma.customer.delete({ where: { id } });
        return { ok: true };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map