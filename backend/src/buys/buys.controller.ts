import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BuysService } from './buys.service';
import { CreateBuyDto } from './dto/create-buy.dto';
import { UpdateBuyDto } from './dto/update-buy.dto';
import { UpdateBuyItemsDto } from './dto/update-buy-items.dto';

@ApiTags('buys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buys')
export class BuysController {
  constructor(private buys: BuysService) {}

  @Get()
  list(@Req() req: any) { return this.buys.findAll(req.user.organizationId) }

  @Post()
  create(@Req() req: any, @Body() dto: CreateBuyDto) { return this.buys.create(req.user.organizationId, dto) }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBuyDto) { return this.buys.update(req.user.organizationId, id, dto) }

  @Put(':id/items')
  updateItems(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBuyItemsDto) { return this.buys.updateItems(req.user.organizationId, id, dto) }
}
