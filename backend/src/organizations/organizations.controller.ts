import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Req } from '@nestjs/common';

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'backend', 'uploads');
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `org-${Date.now()}${ext}`);
  },
});

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgs: OrganizationsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateOrganizationDto })
  @UseInterceptors(FileInterceptor('logo', { storage }))
  create(@Req() req: any, @Body() dto: CreateOrganizationDto, @UploadedFile() file?: Express.Multer.File) {
    const logoPath = file ? '/uploads/' + path.basename(file.path) : undefined;
    return this.orgs.create(req.user.userId, dto, logoPath);
  }

  @Get('me')
  me(@Req() req: any) {
    return this.orgs.findMine(req.user.userId);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateOrganizationDto })
  @UseInterceptors(FileInterceptor('logo', { storage }))
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const logoPath = file ? '/uploads/' + path.basename(file.path) : undefined;
    return this.orgs.update(req.user.userId, id, dto, logoPath);
  }
}
