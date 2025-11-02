import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SellsService } from './sells.service';
import { CreateSellDto } from './dto/create-sell.dto';
import { UpdateSellDto } from './dto/update-sell.dto';
import { UpdateSellItemsDto } from './dto/update-sell-items.dto';

@ApiTags('sells')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sells')
export class SellsController {
  constructor(private sells: SellsService) {}

  @Get()
  list(@Req() req: any) { return this.sells.findAll(req.user.organizationId) }

  @Post()
  create(@Req() req: any, @Body() dto: CreateSellDto) { return this.sells.create(req.user.organizationId, dto) }

  @Get('search')
  search(@Req() req: any, @Query('q') q?: string) { return this.sells.search(req.user.organizationId, q) }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSellDto) { return this.sells.update(req.user.organizationId, id, dto) }

  @Put(':id/items')
  updateItems(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSellItemsDto) { return this.sells.updateItems(req.user.organizationId, id, dto) }
}
