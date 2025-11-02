import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const productStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const parent = path.resolve(__dirname, '..'); // dev: backend, prod: backend/dist
    const isDist = path.basename(parent) === 'dist';
    const backendRoot = isDist ? path.resolve(parent, '..') : parent; // -> backend
    const dir = path.resolve(backendRoot, 'uploads', 'products');
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `product-${Date.now()}${ext}`);
  },
});

function toPublicUrl(p?: string | null) {
  if (!p) return p as any;
  if (/^https?:\/\//i.test(p)) return p;
  const base = (process.env.PUBLIC_BASE_URL || process.env.API_PUBLIC_BASE || 'http://localhost:4000').replace(/\/$/, '');
  const pathPart = p.startsWith('/') ? p : `/${p}`;
  return `${base}${pathPart}`;
}

function withPublicImage<T extends { imageUrl?: string | null }>(obj: T): T {
  if (!obj) return obj;
  return { ...obj, imageUrl: obj.imageUrl ? toPublicUrl(obj.imageUrl) : obj.imageUrl };
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  list(@Req() req: any) {
    return this.products.findAll(req.user.organizationId).then((items) => items.map(withPublicImage));
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.products.create(req.user.organizationId, dto).then(withPublicImage);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(req.user.organizationId, id, dto).then(withPublicImage);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.products.remove(req.user.organizationId, id);
  }

  @Patch(':id/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('image', { storage: productStorage }))
  async uploadImage(@Req() req: any, @Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    const imagePath = file ? '/uploads/products/' + path.basename(file.path) : undefined;
    const updated = await this.products.update(req.user.organizationId, id, { } as any, imagePath)
    return withPublicImage(updated as any)
  }
}
