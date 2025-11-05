import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AccountsService } from './accounts.service'

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accounts: AccountsService) {}

  @Get('summary')
  summary(@Req() req: any) {
    return this.accounts.getSummary(req.user.organizationId)
  }
}

