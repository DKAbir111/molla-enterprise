"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const MANAGER_ROLES = ['owner', 'admin'];
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findById(id) {
        return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    }
    async listTeamMembers(userId) {
        const actor = await this.requireActiveUser(userId);
        const organizationId = this.requireOrganization(actor);
        const members = await this.prisma.user.findMany({
            where: { organizationId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        return {
            currentUserId: actor.id,
            currentUserRole: actor.role,
            members,
        };
    }
    async createTeamMember(userId, dto) {
        const actor = await this.requireActiveUser(userId);
        const organizationId = this.requireOrganization(actor);
        this.ensureIsManager(actor);
        const email = dto.email.toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing && !existing.deletedAt) {
            throw new common_1.BadRequestException('Email already in use');
        }
        const password = await bcrypt.hash(dto.temporaryPassword, 10);
        const role = dto.role || 'member';
        this.ensureRoleChangeAllowed(actor, role);
        if (existing) {
            if (existing.organizationId && existing.organizationId !== organizationId) {
                throw new common_1.BadRequestException('Email already in use');
            }
            const revived = await this.prisma.user.update({
                where: { id: existing.id },
                data: {
                    name: dto.name,
                    password,
                    role,
                    deletedAt: null,
                    organizationId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            });
            return revived;
        }
        const created = await this.prisma.user.create({
            data: {
                name: dto.name,
                email,
                password,
                role,
                organizationId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        return created;
    }
    async updateTeamMember(userId, memberId, dto) {
        const actor = await this.requireActiveUser(userId);
        const organizationId = this.requireOrganization(actor);
        this.ensureIsManager(actor);
        const target = await this.prisma.user.findFirst({
            where: { id: memberId, organizationId, deletedAt: null },
        });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (target.id === actor.id && dto.role && dto.role !== target.role) {
            throw new common_1.BadRequestException('Cannot change your own role from this screen');
        }
        if (target.role === 'owner' && actor.role !== 'owner') {
            throw new common_1.ForbiddenException('Only owners can modify another owner');
        }
        if (dto.role) {
            this.ensureRoleChangeAllowed(actor, dto.role, target.role);
            if (target.role === 'owner' && dto.role !== 'owner') {
                await this.ensureAnotherOwnerExists(organizationId, target.id);
            }
        }
        const updated = await this.prisma.user.update({
            where: { id: target.id },
            data: {
                ...(dto.name ? { name: dto.name } : {}),
                ...(dto.role ? { role: dto.role } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        return updated;
    }
    async removeTeamMember(userId, memberId) {
        const actor = await this.requireActiveUser(userId);
        const organizationId = this.requireOrganization(actor);
        this.ensureIsManager(actor);
        if (actor.id === memberId) {
            throw new common_1.BadRequestException('Use account settings to deactivate yourself');
        }
        const target = await this.prisma.user.findFirst({
            where: { id: memberId, organizationId, deletedAt: null },
        });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (target.role === 'owner' && actor.role !== 'owner') {
            throw new common_1.ForbiddenException('Only owners can remove another owner');
        }
        if (target.role === 'owner') {
            await this.ensureAnotherOwnerExists(organizationId, target.id);
        }
        await this.prisma.user.update({
            where: { id: target.id },
            data: { deletedAt: new Date(), organizationId: null },
        });
        return { ok: true };
    }
    async changePassword(userId, currentPassword, nextPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.deletedAt)
            throw new common_1.NotFoundException('User not found');
        const ok = await bcrypt.compare(currentPassword, user.password);
        if (!ok)
            throw new common_1.BadRequestException('Current password is incorrect');
        const hashed = await bcrypt.hash(nextPassword, 10);
        await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        return { ok: true };
    }
    async getLoginActivity(userId, limit = 20) {
        const size = Math.max(1, Math.min(50, limit ?? 20));
        return this.prisma.loginActivity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: size,
        });
    }
    async ensureAnotherOwnerExists(organizationId, excludeId) {
        const owners = await this.prisma.user.count({
            where: { organizationId, role: 'owner', deletedAt: null, NOT: { id: excludeId } },
        });
        if (owners === 0)
            throw new common_1.BadRequestException('At least one owner is required');
    }
    async requireActiveUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.deletedAt)
            throw new common_1.ForbiddenException('User not available');
        return user;
    }
    requireOrganization(user) {
        if (!user.organizationId)
            throw new common_1.ForbiddenException('Organization is required');
        return user.organizationId;
    }
    ensureIsManager(user) {
        if (!MANAGER_ROLES.includes(user.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
    ensureRoleChangeAllowed(actor, nextRole, currentRole) {
        if (nextRole === 'owner' && actor.role !== 'owner') {
            throw new common_1.ForbiddenException('Only owners can assign owner role');
        }
        if (currentRole === 'owner' && actor.role !== 'owner') {
            throw new common_1.ForbiddenException('Only owners can modify another owner');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
