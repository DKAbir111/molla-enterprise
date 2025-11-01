import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private customers;
    constructor(customers: CustomersService);
    list(req: any): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        phone: string;
        email: string | null;
        address: string;
        updatedAt: Date;
    }[]>;
    create(req: any, dto: CreateCustomerDto): import(".prisma/client").Prisma.Prisma__CustomerClient<{
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        phone: string;
        email: string | null;
        address: string;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(req: any, id: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        phone: string;
        email: string | null;
        address: string;
        updatedAt: Date;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
