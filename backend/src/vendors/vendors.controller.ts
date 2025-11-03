import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VendorsService } from './vendors.service';

@ApiTags('vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private vendors: VendorsService) {}

  @Get()
  list(@Req() req: any) { return this.vendors.findAll(req.user.organizationId) }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) { return this.vendors.findOne(req.user.organizationId, id) }

  @Post()
  create(@Req() req: any, @Body() dto: any) { return this.vendors.create(req.user.organizationId, dto) }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.vendors.update(req.user.organizationId, id, dto) }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) { return this.vendors.remove(req.user.organizationId, id) }
}

