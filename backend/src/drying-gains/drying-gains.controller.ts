import { Controller, Get, Post, Query, Body, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { DryingGainsService } from './drying-gains.service'
import { CreateDryingGainDto } from './dto/create-drying-gain.dto'

@ApiTags('drying-gains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drying-gains')
export class DryingGainsController {
  constructor(private gains: DryingGainsService) {}

  @Get()
  list(@Req() req: any, @Query('productId') productId?: string) {
    return this.gains.list(req.user.organizationId, productId)
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateDryingGainDto) {
    return this.gains.create(req.user.organizationId, dto)
  }
}

