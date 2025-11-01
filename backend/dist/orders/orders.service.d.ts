import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
export declare class OrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureOrg;
    findAll(orgId?: string | null): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            organizationId: string;
            createdAt: Date;
            name: string;
            phone: string;
            email: string | null;
            address: string;
            updatedAt: Date;
        };
        items: {
            id: string;
            orderId: string;
            productId: string;
            productName: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        deliveredAt: Date | null;
    })[]>;
    create(orgId: string | null | undefined, dto: CreateOrderDto): Promise<{
        items: {
            id: string;
            orderId: string;
            productId: string;
            productName: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        deliveredAt: Date | null;
    }>;
    update(orgId: string | null | undefined, id: string, dto: UpdateOrderDto): Promise<{
        id: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        deliveredAt: Date | null;
    }>;
    remove(orgId: string | null | undefined, id: string): Promise<{
        ok: boolean;
    }>;
}
