import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  // Sells and Buys route their "paid amount" through the same ledger.
  exports: [PaymentsService],
})
export class PaymentsModule {}
