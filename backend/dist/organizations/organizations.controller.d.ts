import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationsController {
    private orgs;
    constructor(orgs: OrganizationsService);
    create(req: any, dto: CreateOrganizationDto, file?: Express.Multer.File): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        address: string;
        logoUrl: string | null;
        ownerId: string;
    }>;
    me(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        address: string;
        logoUrl: string | null;
        ownerId: string;
    } | null>;
    update(req: any, id: string, dto: UpdateOrganizationDto, file?: Express.Multer.File): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        address: string;
        logoUrl: string | null;
        ownerId: string;
    }>;
}
