import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
export declare class OrdersController {
    private orders;
    constructor(orders: OrdersService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<({
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
    create(req: any, dto: CreateOrderDto): Promise<{
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
    update(req: any, id: string, dto: UpdateOrderDto): Promise<{
        id: string;
        date: Date;
        organizationId: string;
        createdAt: Date;
        customerId: string;
        status: string;
        deliveryAddress: string | null;
        deliveredAt: Date | null;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
