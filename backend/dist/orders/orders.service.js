"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const tslib_1 = require("tslib");
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
        const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId }, select: { id: true, name: true, price: true, stock: true } });
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
        const discount = num(dto.discount);
        const paidAmount = num(dto.paidAmount);
        const tPerTrip = num(dto.transportPerTrip);
        const tTrips = Math.max(0, Number(dto.transportTrips ?? 0));
        const transportTotal = tPerTrip * tTrips;
        const created = await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
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
            for (const it of itemsData) {
                await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
            }
            try {
                await tx.order.update({ where: { id: order.id }, data: {
                        total: total,
                        discount: discount,
                        paidAmount: paidAmount,
                        transportPerTrip: tPerTrip,
                        transportTrips: tTrips,
                        transportTotal: transportTotal,
                    } });
            }
            catch { }
            if (paidAmount && paidAmount > 0) {
                await tx.transaction.create({
                    data: {
                        organizationId,
                        description: `Order payment - ${order.id}`,
                        type: 'income',
                        amount: paidAmount,
                        category: 'sales',
                        date: new Date(),
                    },
                });
            }
            return order;
        });
        return created;
    }
    async update(orgId, id, dto) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Order not found');
        const data = { ...dto };
        const tPerTrip = dto.transportPerTrip ?? found.transportPerTrip ?? 0;
        const tTrips = dto.transportTrips ?? found.transportTrips ?? 0;
        if (tPerTrip != null || tTrips != null) {
            const per = Number(tPerTrip ?? 0);
            const trips = Number(tTrips ?? 0);
            data.transportPerTrip = per;
            data.transportTrips = trips;
            data.transportTotal = per * trips;
        }
        return this.prisma.order.update({ where: { id }, data });
    }
    async updateItems(orgId, id, dto) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Order not found');
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, organizationId } });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const rows = dto.items.map((i) => {
            const p = productMap.get(i.productId);
            if (!p)
                throw new common_1.NotFoundException(`Product not found: ${i.productId}`);
            const price = typeof i.price === 'number' ? i.price : Number(p.price);
            const total = price * i.quantity;
            return {
                orderId: id,
                productId: i.productId,
                productName: p.name,
                quantity: i.quantity,
                price,
                total,
            };
        });
        const grand = rows.reduce((s, r) => s + r.total, 0);
        const result = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.orderItem.findMany({ where: { orderId: id } });
            for (const it of existing) {
                await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
            }
            await tx.orderItem.deleteMany({ where: { orderId: id } });
            await tx.orderItem.createMany({ data: rows });
            for (const r of rows) {
                await tx.product.update({ where: { id: r.productId }, data: { stock: { decrement: r.quantity } } });
            }
            try {
                await tx.order.update({ where: { id }, data: { total: grand } });
            }
            catch { }
            return tx.order.findUnique({ where: { id }, include: { items: true, customer: true } });
        });
        return result;
    }
    async remove(orgId, id) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.order.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Order not found');
        await this.prisma.$transaction([
            this.prisma.orderItem.deleteMany({ where: { orderId: id } }),
            this.prisma.order.delete({ where: { id } }),
        ]);
        return { ok: true };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
function num(v) {
    return typeof v === 'number' ? v : Number(v ?? 0);
}
