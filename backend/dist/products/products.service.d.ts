import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureOrg;
    findAll(orgId?: string | null): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        description: string | null;
        type: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        grade: string | null;
        unit: string;
        stock: number;
    }[]>;
    create(orgId: string | null | undefined, dto: CreateProductDto): import(".prisma/client").Prisma.Prisma__ProductClient<{
        id: string;
        description: string | null;
        type: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        grade: string | null;
        unit: string;
        stock: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(orgId: string | null | undefined, id: string, dto: UpdateProductDto): Promise<{
        id: string;
        description: string | null;
        type: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        grade: string | null;
        unit: string;
        stock: number;
    }>;
    remove(orgId: string | null | undefined, id: string): Promise<{
        ok: boolean;
    }>;
}
