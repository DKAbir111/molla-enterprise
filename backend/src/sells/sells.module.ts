import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';
import { SellsService } from './sells.service';
import { SellsController } from './sells.controller';

@Module({
  imports: [PaymentsModule, PrismaModule, AlertsModule],
  providers: [SellsService],
  controllers: [SellsController],
})
export class SellsModule {}
