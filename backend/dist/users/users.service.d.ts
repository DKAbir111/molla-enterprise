import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        name: string;
        password: string;
        organizationId: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
}
