import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto, logoPath?: string) {
    // Prevent creating multiple orgs for minimal design; extend later if needed
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.organizationId) throw new ForbiddenException('Organization already exists for user');

    let finalLogoPath = logoPath;
    if (!finalLogoPath && dto.logoBase64) {
      finalLogoPath = await this.saveBase64(dto.logoBase64, 'org-logo');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        logoUrl: finalLogoPath,
        ownerId: userId,
      },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { organizationId: org.id } });
    return org;
  }

  async findMine(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId) return null;
    return this.prisma.organization.findUnique({ where: { id: user.organizationId } });
  }

  async update(userId: string, id: string, dto: UpdateOrganizationDto, logoPath?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId || user.organizationId !== id) throw new ForbiddenException('Not your organization');

    let nextLogo = logoPath;
    if (!nextLogo && dto.logoBase64) {
      nextLogo = await this.saveBase64(dto.logoBase64, `org-${id}-logo`);
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        ...(nextLogo ? { logoUrl: nextLogo } : {}),
      },
    });
  }

  private async saveBase64(b64: string, basename: string) {
    const match = b64.match(/^data:(.+);base64,(.*)$/);
    const data = match ? match[2] : b64;
    const buffer = Buffer.from(data, 'base64');
    const dir = path.join(process.cwd(), 'backend', 'uploads');
    await fs.promises.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${basename}-${Date.now()}.png`);
    await fs.promises.writeFile(file, buffer);
    return '/uploads/' + path.basename(file);
  }
}
