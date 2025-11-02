import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BuysService } from './buys.service';
import { CreateBuyDto } from './dto/create-buy.dto';

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
}

