import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
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
            total: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
            productName: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        customerId: string;
        organizationId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        createdAt: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    create(orgId: string | null | undefined, dto: CreateOrderDto): Promise<{
        items: {
            id: string;
            total: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
            productName: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        customerId: string;
        organizationId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        createdAt: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(orgId: string | null | undefined, id: string, dto: UpdateOrderDto): Promise<{
        id: string;
        customerId: string;
        organizationId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        createdAt: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateItems(orgId: string | null | undefined, id: string, dto: UpdateOrderItemsDto): Promise<({
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
            total: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
            productName: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        customerId: string;
        organizationId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        createdAt: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    }) | null>;
    remove(orgId: string | null | undefined, id: string): Promise<{
        ok: boolean;
    }>;
}
