import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
export declare class OrdersController {
    private orders;
    constructor(orders: OrdersService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            address: string;
        };
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            productName: string;
            quantity: number;
            productId: string;
            orderId: string;
        }[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    create(req: any, dto: CreateOrderDto): Promise<{
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            productName: string;
            quantity: number;
            productId: string;
            orderId: string;
        }[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(req: any, id: string, dto: UpdateOrderDto): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateItems(req: any, id: string, dto: UpdateOrderItemsDto): Promise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            address: string;
        };
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            productName: string;
            quantity: number;
            productId: string;
            orderId: string;
        }[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        date: Date;
        deliveredAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
    }) | null>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
