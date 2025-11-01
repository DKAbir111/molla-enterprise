import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
export declare class TransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureOrg;
    findAll(orgId?: string | null): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        description: string;
        type: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
    }[]>;
    create(orgId: string | null | undefined, dto: CreateTransactionDto): import(".prisma/client").Prisma.Prisma__TransactionClient<{
        id: string;
        description: string;
        type: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(orgId: string | null | undefined, id: string): Promise<{
        ok: boolean;
    }>;
}
