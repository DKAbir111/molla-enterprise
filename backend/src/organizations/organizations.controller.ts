import { Body, Controller, Get, Param, Patch, Post, Delete, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../common/upload/cloudinary.service';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Req } from '@nestjs/common';

function toPublicUrl(p?: string) {
  if (!p) return p as any;
  if (/^https?:\/\//i.test(p)) return p;
  const base = (process.env.PUBLIC_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const pathPart = p.startsWith('/') ? p : `/${p}`;
  return `${base}${pathPart}`;
}

function withPublicLogo<T extends { logoUrl?: string | null }>(obj: T): T {
  if (!obj) return obj;
  return { ...obj, logoUrl: obj.logoUrl ? toPublicUrl(obj.logoUrl) : obj.logoUrl };
}

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private orgs: OrganizationsService,
    private cloudinary: CloudinaryService,
  ) { }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateOrganizationDto })
  @UseInterceptors(FileInterceptor('logo'))
  async create(@Req() req: any, @Body() dto: CreateOrganizationDto, @UploadedFile() file?: Express.Multer.File) {
    const logoPath = file ? await this.cloudinary.uploadImage(file, 'organizations') : undefined;
    return withPublicLogo(await this.orgs.create(req.user.userId, dto, logoPath));
  }

  @Get('me')
  me(@Req() req: any) {
    return this.orgs.findMine(req.user.userId).then((org) => (org ? withPublicLogo(org) : org));
  }

  @Get('me/settings')
  settingsMe(@Req() req: any) {
    return this.orgs.getSettings(req.user.userId)
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateOrganizationDto })
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const logoPath = file ? await this.cloudinary.uploadImage(file, 'organizations') : undefined;
    return withPublicLogo(await this.orgs.update(req.user.userId, id, dto, logoPath));
  }

  @Patch(':id/settings')
  updateSettings(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.orgs.updateSettings(req.user.userId, id, dto)
  }

  @Post(':id/disable')
  disableOrganization(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.orgs.disableOrganization(req.user.userId, id).then(withPublicLogo);
  }

  @Post(':id/enable')
  enableOrganization(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.orgs.enableOrganization(req.user.userId, id).then(withPublicLogo);
  }

  @Delete(':id')
  deleteOrganization(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.orgs.deleteOrganization(req.user.userId, id);
  }
}
