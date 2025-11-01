import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private products;
    constructor(products: ProductsService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
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
    create(req: any, dto: CreateProductDto): import(".prisma/client").Prisma.Prisma__ProductClient<{
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
    update(req: any, id: string, dto: UpdateProductDto): Promise<{
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
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
