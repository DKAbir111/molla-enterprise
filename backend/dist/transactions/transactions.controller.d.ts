import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
export declare class TransactionsController {
    private txs;
    constructor(txs: TransactionsService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        description: string;
        type: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
    }[]>;
    create(req: any, dto: CreateTransactionDto): import(".prisma/client").Prisma.Prisma__TransactionClient<{
        id: string;
        description: string;
        type: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        category: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
