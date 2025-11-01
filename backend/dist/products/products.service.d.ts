import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureOrg;
    findAll(orgId?: string | null): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string;
        grade: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        stock: number;
    }[]>;
    create(orgId: string | null | undefined, dto: CreateProductDto): import(".prisma/client").Prisma.Prisma__ProductClient<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string;
        grade: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        stock: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(orgId: string | null | undefined, id: string, dto: UpdateProductDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string;
        grade: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        stock: number;
    }>;
    remove(orgId: string | null | undefined, id: string): Promise<{
        ok: boolean;
    }>;
}
