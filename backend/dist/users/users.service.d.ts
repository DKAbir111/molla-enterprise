import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        organizationId: string | null;
        createdAt: Date;
        name: string;
        email: string;
        updatedAt: Date;
        password: string;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
}
