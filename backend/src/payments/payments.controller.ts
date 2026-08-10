import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Money received from a customer. Applied oldest-invoice-first unless sellId is given. */
  @Post('receive')
  receive(@Req() req: any, @Body() dto: CreatePaymentDto) {
    return this.payments.receiveFromCustomer(req.user.organizationId, dto);
  }

  /** Money paid to a vendor. */
  @Post('pay')
  pay(@Req() req: any, @Body() dto: CreatePaymentDto) {
    return this.payments.payVendor(req.user.organizationId, dto);
  }

  @Get('payables')
  payables(@Req() req: any) {
    return this.payments.payables(req.user.organizationId);
  }

  @Get('receivables')
  receivables(@Req() req: any) {
    return this.payments.receivables(req.user.organizationId);
  }

  @Get()
  list(
    @Req() req: any,
    @Query('sellId') sellId?: string,
    @Query('buyId') buyId?: string,
    @Query('customerId') customerId?: string,
  ) {
    const orgId = req.user.organizationId;
    if (sellId) return this.payments.listForSell(orgId, sellId);
    if (buyId) return this.payments.listForBuy(orgId, buyId);
    if (customerId) return this.payments.listForCustomer(orgId, customerId);
    return [];
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.payments.remove(req.user.organizationId, id);
  }
}
