"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionsService = class TransactionsService {
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
        return this.prisma.transaction.findMany({ where: { organizationId }, orderBy: { date: 'desc' } });
    }
    create(orgId, dto) {
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
    async remove(orgId, id) {
        const organizationId = this.ensureOrg(orgId);
        const found = await this.prisma.transaction.findFirst({ where: { id, organizationId } });
        if (!found)
            throw new common_1.NotFoundException('Transaction not found');
        await this.prisma.transaction.delete({ where: { id } });
        return { ok: true };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
