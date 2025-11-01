import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateOrganizationDto, logoPath?: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        phone: string;
        email: string;
        address: string;
        updatedAt: Date;
        logoUrl: string | null;
        ownerId: string;
    }>;
    findMine(userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        phone: string;
        email: string;
        address: string;
        updatedAt: Date;
        logoUrl: string | null;
        ownerId: string;
    } | null>;
    update(userId: string, id: string, dto: UpdateOrganizationDto, logoPath?: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        phone: string;
        email: string;
        address: string;
        updatedAt: Date;
        logoUrl: string | null;
        ownerId: string;
    }>;
    private saveBase64;
}
