import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateOrganizationDto, logoPath?: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        logoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    findMine(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        logoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    } | null>;
    update(userId: string, id: string, dto: UpdateOrganizationDto, logoPath?: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        logoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    private saveBase64;
}
