import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureOrg;
    findAll(orgId?: string | null): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        phone: string;
        email: string | null;
        address: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(orgId: string | null | undefined, id: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string | null;
        address: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(orgId: string | null | undefined, dto: CreateCustomerDto): import(".prisma/client").Prisma.Prisma__CustomerClient<{
        id: string;
        name: string;
        phone: string;
        email: string | null;
        address: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(orgId: string | null | undefined, id: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string | null;
        address: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(orgId: string | null | undefined, id: string): Promise<{
        ok: boolean;
    }>;
}
