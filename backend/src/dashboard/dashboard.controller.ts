import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get()
  @ApiQuery({ name: 'months', required: false, type: Number })
  @ApiQuery({ name: 'productDays', required: false, type: Number })
  get(@Req() req: any, @Query('months') months?: string, @Query('productDays') productDays?: string) {
    const m = Math.max(1, Math.min(24, parseInt(months || '6', 10) || 6));
    const pd = Math.max(1, Math.min(365, parseInt(productDays || '90', 10) || 90));
    return this.svc.get(req.user.organizationId, m, pd);
  }
}

