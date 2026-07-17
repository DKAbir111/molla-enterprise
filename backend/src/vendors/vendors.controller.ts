import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VendorsService } from './vendors.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../common/upload/cloudinary.service';

function toPublicUrl(p?: string | null) {
  if (!p) return p as any;
  if (/^https?:\/\//i.test(p)) return p;
  const base = (process.env.PUBLIC_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const pathPart = p.startsWith('/') ? p : `/${p}`;
  return `${base}${pathPart}`;
}
function withPublicAvatar<T extends { avatarUrl?: string | null }>(obj: T): T {
  if (!obj) return obj;
  return { ...obj, avatarUrl: obj.avatarUrl ? toPublicUrl(obj.avatarUrl) : obj.avatarUrl } as T;
}

@ApiTags('vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(
    private vendors: VendorsService,
    private cloudinary: CloudinaryService,
  ) {}

  @Get()
  list(@Req() req: any) { return this.vendors.findAll(req.user.organizationId).then(items => items.map(withPublicAvatar)) }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) { return this.vendors.findOne(req.user.organizationId, id).then(withPublicAvatar as any) }

  @Post()
  create(@Req() req: any, @Body() dto: any) { return this.vendors.create(req.user.organizationId, dto) }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.vendors.update(req.user.organizationId, id, dto).then(withPublicAvatar as any) }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) { return this.vendors.remove(req.user.organizationId, id) }

  @Patch(':id/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Req() req: any, @Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    const p = file ? await this.cloudinary.uploadImage(file, 'vendors') : undefined
    const updated = await this.vendors.update(req.user.organizationId, id, { avatarUrl: p } as any)
    return withPublicAvatar(updated as any)
  }
}
