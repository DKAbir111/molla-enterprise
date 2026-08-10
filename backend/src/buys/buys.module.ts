import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BuysService } from './buys.service';
import { BuysController } from './buys.controller';

@Module({
  imports: [PaymentsModule, PrismaModule],
  providers: [BuysService],
  controllers: [BuysController],
})
export class BuysModule {}

