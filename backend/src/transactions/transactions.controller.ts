import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private txs: TransactionsService) {}

  @Get()
  list(@Req() req: any) {
    return this.txs.findAll(req.user.organizationId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.txs.create(req.user.organizationId, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.txs.remove(req.user.organizationId, id);
  }
}

