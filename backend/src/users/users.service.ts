import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

const MANAGER_ROLES = ['owner', 'admin'];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async listTeamMembers(userId: string) {
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

  async createTeamMember(userId: string, dto: CreateTeamMemberDto) {
    const actor = await this.requireActiveUser(userId);
    const organizationId = this.requireOrganization(actor);
    this.ensureIsManager(actor);

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new BadRequestException('Email already in use');
    }

    const password = await bcrypt.hash(dto.temporaryPassword, 10);
    const role = dto.role || 'member';
    this.ensureRoleChangeAllowed(actor, role);

    if (existing) {
      if (existing.organizationId && existing.organizationId !== organizationId) {
        throw new BadRequestException('Email already in use');
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

  async updateTeamMember(userId: string, memberId: string, dto: UpdateTeamMemberDto) {
    const actor = await this.requireActiveUser(userId);
    const organizationId = this.requireOrganization(actor);
    this.ensureIsManager(actor);

    const target = await this.prisma.user.findFirst({
      where: { id: memberId, organizationId, deletedAt: null },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === actor.id && dto.role && dto.role !== target.role) {
      throw new BadRequestException('Cannot change your own role from this screen');
    }
    if (target.role === 'owner' && actor.role !== 'owner') {
      throw new ForbiddenException('Only owners can modify another owner');
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

  async removeTeamMember(userId: string, memberId: string) {
    const actor = await this.requireActiveUser(userId);
    const organizationId = this.requireOrganization(actor);
    this.ensureIsManager(actor);

    if (actor.id === memberId) {
      throw new BadRequestException('Use account settings to deactivate yourself');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: memberId, organizationId, deletedAt: null },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'owner' && actor.role !== 'owner') {
      throw new ForbiddenException('Only owners can remove another owner');
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

  async changePassword(userId: string, currentPassword: string, nextPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new BadRequestException('Current password is incorrect');
    const hashed = await bcrypt.hash(nextPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { ok: true };
  }

  async getLoginActivity(userId: string, limit = 20) {
    const size = Math.max(1, Math.min(50, limit ?? 20));
    return this.prisma.loginActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: size,
    });
  }

  private async ensureAnotherOwnerExists(organizationId: string, excludeId: string) {
    const owners = await this.prisma.user.count({
      where: { organizationId, role: 'owner', deletedAt: null, NOT: { id: excludeId } },
    });
    if (owners === 0) throw new BadRequestException('At least one owner is required');
  }

  private async requireActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new ForbiddenException('User not available');
    return user;
  }

  private requireOrganization(user: { organizationId: string | null }) {
    if (!user.organizationId) throw new ForbiddenException('Organization is required');
    return user.organizationId;
  }

  private ensureIsManager(user: { role: string }) {
    if (!MANAGER_ROLES.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private ensureRoleChangeAllowed(actor: { role: string }, nextRole: string, currentRole?: string) {
    if (nextRole === 'owner' && actor.role !== 'owner') {
      throw new ForbiddenException('Only owners can assign owner role');
    }
    if (currentRole === 'owner' && actor.role !== 'owner') {
      throw new ForbiddenException('Only owners can modify another owner');
    }
  }
}
