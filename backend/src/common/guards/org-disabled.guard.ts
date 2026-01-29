import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard to prevent write operations (POST, PATCH, PUT, DELETE) on disabled organizations.
 * Disabled orgs (deletedAt is set) can only be read (GET).
 */
@Injectable()
export class OrgDisabledGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;

        // Only check write operations (POST, PATCH, PUT, DELETE)
        if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            return true; // Allow read operations
        }

        // Get organizationId from user
        const userId = request.user?.userId;
        // If there's no authenticated user (e.g., login/forgot-password), allow the request
        if (!userId) return true;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });

        if (!user?.organizationId) return true; // No org, skip check

        const org = await this.prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: { deletedAt: true },
        });

        if (org?.deletedAt) {
            throw new ForbiddenException(
                'Organization is disabled. Only read operations are allowed. Contact your administrator to re-enable the organization.',
            );
        }

        return true;
    }
}
