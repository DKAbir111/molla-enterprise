import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const avatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const parent = path.resolve(__dirname, '..'); // dev: backend, prod: backend/dist
    const isDist = path.basename(parent) === 'dist';
    const backendRoot = isDist ? path.resolve(parent, '..') : parent; // -> backend
    const dir = path.resolve(backendRoot, 'uploads', 'customers');
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `customer-${Date.now()}${ext}`);
  },
});

function toPublicUrl(p?: string | null) {
  if (!p) return p as any;
  if (/^https?:\/\//i.test(p)) return p;
  const base = (process.env.PUBLIC_BASE_URL || process.env.API_PUBLIC_BASE || 'http://localhost:4000').replace(/\/$/, '');
  const pathPart = p.startsWith('/') ? p : `/${p}`;
  return `${base}${pathPart}`;
}
function withPublicAvatar<T extends { avatarUrl?: string | null }>(obj: T): T {
  if (!obj) return obj;
  return { ...obj, avatarUrl: obj.avatarUrl ? toPublicUrl(obj.avatarUrl) : obj.avatarUrl };
}

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get()
  list(@Req() req: any) {
    return this.customers.findAll(req.user.organizationId).then((items) => items.map(withPublicAvatar));
  }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.customers.findOne(req.user.organizationId, id).then(withPublicAvatar as any);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    return this.customers.create(req.user.organizationId, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(req.user.organizationId, id, dto).then(withPublicAvatar as any);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.customers.remove(req.user.organizationId, id);
  }

  @Patch(':id/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  async uploadAvatar(@Req() req: any, @Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    const avatarPath = file ? '/uploads/customers/' + path.basename(file.path) : undefined;
    const updated = await this.customers.update(req.user.organizationId, id, { avatarUrl: avatarPath } as any)
    return withPublicAvatar(updated as any)
  }
}
