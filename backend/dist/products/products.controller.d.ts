import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private products;
    constructor(products: ProductsService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
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
    create(req: any, dto: CreateProductDto): import(".prisma/client").Prisma.Prisma__ProductClient<{
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
    update(req: any, id: string, dto: UpdateProductDto): Promise<{
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
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
